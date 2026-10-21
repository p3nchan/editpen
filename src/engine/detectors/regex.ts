import type {
  DetectorExclude,
  DetectorPattern,
  ProtectedSpan,
} from "../types.js";
import { overlapsProtected } from "../protect.js";

export interface RegexMatch {
  start: number;
  end: number;
  text: string;
  pattern: string;
}

const compiled = new Map<string, RegExp>();

function compile(regex: string, flags = "u"): RegExp {
  const key = `${flags}/${regex}`;
  let value = compiled.get(key);
  if (value === undefined) {
    const uniqueFlags = new Set(flags);
    uniqueFlags.add("g");
    uniqueFlags.add("u");
    value = new RegExp(regex, [...uniqueFlags].join(""));
    compiled.set(key, value);
  }
  value.lastIndex = 0;
  return value;
}

// Per pattern object, so the hot loop (every unit x every pattern) skips
// building and hashing the string key above.
const byItem = new WeakMap<object, RegExp>();

function cachedFor(item: object, regex: string, flags?: string): RegExp {
  let value = byItem.get(item);
  if (value === undefined) {
    value = compile(regex, flags);
    byItem.set(item, value);
  }
  value.lastIndex = 0;
  return value;
}

function isExcluded(text: string, excludes: readonly DetectorExclude[]): boolean {
  return excludes.some((exclude) => cachedFor(exclude, exclude.regex, exclude.flags).test(text));
}

/**
 * All matches of `patterns` in `text` that do not overlap a protected span.
 * A match that overlaps protection is dropped and the search resumes one code
 * point after where it started, so a protected hit never hides a later
 * unprotected one. `offset` shifts `text` indices into document offsets.
 */
export function runRegexDetector(
  text: string,
  patterns: readonly DetectorPattern[],
  protectedSpans: readonly ProtectedSpan[],
  excludes: readonly DetectorExclude[] = [],
  offset = 0,
): RegexMatch[] {
  if (isExcluded(text, excludes)) {
    return [];
  }

  const findings: RegexMatch[] = [];
  for (const pattern of patterns) {
    if (pattern.regex === undefined) {
      continue;
    }
    const regex = cachedFor(pattern, pattern.regex, pattern.flags);
    for (let match = regex.exec(text); match !== null; match = regex.exec(text)) {
      const start = offset + match.index;
      const end = start + match[0].length;
      if (match[0].length === 0 || overlapsProtected(start, end, protectedSpans)) {
        const unit = text.charCodeAt(match.index);
        regex.lastIndex = match.index + (unit >= 0xd800 && unit <= 0xdbff ? 2 : 1);
        continue;
      }
      findings.push({ start, end, text: match[0], pattern: pattern.name });
    }
  }
  return findings.sort((left, right) => left.start - right.start || left.end - right.end);
}
