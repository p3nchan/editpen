// Perf budget: 200 KB of mixed Chinese text (unclosed quotes, tables, code,
// many findings) must lint in < 500 ms through the CLI engine and the browser
// entry, plus a few adversarial inputs (including 100 K+ short lines). Run after `npm run build`.

import path from "node:path";
import { fileURLToPath } from "node:url";
import type * as BrowserModule from "../src/browser/index.js";
import type * as NodeModule from "../src/index.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const node = (await import(path.join(root, "dist/index.js"))) as typeof NodeModule;
const browser = (await import(path.join(root, "dist/browser/index.js"))) as typeof BrowserModule;
const budgetMs = 500;
const targetBytes = 200 * 1024;

function fill(unit: string, bytes = targetBytes): string {
  const unitBytes = Buffer.byteLength(unit, "utf8");
  return unit.repeat(Math.ceil(bytes / unitBytes));
}

const mixed = [
  "在當今快速變遷的時代下，隨著科技的發展，我們需要進行評估。",
  "這不是工具，而是方法。他不是在睡覺，他是在裝睡。這件事——需要重新思考。",
  "他說：「這不是工具，而是方法。」她又說「還沒說完，",
  "雖然很累，但是很開心。首先，其次，最後，總結來說，這很重要。",
  "『書名』、“引號”、`code —`、https://example.com/路徑?q=1 都受保護。",
  "",
  "| 欄位 | 這不是工具，而是方法。 | 進行分析 |",
  "",
  "> 引文：這不是工具，而是方法。",
  "",
  "😀𠀀 閉環賦能，抓手落地。",
  "",
].join("\n");

const cases: [string, string][] = [
  ["mixed prose, 200 KB", fill(`${mixed}\n`)],
  ["unclosed 「 x n", fill("「")],
  ["unclosed 「 with text", fill("「這不是工具，而是方法。")],
  ["many findings, one per line", fill("這不是工具，而是方法。我們需要進行評估。\n")],
  ["many findings, one line", fill("這不是工具，而是方法。軟件、硬件、數據庫。")],
  ["many findings, spaced em dashes", fill("漢 — ")],
  ["CRLF + NFD", fill("Cafe\u0301 這不是工具，而是方法。\r\n")],
  // Inputs that made rule regexes quadratic (lookarounds scanning a whole line/text).
  ["full-width space runs", fill("　")],
  ["triads on one line", fill("是ab、是cd、是ef。整理思路、提升效率、拓展視野。")],
  ["summary openers, no terminator", fill("\n總結來說，")],
  // Many short lines: per-line work must stay line-bounded (review 09-27).
  // 600 KB, because quadratic per-line work still fits the budget at 200 KB
  // (unbounded backtick search: 200 KB ~160 ms, 600 KB ~1.2 s).
  ["many short lines 'a\\n'", fill("a\n", 3 * targetBytes)],
  ["many short Chinese lines", fill("這是一行。\n", 3 * targetBytes)],
  ["many empty lines", fill("\n", 3 * targetBytes)],
];

const failures: string[] = [];
for (const [label, text] of cases) {
  // Every rule runs (experimental: true), so the budget covers the full set.
  // One warm-up run so the budget measures the linter, not JIT start-up; then
  // the best of three runs, so a noisy CI neighbour does not fail the build.
  await node.lint(text.slice(0, 2000), { profile: "zh-tw", experimental: true });
  let cliMs = Infinity;
  let browserMs = Infinity;
  let report: Awaited<ReturnType<typeof node.lint>> | undefined;
  for (let run = 0; run < 3; run += 1) {
    let t0 = performance.now();
    report = await node.lint(text, { profile: "zh-tw", experimental: true });
    cliMs = Math.min(cliMs, performance.now() - t0);
    t0 = performance.now();
    browser.lintText(text, { profile: "zh-tw", experimental: true });
    browserMs = Math.min(browserMs, performance.now() - t0);
  }
  const ok = cliMs < budgetMs && browserMs < budgetMs;
  process.stdout.write(
    `${ok ? "ok  " : "SLOW"} ${label.padEnd(30)} ${Buffer.byteLength(text, "utf8")} B, ${report?.findings.length ?? 0} findings: CLI engine ${cliMs.toFixed(0)} ms, browser ${browserMs.toFixed(0)} ms\n`,
  );
  if (!ok) {
    failures.push(label);
  }
}

if (failures.length > 0) {
  process.stderr.write(`Perf budget (${budgetMs} ms) exceeded: ${failures.join(", ")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Perf OK: every case under ${budgetMs} ms.\n`);
}
