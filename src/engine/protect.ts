import type { Protection, ProtectedSpan } from "./types.js";

// Protected spans: text that rules must not flag because the author did not
// write it in their own voice (quotations) or it is not prose (code, URLs,
// frontmatter). Computed once per lint in linear time.
//
// - frontmatter: a leading `---` block (optional BOM and blank lines before it)
// - code: fenced blocks (``` or ~~~, to the closing fence or end of text) and
//   inline code spans (a backtick run closed by a run of the same length on the
//   same line)
// - blockquote: every line starting with `>` (quoted material)
// - url: http(s) URLs
// - quote: paired 「」, 『』, “”, ‘’. Pairs nest; they never cross a blank
//   line. An opener without its closer protects nothing. Delimiters inside
//   the spans above (code, frontmatter, blockquote, URL) are ignored.
// Headings are not protected.
// A profile can open the values of named frontmatter keys to pattern rules
// (`frontmatter_prose`); see frontmatterProse.

type SpanKind = Exclude<ProtectedSpan["kind"], "mixed">;

const frontmatter = /^﻿?[ \t]*(?:\n[ \t]*)*---[ \t]*\n[\s\S]*?\n---[ \t]*(?:\n|$)/u;
const url = /https?:\/\/[^\s<>"「」『』“”‘’（）【】《》〈〉，。！？、；：]+/gu;
const fenceOpen = /^ {0,3}(`{3,}|~{3,})/u;
const fenceClose = /^ {0,3}(`{3,}|~{3,})[ \t]*$/u;
const blockquote = /^ {0,3}>/u;

const openers: Readonly<Record<string, string>> = { "「": "」", "『": "』", "“": "”", "‘": "’" };
const closers: Readonly<Record<string, string>> = { "」": "「", "』": "『", "”": "“", "’": "‘" };

function inlineCode(line: string, lineStart: number, spans: ProtectedSpan[]): void {
  // Search the line only: an unbounded indexOf would rescan every later line
  // when this one has no backtick (quadratic on many short lines).
  const runs: { start: number; length: number }[] = [];
  let index = line.indexOf("`");
  while (index >= 0) {
    let end = index;
    while (end < line.length && line.charCodeAt(end) === 96) {
      end += 1;
    }
    runs.push({ start: lineStart + index, length: end - index });
    index = line.indexOf("`", end);
  }
  if (runs.length < 2) {
    return;
  }
  // next[i] = index of the next run with the same length (linear, right to left).
  const next = new Int32Array(runs.length).fill(-1);
  const lastByLength = new Map<number, number>();
  for (let run = runs.length - 1; run >= 0; run -= 1) {
    const { length } = runs[run] ?? { length: 0 };
    next[run] = lastByLength.get(length) ?? -1;
    lastByLength.set(length, run);
  }
  let run = 0;
  while (run < runs.length) {
    const close = next[run] ?? -1;
    const open = runs[run];
    const closing = runs[close];
    if (close < 0 || open === undefined || closing === undefined) {
      run += 1;
      continue;
    }
    spans.push({ start: open.start, end: closing.start + closing.length, kind: "code" });
    run = close + 1;
  }
}

function lineSpans(text: string, spans: ProtectedSpan[]): void {
  let fence: { char: string; length: number; start: number } | null = null;
  let lineStart = 0;
  while (lineStart <= text.length) {
    let lineEnd = text.indexOf("\n", lineStart);
    if (lineEnd < 0) {
      lineEnd = text.length;
    }
    const line = text.slice(lineStart, lineEnd);
    const marker = fenceOpen.exec(line)?.[1];
    if (fence !== null) {
      const closing = fenceClose.exec(line)?.[1];
      if (closing !== undefined && closing[0] === fence.char && closing.length >= fence.length) {
        spans.push({ start: fence.start, end: lineEnd, kind: "code" });
        fence = null;
      }
    } else if (marker !== undefined) {
      fence = { char: marker[0] ?? "`", length: marker.length, start: lineStart };
    } else if (blockquote.test(line)) {
      spans.push({ start: lineStart, end: lineEnd, kind: "blockquote" });
    } else {
      inlineCode(line, lineStart, spans);
    }
    if (lineEnd >= text.length) {
      break;
    }
    lineStart = lineEnd + 1;
  }
  if (fence !== null) {
    spans.push({ start: fence.start, end: text.length, kind: "code" });
  }
}

/**
 * `skip` = the non-quote spans (code, frontmatter, blockquote, URL), sorted by
 * start: a quote delimiter inside them never opens or closes a pair, so a 「
 * in code cannot protect later prose.
 */
function quoteSpans(text: string, skip: readonly ProtectedSpan[], spans: ProtectedSpan[]): void {
  let skipIndex = 0;
  const stack: { char: string; start: number }[] = [];
  const open = new Map<string, number>();
  let previousNewline = -2;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index] ?? "";
    if (char === "\n") {
      // A blank line (only spaces/tabs since the last newline) resets pairing.
      if (previousNewline >= 0 && text.slice(previousNewline + 1, index).trim() === "") {
        stack.length = 0;
        open.clear();
      }
      previousNewline = index;
      continue;
    }
    if (openers[char] === undefined && closers[char] === undefined) {
      continue;
    }
    while (skipIndex < skip.length && (skip[skipIndex]?.end ?? 0) <= index) {
      skipIndex += 1;
    }
    if ((skip[skipIndex]?.start ?? Infinity) <= index) {
      continue;
    }
    if (openers[char] !== undefined) {
      stack.push({ char, start: index });
      open.set(char, (open.get(char) ?? 0) + 1);
      continue;
    }
    const opener = closers[char];
    if (opener === undefined || (open.get(opener) ?? 0) === 0) {
      continue;
    }
    // Pop to the matching opener; openers skipped over stay unclosed.
    for (let top = stack.pop(); top !== undefined; top = stack.pop()) {
      open.set(top.char, (open.get(top.char) ?? 1) - 1);
      if (top.char === opener) {
        spans.push({ start: top.start, end: index + 1, kind: "quote" });
        break;
      }
    }
  }
}

function add(spans: ProtectedSpan[], text: string, regex: RegExp, kind: SpanKind): void {
  for (const match of text.matchAll(regex)) {
    if (match[0].length > 0) {
      spans.push({ start: match.index, end: match.index + match[0].length, kind });
    }
  }
}

/** Length of the leading frontmatter block, 0 when there is none. */
export function frontmatterLength(text: string): number {
  return frontmatter.exec(text)?.[0].length ?? 0;
}

export interface Range {
  start: number;
  end: number;
}

// One frontmatter line `key: value` (optionally after `- ` list markers).
// Group 1 = everything before the key (its column), 2 = key, 3 = the rest.
const frontmatterKey = /^([ \t]*(?:-[ \t]+)*)([A-Za-z_][\w-]*)[ \t]*:(?:[ \t]+(.*))?$/u;

/**
 * [start, end) of the scalar that opens `value` (offsets in `value`), inside
 * the surrounding "" or '' when quoted; undefined when it is not a
 * single-line scalar: a block scalar (| or >), flow collection ([ or {),
 * alias, tag, directive or comment, or a quote not closed on this line.
 * A plain scalar ends before ` #` (a comment); text after a closing quote is
 * ignored.
 */
function scalarValue(value: string): Range | undefined {
  const quote = value[0];
  if (quote === '"' || quote === "'") {
    for (let index = 1; index < value.length; index += 1) {
      const char = value[index];
      if (quote === '"' && char === "\\") {
        index += 1;
      } else if (char === quote) {
        if (quote === "'" && value[index + 1] === "'") {
          index += 1;
          continue;
        }
        return { start: 1, end: index };
      }
    }
    return undefined;
  }
  if (/^[|>[{&*!#%@`]/u.test(value)) {
    return undefined;
  }
  const comment = /[ \t]#/u.exec(value);
  const end = (comment === null ? value : value.slice(0, comment.index)).trimEnd().length;
  return { start: 0, end };
}

/**
 * Value ranges of the frontmatter keys in `keys`, at any nesting depth, inside
 * the surrounding "" or '' when quoted, without a trailing comment. A key's
 * value owns every following line indented past the key (a block scalar, a
 * multi-line scalar or flow collection): those lines are never read as keys,
 * and a value that continues there is not opened. Expects LF text.
 */
export function frontmatterProse(text: string, keys: readonly string[]): Range[] {
  const front = frontmatter.exec(text);
  if (front === null || keys.length === 0) {
    return [];
  }
  const wanted = new Set(keys);
  const ranges: Range[] = [];
  const end = front[0].length;
  // Lines indented more than `owner` belong to the value on an earlier line.
  let owner = -1;
  let pending: Range | undefined;
  let lineStart = text.indexOf("---") + 3;
  while (lineStart < end) {
    let lineEnd = text.indexOf("\n", lineStart);
    if (lineEnd < 0 || lineEnd > end) {
      lineEnd = end;
    }
    const line = text.slice(lineStart, lineEnd);
    lineStart = lineEnd + 1;
    const content = line.trimStart();
    if (content === "") {
      continue;
    }
    const indent = line.length - content.length;
    if (owner >= 0 && indent > owner) {
      // The pending value continues on this line: leave it protected.
      pending = undefined;
      continue;
    }
    if (pending !== undefined) {
      ranges.push(pending);
      pending = undefined;
    }
    owner = -1;
    if (content.startsWith("#")) {
      continue;
    }
    const match = frontmatterKey.exec(line);
    if (match === null) {
      // A sequence item or other scalar owns the lines indented past it; a
      // bare "-" item holds a nested node instead.
      owner = content === "-" ? -1 : indent;
      continue;
    }
    const column = match[1]?.length ?? 0;
    const value = match[3]?.trimEnd() ?? "";
    if (value === "" || value.startsWith("#")) {
      continue;
    }
    owner = column;
    const valueStart = lineEnd - (match[3]?.length ?? 0);
    const scalar = wanted.has(match[2] ?? "") ? scalarValue(value) : undefined;
    if (scalar !== undefined && scalar.end > scalar.start) {
      pending = { start: valueStart + scalar.start, end: valueStart + scalar.end };
    }
  }
  if (pending !== undefined) {
    ranges.push(pending);
  }
  return ranges;
}

function collectSpans(text: string, open: readonly Range[]): { nonQuote: ProtectedSpan[]; quotes: ProtectedSpan[] } {
  const nonQuote: ProtectedSpan[] = [];
  const front = frontmatter.exec(text);
  if (front !== null) {
    let cursor = 0;
    for (const range of open) {
      if (range.start > cursor) {
        nonQuote.push({ start: cursor, end: range.start, kind: "frontmatter" });
      }
      cursor = range.end;
    }
    nonQuote.push({ start: cursor, end: front[0].length, kind: "frontmatter" });
  }
  lineSpans(text, nonQuote);
  add(nonQuote, text, url, "url");
  nonQuote.sort(bySpan);
  const quotes: ProtectedSpan[] = [];
  quoteSpans(text, nonQuote, quotes);
  quotes.sort(bySpan);
  return { nonQuote, quotes };
}

function bySpan(left: ProtectedSpan, right: ProtectedSpan): number {
  return left.start - right.start || left.end - right.end;
}

// Sorted spans -> disjoint spans; a union of different kinds is "mixed".
function merge(spans: readonly ProtectedSpan[]): ProtectedSpan[] {
  const merged: ProtectedSpan[] = [];
  for (const span of spans) {
    const previous = merged.at(-1);
    if (previous === undefined || span.start >= previous.end) {
      merged.push({ ...span });
      continue;
    }
    previous.end = Math.max(previous.end, span.end);
    if (previous.kind !== span.kind) {
      previous.kind = "mixed";
    }
  }
  return merged;
}

/**
 * Expects LF text (the engine normalises line endings first). Sorted, merged.
 * `open` = frontmatter ranges left unprotected (from frontmatterProse); quote
 * pairs inside them are protected as in prose.
 */
export function protectSpans(text: string, open: readonly Range[] = []): ProtectedSpan[] {
  return mergedSpans(protectRanges(text, open));
}

/** Hard and quote spans merged into one sorted, disjoint list (protectSpans). */
export function mergedSpans(protection: Protection): ProtectedSpan[] {
  return merge([...protection.hard, ...protection.quotes].sort(bySpan));
}

/**
 * The same spans as protectSpans, kept apart for pattern matching: `hard` =
 * code, URL, frontmatter and blockquote spans (merged); `quotes` = outermost
 * quote pairs. A quote that contains code or a URL stays a quote, so the
 * code does not turn the whole quote into a hard span.
 */
export function protectRanges(text: string, open: readonly Range[] = []): Protection {
  const { nonQuote, quotes } = collectSpans(text, open);
  return { hard: merge(nonQuote), quotes: merge(quotes) };
}

/** The protected spans that overlap [start, end), in order. */
export function overlappingSpans(
  start: number,
  end: number,
  protectedSpans: readonly ProtectedSpan[],
): ProtectedSpan[] {
  let low = 0;
  let high = protectedSpans.length;
  while (low < high) {
    const middle = low + Math.floor((high - low) / 2);
    const span = protectedSpans[middle];
    if (span !== undefined && span.end <= start) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  const found: ProtectedSpan[] = [];
  for (let index = low; index < protectedSpans.length; index += 1) {
    const span = protectedSpans[index];
    if (span === undefined || span.start >= end) {
      break;
    }
    found.push(span);
  }
  return found;
}

export function overlapsProtected(
  start: number,
  end: number,
  protectedSpans: readonly ProtectedSpan[],
): boolean {
  let low = 0;
  let high = protectedSpans.length;
  while (low < high) {
    const middle = low + Math.floor((high - low) / 2);
    const span = protectedSpans[middle];
    if (span !== undefined && span.end <= start) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  const span = protectedSpans[low];
  return span !== undefined && start < span.end && end > span.start;
}

/**
 * Replaces every protected UTF-16 code unit except "\n" with a space. The
 * result has the same length as `text`, so offsets carry over. Linear.
 */
export function maskProtectedText(text: string, protectedSpans: readonly ProtectedSpan[]): string {
  const parts: string[] = [];
  let cursor = 0;
  for (const span of protectedSpans) {
    parts.push(text.slice(cursor, span.start), text.slice(span.start, span.end).replace(/[^\n]/g, " "));
    cursor = span.end;
  }
  parts.push(text.slice(cursor));
  return parts.join("");
}
