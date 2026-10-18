import type { EngineRule, Finding, Severity } from "../types.js";
import type { LintContext } from "../core.js";
import { evidenceGrade } from "../evidence.js";
import { paragraphLengthCv } from "../detectors/builtin/paragraph-length-cv.js";

type BuiltinDetector = (
  text: string,
  params: Readonly<Record<string, unknown>>,
) => number | null;

const builtins: Readonly<Record<string, BuiltinDetector>> = {
  "paragraph-length-cv": paragraphLengthCv,
};

export function runMetricRule(
  rule: EngineRule,
  context: LintContext,
  severity: Exclude<Severity, "off">,
): Finding[] {
  const builtinName = rule.detector.builtin;
  if (builtinName === undefined) {
    throw new Error(`Metric rule ${rule.id} has no builtin detector`);
  }
  const detector = builtins[builtinName];
  if (detector === undefined) {
    throw new Error(`Unknown builtin detector: ${builtinName}`);
  }
  // Protected text is blanked, so quotes and code do not count as paragraph length.
  const value = detector(context.masked(), rule.detector.params ?? {});
  const minimum = rule.detector.threshold?.min;
  if (value === null || minimum === undefined || value >= minimum) {
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
      span: context.span(0, context.text.length),
      value,
      threshold: minimum,
    },
  ];
}
