// Evidence grade shown with a finding: the best grade among the evidence that
// applies to the active profile's variant, and (for pattern hits) to the
// pattern that fired.
//
// - Variant: a zh-tw profile counts evidence with variant zh-TW, both or none
//   ("none" = the source is not about a Chinese variant, so it is not
//   excluded); zh-CN-only evidence does not grade a zh-TW finding. A
//   cross-variant profile (zh) counts all evidence.
// - Pattern: an evidence item whose claim names one of the rule's pattern
//   names (e.g. "pattern moe-mainland-term only") applies only to those
//   patterns; an item that names none applies to every pattern.
// - No applicable evidence: "C" (the lowest grade).

import type { EngineRule, Evidence, Profile } from "./types.js";

export type ProfileVariant = "zh-TW" | "zh-CN" | null;

/** Profiles carry no variant field; derive it from the id or the parent id. */
export function profileVariant(profile: Pick<Profile, "id" | "extends">): ProfileVariant {
  const ids = [profile.id, profile.extends];
  if (ids.includes("zh-tw")) {
    return "zh-TW";
  }
  if (ids.includes("zh-cn")) {
    return "zh-CN";
  }
  return null;
}

function namesPattern(claim: string, name: string): boolean {
  const escaped = name.replace(/[\\^$.*+?()[\]{}|]/gu, "\\$&");
  return new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`, "u").test(claim);
}

export function applicableEvidence(
  rule: EngineRule,
  variant: ProfileVariant,
  pattern?: string,
): Evidence[] {
  const names = (rule.detector.patterns ?? []).map((item) => item.name);
  return rule.evidence.filter((item) => {
    if (variant !== null && item.variant !== variant && item.variant !== "both" && item.variant !== "none") {
      return false;
    }
    if (pattern === undefined) {
      return true;
    }
    const named = names.filter((name) => namesPattern(item.claim, name));
    return named.length === 0 || named.includes(pattern);
  });
}

export function evidenceGrade(
  rule: EngineRule,
  variant: ProfileVariant,
  pattern?: string,
): "A" | "B" | "C" {
  const grades = new Set(applicableEvidence(rule, variant, pattern).map((item) => item.grade));
  return grades.has("A") ? "A" : grades.has("B") ? "B" : "C";
}
