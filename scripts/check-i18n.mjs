#!/usr/bin/env node
/**
 * Fails when a screen asks for a translation key that no locale has, or when
 * the three locales have drifted apart.
 *
 * This is a check over the repo's files, not a browser test, which is why it
 * lives here rather than in a .spec. It exists because a whole block was once
 * deleted from the locale files while a page still asked for it, and the app
 * happily rendered "public.request.demo_title" to the user.
 *
 * Keys assembled at runtime ("bookings.status_" + status) cannot be checked
 * statically and are out of scope.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src/app");
const I18N = join(ROOT, "src/assets/i18n");
const LOCALES = ["fr", "en", "ar"];

const PATTERNS = [
  /["']([a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+)["']\s*\|\s*translate/g,
  /\.instant\(\s*["']([a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+)["']/g,
  /(?:labelKey|descKey|titleKey|countKey|subtitleKey)\s*:\s*["']([a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+)["']/g,
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(ts|html)$/.test(entry) && !entry.includes(".spec.")) yield full;
  }
}

function resolve(dictionary, key) {
  let node = dictionary;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null || !(part in node)) return null;
    node = node[part];
  }
  return typeof node === "string" ? node : null;
}

function flatten(node, prefix = "") {
  if (typeof node !== "object" || node === null) return [];
  return Object.entries(node).flatMap(([k, v]) =>
    typeof v === "string" ? [`${prefix}${k}`] : flatten(v, `${prefix}${k}.`)
  );
}

const dictionaries = Object.fromEntries(
  LOCALES.map((loc) => [loc, JSON.parse(readFileSync(join(I18N, `${loc}.json`), "utf8"))])
);

const problems = [];

// 1. every key a screen names
const seen = new Map();
for (const file of walk(SRC)) {
  const text = readFileSync(file, "utf8");
  for (const pattern of PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (!seen.has(match[1])) seen.set(match[1], relative(ROOT, file));
    }
  }
}
for (const [key, where] of seen) {
  const absent = LOCALES.filter((loc) => resolve(dictionaries[loc], key) === null);
  if (absent.length > 0) problems.push(`missing in ${absent.join(", ")}: ${key}  (${where})`);
}

// 2. the three locales carry the same keys
const [reference, ...others] = LOCALES;
const referenceKeys = new Set(flatten(dictionaries[reference]));
for (const loc of others) {
  const keys = new Set(flatten(dictionaries[loc]));
  for (const key of referenceKeys) if (!keys.has(key)) problems.push(`${loc}.json is missing ${key}`);
  for (const key of keys) if (!referenceKeys.has(key)) problems.push(`${loc}.json has an extra ${key}`);
}

if (problems.length > 0) {
  console.error(`i18n: ${problems.length} problem(s)\n`);
  for (const problem of problems) console.error("  " + problem);
  process.exit(1);
}

console.log(`i18n: ${seen.size} keys referenced, all present in ${LOCALES.join(", ")}`);
