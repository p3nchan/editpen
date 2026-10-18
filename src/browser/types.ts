// Public contracts of `editpen/browser`. Pure types; safe to import anywhere.

import type { RuleDefault } from "../engine/defaults.js";

export type { RuleDefault };
import type {
  DetectorValidity,
  EngineRule,
  Profile,
  RuleKind,
  RuleStatus,
  Scope,
  Severity,
} from "../engine/types.js";

export type BrowserProfile = "zh" | "zh-tw";
export type FindingSeverity = Exclude<Severity, "off">;

/**
 * A located span. `start`/`end` are UTF-16 code units (JS string indices, use
 * them for DOM Range / textarea selection). `startCodePoint`/`endCodePoint` are
 * Unicode code points (what architecture.md §5 promises). All half-open, zero-based,
 * into the string passed to lintText (the engine normalises CRLF and NFC
 * internally and maps offsets back). `line`/`column` are 1-based; column
 * counts code points, same as the CLI.
 */
export interface Span {
  start: number;
  end: number;
  startCodePoint: number;
  endCodePoint: number;
  line: number;
  column: number;
}

interface FindingBase {
  ruleId: string;
  slug: string;
  title: string;
  kind: RuleKind;
  severity: FindingSeverity;
  status: RuleStatus;
  evidenceGrade: "A" | "B" | "C";
  message: string;
  message_en: string | null;
}

/** A pattern hit: highlight exactly this span. */
export interface InlineFinding extends FindingBase, Span {
  scope: "inline";
  match: string;
  pattern: string;
}

/**
 * A document-level measurement (density or metric rule). It has no highlight
 * span: show it in the summary. `occurrences` lists the individual hits that
 * fed a density count (empty for metrics such as paragraph uniformity).
 */
export interface DocumentFinding extends FindingBase {
  scope: "document";
  value: number;
  threshold: number;
  occurrences: Span[];
}

export type Finding = InlineFinding | DocumentFinding;

export interface LintSummary {
  error: number;
  warn: number;
  info: number;
  total: number;
  /** The document-scope findings, same objects as in `findings`. */
  document: DocumentFinding[];
}

export interface LintResult {
  profile: BrowserProfile;
  /** All findings, in CLI order (start offset, then rule id). */
  findings: Finding[];
  summary: LintSummary;
}

export interface LintTextOptions {
  profile?: BrowserProfile;
  /** Run exactly these rule ids, ignoring defaults (e.g. the rules a user left on). */
  ruleIds?: readonly string[];
  /** Also run these rule ids, whatever their default. Unknown ids throw. */
  enable?: readonly string[];
  /** Never run these rule ids (wins over `enable` and `ruleIds`). Unknown ids throw. */
  disable?: readonly string[];
  /** Also run rules whose default is "experimental". */
  experimental?: boolean;
}

export interface RuleCard {
  id: string;
  slug: string;
  title: string;
  message: string;
  message_en: string | null;
  /** Rule scope from its frontmatter (core, core-candidate, zh-tw, experimental). */
  scope: Scope;
  /** The profile this card was built for. */
  profile: BrowserProfile;
  kind: RuleKind;
  findingScope: "inline" | "document";
  status: RuleStatus;
  detector_validity: DetectorValidity;
  /** Effective severity under `profile` (what lintText reports); "off" = never fires. */
  severity: Severity;
  /**
   * Best grade among the evidence that applies to this profile's variant
   * (zh-tw: zh-TW, both, none), same as `Finding.evidenceGrade` for the rule's
   * document findings. Pattern hits may carry a lower grade when an evidence
   * item names only other patterns. Rules: src/engine/evidence.ts.
   */
  evidenceGrade: "A" | "B" | "C";
  evidence: {
    source: string;
    grade: "A" | "B" | "C";
    role: "basis" | "support";
    variant: "zh-CN" | "zh-TW" | "both" | "none";
  }[];
  /** Contexts where a hit is acceptable, from `false_positives[].context`. */
  keep_when: string[];
  /** Text of the rule's first failing fixture, or null if it has none. */
  example: string | null;
  /**
   * Whether this rule runs by default: "on"; "experimental" (only with
   * `experimental: true`); "off" (only when enabled by id). Same map as the
   * CLI: src/engine/defaults.ts.
   */
  default: RuleDefault;
}

/** Shape of the build-time compiled data (src/browser/data.generated.ts). */
export interface CompiledRule extends EngineRule {
  example: string | null;
}

export interface CompiledData {
  schema: "editpen-browser-data/1";
  profiles: Record<BrowserProfile, { profile: Profile; ruleIds: string[] }>;
  rules: CompiledRule[];
  lexicons: Record<string, string[]>;
}
