// Input normalisation (architecture §5): line endings CRLF / lone CR -> LF, then
// Unicode NFC. Rules always see the normalised text; every reported offset is
// mapped back to the caller's original string, so spans slice the text the
// caller passed in.
//
// Mapping: an offset that falls on a boundary between normalisation segments
// maps exactly. "\r\n" is one segment that normalises to "\n", so a span that
// ends before a line break ends before the "\r". An offset strictly inside a
// segment that NFC changed (e.g. "e\u0301\u0301" -> "é\u0301") has no exact
// original position: as a span start it maps to the segment's original start,
// as a span end to the segment's original end. A match touching part of such a
// segment therefore covers the whole original grapheme, never an empty span.

export interface NormalizedText {
  /** LF line endings, NFC. */
  text: string;
  /** Normalised UTF-16 offset -> original UTF-16 offset, as a span start. Monotonic. */
  toOriginal(offset: number): number;
  /** Same, as a span end: offsets inside a changed segment round up. */
  toOriginalEnd(offset: number): number;
}

// Code points that NFC may compose with the preceding code point: combining
// marks, and Hangul medial vowels / final consonants (conjoining jamo).
const joinsPrevious = /[\p{M}ᅠ-ᇿ]/u;

function normalizeLine(line: string, lineStart: number, parts: string[], map: number[], endMap: number[]): void {
  const normalized = line.normalize("NFC");
  if (normalized === line) {
    parts.push(line);
    for (let index = 0; index < line.length; index += 1) {
      map.push(lineStart + index);
      endMap.push(lineStart + index);
    }
    return;
  }
  let index = 0;
  while (index < line.length) {
    let end = index + ((line.codePointAt(index) ?? 0) > 0xffff ? 2 : 1);
    while (end < line.length) {
      const codePoint = line.codePointAt(end) ?? 0;
      if (!joinsPrevious.test(String.fromCodePoint(codePoint))) {
        break;
      }
      end += codePoint > 0xffff ? 2 : 1;
    }
    const segment = line.slice(index, end);
    const segmentNfc = segment.normalize("NFC");
    parts.push(segmentNfc);
    const same = segmentNfc === segment;
    for (let offset = 0; offset < segmentNfc.length; offset += 1) {
      map.push(lineStart + (same ? index + offset : index));
      endMap.push(lineStart + (same ? index + offset : offset === 0 ? index : end));
    }
    index = end;
  }
}

export function normalizeText(original: string): NormalizedText {
  if (!original.includes("\r") && original.normalize("NFC") === original) {
    return { text: original, toOriginal: (offset) => offset, toOriginalEnd: (offset) => offset };
  }
  const parts: string[] = [];
  const map: number[] = [];
  const endMap: number[] = [];
  let lineStart = 0;
  while (lineStart <= original.length) {
    let breakAt = lineStart;
    while (breakAt < original.length) {
      const unit = original.charCodeAt(breakAt);
      if (unit === 10 || unit === 13) {
        break;
      }
      breakAt += 1;
    }
    normalizeLine(original.slice(lineStart, breakAt), lineStart, parts, map, endMap);
    if (breakAt >= original.length) {
      break;
    }
    parts.push("\n");
    map.push(breakAt);
    endMap.push(breakAt);
    const crlf = original.charCodeAt(breakAt) === 13 && original.charCodeAt(breakAt + 1) === 10;
    lineStart = breakAt + (crlf ? 2 : 1);
  }
  map.push(original.length);
  endMap.push(original.length);
  const text = parts.join("");
  const starts = Int32Array.from(map);
  const ends = Int32Array.from(endMap);
  const clamp = (offset: number): number => Math.max(0, Math.min(offset, text.length));
  return {
    text,
    toOriginal: (offset) => starts[clamp(offset)] ?? original.length,
    toOriginalEnd: (offset) => ends[clamp(offset)] ?? original.length,
  };
}
