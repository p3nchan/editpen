import type { DetectorPattern, EngineRule, Finding, Severity } from "../types.js";
import type { LintContext } from "../core.js";
import { evidenceGrade } from "../evidence.js";
import { runRegexDetector } from "../detectors/regex.js";

function escapeRegexLiteral(value: string): string {
  return value.replace(/[\\^$.*+?()[\]{}|]/gu, "\\$&");
}

function resolvedPatterns(
  patterns: readonly DetectorPattern[],
  lexicons: ReadonlyMap<string, readonly string[]>,
): DetectorPattern[] {
  return patterns.flatMap((pattern) => {
    if (pattern.regex !== undefined || pattern.lexicon === undefined) {
      return [pattern];
    }
    const terms = [...new Set(lexicons.get(pattern.lexicon) ?? [])]
      .filter((term) => term.length > 0)
      .sort((left, right) => right.length - left.length || left.localeCompare(right));
    if (terms.length === 0) {
      return [];
    }
    return [{
      name: pattern.name,
      regex: `(?:${terms.map(escapeRegexLiteral).join("|")})`,
      ...(pattern.flags === undefined ? {} : { flags: pattern.flags }),
    }];
  });
}

export function runPatternRule(
  rule: EngineRule,
  context: LintContext,
  lexicons: ReadonlyMap<string, readonly string[]>,
  severity: Exclude<Severity, "off">,
): Finding[] {
  const patterns = resolvedPatterns(rule.detector.patterns ?? [], lexicons);
  const excludes = rule.detector.exclude ?? [];
  const findings: Finding[] = [];
  const grades = new Map<string, "A" | "B" | "C">();
  const gradeFor = (pattern: string): "A" | "B" | "C" => {
    let grade = grades.get(pattern);
    if (grade === undefined) {
      grade = evidenceGrade(rule, context.variant, pattern);
      grades.set(pattern, grade);
    }
    return grade;
  };

  // Positional scope: only matches wholly inside the first N prose paragraphs.
  const within = rule.detector.within === undefined
    ? undefined
    : context.proseParagraphs().slice(0, rule.detector.within.paragraphs);

  for (const unit of context.units(rule.detector.unit)) {
    const matches = runRegexDetector(unit.text, patterns, context.protectedSpans, excludes, unit.start);
    for (const match of matches) {
      if (within !== undefined && !within.some((block) => block.start <= match.start && match.end <= block.end)) {
        continue;
      }
      const span = context.span(match.start, match.end);
      findings.push({
        ruleId: rule.id,
        slug: rule.slug,
        title: rule.title,
        kind: rule.kind,
        severity,
        status: rule.status,
        evidenceGrade: gradeFor(match.pattern),
        message: rule.message,
        span,
        match: context.original.slice(span.start, span.end),
        pattern: match.pattern,
      });
    }
  }
  return findings;
}
