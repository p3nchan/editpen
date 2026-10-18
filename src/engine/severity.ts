import type { Profile, EngineRule, Severity } from "./types.js";

const severityRank: Record<Severity, number> = {
  off: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function lowerSeverity(left: Severity, right: Severity): Severity {
  return severityRank[left] <= severityRank[right] ? left : right;
}

export function severityCeiling(rule: EngineRule): Severity {
  if (rule.detector_validity === "precision-gate-failed" || rule.status === "contradicted") {
    return "off";
  }
  if (rule.status === "measured-translationese" || rule.status === "hypothesis") {
    return "warn";
  }
  if (rule.detector_validity === "untested") {
    return "warn";
  }
  if (rule.measurement === null || typeof rule.measurement.fp_rate !== "number") {
    return "warn";
  }
  return "error";
}

export function effectiveSeverity(rule: EngineRule, profile?: Profile): Severity {
  let severity = lowerSeverity(rule.severity.default, severityCeiling(rule));
  if (profile !== undefined && rule.scope === "core-candidate") {
    severity = lowerSeverity(severity, profile.candidate_ceiling);
  }
  return severity;
}
