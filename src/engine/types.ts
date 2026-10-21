// Pure data types shared by the Node loader, the core engine and the browser entry.

/** `house`: a maintainer's own editing policy, loaded only by profiles that include it (never zh / zh-tw). */
export type Scope = "core" | "core-candidate" | "zh-tw" | "experimental" | "house";
export type RuleStatus =
  | "measured-AI"
  | "measured-translationese"
  | "replicable"
  | "hypothesis"
  | "contradicted";
export type DetectorValidity =
  | "untested"
  | "precision-gate-passed"
  | "precision-gate-failed";
export type RuleKind = "pattern" | "density" | "metric";
export type Severity = "error" | "warn" | "info" | "off";

export interface DetectorPattern {
  name: string;
  regex?: string;
  flags?: string;
  lexicon?: string;
  tokens?: unknown[];
}

export interface DetectorExclude {
  name: string;
  regex: string;
  flags?: string;
}

export interface DetectorThreshold {
  per?: number;
  chars?: boolean;
  /** Density: divide by Han-script characters only (default: all non-whitespace). */
  han?: boolean;
  count?: boolean;
  /** Density: fire when the value exceeds this. */
  max?: number;
  /**
   * Density: minimum number of occurrences before the rule can fire at all.
   * Metric: fire when the measured value is below this.
   */
  min?: number;
}

export interface RuleDetector {
  engine: "regex" | "tokens" | "builtin";
  unit?: "sentence" | "paragraph" | "document";
  patterns?: DetectorPattern[];
  threshold?: DetectorThreshold;
  builtin?: string;
  params?: Record<string, unknown>;
  exclude?: DetectorExclude[];
  /** Pattern rules: keep only matches inside the first `paragraphs` prose paragraphs (headings, list items, tables, blockquotes, image-only or HTML-only blocks, code and frontmatter do not count). */
  within?: { paragraphs: number };
}

export interface Evidence {
  source: string;
  role: "basis" | "support";
  grade: "A" | "B" | "C";
  claim: string;
  direction: "up" | "down" | "mixed" | "unknown";
  variant: "zh-CN" | "zh-TW" | "both" | "none";
}

export interface FalsePositive {
  context: string;
  fixtures: string[];
}

export interface Rule {
  id: string;
  slug: string;
  feature: string;
  title: string;
  scope: Scope;
  status: RuleStatus;
  detector_validity: DetectorValidity;
  kind: RuleKind;
  severity: { default: Severity };
  message: string;
  message_en?: string;
  detector: RuleDetector;
  provenance: Record<string, string | number | boolean | null>;
  evidence: Evidence[];
  variants: Record<string, Record<string, unknown>>;
  false_positives: FalsePositive[];
  measurement: Record<string, unknown> | null;
  body: string;
  sourcePath: string;
}

export interface Profile {
  id: string;
  name: string;
  extends?: string;
  include: { scope: Scope[] };
  candidate_ceiling: Severity;
  lexicons?: string[];
  compose?: Record<string, string>;
  /** Rule ids this profile runs by default, whatever their global default (src/engine/defaults.ts). */
  enable?: string[];
  /** House severity per rule id: replaces the evidence-based severity; findings carry `housePolicy: true`. */
  severity?: Record<string, Severity>;
  /**
   * Frontmatter keys whose single-line scalar values pattern rules lint as
   * prose (matched at any nesting depth, e.g. `summary` under `tldr`). The
   * rest of the frontmatter stays protected. Not inherited by child profiles.
   */
  frontmatter_prose?: string[];
}

export interface ProtectedSpan {
  start: number;
  end: number;
  kind: "code" | "url" | "frontmatter" | "quote" | "blockquote" | "mixed";
}

/** Protection for pattern matching: hard spans and quote spans, each sorted and disjoint. */
export interface Protection {
  hard: readonly ProtectedSpan[];
  quotes: readonly ProtectedSpan[];
}

/**
 * A located span in the text the caller passed to `lint` / `lintText`
 * (before any normalisation).
 *
 * - `start` / `end`: half-open, zero-based offsets in UTF-16 code units, i.e.
 *   JavaScript string indices: `text.slice(start, end)` is the flagged text.
 *   A character outside the BMP (emoji, CJK Extension B such as 𠀀) counts as
 *   2. The CLI JSON output (`editpen lint -f json`) uses exactly these values,
 *   and fixture `spans:` are checked against them. The browser entry adds
 *   `startCodePoint` / `endCodePoint` for code-point consumers.
 * - `line` / `column`: 1-based. Lines break at LF, CRLF and a lone CR; the
 *   column counts code points from the start of the line.
 *
 * The engine lints a normalised copy (CRLF/CR -> LF, Unicode NFC) and maps
 * every offset back, so a CRLF file gets offsets into its CRLF text.
 */
export interface SourceSpan {
  start: number;
  end: number;
  line: number;
  column: number;
}

export interface Finding {
  ruleId: string;
  slug: string;
  title: string;
  kind: RuleKind;
  severity: Exclude<Severity, "off">;
  status: RuleStatus;
  evidenceGrade: "A" | "B" | "C";
  message: string;
  span: SourceSpan;
  match?: string;
  pattern?: string;
  value?: number;
  threshold?: number;
  supportingSpans?: SourceSpan[];
  /** Present when the severity comes from the profile's house policy, not from evidence. */
  housePolicy?: true;
}

export interface Report {
  schema: "editpen-report/1";
  profile: string;
  findings: Finding[];
  summary: {
    error: number;
    warn: number;
    info: number;
    total: number;
  };
}

/** A rule as the pure engine needs it: frontmatter only, no file body or path. */
export type EngineRule = Omit<Rule, "body" | "sourcePath">;
