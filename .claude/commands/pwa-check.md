---
description: Check PWA manifest, icons and service-worker caching rules against docs/standards.md
argument-hint: "[--fix]"
---
Check the PWA against **docs/standards.md → "PWA"** (IDs `PWA-01` … `PWA-07`).

## Steps
1. Read the PWA section of `docs/standards.md`.
2. Manifest (`app/manifest.ts` or built `manifest.webmanifest`): every required field and exact values (`start_url "/en"`, `scope "/"`, `display "standalone"`), `theme_color`/`background_color` equal to token values in `tokens/design-tokens.json`, icons 192/512 any + maskable, screenshots narrow + wide; icon files exist with correct pixel sizes (`sips -g pixelWidth -g pixelHeight` or `file`).
3. Apple meta: apple-touch-icon 180, `apple-mobile-web-app-title`, status-bar style, `theme-color`.
4. Service worker (Serwist config): precache static assets; SWR for public pages; offline fallback route exists per locale; **NetworkOnly / excluded** for `/*/donate*`, `/api/**`, `/admin/**`, receipt URLs, Cashfree origins (PWA-05 — any gap is FAIL). Check skipWaiting/clientsClaim behaviour (PWA-06).
5. If the app runs: build + start, fetch the manifest and `/sw.js`; if Playwright exists run the PWA e2e (offline fallback, donate not cached).
6. PWA-07 is MANUAL: Chrome DevTools → Application → Manifest/installability, iOS add to home screen.

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
