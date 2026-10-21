import type {
  DetectorExclude,
  DetectorPattern,
  Protection,
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

function nextCodePoint(text: string, index: number): number {
  const unit = text.charCodeAt(index);
  return index + (unit >= 0xd800 && unit <= 0xdbff ? 2 : 1);
}

/**
 * Whether protection drops a match at `index` in `text` (document offsets
 * `start`/`end`): undefined when it is kept, else the `text` index to resume
 * the search at. Hard spans (code, URL, frontmatter, blockquote) drop any
 * match that touches them. A quote drops only a match that lies inside it
 * (code or a URL inside the quote does not widen that to a veto): a match
 * that starts in a quote and runs past it is still inside when the same
 * pattern also matches there with the text cut at the quote's end (a quoted
 * example of the pattern followed by more text); otherwise it straddles the
 * quote and is kept, as is a match that starts before a quote.
 *
 * Resume points: a match starting inside a hard span resumes at its end
 * (every match starting there touches it); a match wholly inside a quote
 * resumes at its own end, so a long protected run is scanned once, not once
 * per suffix. Any other dropped match resumes one code point after its
 * start, so it never hides a later unprotected match.
 */
function protectedResume(
  item: object,
  regex: RegExp,
  text: string,
  index: number,
  start: number,
  end: number,
  protection: Protection,
  offset: number,
): number | undefined {
  const hard = overlappingSpans(start, end, protection.hard)[0];
  if (hard !== undefined) {
    return hard.start <= start ? Math.max(hard.end - offset, nextCodePoint(text, index)) : nextCodePoint(text, index);
  }
  for (const span of overlappingSpans(start, end, protection.quotes)) {
    if (start < span.start) {
      continue;
    }
    if (end <= span.end) {
      return end - offset;
    }
    const inner = sticky(item, regex);
    inner.lastIndex = index;
    if (inner.exec(text.slice(0, span.end - offset)) !== null) {
      return nextCodePoint(text, index);
    }
  }
  return undefined;
}

function isExcluded(text: string, excludes: readonly DetectorExclude[]): boolean {
  return excludes.some((exclude) => cachedFor(exclude, exclude.regex, exclude.flags).test(text));
}

/**
 * All matches of `patterns` in `text` that protection does not drop (see
 * protectedResume for where the search resumes after a dropped match).
 * `offset` shifts `text` indices into document offsets.
 */
export function runRegexDetector(
  text: string,
  patterns: readonly DetectorPattern[],
  protection: Protection,
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
      if (match[0].length === 0) {
        regex.lastIndex = nextCodePoint(text, match.index);
        continue;
      }
      const resume = protectedResume(pattern, regex, text, match.index, start, end, protection, offset);
      if (resume !== undefined) {
        regex.lastIndex = resume;
        continue;
      }
      findings.push({ start, end, text: match[0], pattern: pattern.name });
    }
  }
  return findings.sort((left, right) => left.start - right.start || left.end - right.end);
}
