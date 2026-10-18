// `editpen lint -f json`: the Report object as-is (schema "editpen-report/1").
// Offsets (`span.start` / `span.end`, `supportingSpans[]`) are UTF-16 code
// units into the file's original text (JavaScript string indices, CRLF kept);
// `line` / `column` are 1-based, column in code points. See SourceSpan in
// src/engine/types.ts.
import type { Report } from "../engine/loader.js";

export function formatJson(report: Report): string {
  return JSON.stringify(report, null, 2);
}
