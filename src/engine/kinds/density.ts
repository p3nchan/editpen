import type { EngineRule, Finding, ProtectedSpan, Severity } from "../types.js";
import type { LintContext } from "../core.js";
import { evidenceGrade } from "../evidence.js";
import { runRegexDetector } from "../detectors/regex.js";
import { overlapsProtected } from "../protect.js";
import { charCount } from "../text.js";

interface LexiconMatch {
  start: number;
  end: number;
}

function findTerms(
  text: string,
  terms: readonly string[],
  protectedSpans: readonly ProtectedSpan[],
): LexiconMatch[] {
  const matches: LexiconMatch[] = [];
  for (const term of terms) {
    let from = 0;
    while (from < text.length) {
      const start = text.indexOf(term, from);
      if (start < 0) {
        break;
      }
      const end = start + term.length;
      if (!overlapsProtected(start, end, protectedSpans)) {
        matches.push({ start, end });
      }
      from = end;
    }
  }
  return matches.sort((left, right) => left.start - right.start || left.end - right.end);
}

const hanChar = /\p{Script=Han}/gu;

function hanCount(text: string): number {
  return text.match(hanChar)?.length ?? 0;
}

function unprotectedCharCount(
  text: string,
  protectedSpans: readonly ProtectedSpan[],
  count: (text: string) => number,
): number {
  let total = 0;
  let cursor = 0;
  for (const span of protectedSpans) {
    total += count(text.slice(cursor, span.start));
    cursor = Math.max(cursor, span.end);
  }
  return total + count(text.slice(cursor));
}

export function runDensityRule(
  rule: EngineRule,
  context: LintContext,
  lexicons: ReadonlyMap<string, readonly string[]>,
  severity: Exclude<Severity, "off">,
): Finding[] {
  const { text, protectedSpans } = context;
  const terms = (rule.detector.patterns ?? []).flatMap((pattern) =>
    pattern.lexicon === undefined ? [] : [...(lexicons.get(pattern.lexicon) ?? [])],
  );
  const lexiconMatches = findTerms(text, [...new Set(terms)], protectedSpans);
  const regexMatches = runRegexDetector(
    text,
    rule.detector.patterns ?? [],
    context.protection,
    rule.detector.exclude ?? [],
  );
  const matches = [...lexiconMatches, ...regexMatches]
    .sort((left, right) => left.start - right.start || left.end - right.end);
  const countMode = rule.detector.threshold?.count === true;
  const maximum = rule.detector.threshold?.max;
  const minimumCount = rule.detector.threshold?.min;
  if (maximum === undefined || matches.length === 0) {
    return [];
  }
  if (minimumCount !== undefined && matches.length < minimumCount) {
    return [];
  }
  const denominator = unprotectedCharCount(
    text,
    protectedSpans,
    rule.detector.threshold?.han === true ? hanCount : charCount,
  );
  if (!countMode && denominator === 0) {
    return [];
  }
  const value = countMode
    ? matches.length
    : (matches.length * (rule.detector.threshold?.per ?? 1000)) / denominator;
  if (value <= maximum) {
    return [];
  }
  const first = matches[0];
  if (first === undefined) {
    return [];
  }
  return [
    {
      ruleId: rule.id,
      slug: rule.slug,
      title: rule.title,
      kind: rule.kind,
      severity,
      status: rule.status,
      evidenceGrade: evidenceGrade(rule, context.variant),
      message: rule.message,
      // The finding points at its first occurrence; every occurrence is in
      // supportingSpans. (A first-to-last span would highlight unrelated text.)
      span: context.span(first.start, first.end),
      value,
      threshold: maximum,
      supportingSpans: matches.map((match) => context.span(match.start, match.end)),
    },
  ];
}
