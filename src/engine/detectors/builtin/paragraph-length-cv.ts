import { charCount, splitParagraphs } from "../../text.js";

function numericParam(
  params: Readonly<Record<string, unknown>>,
  name: string,
  fallback: number,
): number {
  const value = params[name];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function paragraphLengthCv(
  text: string,
  params: Readonly<Record<string, unknown>>,
): number | null {
  const minimumParagraphs = numericParam(params, "min_paragraphs", 3);
  const minimumCharacters = numericParam(params, "min_chars", 20);
  const lengths = splitParagraphs(text)
    .map((paragraph) => charCount(paragraph.text))
    .filter((length) => length >= minimumCharacters);

  if (lengths.length < minimumParagraphs) {
    return null;
  }
  const mean = lengths.reduce((sum, length) => sum + length, 0) / lengths.length;
  if (mean === 0) {
    return null;
  }
  const variance = lengths.reduce((sum, length) => sum + (length - mean) ** 2, 0) / lengths.length;
  return Math.sqrt(variance) / mean;
}
