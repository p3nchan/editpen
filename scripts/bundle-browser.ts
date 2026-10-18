// Build step: bundle `editpen/browser` for the browser and fail if any Node
// builtin or Node-only dependency is reachable from it.
// Writes dist/editpen-browser.min.js and prints its minified+gzipped size.

import { builtinModules } from "node:module";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { build, type Plugin } from "esbuild";

const root = fileURLToPath(new URL("..", import.meta.url));
const builtins = new Set(builtinModules.flatMap((name) => [name, `node:${name}`]));
const nodeOnlyPackages = ["ajv", "gray-matter", "yaml", "chalk", "commander"];

const forbidNode: Plugin = {
  name: "forbid-node",
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /.*/ }, (args) => {
      const bare = args.path.split("/")[0] ?? "";
      if (args.path.startsWith("node:") || builtins.has(args.path) || builtins.has(bare)) {
        return { errors: [{ text: `Node builtin "${args.path}" imported by ${args.importer}` }] };
      }
      if (nodeOnlyPackages.includes(bare)) {
        return { errors: [{ text: `Node-only package "${args.path}" imported by ${args.importer}` }] };
      }
      return undefined;
    });
  },
};

const result = await build({
  absWorkingDir: root,
  entryPoints: ["src/browser/index.ts"],
  outfile: "dist/editpen-browser.min.js",
  bundle: true,
  minify: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  metafile: true,
  logLevel: "warning",
  plugins: [forbidNode],
});

const inputs = Object.keys(result.metafile.inputs);
const leaked = inputs.filter((input) => input.includes("node_modules"));
if (leaked.length > 0) {
  throw new Error(`Browser bundle pulls in dependencies: ${leaked.join(", ")}`);
}
const output = Object.values(result.metafile.outputs)[0];
const bytes = await readFile(new URL("../dist/editpen-browser.min.js", import.meta.url));
process.stdout.write(
  `Browser bundle OK: ${inputs.length} inputs, 0 Node imports, ${output?.bytes ?? bytes.length} B minified, ${gzipSync(bytes).length} B gzipped\n`,
);
