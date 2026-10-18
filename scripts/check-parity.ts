// Parity check: every fixture in rules/*/fixtures.yaml plus test/parity-texts/*
// must produce identical findings through the CLI path (dist/index.js `lint`)
// and the browser path (dist/browser/index.js and the esbuild bundle).
// Run after `npm run build`.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import type * as BrowserModule from "../src/browser/index.js";
import type { Finding as BrowserFinding, Span } from "../src/browser/index.js";
import type * as NodeModule from "../src/index.js";
import type { Finding as CoreFinding, SourceSpan } from "../src/engine/types.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const node = (await import(path.join(root, "dist/index.js"))) as typeof NodeModule;
const browsers: [string, typeof BrowserModule][] = [
  ["dist/browser/index.js", (await import(path.join(root, "dist/browser/index.js"))) as typeof BrowserModule],
  ["dist/editpen-browser.min.js", (await import(path.join(root, "dist/editpen-browser.min.js"))) as typeof BrowserModule],
];
const profiles = ["zh", "zh-tw"] as const;
const errors: string[] = [];

interface Case {
  name: string;
  text: string;
  ruleIds?: string[];
}

function codePoints(text: string, utf16: number): number {
  return [...text.slice(0, utf16)].length;
}

function checkSpan(label: string, text: string, core: SourceSpan, span: Span): void {
  if (core.start !== span.start || core.end !== span.end) {
    errors.push(`${label}: UTF-16 span [${span.start}, ${span.end}) != CLI [${core.start}, ${core.end})`);
  }
  if (core.line !== span.line || core.column !== span.column) {
    errors.push(`${label}: line/column ${span.line}:${span.column} != CLI ${core.line}:${core.column}`);
  }
  if (span.startCodePoint !== codePoints(text, span.start) || span.endCodePoint !== codePoints(text, span.end)) {
    errors.push(`${label}: code-point span [${span.startCodePoint}, ${span.endCodePoint}) is wrong`);
  }
  if ([...text].slice(span.startCodePoint, span.endCodePoint).join("") !== text.slice(span.start, span.end)) {
    errors.push(`${label}: code-point and UTF-16 spans select different text`);
  }
}

function compare(label: string, text: string, core: CoreFinding, finding: BrowserFinding): void {
  if (core.ruleId !== finding.ruleId || core.severity !== finding.severity || core.message !== finding.message) {
    errors.push(`${label}: ${finding.ruleId}/${finding.severity} != CLI ${core.ruleId}/${core.severity}`);
    return;
  }
  if (finding.scope === "inline") {
    if (core.kind !== "pattern" || core.match !== finding.match || core.pattern !== finding.pattern) {
      errors.push(`${label}: inline finding does not match CLI pattern hit`);
    }
    checkSpan(label, text, core.span, finding);
    return;
  }
  if (core.kind === "pattern" || core.value !== finding.value || core.threshold !== finding.threshold) {
    errors.push(`${label}: document value ${finding.value}/${finding.threshold} != CLI ${core.value}/${core.threshold}`);
  }
  const supporting = core.supportingSpans ?? [];
  if (supporting.length !== finding.occurrences.length) {
    errors.push(`${label}: ${finding.occurrences.length} occurrences != CLI ${supporting.length}`);
    return;
  }
  supporting.forEach((span, index) => {
    const occurrence = finding.occurrences[index];
    if (occurrence !== undefined) {
      checkSpan(`${label} occurrence ${index}`, text, span, occurrence);
    }
  });
}

async function loadCases(): Promise<Case[]> {
  const cases: Case[] = [];
  const rulesDir = path.join(root, "rules");
  for (const entry of (await readdir(rulesDir)).sort()) {
    if (!/^[A-Z][0-9]{2}[a-z]-/u.test(entry)) {
      continue;
    }
    const document = parse(await readFile(path.join(rulesDir, entry, "fixtures.yaml"), "utf8")) as {
      rule: string;
      fixtures: { id: string; text: string }[];
    };
    for (const fixture of document.fixtures) {
      cases.push({ name: fixture.id, text: fixture.text });
      cases.push({ name: `${fixture.id} [only ${document.rule}]`, text: fixture.text, ruleIds: [document.rule] });
    }
  }
  const textsDir = path.join(root, "test", "parity-texts");
  for (const file of (await readdir(textsDir)).sort()) {
    cases.push({ name: file, text: await readFile(path.join(textsDir, file), "utf8") });
  }
  return cases;
}

const cases = await loadCases();
let comparisons = 0;
let findingsCompared = 0;

for (const testCase of cases) {
  for (const profile of profiles) {
  for (const experimental of [false, true]) {
    if (experimental && testCase.ruleIds !== undefined) {
      continue;
    }
    const options = testCase.ruleIds === undefined ? { experimental } : { ruleIds: testCase.ruleIds };
    const report = await node.lint(testCase.text, { profile, ...options });
    for (const [browserName, browser] of browsers) {
      comparisons += 1;
      const label = `${testCase.name} (${profile}${experimental ? ", experimental" : ""}, ${browserName})`;
      const result = browser.lintText(testCase.text, { profile, ...options });
      const { document, ...counts } = result.summary;
      if (JSON.stringify(counts) !== JSON.stringify(report.summary)) {
        errors.push(`${label}: summary ${JSON.stringify(counts)} != CLI ${JSON.stringify(report.summary)}`);
      }
      if (document.length !== result.findings.filter((finding) => finding.scope === "document").length) {
        errors.push(`${label}: summary.document does not list the document findings`);
      }
      if (result.findings.length !== report.findings.length) {
        errors.push(`${label}: ${result.findings.length} findings != CLI ${report.findings.length}`);
        continue;
      }
      report.findings.forEach((core, index) => {
        const finding = result.findings[index];
        if (finding !== undefined) {
          findingsCompared += 1;
          compare(`${label} #${index}`, testCase.text, core, finding);
        }
      });
    }
  }
  }
}

// Offsets after supplementary-plane characters: 😀 (U+1F600) and 𠀀 (U+20000)
// are 2 UTF-16 units but 1 code point each, so the same hit moves by 4 and 2.
const plain = "這不是工具，而是方法。";
for (const [browserName, browser] of browsers) {
  const base = browser.lintText(plain, { ruleIds: ["D01a"] }).findings[0];
  const shifted = browser.lintText(`😀𠀀${plain}`, { ruleIds: ["D01a"] }).findings[0];
  if (base?.scope !== "inline" || shifted?.scope !== "inline") {
    errors.push(`${browserName}: D01a did not fire on the emoji offset probe`);
  } else if (
    shifted.start !== base.start + 4 ||
    shifted.end !== base.end + 4 ||
    shifted.startCodePoint !== base.startCodePoint + 2 ||
    shifted.endCodePoint !== base.endCodePoint + 2
  ) {
    errors.push(`${browserName}: emoji offset probe got ${JSON.stringify(shifted)} from base ${JSON.stringify(base)}`);
  }
  // Partial NFC composition before the hit ("e\u0301\u0301" -> "é\u0301",
  // "e\u0301\u0316" -> "é\u0316"): 3 original UTF-16 units / code points each.
  const nfd = browser.lintText(`e\u0301\u0301e\u0301\u0316${plain}`, { ruleIds: ["D01a"] }).findings[0];
  if (
    base?.scope !== "inline" || nfd?.scope !== "inline" ||
    nfd.start !== base.start + 6 || nfd.end !== base.end + 6 ||
    nfd.startCodePoint !== base.startCodePoint + 6 || nfd.endCodePoint !== base.endCodePoint + 6
  ) {
    errors.push(`${browserName}: partial-NFC offset probe got ${JSON.stringify(nfd)} from base ${JSON.stringify(base)}`);
  }
  for (const profile of profiles) {
    const cards = browser.ruleCards(profile);
    const cliRules = await node.loadRules(path.join(root, "rules"), profile);
    if (cards.map((card) => card.id).join() !== cliRules.map((rule) => rule.id).join()) {
      errors.push(`${browserName}: ruleCards(${profile}) ids differ from the CLI rule list`);
    }
    for (const card of cards) {
      const cliRule = cliRules.find((rule) => rule.id === card.id);
      const cliProfile = await node.loadProfile(path.join(root, "rules"), profile);
      if (cliRule === undefined || card.evidenceGrade !== node.evidenceGrade(cliRule, node.profileVariant(cliProfile))) {
        errors.push(`${browserName}: card ${card.id} evidenceGrade ${card.evidenceGrade} differs from the CLI (${profile})`);
      }
      if (card.example === null || !["on", "experimental", "off"].includes(card.default) || card.evidence.length === 0) {
        errors.push(`${browserName}: card ${card.id} is missing example/default/evidence`);
      }
    }
  }
}

if (errors.length > 0) {
  process.stderr.write(`Parity check failed:\n${errors.map((error) => `- ${error}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Parity OK: ${cases.length} texts x ${profiles.length} profiles x ${browsers.length} browser builds = ${comparisons} comparisons, ${findingsCompared} findings identical; emoji/𠀀 and partial-NFC offset probes passed.\n`,
  );
}
