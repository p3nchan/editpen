// Engine behaviour checks: protected spans, markdown structure, normalisation
// offsets, rule selection, and the loadRules regex gate. Run after `npm run build`.

import { cp, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import type * as BrowserModule from "../src/browser/index.js";
import type * as CoreModule from "../src/engine/core.js";
import type * as NormalizeModule from "../src/engine/normalize.js";
import type * as NodeModule from "../src/index.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const node = (await import(path.join(root, "dist/index.js"))) as typeof NodeModule;
const browser = (await import(path.join(root, "dist/browser/index.js"))) as typeof BrowserModule;
// The browser entry wraps this same lintCore; used with custom rules below.
const core = (await import(path.join(root, "dist/engine/core.js"))) as typeof CoreModule;
const { normalizeText } = (await import(path.join(root, "dist/engine/normalize.js"))) as typeof NormalizeModule;
const errors: string[] = [];
let checks = 0;

function check(label: string, ok: boolean, detail = ""): void {
  checks += 1;
  if (!ok) {
    errors.push(`${label}${detail === "" ? "" : `: ${detail}`}`);
  }
}

async function hits(text: string, ruleId: string, options: NodeModule.LintOptions = {}): Promise<string[]> {
  const report = await node.lint(text, { profile: "zh-tw", ruleIds: [ruleId], ...options });
  return report.findings.map((finding) => text.slice(finding.span.start, finding.span.end));
}

const d01a = "這不是工具，而是方法。";

// Protected spans: each wrapper must hide the D01a hit.
const protectedCases: [string, string][] = [
  ["「」", `他說：「${d01a}」`],
  ["『』", `他說：『${d01a}』`],
  ["“”", `他說：“${d01a}”`],
  ["‘’", `他說：‘${d01a}’`],
  ["inline code", `範例 \`${d01a}\` 結束。`],
  ["double-backtick code", `範例 \`\`${d01a}\`\` 結束。`],
  ["fenced code", `前言。\n\n\`\`\`\n${d01a}\n\`\`\`\n`],
  ["unclosed fence", `前言。\n\n~~~\n${d01a}\n`],
  ["blockquote", `前言。\n\n> ${d01a}\n`],
  ["frontmatter", `---\ntitle: ${d01a}\n---\n正文。`],
  ["frontmatter after BOM + blank line", `﻿\n---\ntitle: ${d01a}\n---\n正文。`],
  ["url", `見 https://example.com/這不是工具，而是方法 。`],
  ["quote after inline code", `\`x\` 「${d01a}」`],
];
for (const [label, text] of protectedCases) {
  const found = await hits(text, "D01a");
  check(`protected ${label}`, found.length === 0, `got ${JSON.stringify(found)}`);
}

// Not protected: headings, unclosed quotes, text after a closed quote, table cells.
const openCases: [string, string, number][] = [
  ["heading", `## ${d01a}\n\n正文。`, 1],
  ["unclosed 「", `「${d01a}`, 1],
  ["unclosed 『 then closed pair", `『開頭\n\n「引號」${d01a}`, 1],
  ["quote does not cross a blank line", `「開頭\n\n${d01a}」`, 1],
  ["after a protected hit in the same sentence", `「不是工具，而是」${d01a}`, 1],
  ["table cell", `| D01a | 「不是 X，而是 Y」對比句 | ${d01a} |`, 1],
  ["two table cells never join", "| 這不是 | 工具，而是方法 |", 0],
  ["sentence does not cross a blank line", "這不是工具\n\n，而是方法。", 0],
  // A quote delimiter inside code/frontmatter/blockquote never pairs with prose.
  ["「 in a fence does not pair with prose 」", `\`\`\`\n「\n\`\`\`\n${d01a}」`, 1],
  ["「 in inline code does not pair with prose 」", `\`「\`${d01a}」`, 1],
  ["「 in a blockquote does not pair with prose 」", `> 「\n${d01a}」`, 1],
  ["「 in frontmatter does not pair with prose 」", `---\ntitle: 「\n---\n${d01a}」`, 1],
  ["」 in inline code does not close a prose 「", `「${d01a}\`」\``, 1],
];
for (const [label, text, expected] of openCases) {
  const found = await hits(text, "D01a");
  check(`linted ${label}`, found.length === expected, `expected ${expected}, got ${JSON.stringify(found)}`);
}

// Normalisation: offsets index the original text (CRLF kept, NFD kept).
for (const text of [`é${d01a}\r\n\r\n${d01a}`, `Café\r\n${d01a}`, `切${d01a}\r${d01a}`]) {
  const report = await node.lint(text, { profile: "zh-tw", ruleIds: ["D01a"] });
  check(`normalised offsets ${JSON.stringify(text)}`, report.findings.length > 0);
  for (const finding of report.findings) {
    const slice = text.slice(finding.span.start, finding.span.end);
    check(`normalised slice ${JSON.stringify(text)}`, slice === finding.match && slice === "不是工具，而是方法", slice);
  }
}
// Browser path agrees on the code/quote crossing repros.
for (const text of [`\`\`\`\n「\n\`\`\`\n${d01a}」`, `\`「\`${d01a}」`]) {
  const found = browser.lintText(text, { ruleIds: ["D01a"] }).findings.map((f) => f.scope === "inline" ? [f.start, f.end] : []);
  check(`browser code/quote crossing ${JSON.stringify(text)}`, found.length === 1, JSON.stringify(found));
}

// Partial NFC composition: an offset inside a changed segment maps to the
// segment's original start (as a start) or end (as an end), never collapsing.
for (const [text, nfc] of [["e\u0301\u0301", "\u00e9\u0301"], ["e\u0301\u0316", "\u00e9\u0316"]] as const) {
  const normalized = normalizeText(text);
  check(`NFC ${JSON.stringify(text)} text`, normalized.text === nfc, JSON.stringify(normalized.text));
  const mapped = [normalized.toOriginal(0), normalized.toOriginalEnd(1), normalized.toOriginal(1), normalized.toOriginalEnd(2)];
  check(`NFC ${JSON.stringify(text)} boundaries`, mapped.join() === "0,3,0,3", mapped.join());
}
const crlf = await node.lint(`第一行。\r\n${d01a}`, { profile: "zh-tw", ruleIds: ["D01a"] });
check("CRLF line/column", crlf.findings[0]?.span.line === 2 && crlf.findings[0]?.span.column === 2,
  JSON.stringify(crlf.findings[0]?.span));

// Metric span covers the whole original text, even with supplementary
// characters inside protected spans (browser report issue 2).
const paragraph = "我把昨天的測試重新跑了一次，三個失敗案例都停在相同位置。「😀𠀀」";
const uniform = [paragraph, paragraph, paragraph].join("\n\n");
const metric = (await node.lint(uniform, { profile: "zh-tw", ruleIds: ["F26a"] })).findings[0];
check("metric span end", metric?.span.end === uniform.length, `${metric?.span.end} != ${uniform.length}`);

// Rule selection.
const selectionText = `${d01a}我們需要進行評估。`;
const ids = async (options: NodeModule.LintOptions): Promise<string[]> =>
  [...new Set((await node.lint(selectionText, { profile: "zh-tw", ...options })).findings.map((f) => f.ruleId))].sort();
check("default runs D01a only (F09a is experimental)", (await ids({})).join() === "D01a", (await ids({})).join());
check("--experimental adds F09a", (await ids({ experimental: true })).join() === "D01a,F09a",
  (await ids({ experimental: true })).join());
check("--enable F09a", (await ids({ enable: ["F09a"] })).join() === "D01a,F09a");
check("--disable F09a", (await ids({ experimental: true, disable: ["F09a"] })).join() === "D01a");
check("--disable wins over ruleIds", (await ids({ ruleIds: ["D01a"], disable: ["D01a"] })).length === 0);
let threw = false;
try {
  await ids({ enable: ["X99z"] });
} catch {
  threw = true;
}
check("unknown --enable id throws", threw);
const browserIds = [...new Set(browser.lintText(selectionText, { experimental: true, disable: ["D01a"] }).findings.map((f) => f.ruleId))];
check("browser disable", browserIds.join() === "F09a", browserIds.join());

// Default rule set pinned to decision D19 (projects/editpen/launch/
// decision-rule-defaults.md option 1). Editing src/engine/defaults.ts without
// updating these lists fails here, in the CLI rule list and the browser cards.
const expectedOn = ["D01a", "D04a", "M01b"];
const expectedExperimental = ["D02a", "D04b", "D09a", "D09b", "F02a", "F05a", "F06a", "F07a", "F08a", "F09a", "F11a", "F26a", "M01a"];
const allRules = await node.loadRules(path.join(root, "rules"), "zh-tw");
const byDefault = (state: string): string =>
  allRules.filter((rule) => node.ruleDefault(rule.id) === state).map((rule) => rule.id).sort().join();
check("default-on rules", byDefault("on") === expectedOn.join(), byDefault("on"));
check("experimental rules", byDefault("experimental") === expectedExperimental.join(), byDefault("experimental"));
check("no rule is off", byDefault("off") === "", byDefault("off"));
for (const profile of ["zh", "zh-tw"] as const) {
  const cards = browser.ruleCards(profile);
  const cardsOn = cards.filter((card) => card.default === "on").map((card) => card.id).sort().join();
  const cardsExp = cards.filter((card) => card.default === "experimental").map((card) => card.id).sort().join();
  const profileRules = await node.loadRules(path.join(root, "rules"), profile);
  const want = (ids: string[]): string => ids.filter((id) => profileRules.some((rule) => rule.id === id)).join();
  check(`browser ruleCards(${profile}) on`, cardsOn === want(expectedOn), cardsOn);
  check(`browser ruleCards(${profile}) experimental`, cardsExp === want(expectedExperimental), cardsExp);
}
// Rules actually run: a text that trips every rule under --experimental
// yields only default-on rule ids without it, in the CLI and the browser.
const texts: string[] = [];
for (const entry of await readdir(path.join(root, "rules"))) {
  if (/^[A-Z][0-9]{2}[a-z]-/u.test(entry)) {
    const fixtures = parse(await readFile(path.join(root, "rules", entry, "fixtures.yaml"), "utf8")) as { fixtures: { text: string }[] };
    texts.push(...fixtures.fixtures.map((fixture) => fixture.text));
  }
}
const runIds = (findings: readonly { ruleId: string }[]): Set<string> => new Set(findings.map((f) => f.ruleId));
const cliDefault = new Set<string>();
const cliExperimental = new Set<string>();
const browserDefault = new Set<string>();
const browserExperimental = new Set<string>();
for (const text of texts) {
  for (const id of runIds((await node.lint(text, { profile: "zh-tw" })).findings)) cliDefault.add(id);
  for (const id of runIds((await node.lint(text, { profile: "zh-tw", experimental: true })).findings)) cliExperimental.add(id);
  for (const id of runIds(browser.lintText(text, { profile: "zh-tw" }).findings)) browserDefault.add(id);
  for (const id of runIds(browser.lintText(text, { profile: "zh-tw", experimental: true }).findings)) browserExperimental.add(id);
}
const sorted = (set: Set<string>): string => [...set].sort().join();
check("CLI default lint fires only default-on rules", sorted(cliDefault) === expectedOn.join(), sorted(cliDefault));
check("browser default lintText fires only default-on rules", sorted(browserDefault) === expectedOn.join(), sorted(browserDefault));
check("CLI --experimental fires every rule", sorted(cliExperimental) === allRules.map((rule) => rule.id).sort().join(),
  sorted(cliExperimental));
check("browser experimental fires every rule", sorted(browserExperimental) === sorted(cliExperimental), sorted(browserExperimental));

// Evidence grade follows the profile's variant: F09a's A source is zh-CN only.
const f09 = async (profile: string): Promise<string | undefined> =>
  (await node.lint("我們需要進行評估。", { profile, ruleIds: ["F09a"] })).findings[0]?.evidenceGrade;
check("F09a grade under zh-tw is not the zh-CN A", (await f09("zh-tw")) === "C", await f09("zh-tw"));
check("F09a grade under zh keeps A", (await f09("zh")) === "A", await f09("zh"));
const f09Card = browser.ruleCards("zh-tw").find((card) => card.id === "F09a");
check("browser card grade follows the variant", f09Card?.evidenceGrade === "C", f09Card?.evidenceGrade);

// Density findings point at their first occurrence, not first-to-last.
const signposts = "首先確認需求。其次整理資料。此外記下限制。然而時程很趕。最後再交付結果。";
const density = (await node.lint(signposts, { profile: "zh-tw", ruleIds: ["D02a"] })).findings[0];
check("density span = first occurrence", density?.span.start === 0 && density.span.end === 2 &&
  (density.supportingSpans?.length ?? 0) > 1, JSON.stringify(density?.span));

// loadRules fails closed on an unsafe regex in a custom rules dir, and accepts
// the reviewed patterns only verbatim.
const customDir = await mkdtemp(path.join(tmpdir(), "editpen-rules-"));
try {
  await cp(path.join(root, "rules"), customDir, { recursive: true });
  await node.loadRules(customDir, "zh-tw");
  checks += 1;
  const rulePath = path.join(customDir, "D01a-contrastive-frame", "rule.md");
  const source = await readFile(rulePath, "utf8");
  for (const [label, regex] of [["nested quantifier", "(不是+)+"], ["backreference", "(不是)\\1"], ["unbounded lookbehind", "(?<!提醒[^，]*)不是"], ["adjacent unbounded quantifiers", "^a+a+$"], ["adjacent unbounded quantifiers across a group", "(不+)是*"]] as const) {
    await writeFile(rulePath, source.replace(/regex: '\(不是\|並非\|並非是\)[^']*'/u, () => `regex: '${regex}'`));
    let message = "";
    try {
      await node.loadRules(customDir, "zh-tw");
    } catch (error: unknown) {
      message = error instanceof Error ? error.message : String(error);
    }
    check(`loadRules rejects ${label}`, message.includes("D01a/") && message.includes("super-linear"), message);
  }
  // A custom rule matching a partially composed grapheme gets the whole
  // original grapheme, in the CLI and in the lintCore the browser wraps.
  await writeFile(rulePath, source.replace(/regex: '\(不是\|並非\|並非是\)[^']*'/u, "regex: 'é'"));
  const accentRules = (await node.loadRules(customDir, "zh-tw")).filter((rule) => rule.id === "D01a");
  const accentProfile = await node.loadProfile(customDir, "zh-tw");
  for (const [text, start, end] of [["e\u0301\u0301", 0, 3], ["x e\u0301\u0316 y", 2, 5], ["\u00e9", 0, 1]] as const) {
    const cli = (await node.lint(text, { profile: "zh-tw", ruleIds: ["D01a"], rulesDir: customDir })).findings;
    const shared = core.lintCore(text, { profile: accentProfile, rules: accentRules, lexicons: new Map() }).findings;
    for (const [where, findings] of [["CLI", cli], ["lintCore", shared]] as const) {
      const span = findings[0]?.span;
      check(`${where} partial-NFC span ${JSON.stringify(text)}`, findings.length === 1 && span?.start === start &&
        span.end === end && findings[0]?.match === text.slice(start, end), JSON.stringify(findings.map((f) => [f.span.start, f.span.end, f.match])));
    }
  }
  await writeFile(rulePath, source);
  // threshold.min: a density rule needs at least that many occurrences.
  const d02aPath = path.join(customDir, "D02a-signpost-density", "rule.md");
  const d02a = await readFile(d02aPath, "utf8");
  const withoutMin = d02a.replace(/\n    min: \d+(?=\n)/u, "");
  await writeFile(d02aPath, withoutMin.replace("\n  threshold:\n", "\n  threshold:\n    min: 6\n"));
  const withMin = await node.lint(signposts, { profile: "zh-tw", ruleIds: ["D02a"], rulesDir: customDir });
  check("density threshold.min suppresses 5 < 6 occurrences", withMin.findings.length === 0);
  await writeFile(d02aPath, d02a);

  const f11aPath = path.join(customDir, "F11a-pseudo-contrast", "rule.md");
  await writeFile(rulePath, source);
  await writeFile(f11aPath, (await readFile(f11aPath, "utf8")).replace("[他她它我你]", "[他她它我你妳]"));
  let message = "";
  try {
    await node.loadRules(customDir, "zh-tw");
  } catch (error: unknown) {
    message = error instanceof Error ? error.message : String(error);
  }
  check("edited reviewed regex loses its exemption", message.includes("F11a/repeated-subject-contrast"), message);
} finally {
  await rm(customDir, { recursive: true, force: true });
}

if (errors.length > 0) {
  process.stderr.write(`Engine checks failed:\n${errors.map((error) => `- ${error}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Engine checks OK: ${checks} checks.\n`);
}
