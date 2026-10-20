---
description: Check the current branch against the SEO items in docs/standards.md
argument-hint: "[route|locale] [--fix]"
---
Check this branch against **docs/standards.md → "SEO"** (IDs `SEO-01` … `SEO-16`) and the sitemap in **docs/spec.md §1**.

## Steps
1. Read the SEO section of `docs/standards.md` and `docs/spec.md` §1.
2. For each public route in the spec: confirm a `generateMetadata` exists, titles/descriptions come from translations or CMS (unique per page and locale), canonical is absolute and self-referencing, `alternates.languages` covers en/hi/mr/gu + x-default.
3. Inspect `app/sitemap.ts` and `app/robots.ts`; confirm admin/api are disallowed and noindex (also check middleware/headers for `X-Robots-Tag`).
4. If the app runs: build and start it, then fetch `/` (expect 308 → /en), `/sitemap.xml`, `/robots.txt`, and the HTML of each route × locale; verify `<title>`, `<meta name=description>`, `<link rel=canonical>`, `<link rel=alternate hreflang>` reciprocity, OG/Twitter tags, a visible `<h1>`, content present in server HTML (no JS), and `alt` on images.
5. Check internal links for descriptive text and 404s (crawl from `/en`).

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
