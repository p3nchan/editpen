#!/usr/bin/env node

import { access, readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { Ajv, type AnySchema, type ErrorObject } from "ajv";
import { Command } from "commander";
import { parse } from "yaml";
import { loadProfile, loadRules, type Profile, type Rule, type Severity } from "./engine/loader.js";
import { defaultRulesDir, lint } from "./engine/run.js";
import { ruleDefault } from "./engine/defaults.js";
import { evidenceGrade, profileVariant } from "./engine/evidence.js";
import { effectiveSeverity, isHouseSeverity, severityCeiling } from "./engine/severity.js";
import type { Finding, SourceSpan } from "./engine/types.js";
import { formatHuman } from "./formats/human.js";
import { formatJson } from "./formats/json.js";

// dist/cli.js and src/cli.ts both sit one level below package.json.
const { version: pkgVersion } = createRequire(import.meta.url)("../package.json") as { version: string };

// The regex safety gate is a heuristic (src/engine/regex-safety.ts), not a
// timing guarantee: a custom rules directory is trusted input.
const rulesDirHelp =
  "rules directory (trusted input: the regex safety check is a heuristic and cannot rule out every slow pattern)";

interface Fixture {
  id: string;
  text: string;
  expect: "pass" | "fail";
  spans?: [number, number][];
  note?: string;
}

interface FixtureDocument {
  schema: 1;
  rule: string;
  fixtures: Fixture[];
}

interface LedgerInfo {
  ids: Set<string>;
  deriveRuleUnchecked: Set<string>;
}

const allRulesProfile: Profile = {
  id: "all",
  name: "All rules",
  include: { scope: ["core", "core-candidate", "zh-tw", "experimental", "house"] },
  candidate_ceiling: "warn",
};

function formatValidationErrors(errors: ErrorObject[] | null | undefined): string {
  if (errors === null || errors === undefined || errors.length === 0) {
    return "unknown validation error";
  }
  return errors
    .map((error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`)
    .join("; ");
}

function severityRank(severity: Severity): number {
  return { off: 0, info: 1, warn: 2, error: 3 }[severity];
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function markdownCells(line: string): string[] {
  return line.split("|").slice(1, -1).map((cell) => cell.trim());
}

async function loadLedgerInfo(repoRoot: string): Promise<LedgerInfo | null> {
  const jsonPath = path.join(repoRoot, "research", "ledger.json");
  if (await exists(jsonPath)) {
    const source = await readFile(jsonPath, "utf8");
    const ids = new Set(source.match(/S\d{3}/gu) ?? []);
    const deriveRuleUnchecked = new Set<string>();
    for (const id of ids) {
      const recordPattern = new RegExp(
        `(?:${id}[\\s\\S]{0,1000}derive[_ ]rule[\\s\\S]{0,100}not checked)|(?:derive[_ ]rule[\\s\\S]{0,100}not checked[\\s\\S]{0,1000}${id})`,
        "iu",
      );
      if (recordPattern.test(source)) {
        deriveRuleUnchecked.add(id);
      }
    }
    return { ids, deriveRuleUnchecked };
  }

  const markdownPath = path.join(repoRoot, "research", "ledger.md");
  if (!(await exists(markdownPath))) {
    return null;
  }
  const source = await readFile(markdownPath, "utf8");
  const lines = source.split(/\r?\n/u);
  const ids = new Set<string>();
  const deriveRuleUnchecked = new Set<string>();
  let deriveRuleColumn = -1;
  for (const line of lines) {
    const cells = markdownCells(line);
    if (cells[0] === "ID") {
      deriveRuleColumn = cells.findIndex((cell) => cell.toLowerCase() === "derive rule");
      continue;
    }
    const id = cells[0];
    if (id === undefined || !/^S\d{3}$/u.test(id)) {
      continue;
    }
    ids.add(id);
    if (deriveRuleColumn >= 0 && cells[deriveRuleColumn]?.toLowerCase() === "not checked") {
      deriveRuleUnchecked.add(id);
    }
  }
  return { ids, deriveRuleUnchecked };
}

function validateEvidence(rule: Rule, ledger: LedgerInfo | null, errors: string[]): void {
  for (const evidence of rule.evidence) {
    if (!/^S\d{3}$/u.test(evidence.source)) {
      errors.push(`${rule.id}: invalid evidence source ID ${evidence.source}`);
      continue;
    }
    if (ledger !== null && !ledger.ids.has(evidence.source)) {
      errors.push(`${rule.id}: evidence source ${evidence.source} is missing from the ledger`);
    }
    if (
      ledger !== null &&
      evidence.role === "basis" &&
      ledger.deriveRuleUnchecked.has(evidence.source)
    ) {
      errors.push(`${rule.id}: basis source ${evidence.source} has derive rule: not checked`);
    }
  }
}

function spanKey(span: { start: number; end: number }): string {
  return `[${span.start}, ${span.end})`;
}

function sameMultiset(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && [...left].sort().join() === [...right].sort().join();
}

/**
 * Exact fixture matching. A pass fixture must produce no finding for its rule.
 * A fail fixture must produce findings, and when it lists `spans`:
 * - pattern rules: the findings' spans equal `spans` exactly (same multiset, no
 *   extras, no duplicates);
 * - density / metric rules: exactly one finding, and `spans` equals either its
 *   span or the full list of its supporting occurrences.
 */
function fixtureMismatches(fixture: Fixture, findings: readonly Finding[]): string[] {
  if (fixture.expect === "pass") {
    return findings.length === 0
      ? []
      : [`${fixture.id}: expected pass, got ${findings.length} finding(s) at ${findings.map((finding) => spanKey(finding.span)).join(" ")}`];
  }
  if (findings.length === 0) {
    return [`${fixture.id}: expected fail, got pass`];
  }
  if (fixture.spans === undefined) {
    return [];
  }
  const expected = fixture.spans.map(([start, end]) => spanKey({ start, end }));
  const first = findings[0];
  if (first !== undefined && first.kind !== "pattern") {
    const occurrences = (first.supportingSpans ?? []).map((span: SourceSpan) => spanKey(span));
    if (findings.length === 1 && (sameMultiset(expected, [spanKey(first.span)]) || sameMultiset(expected, occurrences))) {
      return [];
    }
    return [
      `${fixture.id}: expected ${expected.join(" ")}, got ${findings.length} finding(s) with span ${spanKey(first.span)} and occurrences ${occurrences.join(" ") || "(none)"}`,
    ];
  }
  const actual = findings.map((finding) => spanKey(finding.span));
  return sameMultiset(expected, actual)
    ? []
    : [`${fixture.id}: expected exactly ${expected.join(" ")}, got ${actual.join(" ")}`];
}

async function checkProfiles(rulesDir: string, errors: string[]): Promise<void> {
  const entries = await readdir(path.join(rulesDir, "profiles"), { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".yaml")) {
      continue;
    }
    try {
      const profile = await loadProfile(rulesDir, entry.name.slice(0, -5));
      // `enable` and house `severity` may name only rules this profile loads.
      const named = [...(profile.enable ?? []), ...Object.keys(profile.severity ?? {})];
      if (named.length > 0) {
        const loaded = new Set((await loadRules(rulesDir, profile)).map((rule) => rule.id));
        for (const id of named.filter((ruleId) => !loaded.has(ruleId))) {
          errors.push(`profile ${profile.id}: ${id} is not a rule in this profile's scopes`);
        }
      }
    } catch (error: unknown) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
}

async function checkRules(rulesDir: string): Promise<void> {
  const fixtureSchemaSource = await readFile(
    path.join(rulesDir, "schema", "fixtures.schema.json"),
    "utf8",
  );
  const fixtureSchema = JSON.parse(fixtureSchemaSource) as AnySchema;
  const validateFixtures = new Ajv({ allErrors: true, strict: false }).compile<FixtureDocument>(
    fixtureSchema,
  );
  const errors: string[] = [];
  await checkProfiles(rulesDir, errors);

  let rules: Rule[] = [];
  try {
    rules = await loadRules(rulesDir, allRulesProfile);
  } catch (error: unknown) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  const ledger = await loadLedgerInfo(path.dirname(rulesDir));
  if (ledger === null) {
    errors.push(
      `evidence ledger not found: expected ${path.join(path.dirname(rulesDir), "research", "ledger.md")} (or ledger.json)`,
    );
  }
  let fixtureCount = 0;

  for (const rule of rules) {
    validateEvidence(rule, ledger, errors);
    const ceiling = severityCeiling(rule);
    if (severityRank(rule.severity.default) > severityRank(ceiling)) {
      errors.push(`${rule.id}: default severity ${rule.severity.default} exceeds ${ceiling} ceiling`);
    }

    const fixturePath = path.join(path.dirname(rule.sourcePath), "fixtures.yaml");
    let document: unknown;
    try {
      document = parse(await readFile(fixturePath, "utf8"));
    } catch (error: unknown) {
      errors.push(`${rule.id}: cannot read fixtures: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    if (!validateFixtures(document)) {
      errors.push(`${rule.id}: invalid fixtures: ${formatValidationErrors(validateFixtures.errors)}`);
      continue;
    }
    const fixtures = document as FixtureDocument;
    if (fixtures.rule !== rule.id) {
      errors.push(`${rule.id}: fixtures declare rule ${fixtures.rule}`);
      continue;
    }

    for (const fixture of fixtures.fixtures) {
      fixtureCount += 1;
      try {
        const report = await lint(fixture.text, {
          rulesDir,
          profile: allRulesProfile,
          ruleIds: [rule.id],
        });
        errors.push(...fixtureMismatches(fixture, report.findings));
      } catch (error: unknown) {
        errors.push(`${fixture.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Rule checks failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }
  process.stdout.write(`Checked ${rules.length} rules and ${fixtureCount} fixtures. All checks passed.\n`);
}

async function loadAllRules(rulesDir: string): Promise<Rule[]> {
  return loadRules(rulesDir, allRulesProfile);
}

interface LintCommandOptions {
  profile: string;
  format: string;
  rulesDir: string;
  enable: string[];
  disable: string[];
  experimental: boolean;
}

function collectIds(value: string, previous: string[]): string[] {
  return [...previous, ...value.split(",").map((id) => id.trim()).filter((id) => id.length > 0)];
}

const program = new Command();
program.name("editpen").description("Evidence-backed Chinese writing linter").version(pkgVersion);

program
  .command("lint")
  .description("Lint a text file")
  .argument("<file>", "text file to lint")
  .option("-p, --profile <profile>", "rule profile", "zh-tw")
  .option("-f, --format <format>", "output format: human or json", "human")
  .option("--rules-dir <path>", rulesDirHelp, defaultRulesDir)
  .option("--enable <ids>", "also run these rules (comma-separated; repeatable)", collectIds, [])
  .option("--disable <ids>", "do not run these rules (comma-separated; repeatable)", collectIds, [])
  .option("--experimental", "also run rules whose default is experimental", false)
  .action(async (file: string, options: LintCommandOptions) => {
    if (options.format !== "human" && options.format !== "json") {
      throw new Error(`Unknown format: ${options.format}`);
    }
    const text = await readFile(file, "utf8");
    const report = await lint(text, {
      profile: options.profile,
      rulesDir: options.rulesDir,
      enable: options.enable,
      disable: options.disable,
      experimental: options.experimental,
    });
    process.stdout.write(`${options.format === "json" ? formatJson(report) : formatHuman(report, file)}\n`);
    if (report.summary.error > 0) {
      process.exitCode = 1;
    }
  });

program
  .command("explain")
  .description("Show one rule's human-readable page")
  .argument("<rule-id>", "rule ID")
  .option("--rules-dir <path>", rulesDirHelp, defaultRulesDir)
  .action(async (ruleId: string, options: { rulesDir: string }) => {
    const rule = (await loadAllRules(options.rulesDir)).find((candidate) => candidate.id === ruleId);
    if (rule === undefined) {
      throw new Error(`Unknown rule: ${ruleId}`);
    }
    process.stdout.write(`# ${rule.id} ${rule.title}\n\n${rule.body}\n`);
  });

program
  .command("rules")
  .description("List rules: default (on/experimental/off) and the severity each emits under the profile")
  .option("-p, --profile <profile>", "rule profile", "zh-tw")
  .option("--rules-dir <path>", rulesDirHelp, defaultRulesDir)
  .action(async (options: { profile: string; rulesDir: string }) => {
    const profile = await loadProfile(options.rulesDir, options.profile);
    const rules = await loadRules(options.rulesDir, profile);
    process.stdout.write("id\tdefault\tseverity\tevidence\tscope\ttitle\n");
    for (const rule of rules) {
      const grade = evidenceGrade(rule, profileVariant(profile));
      const state = profile.enable?.includes(rule.id) === true ? "on" : ruleDefault(rule.id);
      const severity = `${effectiveSeverity(rule, profile)}${isHouseSeverity(rule, profile) ? " (house policy)" : ""}`;
      process.stdout.write(
        `${rule.id}\t${state}\t${severity}\t${grade}\t${rule.scope}\t${rule.title}\n`,
      );
    }
  });

program
  .command("check-rules")
  .description("Validate rule schemas, evidence, severity, and fixtures")
  .option("--rules-dir <path>", rulesDirHelp, defaultRulesDir)
  .action(async (options: { rulesDir: string }) => {
    await checkRules(options.rulesDir);
  });

try {
  await program.parseAsync(process.argv);
} catch (error: unknown) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
