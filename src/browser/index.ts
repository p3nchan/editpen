// `editpen/browser`: client-side lint with the same findings as the CLI.
// Rules, profiles and lexicons are compiled at build time into data.generated.ts;
// nothing here (or below) imports Node builtins, Ajv, gray-matter or yaml.

import { lintCore, selectRules } from "../engine/core.js";
import { evidenceGrade, profileVariant } from "../engine/evidence.js";
import { effectiveSeverity } from "../engine/severity.js";
import type { Finding as CoreFinding, SourceSpan } from "../engine/types.js";
import { data } from "./data.generated.js";
import { ruleDefault } from "../engine/defaults.js";
import type {
  BrowserProfile,
  CompiledRule,
  Finding,
  LintResult,
  LintTextOptions,
  RuleCard,
  Span,
} from "./types.js";

export type * from "./types.js";

export const profiles: readonly BrowserProfile[] = ["zh", "zh-tw"];

const rulesById = new Map(data.rules.map((rule) => [rule.id, rule]));
const lexicons: ReadonlyMap<string, readonly string[]> = new Map(Object.entries(data.lexicons));

function profileData(profile: unknown): { id: BrowserProfile; rules: CompiledRule[] } {
  if (profile !== "zh" && profile !== "zh-tw") {
    throw new TypeError(`Unknown profile: ${String(profile)} (expected "zh" or "zh-tw")`);
  }
  const rules = data.profiles[profile].ruleIds.map((id) => {
    const rule = rulesById.get(id);
    if (rule === undefined) {
      throw new Error(`Compiled data is missing rule ${id}`);
    }
    return rule;
  });
  return { id: profile, rules };
}

/** Maps UTF-16 indices to code-point indices in one pass over the text. */
function codePointIndex(text: string): (utf16: number) => number {
  const map = new Uint32Array(text.length + 1);
  let codePoints = 0;
  for (let index = 0; index < text.length; index += 1) {
    map[index] = codePoints;
    const unit = text.charCodeAt(index);
    const next = text.charCodeAt(index + 1);
    if (unit >= 0xd800 && unit <= 0xdbff && next >= 0xdc00 && next <= 0xdfff) {
      index += 1;
      map[index] = codePoints;
    }
    codePoints += 1;
  }
  map[text.length] = codePoints;
  return (utf16) => map[Math.max(0, Math.min(utf16, text.length))] ?? codePoints;
}

function toSpan(span: SourceSpan, cp: (utf16: number) => number): Span {
  return {
    start: span.start,
    end: span.end,
    startCodePoint: cp(span.start),
    endCodePoint: cp(span.end),
    line: span.line,
    column: span.column,
  };
}

function toFinding(finding: CoreFinding, cp: (utf16: number) => number): Finding {
  const base = {
    ruleId: finding.ruleId,
    slug: finding.slug,
    title: finding.title,
    kind: finding.kind,
    severity: finding.severity,
    status: finding.status,
    evidenceGrade: finding.evidenceGrade,
    message: finding.message,
    message_en: rulesById.get(finding.ruleId)?.message_en ?? null,
  };
  if (finding.kind === "pattern") {
    return {
      ...base,
      scope: "inline",
      ...toSpan(finding.span, cp),
      match: finding.match ?? "",
      pattern: finding.pattern ?? "",
    };
  }
  return {
    ...base,
    scope: "document",
    value: finding.value ?? 0,
    threshold: finding.threshold ?? 0,
    occurrences: (finding.supportingSpans ?? []).map((span) => toSpan(span, cp)),
  };
}

export function lintText(text: string, options: LintTextOptions = {}): LintResult {
  if (typeof text !== "string") {
    throw new TypeError("lintText expects a string");
  }
  const { id, rules } = profileData(options.profile ?? "zh-tw");
  const report = lintCore(text, {
    profile: data.profiles[id].profile,
    rules: selectRules(rules, {
      ruleIds: options.ruleIds,
      enable: options.enable,
      disable: options.disable,
      experimental: options.experimental,
    }),
    lexicons,
  });
  const cp = codePointIndex(text);
  const findings = report.findings.map((finding) => toFinding(finding, cp));
  return {
    profile: id,
    findings,
    summary: {
      ...report.summary,
      document: findings.filter((finding) => finding.scope === "document"),
    },
  };
}

export function ruleCards(profile: BrowserProfile = "zh-tw"): RuleCard[] {
  const { id, rules } = profileData(profile);
  const compiledProfile = data.profiles[id].profile;
  return rules.map((rule) => ({
    id: rule.id,
    slug: rule.slug,
    title: rule.title,
    message: rule.message,
    message_en: rule.message_en ?? null,
    scope: rule.scope,
    profile: id,
    kind: rule.kind,
    findingScope: rule.kind === "pattern" ? "inline" : "document",
    status: rule.status,
    detector_validity: rule.detector_validity,
    severity: effectiveSeverity(rule, compiledProfile),
    evidenceGrade: evidenceGrade(rule, profileVariant(compiledProfile)),
    evidence: rule.evidence.map(({ source, grade, role, variant }) => ({ source, grade, role, variant })),
    keep_when: rule.false_positives.map((item) => item.context),
    example: rule.example,
    default: ruleDefault(rule.id),
  }));
}
