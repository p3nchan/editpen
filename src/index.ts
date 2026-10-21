import type { LintOptions } from "./engine/run.js";
import { defaultRulesDir, lint } from "./engine/run.js";
import { loadRules, type Rule } from "./engine/loader.js";

export { lint, loadRules };
export type {
  Evidence,
  Finding,
  Profile,
  Report,
  Rule,
  Severity,
} from "./engine/loader.js";
export type { LintOptions } from "./engine/run.js";

export async function explain(ruleId: string, options: LintOptions = {}): Promise<Rule | undefined> {
  const rulesDir = options.rulesDir ?? defaultRulesDir;
  const allScopes = {
    id: "all",
    name: "All rules",
    include: { scope: ["core", "core-candidate", "zh-tw", "experimental", "house"] as const },
    candidate_ceiling: "warn" as const,
  };
  const rules = await loadRules(rulesDir, {
    ...allScopes,
    include: { scope: [...allScopes.include.scope] },
  });
  return rules.find((rule) => rule.id === ruleId);
}
export type { RuleSelection } from "./engine/core.js";
export { ruleDefault, ruleDefaults, type RuleDefault } from "./engine/defaults.js";
export { evidenceGrade, profileVariant } from "./engine/evidence.js";
export { loadProfile } from "./engine/loader.js";
