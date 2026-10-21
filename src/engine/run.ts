import { fileURLToPath } from "node:url";
import { lintCore, selectRules, type RuleSelection } from "./core.js";
import { loadLexicons, loadProfile, loadRules, type Profile, type Report } from "./loader.js";

export interface LintOptions extends RuleSelection {
  profile?: string | Profile;
  rulesDir?: string;
}

export const defaultRulesDir = fileURLToPath(new URL("../../rules", import.meta.url));

export async function lint(text: string, options: LintOptions = {}): Promise<Report> {
  const rulesDir = options.rulesDir ?? defaultRulesDir;
  const profile =
    typeof options.profile === "object"
      ? options.profile
      : await loadProfile(rulesDir, options.profile ?? "zh-tw");
  const rules = selectRules(await loadRules(rulesDir, profile), {
    ruleIds: options.ruleIds,
    // A profile's `enable` changes its default set; an explicit ruleIds list ignores it.
    enable: options.ruleIds === undefined && profile.enable !== undefined
      ? [...profile.enable, ...(options.enable ?? [])]
      : options.enable,
    disable: options.disable,
    experimental: options.experimental,
  });
  const lexicons = await loadLexicons(rulesDir, rules, profile);
  return lintCore(text, { profile, rules, lexicons });
}
