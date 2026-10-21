import type { ProtectedSpan } from "./types.js";

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

// One frontmatter line `key: value` (optionally a `- ` list item). Group 1 =
// key; the value is what follows `: ` up to the end of the line.
const frontmatterLine = /^[ \t]*(?:-[ \t]+)*([A-Za-z_][\w-]*)[ \t]*:[ \t]+(\S.*?)[ \t]*$/u;

/**
 * Value ranges of the frontmatter keys in `keys`, at any nesting depth, inside
 * the surrounding "" or '' when quoted. Single-line scalars only: a block
 * scalar (| or >), flow collection ([ or {), alias, tag or comment value stays
 * protected. Expects LF text.
 */
export function frontmatterProse(text: string, keys: readonly string[]): Range[] {
  const front = frontmatter.exec(text);
  if (front === null || keys.length === 0) {
    return [];
  }
  const wanted = new Set(keys);
  const ranges: Range[] = [];
  const end = front[0].length;
  let lineStart = text.indexOf("---") + 3;
  while (lineStart < end) {
    let lineEnd = text.indexOf("\n", lineStart);
    if (lineEnd < 0 || lineEnd > end) {
      lineEnd = end;
    }
    const line = text.slice(lineStart, lineEnd);
    const match = frontmatterLine.exec(line);
    const key = match?.[1];
    const value = match?.[2];
    if (key !== undefined && value !== undefined && wanted.has(key) && !/^[|>[{&*!#]/u.test(value)) {
      let start = lineStart + line.lastIndexOf(value);
      let stop = start + value.length;
      const quote = value[0];
      if ((quote === '"' || quote === "'") && value.length >= 2 && value.endsWith(quote)) {
        start += 1;
        stop -= 1;
      }
      if (stop > start) {
        ranges.push({ start, end: stop });
      }
    }
    lineStart = lineEnd + 1;
  }
  return ranges;
}

/**
 * Expects LF text (the engine normalises line endings first). Sorted, merged.
 * `open` = frontmatter ranges left unprotected (from frontmatterProse); quote
 * pairs inside them are protected as in prose.
 */
export function protectSpans(text: string, open: readonly Range[] = []): ProtectedSpan[] {
  const spans: ProtectedSpan[] = [];
  const front = frontmatter.exec(text);
  if (front !== null) {
    let cursor = 0;
    for (const range of open) {
      if (range.start > cursor) {
        spans.push({ start: cursor, end: range.start, kind: "frontmatter" });
      }
      cursor = range.end;
    }
    spans.push({ start: cursor, end: front[0].length, kind: "frontmatter" });
  }
  lineSpans(text, spans);
  add(spans, text, url, "url");
  spans.sort((left, right) => left.start - right.start || left.end - right.end);
  const nonQuote = spans.slice();
  quoteSpans(text, nonQuote, spans);
  spans.sort((left, right) => left.start - right.start || left.end - right.end);

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
