// Writes the Claude Code and Codex plugin manifests from package.json.
// `tsx scripts/sync-skill-manifests.ts` writes; `--check` fails if any file is stale.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
  name: string;
  version: string;
  license: string;
  author: string;
  homepage: string;
  repository: { url: string };
};
// npm person string "Name (url)" -> { name, url }
const authorMatch = /^(.+?)\s*\((\S+)\)$/.exec(pkg.author);
if (!authorMatch) throw new Error(`package.json author must be "Name (url)": ${pkg.author}`);
const author = { name: authorMatch[1], url: authorMatch[2] };
const repository = pkg.repository.url.replace(/^git\+/, "").replace(/\.git$/, "");
const homepage = pkg.homepage;
const description = "Chinese writing linter skill: lint a draft, fix only the flagged spans, re-check.";

const files: Record<string, unknown> = {
  ".claude-plugin/plugin.json": {
    name: pkg.name,
    version: pkg.version,
    description,
    author,
    license: pkg.license,
    repository,
    homepage,
  },
  ".claude-plugin/marketplace.json": {
    name: pkg.name,
    owner: { name: author.name },
    description,
    plugins: [{ name: pkg.name, source: "./", description }],
  },
  ".codex-plugin/plugin.json": {
    name: pkg.name,
    version: pkg.version,
    description,
    skills: "./skills/",
    author,
    license: pkg.license,
    repository,
    homepage,
  },
  ".agents/plugins/marketplace.json": {
    name: pkg.name,
    interface: { displayName: "editpen" },
    plugins: [
      {
        name: pkg.name,
        source: { source: "local", path: "./" },
        // No auth needed; values per developers.openai.com/plugins/build/plugins.
        policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
        category: "Writing",
      },
    ],
  },
};

const check = process.argv.includes("--check");
let stale = false;
for (const [path, value] of Object.entries(files)) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  if (check) {
    let current = "";
    try {
      current = readFileSync(path, "utf8");
    } catch {
      // missing counts as stale
    }
    if (current !== text) {
      console.error(`stale: ${path}`);
      stale = true;
    }
  } else {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  }
}
if (stale) {
  console.error("run: npx tsx scripts/sync-skill-manifests.ts");
  process.exitCode = 1;
}
