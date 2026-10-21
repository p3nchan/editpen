// Pure lint core: no filesystem, no Node builtins. Takes already-loaded data.
// Both the Node runner (run.ts) and the browser entry (browser/index.ts) call lintCore.

import type { EngineRule, Finding, Profile, Protection, ProtectedSpan, Report, SourceSpan } from "./types.js";
import { ruleDefault } from "./defaults.js";
import { profileVariant, type ProfileVariant } from "./evidence.js";
import { normalizeText } from "./normalize.js";
import { frontmatterLength, frontmatterProse, maskProtectedText, mergedSpans, protectRanges } from "./protect.js";
import { runDensityRule } from "./kinds/density.js";
import { runMetricRule } from "./kinds/metric.js";
import { runPatternRule } from "./kinds/pattern.js";
import { effectiveSeverity, isHouseSeverity } from "./severity.js";
import { createLocator, isEmbedBlock, isMarkupBlock, splitBlocks, splitSentences, type TextUnit } from "./text.js";

export interface CoreInput {
  profile: Profile;
  rules: readonly EngineRule[];
  lexicons: ReadonlyMap<string, readonly string[]>;
}

export interface RuleSelection {
  /** Run exactly these rules (ignores defaults; `enable`/`disable` still apply). */
  ruleIds?: readonly string[] | undefined;
  /** Also run these rules, whatever their default. */
  enable?: readonly string[] | undefined;
  /** Never run these rules. Wins over `enable` and `ruleIds`. */
  disable?: readonly string[] | undefined;
  /** Also run rules whose default is "experimental". */
  experimental?: boolean | undefined;
}

/**
 * Picks the rules to run from a profile's rules. Base set: `ruleIds` if given,
 * otherwise every rule whose default (src/engine/defaults.ts) is "on", plus
 * "experimental" ones when `experimental` is set. Then `enable` adds and
 * `disable` removes. Unknown ids in `enable`/`disable` throw, so a typo never
 * silently lints with the wrong rule set.
 */
export function selectRules<T extends EngineRule>(
  rules: readonly T[],
  selection: RuleSelection | readonly string[] | undefined = {},
): readonly T[] {
  const options: RuleSelection = Array.isArray(selection)
    ? { ruleIds: selection as readonly string[] }
    : ((selection ?? {}) as RuleSelection);
  const known = new Set(rules.map((rule) => rule.id));
  const unknown = [...(options.enable ?? []), ...(options.disable ?? [])].filter((id) => !known.has(id));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown rule id(s) for this profile: ${unknown.join(", ")} (available: ${[...known].join(", ")})`,
    );
  }
  const selected = new Set(
    options.ruleIds !== undefined
      ? options.ruleIds
      : rules
        .filter((rule) => {
          const state = ruleDefault(rule.id);
          return state === "on" || (state === "experimental" && options.experimental === true);
        })
        .map((rule) => rule.id),
  );
  for (const id of options.enable ?? []) {
    selected.add(id);
  }
  for (const id of options.disable ?? []) {
    selected.delete(id);
  }
  return rules.filter((rule) => selected.has(rule.id));
}

/** Shared per-lint state; everything is computed once, not once per rule. */
export interface LintContext {
  /** The caller's text, as passed in. Reported spans index into it. */
  original: string;
  /** The normalised text (LF, NFC) that rules match against. */
  text: string;
  protectedSpans: readonly ProtectedSpan[];
  /** `protectedSpans` with hard and quote spans kept apart, for regex matching. */
  protection: Protection;
  /**
   * Protection for pattern rules: `protection`, except that the profile's
   * `frontmatter_prose` values are open (quotes in them stay protected).
   * Metric and density rules and `proseParagraphs` keep the whole frontmatter
   * protected.
   */
  patternProtection: Protection;
  /** The profile's language variant, for evidence grades. */
  variant: ProfileVariant;
  /** Normalised [start, end) -> located span in the caller's original text. */
  span(start: number, end: number): SourceSpan;
  /**
   * Units a pattern is matched in: "document" = the whole text; "paragraph" =
   * structural blocks (blank-line paragraphs; headings, list items and each
   * table cell on their own); "sentence" = those blocks split at 。！？.
   * Frontmatter yields one block per `frontmatter_prose` value, nothing else.
   */
  units(unit: "sentence" | "paragraph" | "document" | undefined): readonly TextUnit[];
  /** The normalised text with protected spans blanked (same length). */
  masked(): string;
  /**
   * Prose paragraphs in order: paragraph blocks minus headings, list items,
   * table cells, markers, blockquotes, image-only or HTML-only blocks, and
   * blocks inside code or frontmatter.
   */
  proseParagraphs(): readonly TextUnit[];
}

// A block wholly inside a code, frontmatter or blockquote span is not prose (a
// paragraph that is one quotation still is). Spans are sorted and disjoint.
function insideNonProse(unit: TextUnit, spans: readonly ProtectedSpan[]): boolean {
  let low = 0;
  let high = spans.length;
  while (low < high) {
    const middle = low + Math.floor((high - low) / 2);
    if ((spans[middle]?.end ?? 0) <= unit.start) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  const span = spans[low];
  return span !== undefined && span.kind !== "quote" && span.kind !== "url" &&
    span.start <= unit.start && unit.end <= span.end;
}

function createContext(original: string, profile: Profile): LintContext {
  const normalized = normalizeText(original);
  const { text } = normalized;
  const protection = protectRanges(text);
  const protectedSpans = mergedSpans(protection);
  const prose = frontmatterProse(text, profile.frontmatter_prose ?? []);
  const patternProtection = prose.length > 0 ? protectRanges(text, prose) : protection;
  // Blocks never join a frontmatter value with the next key: the frontmatter
  // contributes only its prose values as blocks.
  const frontmatterEnd = prose.length > 0 ? frontmatterLength(text) : 0;
  const allBlocks = (): TextUnit[] => {
    const parsed = splitBlocks(text);
    if (prose.length === 0) {
      return parsed;
    }
    return [
      ...prose.map((range) => ({ text: text.slice(range.start, range.end), start: range.start, end: range.end })),
      ...parsed.filter((block) => block.start >= frontmatterEnd),
    ];
  };
  let locate: ReturnType<typeof createLocator> | undefined;
  let blocks: TextUnit[] | undefined;
  let sentences: TextUnit[] | undefined;
  let masked: string | undefined;
  let paragraphs: TextUnit[] | undefined;
  return {
    original,
    text,
    protectedSpans,
    protection,
    patternProtection,
    variant: profileVariant(profile),
    span(start, end) {
      locate ??= createLocator(original);
      const originalStart = normalized.toOriginal(start);
      return { start: originalStart, end: normalized.toOriginalEnd(end), ...locate(originalStart) };
    },
    units(unit) {
      if (unit === undefined || unit === "document") {
        return [{ text, start: 0, end: text.length }];
      }
      blocks ??= allBlocks();
      if (unit === "paragraph") {
        return blocks;
      }
      sentences ??= blocks.flatMap((block) => splitSentences(text, block.start, block.end));
      return sentences;
    },
    masked() {
      masked ??= maskProtectedText(text, protectedSpans);
      return masked;
    },
    proseParagraphs() {
      blocks ??= allBlocks();
      paragraphs ??= blocks.filter((block) =>
        !isMarkupBlock(text, block.start) && !isEmbedBlock(block.text) && !insideNonProse(block, protectedSpans));
      return paragraphs;
    },
  };
}

function runRule(
  rule: EngineRule,
  context: LintContext,
  profile: Profile,
  lexicons: ReadonlyMap<string, readonly string[]>,
): Finding[] {
  const findings = runRuleKind(rule, context, profile, lexicons);
  return isHouseSeverity(rule, profile)
    ? findings.map((finding) => ({ ...finding, housePolicy: true as const }))
    : findings;
}

function runRuleKind(
  rule: EngineRule,
  context: LintContext,
  profile: Profile,
  lexicons: ReadonlyMap<string, readonly string[]>,
): Finding[] {
  const severity = effectiveSeverity(rule, profile);
  if (severity === "off") {
    return [];
  }
  if (rule.kind === "pattern") {
    if (rule.detector.engine === "tokens") {
      throw new Error(`Token detector is not available in this skeleton: ${rule.id}`);
    }
    return runPatternRule(rule, context, lexicons, severity);
  }
  if (rule.kind === "density") {
    return runDensityRule(rule, context, lexicons, severity);
  }
  return runMetricRule(rule, context, severity);
}

export function lintCore(text: string, input: CoreInput): Report {
  const { profile, rules, lexicons } = input;
  const context = createContext(text, profile);
  const findings = rules
    .flatMap((rule) => runRule(rule, context, profile, lexicons))
    .sort((left, right) => left.span.start - right.span.start || left.ruleId.localeCompare(right.ruleId));
  const summary = {
    error: findings.filter((finding) => finding.severity === "error").length,
    warn: findings.filter((finding) => finding.severity === "warn").length,
    info: findings.filter((finding) => finding.severity === "info").length,
    total: findings.length,
  };
  return { schema: "editpen-report/1", profile: profile.id, findings, summary };
}
