export interface TextUnit {
  text: string;
  start: number;
  end: number;
}

function isWhitespaceCode(unit: number): boolean {
  return (
    unit === 32 || (unit >= 9 && unit <= 13) || unit === 0xa0 || unit === 0x3000 ||
    unit === 0xfeff || unit === 0x1680 || (unit >= 0x2000 && unit <= 0x200a) ||
    unit === 0x2028 || unit === 0x2029 || unit === 0x202f || unit === 0x205f || unit === 0x85
  );
}

/** Trims whitespace (the same set as regex `\s`) without regex backtracking. */
function trimmedUnit(text: string, start: number, end: number): TextUnit | null {
  let unitStart = start;
  let unitEnd = end;
  while (unitStart < unitEnd && isWhitespaceCode(text.charCodeAt(unitStart))) {
    unitStart += 1;
  }
  while (unitEnd > unitStart && isWhitespaceCode(text.charCodeAt(unitEnd - 1))) {
    unitEnd -= 1;
  }
  if (unitStart === unitEnd) {
    return null;
  }
  return { text: text.slice(unitStart, unitEnd), start: unitStart, end: unitEnd };
}

/** Splits `text.slice(start, end)` at runs of 。！？; offsets stay relative to `text`. */
export function splitSentences(text: string, start = 0, end = text.length): TextUnit[] {
  const units: TextUnit[] = [];
  const terminator = /[。！？]+/gu;
  let cursor = start;
  for (const match of text.slice(start, end).matchAll(terminator)) {
    const matchEnd = start + match.index + match[0].length;
    const unit = trimmedUnit(text, cursor, matchEnd);
    if (unit !== null) {
      units.push(unit);
    }
    cursor = matchEnd;
  }
  const tail = trimmedUnit(text, cursor, end);
  if (tail !== null) {
    units.push(tail);
  }
  return units;
}

/** Paragraphs separated by blank lines. Used by metric rules (F26a). */
export function splitParagraphs(text: string): TextUnit[] {
  const units: TextUnit[] = [];
  const separator = /\r?\n[ \t]*\r?\n/gu;
  let start = 0;
  for (const match of text.matchAll(separator)) {
    if (match.index === undefined) {
      continue;
    }
    const unit = trimmedUnit(text, start, match.index);
    if (unit !== null) {
      units.push(unit);
    }
    start = match.index + match[0].length;
  }
  const tail = trimmedUnit(text, start, text.length);
  if (tail !== null) {
    units.push(tail);
  }
  return units;
}

const tableRow = /^[ \t]*\|.*\|[ \t]*$/u;
const tableDelimiterCell = /^:?-+:?$/u;
// Lines that start a new block: headings, list items, fence / frontmatter
// markers, blockquotes.
const blockStart = /^[ \t]{0,3}(?:#{1,6}(?:[ \t]|$)|[-*+][ \t]|\d{1,9}[.)][ \t]|```|~~~|>|---)/u;
// Of those, the ones that are a block on their own (never continue on the next line).
const singleLineBlock = /^[ \t]{0,3}(?:#{1,6}(?:[ \t]|$)|```|~~~|>|---)/u;

function tableCells(text: string, lineStart: number, lineEnd: number, units: TextUnit[]): void {
  let cellStart = -1;
  for (let index = lineStart; index <= lineEnd; index += 1) {
    const isPipe =
      index < lineEnd && text.charCodeAt(index) === 124 && text.charCodeAt(index - 1) !== 92;
    if (!isPipe && index < lineEnd) {
      continue;
    }
    if (cellStart >= 0) {
      const cell = trimmedUnit(text, cellStart, index);
      if (cell !== null && !tableDelimiterCell.test(cell.text)) {
        units.push(cell);
      }
    }
    cellStart = index + 1;
  }
}

/**
 * Structural blocks for pattern matching: paragraphs (blank-line separated),
 * where a heading, list item or markdown block marker starts a new block, and
 * every table row is split into one unit per cell, so no match can join two
 * cells across `|`. Expects LF text (the engine normalises before linting).
 */
export function splitBlocks(text: string): TextUnit[] {
  const units: TextUnit[] = [];
  let blockBegin = -1;
  let blockEnd = -1;
  const flush = (): void => {
    if (blockBegin >= 0) {
      const unit = trimmedUnit(text, blockBegin, blockEnd);
      if (unit !== null) {
        units.push(unit);
      }
    }
    blockBegin = -1;
  };
  let lineStart = 0;
  while (lineStart <= text.length) {
    let lineEnd = text.indexOf("\n", lineStart);
    if (lineEnd < 0) {
      lineEnd = text.length;
    }
    const line = text.slice(lineStart, lineEnd);
    if (trimmedUnit(line, 0, line.length) === null) {
      flush();
    } else if (tableRow.test(line)) {
      flush();
      tableCells(text, lineStart, lineEnd, units);
    } else {
      if (blockStart.test(line)) {
        flush();
      }
      if (blockBegin < 0) {
        blockBegin = lineStart;
      }
      blockEnd = lineEnd;
      if (singleLineBlock.test(line)) {
        flush();
      }
    }
    if (lineEnd >= text.length) {
      break;
    }
    lineStart = lineEnd + 1;
  }
  flush();
  return units;
}

/** Code points that are not whitespace. */
export function charCount(text: string): number {
  let count = 0;
  for (let index = 0; index < text.length; index += 1) {
    const unit = text.charCodeAt(index);
    if (unit >= 0xdc00 && unit <= 0xdfff && index > 0) {
      const previous = text.charCodeAt(index - 1);
      if (previous >= 0xd800 && previous <= 0xdbff) {
        continue;
      }
    }
    if (!isWhitespaceCode(unit)) {
      count += 1;
    }
  }
  return count;
}

export type Locator = (offset: number) => { line: number; column: number };

/**
 * UTF-16 offset -> 1-based line and column. O(n) setup, O(log lines) per
 * lookup. Lines break at "\n", "\r\n" and a lone "\r". Columns count code points.
 */
export function createLocator(text: string): Locator {
  const lineStarts = [0];
  const codePointsBefore = new Uint32Array(text.length + 1);
  let codePoints = 0;
  for (let index = 0; index < text.length; index += 1) {
    const unit = text.charCodeAt(index);
    const previous = index > 0 ? text.charCodeAt(index - 1) : 0;
    if (unit >= 0xdc00 && unit <= 0xdfff && previous >= 0xd800 && previous <= 0xdbff) {
      codePointsBefore[index] = codePoints - 1;
    } else {
      codePointsBefore[index] = codePoints;
      codePoints += 1;
    }
    if (unit === 10 || (unit === 13 && text.charCodeAt(index + 1) !== 10)) {
      lineStarts.push(index + 1);
    }
  }
  codePointsBefore[text.length] = codePoints;
  return (offset) => {
    const safeOffset = Math.max(0, Math.min(offset, text.length));
    let low = 0;
    let high = lineStarts.length - 1;
    while (low < high) {
      const middle = (low + high + 1) >> 1;
      if ((lineStarts[middle] ?? 0) <= safeOffset) {
        low = middle;
      } else {
        high = middle - 1;
      }
    }
    const lineStart = lineStarts[low] ?? 0;
    return {
      line: low + 1,
      column: (codePointsBefore[safeOffset] ?? 0) - (codePointsBefore[lineStart] ?? 0) + 1,
    };
  };
}
