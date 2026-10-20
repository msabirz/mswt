---
description: Check JSON-LD structured data on the current branch against docs/standards.md
argument-hint: "[route] [--fix]"
---
Check structured data against **docs/standards.md → "JSON-LD"** (IDs `LD-01` … `LD-14`).

## Steps
1. Read the JSON-LD section of `docs/standards.md` and `organization_settings` in `docs/spec.md` §2.
2. Static: all JSON-LD is emitted through the typed `<JsonLd>` component; grep for raw `application/ld+json` elsewhere (FAIL). Grep for hard-coded Trust values (legal name, PAN, phone, address) in builders — they must come from settings (LD-04). Grep for `SearchAction` and `FAQPage` (LD-12, must be absent).
3. If the app runs: fetch each page type × locale, extract every `<script type="application/ld+json">`, parse it, and verify: NGO `@id` is the same everywhere and referenced from each page; required properties per type (LD-03, LD-05 … LD-11); dates carry `+05:30`; logo URL returns 200 and is ≥112×112; values match visible content (LD-14).
4. LD-13 is MANUAL: list the URLs to paste into https://search.google.com/test/rich-results and https://validator.schema.org.

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
