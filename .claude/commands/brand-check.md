---
description: Check that the current branch uses only brand tokens and approved colour pairs from docs/brand.md
argument-hint: "[path] [--fix]"
---
Check brand compliance against **docs/standards.md → "Brand"** (IDs `BRAND-01` … `BRAND-06`) and **docs/brand.md** + **tokens/design-tokens.json**.

## Steps
1. Read `docs/brand.md` (palette, contrast table, typography, logo rules) and `tokens/design-tokens.json`. Validate the token file: `python3 -m json.tool tokens/design-tokens.json` and confirm every `{alias}` reference resolves.
2. BRAND-01 — literals: in `src/` (excluding generated theme files) search for
   - colours: `#[0-9a-fA-F]{3,8}\b`, `rgb(a)?(`, `hsl(a)?(`, `oklch(`, Tailwind arbitrary colours `(bg|text|border|ring|fill|stroke)-\[`
   - fonts: `font-family`, `fontFamily` outside the font setup module
   - radius/shadow literals: `rounded-\[`, `shadow-\[`, `border-radius:`, `box-shadow:`
   - default Tailwind palette classes not mapped to tokens (e.g. `text-gray-`, `bg-blue-`)
3. BRAND-02 — every text/background class pair in changed files appears as PASS in the contrast table.
4. BRAND-03/04 — logo: header and footer use the logo component with an accessible name; favicon, PWA icons, OG template, receipt and email headers reference files derived from `brand/logo/`; clear space and minimum size respected (check rendered sizes in code).
5. BRAND-05 — `next/font` config uses the brand font for Latin and the approved Indic fallbacks with token line-heights.
6. BRAND-06 — Tailwind theme / CSS variables are generated from the token file (script exists, output up to date: regenerate and `git diff --exit-code`).

## Report format
Output a Markdown table with one row per ID in scope:

| ID | Status | Evidence |
|---|---|---|
| XX-01 | PASS / FAIL / N/A / MANUAL | file:line, command output, or what a human must check |

Then: a one-line verdict (`PASS` only if there is no FAIL), a list of FAIL items with the concrete fix, and MANUAL items to record in the PR description.

## Rules
- Judge only from evidence you actually gathered (files read, commands run). If you could not check an item, mark it MANUAL or FAIL — never PASS by assumption.
- N/A only when the branch has nothing the item applies to yet (e.g. no pages before Step 6); say why.
- Do not fix anything unless the user passed `--fix` in the arguments: this command reports.
- Arguments (optional): `$ARGUMENTS` — a route, locale, file path or `--fix` to narrow or extend the run.
