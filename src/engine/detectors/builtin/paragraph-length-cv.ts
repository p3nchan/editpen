import { charCount, splitParagraphs } from "../../text.js";

function numericParam(
  params: Readonly<Record<string, unknown>>,
  name: string,
  fallback: number,
): number {
  const value = params[name];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

// `skip`: paragraphs whose first line is a heading or a list item do not count.
const skippable: Readonly<Record<string, RegExp>> = {
  heading: /^#{1,6}(?:[ \t]|$)/u,
  list: /^(?:[-*+]|\d{1,9}[.)])[ \t]/u,
};

function skipPatterns(params: Readonly<Record<string, unknown>>): RegExp[] {
  const value = params.skip;
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error("paragraph-length-cv: params.skip must be a list of heading / list");
  }
  return value.map((name: unknown) => {
    const pattern = typeof name === "string" && Object.hasOwn(skippable, name) ? skippable[name] : undefined;
    if (pattern === undefined) {
      throw new Error(`paragraph-length-cv: unknown skip value ${String(name)} (expected heading or list)`);
    }
    return pattern;
  });
}

export function paragraphLengthCv(
  text: string,
  params: Readonly<Record<string, unknown>>,
): number | null {
  const minimumParagraphs = numericParam(params, "min_paragraphs", 3);
  const minimumCharacters = numericParam(params, "min_chars", 20);
  const skip = skipPatterns(params);
  const lengths = splitParagraphs(text)
    .filter((paragraph) => !skip.some((pattern) => pattern.test(paragraph.text)))
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
