---
description: Audit the current branch against the A11y (WCAG 2.2 AA) items in docs/standards.md
argument-hint: "[route|path] [--fix]"
---
Audit this branch for accessibility against **docs/standards.md → "A11y — WCAG 2.2 AA"** (IDs `A11Y-01` … `A11Y-21`) and the contrast table in **docs/brand.md**.

## Steps
1. Read `docs/standards.md` (A11y section) and the contrast table in `docs/brand.md`.
2. `git diff --name-only main...HEAD` to find what changed; audit changed routes/components first, then the rest.
3. Static checks: landmarks, single `<h1>`, heading order, skip link, `<html lang>` per locale, labels and `aria-describedby` error wiring, `alt` attributes, focus styles (`focus-visible` classes present, not removed), target sizes from token classes, `prefers-reduced-motion` handling, `aria-live` for status messages, admin login paste allowed.
4. If the app exists (Step 2+): run `npm run test:e2e -- --grep a11y` (Playwright + axe) and report serious/critical violations per route × locale. If a dev server is needed, start it and stop it afterwards.
5. Colour pairs: for every text/background or UI/background class pair found in changed files, confirm it is a PASS row in the brand contrast table (A11Y-08, A11Y-09).

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
