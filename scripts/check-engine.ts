// Engine behaviour checks: protected spans, markdown structure, normalisation
// offsets, rule selection, and the loadRules regex gate. Run after `npm run build`.

import { spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import type * as BrowserModule from "../src/browser/index.js";
import type * as CoreModule from "../src/engine/core.js";
import type * as NormalizeModule from "../src/engine/normalize.js";
import type * as CvModule from "../src/engine/detectors/builtin/paragraph-length-cv.js";
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

// A quote drops only a match that lies inside it: a pattern that straddles a
// quote (quoted word in X or in Y) is reported; a quoted example of the
// pattern stays protected even when text follows the closing 」.
const straddle: [string, string, string[]][] = [
  ["quote in X", "小白點不是「卵齒」，而是幫他破殼的工具。", ["不是「卵齒」，而是幫他破殼的工具"]],
  ["quote in Y", "小白點不是沾到的髒東西，而是幫他破殼的「卵齒」。", ["不是沾到的髒東西，而是幫他破殼的「卵齒」"]],
  ["quote mid-Y", "小白點不是髒東西，而是幫他「破殼」的工具。", ["不是髒東西，而是幫他「破殼」的工具"]],
  ["whole match inside a quote", "他說那叫「不是髒東西，而是卵齒」。", []],
  ["quoted example followed by text", "「不是 X，而是 Y」這種對比句很常見。", []],
  ["code still drops a straddle", "小白點不是`卵齒`，而是幫他破殼的工具。", []],
];
for (const [label, text, expected] of straddle) {
  const found = await hits(text, "D01a");
  check(`quote overlap: ${label}`, found.join("|") === expected.join("|"), JSON.stringify(found));
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

// 小企鵝模式 (rules/profiles/penchan.yaml): house rules load only there, never
// in zh / zh-tw or the browser data; every rule it loads runs by default; its
// house severity is marked as policy, and rules it does not map keep evidence.
const penchanRules = await node.loadRules(path.join(root, "rules"), "penchan");
const houseIds = penchanRules.filter((rule) => rule.scope === "house").map((rule) => rule.id).sort();
check("penchan loads the house rules", houseIds.join() === "D01b,D04c,D04d,D09c,D09d,F12a,F12b,F26b,M01c", houseIds.join());
for (const profile of ["zh", "zh-tw"] as const) {
  const cardIds = browser.ruleCards(profile).map((card) => card.id);
  check(`browser ruleCards(${profile}) has no house rule`, !cardIds.some((id) => houseIds.includes(id)), cardIds.join());
}
const penchanFired = new Set<string>();
for (const text of texts) {
  for (const id of runIds((await node.lint(text, { profile: "penchan" })).findings)) penchanFired.add(id);
}
// F26a is off there (F26b replaces it); every other rule it loads runs.
check("penchan runs every rule it loads by default", sorted(penchanFired) ===
  penchanRules.map((rule) => rule.id).filter((id) => id !== "F26a").sort().join(), sorted(penchanFired));
const penchanRun = await node.lint("他走了——再也沒回來。這個軟件很好用。", { profile: "penchan" });
const levels = penchanRun.findings.map((f) => `${f.ruleId}:${f.severity}:${f.housePolicy === true ? "house" : "evidence"}`).sort().join();
check("penchan: M01c error as house policy, D04a keeps its evidence level", levels === "D04a:warn:evidence,M01c:error:house", levels);

// penchan swaps F26a for F26b: short paragraphs (7+ chars) count there.
const shortUniform = "今天去海邊看企鵝了。\n\n牠們排成一列走路。\n\n回家時天已經黑了。";
const shortRun = (await node.lint(shortUniform, { profile: "penchan", experimental: true })).findings.map((f) => f.ruleId);
check("penchan: F26b fires on short uniform paragraphs, F26a stays off even with --experimental",
  shortRun.includes("F26b") && !shortRun.includes("F26a"), shortRun.join());
check("zh-tw F26a unchanged: paragraphs under 20 chars do not count",
  (await hits(shortUniform, "F26a")).length === 0);

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

// House profiles (test/house): scope `house`, profile `enable` + house
// `severity`, positional scope (`detector.within`), and `--max-warnings`.
for (const profile of ["zh", "zh-tw"]) {
  const scopes = (await node.loadRules(path.join(root, "rules"), profile)).map((rule) => rule.scope);
  check(`${profile} loads no house rule`, !scopes.includes("house"), scopes.join());
}
const houseRoot = await mkdtemp(path.join(tmpdir(), "editpen-house-"));
try {
  const houseDir = path.join(houseRoot, "rules");
  await cp(path.join(root, "rules"), houseDir, { recursive: true });
  await cp(path.join(root, "test/house/rules"), houseDir, { recursive: true });
  await mkdir(path.join(houseRoot, "research"));
  await cp(path.join(root, "research/ledger.md"), path.join(houseRoot, "research/ledger.md"));
  const cli = (...args: string[]): { code: number | null; out: string } => {
    const result = spawnSync(process.execPath, [path.join(root, "dist/cli.js"), ...args], { encoding: "utf8" });
    return { code: result.status, out: `${result.stdout}${result.stderr}` };
  };

  for (const profile of ["zh", "zh-tw"]) {
    const loaded = (await node.loadRules(houseDir, profile)).map((rule) => rule.id);
    check(`house rule stays out of ${profile}`, !loaded.includes("Z01a"), loaded.join());
  }
  check("house-test profile loads the house rule",
    (await node.loadRules(houseDir, "house-test")).some((rule) => rule.id === "Z01a"));

  const houseText = "我們需要進行評估。\n\n測試詞在第二段。";
  const house = await node.lint(houseText, { profile: "house-test", rulesDir: houseDir });
  const houseIds = house.findings.map((finding) => finding.ruleId).sort().join();
  check("profile enable runs experimental F09a by default", houseIds === "F09a,Z01a", houseIds);
  check("house severity raises to error and is marked house policy",
    house.findings.every((finding) => finding.severity === "error" && finding.housePolicy === true) &&
      house.summary.error === 2, JSON.stringify(house.findings.map((f) => [f.ruleId, f.severity, f.housePolicy])));
  const publicRun = await node.lint(houseText, { profile: "zh-tw", rulesDir: houseDir, experimental: true });
  check("zh-tw keeps evidence severity, no house marker",
    publicRun.findings.some((f) => f.ruleId === "F09a" && f.severity !== "error") &&
      publicRun.findings.every((f) => f.ruleId !== "Z01a" && f.housePolicy === undefined),
    JSON.stringify(publicRun.findings.map((f) => [f.ruleId, f.severity])));
  const disabled = await node.lint(houseText, { profile: "house-test", rulesDir: houseDir, disable: ["F09a"] });
  check("--disable wins over profile enable", disabled.findings.every((f) => f.ruleId !== "F09a"));
  const only = await node.lint(houseText, { profile: "house-test", rulesDir: houseDir, ruleIds: ["Z01a"] });
  check("ruleIds ignores profile enable", only.findings.map((f) => f.ruleId).join() === "Z01a");

  // Positional scope: only the first 2 prose paragraphs; headings, list
  // items, table cells, blockquotes, code and frontmatter neither match nor count.
  const positional = [
    "---\ntitle: 測試詞\n---",
    "# 測試詞標題",
    "- 測試詞清單\n- 第二項",
    "| 測試詞 | 表格 |\n|---|---|\n| 測試詞 | 列 |",
    "> 測試詞引文",
    "```\n測試詞程式碼\n```",
    "第一段有測試詞。",
    "## 小標題",
    "第二段，測試詞。再一次測試詞。",
    "第三段的測試詞不算。",
  ].join("\n\n");
  const within = await node.lint(positional, { profile: "house-test", rulesDir: houseDir, ruleIds: ["Z01a"] });
  const lines = within.findings.map((finding) => finding.span.line).join();
  check("within: first 2 prose paragraphs only", within.findings.length === 3 &&
    within.findings.every((f) => f.match === "測試詞") && lines === "20,24,24", lines);

  // A block that is only images or only HTML lines is not a prose paragraph
  // either; an image followed by text still is.
  const embeds = [
    "![測試詞](a.png)",
    "<div>測試詞</div>",
    "<p>\n<img src=\"b.png\" alt=\"測試詞\">\n</p>",
    "第一段。",
    "第二段有測試詞。",
    "第三段的測試詞不算。",
  ].join("\n\n");
  const embedRun = await node.lint(embeds, { profile: "house-test", rulesDir: houseDir, ruleIds: ["Z01a"] });
  const embedLines = embedRun.findings.map((finding) => finding.span.line).join();
  check("within: image-only and HTML-only blocks are not prose", embedLines === "11", embedLines);
  const captioned = await node.lint("![圖](a.png) 圖說有測試詞。\n\n第二段。\n\n第三段有測試詞。", {
    profile: "house-test", rulesDir: houseDir, ruleIds: ["Z01a"],
  });
  check("within: image plus text is still prose", captioned.findings.map((f) => f.span.line).join() === "1",
    captioned.findings.map((f) => f.span.line).join());

  // check-rules: accepts the house rule and profile; rejects a rule default
  // above its evidence ceiling and a profile entry naming an unknown rule.
  const passing = cli("check-rules", "--rules-dir", houseDir);
  check("check-rules passes with house rule + profile", passing.code === 0, passing.out);
  const z01aPath = path.join(houseDir, "Z01a-test-house", "rule.md");
  const z01a = await readFile(z01aPath, "utf8");
  await writeFile(z01aPath, z01a.replace("default: warn", "default: error"));
  const tooHigh = cli("check-rules", "--rules-dir", houseDir);
  check("check-rules still rejects a rule default above its ceiling",
    tooHigh.code === 1 && tooHigh.out.includes("Z01a: default severity error exceeds warn ceiling"), tooHigh.out);
  await writeFile(z01aPath, z01a);
  const profilePath = path.join(houseDir, "profiles", "house-test.yaml");
  const profileSource = await readFile(profilePath, "utf8");
  await writeFile(profilePath, profileSource.replace("Z01a: error", "Y01a: error"));
  const unknown = cli("check-rules", "--rules-dir", houseDir);
  check("check-rules rejects a house severity for a rule outside the profile",
    unknown.code === 1 && unknown.out.includes("profile house-test: Y01a"), unknown.out);
  await writeFile(profilePath, profileSource);

  // --max-warnings: exit 1 only when warnings exceed n; errors still exit 1.
  const warnFile = path.join(houseRoot, "warn.md");
  await writeFile(warnFile, `${d01a}\n\n${d01a}`);
  for (const [args, code] of [[[], 0], [["--max-warnings", "2"], 0], [["--max-warnings", "1"], 1], [["--max-warnings", "0"], 1]] as const) {
    const run = cli("lint", warnFile, "-f", "json", ...args);
    check(`lint ${args.join(" ") || "(no flag)"} with 2 warnings exits ${code}`, run.code === code, `${run.code}`);
  }
  for (const bad of ["-1", "x", "1.5"]) {
    const run = cli("lint", warnFile, "--max-warnings", bad);
    check(`--max-warnings ${bad} is rejected`, run.code === 1 && run.out.includes("non-negative integer"), run.out);
  }
  const errorFile = path.join(houseRoot, "error.md");
  await writeFile(errorFile, "測試詞。");
  const errorRun = cli("lint", errorFile, "-p", "house-test", "--rules-dir", houseDir);
  check("house error exits 1 and prints house policy", errorRun.code === 1 && errorRun.out.includes("house policy"), errorRun.out);
} finally {
  await rm(houseRoot, { recursive: true, force: true });
}

// paragraph-length-cv `skip`: heading and list paragraphs drop out of the CV.
const { paragraphLengthCv } = (await import(path.join(root, "dist/engine/detectors/builtin/paragraph-length-cv.js"))) as typeof CvModule;
const cvBody = "我把昨天的測試重新跑了一次，三個失敗案例都停在相同位置。";
const cvText = [`# ${cvBody}${cvBody}${cvBody}`, cvBody, `- ${cvBody}${cvBody}`, cvBody, cvBody].join("\n\n");
const cvAll = paragraphLengthCv(cvText, {});
const cvSkip = paragraphLengthCv(cvText, { skip: ["heading", "list"] });
check("CV without skip counts heading/list", cvAll !== null && cvAll > 0.3, `${cvAll}`);
check("CV skip heading/list", cvSkip === 0, `${cvSkip}`);
let cvThrew = false;
try {
  paragraphLengthCv(cvText, { skip: ["table"] });
} catch {
  cvThrew = true;
}
check("CV unknown skip value throws", cvThrew);

if (errors.length > 0) {
  process.stderr.write(`Engine checks failed:\n${errors.map((error) => `- ${error}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Engine checks OK: ${checks} checks.\n`);
}
