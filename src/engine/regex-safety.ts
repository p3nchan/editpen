// Regex safety gate for rule patterns. Runs inside loadRules, so every rules
// directory (bundled or custom `--rules-dir`) is checked before any text is
// linted, and fails closed.
//
// Known-dangerous shapes:
// - a quantified group that itself contains a quantifier, e.g. `(a+)+`, `(\w*){2,}`
//   (catastrophic backtracking)
// - a backreference `\1`..`\9` (can force super-linear matching)
// - an unbounded quantifier (`*`, `+`, `{n,}`) inside a lookahead/lookbehind:
//   every match attempt may rescan to the end/start of the unit, which is
//   quadratic on long units (measured: 500 KB single-line input, 45 s)
// - two adjacent unboundedly quantified atoms, e.g. `a+a+`, `\s*.*`, `[^，]+(?:x)*`:
//   the split point between them is ambiguous, so a failing match attempt
//   tries every split (quadratic; measured `^a+a+$` 151 ms at 16 K chars)
// Plus: the pattern must compile with the flags the engine uses.
//
// This is a heuristic, not a proof of linear time: it rejects the shapes above
// and nothing else (overlapping alternations such as `(?:a|ab)+c` pass, and
// there is no execution time limit). The bundled rules are additionally
// measured (see reviewedRegexes). A custom `--rules-dir` is trusted input:
// only load rule directories you would run as code.

import type { EngineRule } from "./types.js";

const nestedQuantifier =
  /\((?:\\.|[^()])*?(?:[+*]|\{\d+(?:,\d*)?\})(?:\\.|[^()])*?\)(?:[+*]|\{\d+(?:,\d*)?\})/u;
const backreference = /\\[1-9]/u;

/** True when `*`, `+` or `{n,}` appears inside a lookaround (outside character classes). */
export function hasUnboundedLookaround(regex: string): boolean {
  const groups: boolean[] = [];
  let openLookarounds = 0;
  for (let index = 0; index < regex.length; index += 1) {
    const char = regex[index];
    if (char === "\\") {
      index += 1;
    } else if (char === "[") {
      for (index += 1; index < regex.length && regex[index] !== "]"; index += 1) {
        if (regex[index] === "\\") {
          index += 1;
        }
      }
    } else if (char === "(") {
      const lookaround = /^\(\?<?[=!]/u.test(regex.slice(index, index + 4));
      groups.push(lookaround);
      openLookarounds += lookaround ? 1 : 0;
    } else if (char === ")") {
      openLookarounds -= groups.pop() === true ? 1 : 0;
    } else if (
      openLookarounds > 0 &&
      (char === "*" || char === "+" || (char === "{" && /^\{\d*,\}/u.test(regex.slice(index))))
    ) {
      return true;
    }
  }
  return false;
}

/**
 * True when an unboundedly quantified atom (`*`, `+`, `{n,}`; atom = char,
 * escape, class, `.` or group) directly follows another one, e.g. `a+a+`.
 */
export function hasAdjacentUnboundedQuantifiers(regex: string): boolean {
  // previous: does the text matched so far at this point end in an unbounded
  // item? Plain groups are transparent (`(a+)a+`, `a+(?:a+)`); lookarounds
  // are zero-width and checked on their own.
  const groups: { outer: boolean; lookaround: boolean; branchEnd: boolean }[] = [];
  let previous = false;
  for (let index = 0; index < regex.length; index += 1) {
    const char = regex[index];
    if (char === "(") {
      const lookaround = /^\(\?<?[=!]/u.test(regex.slice(index, index + 4));
      groups.push({ outer: previous, lookaround, branchEnd: false });
      previous = lookaround ? false : previous;
      index += /^\(\?(?:<?[=!]|:|<[^>]*>)/u.exec(regex.slice(index))?.[0].length ?? 1;
      index -= 1;
      continue;
    }
    if (char === "|") {
      const group = groups.at(-1);
      if (group !== undefined) {
        group.branchEnd ||= previous;
      }
      previous = group === undefined || group.lookaround ? false : group.outer;
      continue;
    }
    let before: boolean = previous;
    if (char === ")") {
      const group = groups.pop();
      before = group?.outer ?? false;
      if (group?.lookaround === true) {
        previous = before;
        continue;
      }
      previous ||= group?.branchEnd ?? false;
    } else if (char === "\\") {
      index += 1;
      if (/[pPu]/u.test(regex[index] ?? "") && regex[index + 1] === "{") {
        index = Math.max(index, regex.indexOf("}", index));
      }
    } else if (char === "[") {
      for (index += 1; index < regex.length && regex[index] !== "]"; index += 1) {
        if (regex[index] === "\\") {
          index += 1;
        }
      }
    }
    // Quantifier after the atom that ends at `index`.
    const rest = regex.slice(index + 1);
    const quantifier = /^(?:[*+?]|\{\d+(?:,\d*)?\})\??/u.exec(rest)?.[0] ?? "";
    const unbounded = /^(?:[*+]|\{\d+,\})/u.test(quantifier);
    if (unbounded && before) {
      return true;
    }
    if (quantifier === "" && char === ")") {
      // Unquantified group: `previous` already describes its last item.
    } else if (/^(?:\?|\{0,\d+\})/u.test(quantifier)) {
      // Optional item: `a+b?a+` is still `a+a+` when b is absent.
      previous ||= before;
    } else {
      previous = unbounded;
    }
    index += quantifier.length;
  }
  return false;
}

export function hasUnsafeRegex(regex: string): boolean {
  return (
    nestedQuantifier.test(regex) ||
    backreference.test(regex) ||
    hasUnboundedLookaround(regex) ||
    hasAdjacentUnboundedQuantifiers(regex)
  );
}

/**
 * Patterns that trip the heuristic but were measured linear. Keyed by
 * `<rule id>/<pattern name>` (excludes: `<rule id>/exclude:<name>`); the value
 * is the exact regex that was measured, so any edit voids the exemption.
 * Measurement (2026-09-27, rules at main a6e9704): every flagged regex run
 * with matchAll (excludes: test) over 20 KB and 200 KB repetitions of 23
 * adversarial fills (spaces, full-width spaces, newlines, terminators, trigger
 * words, triads, dashes); linear = 200 KB time <= ~15x the 20 KB time.
 * These three stayed within 1-2 ms at 200 KB (x2-x4).
 * NOT exempt (measured quadratic, x95-x100): D02a/signpost and
 * D02a/exclude:fewer-than-3 (full-width space runs, 200 KB 4.8 s),
 * F02a/repeated-prefix-triad and F02a/abstract-verb-object-triad (trailing
 * line-start lookbehind, 3.5 s / 1.3 s), F06a/zongjie (lookahead to end of
 * text, 1.2 s).
 */
export const reviewedRegexes: Readonly<Record<string, string>> = {
  // Adjacent-quantifier false positive: `[ \t]*` and `\d+` share no
  // character, anchored at ^. Measured 2026-09-27: <= 1.6 ms at 200 KB over
  // space, tab, digit, newline, "#", "- " fills (with and without /m).
  "F02a/exclude:markdown-heading-or-list-item": "^[ \\t]*(?:#{1,6}|[-*+]|\\d+[.)])[ \\t]",
  "F02a/repeated-prefix-triad":
    "(?<!(?:提醒|呼籲|建議|要求|叮嚀|規定|告訴)[^，。！？、\\n]{0,8})(?<!(?:需要|是|讓|願|要|代表|意味著|帶來|成為|展現)[^，。！？、\\n]{2,12}[、，])(需要|是|讓|願|要|代表|意味著|帶來|成為|展現)([^，。！？、\\n]{2,12})[、，]\\1([^，。！？、\\n]{2,12})[、，]\\1([^，。！？、\\n]{2,12})[。！]",
  "F11a/repeated-subject-contrast":
    "([他她它我你]們?)不是在[^，。]{2,15}[，,]\\1是在[^。]{2,15}[。！]",
  "M01a/spaced-em-dash":
    "(?<=\\p{Script=Han}[，、；：」』）]?[ \\u00A0\\u3000]+)—(?=[ \\u00A0\\u3000]+[「『（]?\\p{Script=Han})",
};

/** Returns one message per unsafe or invalid regex in the rule; empty if all pass. */
export function regexSafetyErrors(rule: EngineRule): string[] {
  const items = [
    ...(rule.detector.patterns ?? []).flatMap((pattern) =>
      pattern.regex === undefined ? [] : [{ name: pattern.name, regex: pattern.regex, flags: pattern.flags }],
    ),
    ...(rule.detector.exclude ?? []).map((exclude) => ({
      name: `exclude:${exclude.name}`,
      regex: exclude.regex,
      flags: exclude.flags,
    })),
  ];
  const errors: string[] = [];
  for (const item of items) {
    try {
      new RegExp(item.regex, [...new Set(`${item.flags ?? ""}gu`)].join(""));
    } catch (error: unknown) {
      errors.push(`${rule.id}/${item.name}: invalid regex: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    if (hasUnsafeRegex(item.regex) && reviewedRegexes[`${rule.id}/${item.name}`] !== item.regex) {
      errors.push(
        `${rule.id}/${item.name}: nested quantifier, backreference, unbounded lookaround or adjacent unbounded quantifiers (super-linear matching risk); rewrite it, or measure it linear and add it to reviewedRegexes in src/engine/regex-safety.ts`,
      );
    }
  }
  return errors;
}
