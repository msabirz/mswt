#!/usr/bin/env node
// Fails if code in src/ bypasses the design tokens (docs/standards.md BRAND-01).
// Allowed: token utilities (bg-primary-700, text-fg-default…), var(--…) references, and the
// generated src/styles/theme.css. Usage: node scripts/brand-lint.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const SKIP = new Set(["src/styles/theme.css", "src/styles/fonts.css"]);
const FONT_FILE = "src/lib/fonts.ts";

const RULES = [
  {
    name: "colour literal (hex)",
    re: /#[0-9a-fA-F]{3,8}\b(?![\w-])/g,
    exts: [".css", ".ts", ".tsx"],
    ignoreIn: /href=|#sg-|#main|fieldId|`#\$\{/,
  },
  {
    name: "colour function",
    re: /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\(/g,
    exts: [".css", ".ts", ".tsx"],
  },
  {
    name: "arbitrary colour/radius/shadow/font class",
    re: /\b(?:bg|text|border|ring|fill|stroke|outline|decoration|from|to|via|shadow|rounded|font)-\[(?!length:)/g,
    exts: [".ts", ".tsx"],
  },
  {
    name: "default Tailwind palette class",
    re: /\b(?:bg|text|border|ring)-(?:gray|slate|zinc|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black)(?:-\d{2,3})?\b/g,
    exts: [".ts", ".tsx"],
  },
  {
    name: "inline colour/font style",
    re: /style=\{\{[^}]*\b(?:color|backgroundColor|borderColor|fontFamily)\s*:\s*["'`](?!var\()/g,
    exts: [".tsx"],
  },
  { name: "font-family literal", re: /font-family:\s*(?!var\()[^;]*["']/g, exts: [".css"] },
];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const problems = [];
for (const file of walk(join(root, "src"))) {
  const rel = relative(root, file);
  if (SKIP.has(rel) || rel === FONT_FILE) continue;
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (/brand-lint-ignore/.test(line)) return;
    for (const rule of RULES) {
      if (!rule.exts.some((e) => rel.endsWith(e))) continue;
      if (rule.ignoreIn && rule.ignoreIn.test(line)) continue;
      for (const m of line.matchAll(rule.re)) problems.push(`${rel}:${i + 1}  ${rule.name}: ${m[0]}`);
    }
  });
}

if (problems.length) {
  console.error(
    `Brand lint failed — use token classes from src/styles/theme.css instead:\n${problems.join("\n")}`,
  );
  process.exit(1);
}
console.log("Brand lint: no colour, font, radius or shadow literals in src/");
