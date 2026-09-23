#!/usr/bin/env node
// Every class a template uses must have a rule behind it somewhere.
//
// Written to make dropping Bootstrap something other than a leap. The
// framework's stylesheet was providing a bounded set of utilities and five
// small components; replacing them by hand is easy, and noticing the one that
// was missed is not — a class with no rule is invisible until someone opens
// the screen.
//
// Mirrors scripts/check-i18n.mjs: reads what the templates ask for, reads
// what the stylesheets define, and fails on the difference.
//
// It checks that a selector EXISTS, not that it is correct. A wrong colour
// still needs eyes.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const SRC = new URL("../src", import.meta.url).pathname;

/** Classes that are never written as a literal selector and are fine. */
const IGNORED = [
  // Bootstrap Icons ship their own stylesheet: `bi` plus `bi-<name>`.
  /^bi(-|$)/,
  // Angular / router adds these at runtime.
  /^ng-/,
  /^(active|is-active|disabled|show|collapsed|selected)$/,
  // Written by an interpolation, e.g. class="tone-{{ kind }}".
  /[{}]/,
  // What an interpolation leaves behind once removed: `toast-item--`. The
  // stem is real; the full class name is only known at runtime.
  /-$/,
  /^$/,
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

const files = walk(SRC);

// ---- what the templates ask for -------------------------------------------
const used = new Map(); // class -> first file that used it

for (const file of files) {
  if (extname(file) !== ".html" && extname(file) !== ".ts") continue;
  // Specs are not shipped markup; a class in a test fixture proves nothing.
  if (file.endsWith(".spec.ts")) continue;

  const source = readFileSync(file, "utf8");
  const patterns = [
    /class="([^"]*)"/g,
    /\[class\]="'([^']*)'"/g,
    /\[ngClass\]="'([^']*)'"/g,
    // `[class.foo]="expr"` — the class is in the binding's name.
    /\[class\.([\w-]+)\]/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      // `class="toast-item toast-item--{{ kind }}"` — drop the interpolation
      // before splitting, or its innards arrive as class names of their own.
      const attribute = match[1].replace(/\{\{[\s\S]*?\}\}/g, " ");

      for (const name of attribute.split(/\s+/)) {
        if (IGNORED.some((re) => re.test(name))) continue;
        if (!used.has(name)) used.set(name, file.replace(SRC, "src"));
      }
    }
  }
}

// ---- what the stylesheets define ------------------------------------------
const defined = new Set();
// SCSS nesting suffixes: `&--warn`, `&-body`. Recorded on their own because
// resolving them properly would mean parsing the nesting tree; instead a
// used class is accepted when it splits into a defined prefix and one of
// these. A class with neither is still a real miss, which is the point.
const suffixes = new Set();

for (const file of files) {
  const ext = extname(file);
  if (![".scss", ".css", ".ts"].includes(ext)) continue;

  let source = readFileSync(file, "utf8");

  // A component can carry its styles inline in the decorator, so those count
  // as definitions too — but only the style block, never the template.
  if (ext === ".ts") {
    const blocks = [...source.matchAll(/styles:\s*\[([\s\S]*?)\]\s*[,}]/g)].map((m) => m[1]);
    if (blocks.length === 0) continue;
    source = blocks.join("\n");
  }

  for (const match of source.matchAll(/\.([a-zA-Z][\w-]*)/g)) defined.add(match[1]);

  // Interpolated selectors from a loop: `.col-#{$i}`, `.d-#{$bp}-#{$name}`.
  for (const match of source.matchAll(/\.([a-zA-Z][\w-]*)-#\{/g)) defined.add(`${match[1]}-*`);

  for (const match of source.matchAll(/&(-{1,2}[\w-]+)/g)) suffixes.add(match[1]);
}

const prefixes = [...defined].filter((name) => name.endsWith("-*")).map((name) => name.slice(0, -1));

function isDefined(name) {
  if (defined.has(name)) return true;
  // A behaviour hook earns its place by being read in code, not by having a
  // rule. The guard above makes sure it is still in the markup.
  if (hooks.has(name)) return true;
  if (prefixes.some((prefix) => name.startsWith(prefix))) return true;

  return [...suffixes].some(
    (suffix) => name.endsWith(suffix) && defined.has(name.slice(0, -suffix.length))
  );
}

// ---- a class TypeScript reaches for must still be in the markup -------------
// `closest(".app-navbar-menu")` is how the navbar tells a click inside the
// menu from one outside it. That class carries no styling, so removing it as
// an unstyled leftover looked safe — and every click then counted as outside,
// closing a dropdown in the same tick it opened.
//
// A class can earn its place by being a behaviour hook rather than a style.
// This checks the other direction from everything below: not "does the rule
// exist" but "does the element the code looks for still exist".
const hooks = new Map();

for (const file of files) {
  if (extname(file) !== ".ts" || file.endsWith(".spec.ts")) continue;

  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/(?:closest|querySelector(?:All)?)\(\s*["'`]\.([\w-]+)/g)) {
    if (!hooks.has(match[1])) hooks.set(match[1], file.replace(SRC, "src"));
  }
}

// `used` holds the classes taken out of class attributes, so a mention in a
// comment does not count — searching the raw text let the comment explaining
// this very hook satisfy its own check.
const orphanedHooks = [...hooks.entries()].filter(([name]) => !used.has(name));

if (orphanedHooks.length > 0) {
  console.error(`css: ${orphanedHooks.length} class(es) the code looks for are in no template:\n`);
  for (const [name, file] of orphanedHooks.sort()) console.error(`  .${name}  — read by ${file}`);
  console.error("\nA behaviour hook needs the element to carry it, rule or no rule.");
  process.exit(1);
}

// ---- nothing may still address a framework that is gone ---------------------
// Buttons were styled entirely through `--bs-btn-*`: Bootstrap's variables,
// read by Bootstrap's own rules. Removing Bootstrap left every one of those
// declarations valid CSS addressed to nobody, and the app shipped buttons with
// no background or padding. The class check could not see it — the selector
// was there, its declarations simply had no reader.
const bootstrapVars = [];

for (const file of files) {
  if (![".scss", ".css"].includes(extname(file))) continue;

  // Comments explain why these are gone, so they must not count as uses.
  const source = readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|\s)\/\/[^\n]*/g, " ");

  for (const match of source.matchAll(/--bs-[\w-]+/g)) {
    bootstrapVars.push(`${match[0]}  — ${file.replace(SRC, "src")}`);
  }
}

if (bootstrapVars.length > 0) {
  console.error(`css: ${bootstrapVars.length} Bootstrap variable(s) remain, and nothing reads them:\n`);
  for (const line of [...new Set(bootstrapVars)].sort()) console.error(`  ${line}`);
  console.error("\nDeclare the real property instead.");
  process.exit(1);
}

// ---- the difference --------------------------------------------------------
const missing = [...used.entries()].filter(([name]) => !isDefined(name));

if (missing.length > 0) {
  console.error(`css: ${missing.length} class(es) used in a template with no rule behind them:\n`);
  for (const [name, file] of missing.sort()) console.error(`  .${name}  — ${file}`);
  console.error("\nAdd a rule, or remove the class.");
  process.exit(1);
}

console.log(`css: ${used.size} classes referenced, all defined`);
