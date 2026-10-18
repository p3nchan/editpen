import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Ajv, type AnySchema, type ErrorObject } from "ajv";
import matter from "gray-matter";
import { parse } from "yaml";
import { regexSafetyErrors } from "./regex-safety.js";
import type { EngineRule, Profile, Rule } from "./types.js";

export type * from "./types.js";

function formatErrors(errors: ErrorObject[] | null | undefined): string {
  if (errors === null || errors === undefined || errors.length === 0) {
    return "unknown validation error";
  }
  return errors
    .map((error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`)
    .join("; ");
}

async function readJsonSchema(filePath: string): Promise<AnySchema> {
  const source = await readFile(filePath, "utf8");
  return JSON.parse(source) as AnySchema;
}

export async function loadProfile(dir: string, profile: string): Promise<Profile> {
  return loadProfileWithAncestors(dir, profile, new Set());
}

async function loadProfileWithAncestors(
  dir: string,
  profile: string,
  ancestors: ReadonlySet<string>,
): Promise<Profile> {
  if (ancestors.has(profile)) {
    throw new Error(`Profile inheritance cycle: ${[...ancestors, profile].join(" -> ")}`);
  }
  const profilePath = path.join(dir, "profiles", `${profile}.yaml`);
  const schemaPath = path.join(dir, "schema", "profile.schema.json");
  const [source, schema] = await Promise.all([
    readFile(profilePath, "utf8"),
    readJsonSchema(schemaPath),
  ]);
  const value: unknown = parse(source);
  const validate = new Ajv({ allErrors: true, strict: false }).compile<Profile>(schema);
  if (!validate(value)) {
    throw new Error(`Invalid profile ${profilePath}: ${formatErrors(validate.errors)}`);
  }
  const selectedProfile = value as Profile;
  if (selectedProfile.extends === undefined) {
    return selectedProfile;
  }
  const parent = await loadProfileWithAncestors(
    dir,
    selectedProfile.extends,
    new Set([...ancestors, profile]),
  );
  const scopes = [...new Set([...parent.include.scope, ...selectedProfile.include.scope])];
  const lexicons = [...new Set([...(parent.lexicons ?? []), ...(selectedProfile.lexicons ?? [])])];
  return {
    ...selectedProfile,
    include: { scope: scopes },
    ...(lexicons.length > 0 ? { lexicons } : {}),
  };
}

export async function loadRules(
  dir: string,
  profile: string | Profile = "zh-tw",
): Promise<Rule[]> {
  const schema = await readJsonSchema(path.join(dir, "schema", "rule.schema.json"));
  const validate = new Ajv({ allErrors: true, strict: false }).compile<Omit<Rule, "body" | "sourcePath">>(schema);
  const selectedProfile = typeof profile === "string" ? await loadProfile(dir, profile) : profile;
  const entries = await readdir(dir, { withFileTypes: true });
  const rules: Rule[] = [];
  const unsafe: string[] = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isDirectory() || !/^[A-Z][0-9]{2}[a-z]-/.test(entry.name)) {
      continue;
    }
    const sourcePath = path.join(dir, entry.name, "rule.md");
    const source = await readFile(sourcePath, "utf8");
    const parsed = matter(source);
    const frontmatter: unknown = parsed.data;
    if (!validate(frontmatter)) {
      throw new Error(`Invalid rule ${sourcePath}: ${formatErrors(validate.errors)}`);
    }
    const validFrontmatter = frontmatter as Omit<Rule, "body" | "sourcePath">;
    unsafe.push(...regexSafetyErrors(validFrontmatter));
    if (!selectedProfile.include.scope.includes(validFrontmatter.scope)) {
      continue;
    }
    rules.push({ ...validFrontmatter, body: parsed.content.trim(), sourcePath });
  }
  if (unsafe.length > 0) {
    throw new Error(`Unsafe regex in ${dir} (every rule is checked, whatever the profile):\n${unsafe.map((error) => `- ${error}`).join("\n")}`);
  }

  return rules;
}

interface LexiconDocument {
  id: string;
  terms: string[];
}

function isLexiconDocument(value: unknown): value is LexiconDocument {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as { id?: unknown; terms?: unknown };
  return (
    typeof candidate.id === "string" &&
    Array.isArray(candidate.terms) &&
    candidate.terms.every((term) => typeof term === "string")
  );
}

export async function loadLexicons(
  rulesDir: string,
  rules: readonly EngineRule[],
  profile: Profile,
): Promise<ReadonlyMap<string, readonly string[]>> {
  const names = new Set(
    [
      ...(profile.lexicons ?? []),
      ...rules.flatMap((rule) =>
        (rule.detector.patterns ?? []).flatMap((pattern) =>
          pattern.lexicon === undefined ? [] : [pattern.lexicon],
        ),
      ),
    ],
  );
  const lexicons = new Map<string, readonly string[]>();
  for (const name of names) {
    let source: string;
    try {
      source = await readFile(path.join(rulesDir, "lexicons", `${name}.yaml`), "utf8");
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        process.emitWarning(`Lexicon not found: ${name}`);
        continue;
      }
      throw error;
    }
    const document: unknown = parse(source);
    if (!isLexiconDocument(document) || document.id !== name) {
      throw new Error(`Invalid lexicon: ${name}`);
    }
    lexicons.set(name, document.terms);
  }
  return lexicons;
}
