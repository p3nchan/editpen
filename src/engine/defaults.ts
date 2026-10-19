// Default state per rule, shared by the CLI (`lint`, `editpen rules`) and the
// browser entry (`lintText`, `ruleCards`). Pure data; no Node imports.
//
// - "on": runs by default.
// - "experimental": runs only with `--experimental` (CLI) or
//   `{ experimental: true }` (browser), or when enabled by id.
// - "off": runs only when enabled by id (`--enable <id>` / `{ enable: [id] }`).
//
// Rules not listed are "on". Set per Penchan's decision D19 (2026-09-28,
// projects/editpen/launch/decision-rule-defaults.md option 1): on = D01a,
// D04a, M01b; every other rule is experimental. scripts/check-engine.ts pins
// this set, so an edit here must update that check too.
export type RuleDefault = "on" | "experimental" | "off";

export const ruleDefaults: Readonly<Record<string, RuleDefault>> = {
  D01a: "on",
  D02a: "experimental",
  D04a: "on",
  D04b: "experimental",
  D09a: "experimental",
  D09b: "experimental",
  F02a: "experimental",
  F05a: "experimental",
  F06a: "experimental",
  F07a: "experimental",
  F08a: "experimental",
  F09a: "experimental",
  F11a: "experimental",
  F26a: "experimental",
  M01a: "experimental",
  M01b: "on",
};

export function ruleDefault(ruleId: string): RuleDefault {
  return ruleDefaults[ruleId] ?? "on";
}
