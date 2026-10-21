import type {
  DetectorExclude,
  DetectorPattern,
  ProtectedSpan,
} from "../types.js";
import { overlappingSpans } from "../protect.js";

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

// Sticky copy of a pattern's regex, for re-matching at one position.
const stickyFor = new WeakMap<object, RegExp>();

function sticky(item: object, regex: RegExp): RegExp {
  let value = stickyFor.get(item);
  if (value === undefined) {
    value = new RegExp(regex.source, regex.flags.replace("g", "") + "y");
    stickyFor.set(item, value);
  }
  return value;
}

/**
 * Whether protection drops a match at `index` in `text` (document offsets
 * `start`/`end`). Code, URL, frontmatter and blockquote spans drop any match
 * that touches them. A quote drops only a match that lies inside it: a match
 * that starts in a quote and runs past it is still inside when the same
 * pattern also matches there with the text cut at the quote's end (a quoted
 * example of the pattern followed by more text); otherwise it straddles the
 * quote and is kept, as is a match that starts before a quote.
 */
function isProtected(
  item: object,
  regex: RegExp,
  text: string,
  index: number,
  start: number,
  end: number,
  protectedSpans: readonly ProtectedSpan[],
  offset: number,
): boolean {
  for (const span of overlappingSpans(start, end, protectedSpans)) {
    if (span.kind !== "quote") {
      return true;
    }
    if (start < span.start) {
      continue;
    }
    if (end <= span.end) {
      return true;
    }
    const inner = sticky(item, regex);
    inner.lastIndex = index;
    if (inner.exec(text.slice(0, span.end - offset)) !== null) {
      return true;
    }
  }
  return false;
}

function isExcluded(text: string, excludes: readonly DetectorExclude[]): boolean {
  return excludes.some((exclude) => cachedFor(exclude, exclude.regex, exclude.flags).test(text));
}

/**
 * All matches of `patterns` in `text` that protection does not drop (see
 * isProtected). After a dropped match the search resumes one code point
 * after where it started, so a protected hit never hides a later
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
      if (match[0].length === 0 || isProtected(pattern, regex, text, match.index, start, end, protectedSpans, offset)) {
        const unit = text.charCodeAt(match.index);
        regex.lastIndex = match.index + (unit >= 0xd800 && unit <= 0xdbff ? 2 : 1);
        continue;
      }
      findings.push({ start, end, text: match[0], pattern: pattern.name });
    }
  }
  return findings.sort((left, right) => left.start - right.start || left.end - right.end);
}
