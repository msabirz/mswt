---
description: Full Definition-of-Done check for the current branch (all standards + lint/typecheck/tests/build)
argument-hint: "[--fix]"
---
Run the full Definition of Done for this branch against **docs/standards.md** (every group) and the current step's exit criteria in **docs/roadmap.md**.

## Steps
1. Identify the step from the branch name (`git branch --show-current`) and read its deliverables and exit criteria in `docs/roadmap.md`.
2. GEN items: run whatever exists of `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build`, Lighthouse CI (`npx lhci autorun` if configured). Report each command and its exit status; paste the failing output. Scan the diff for secrets (`git diff main...HEAD` for keys, tokens, `.env` files).
3. Run the checks of `/a11y-audit`, `/seo-check`, `/jsonld-check`, `/pwa-check`, `/brand-check` (follow those command files in `.claude/commands/`) plus the Performance, Security and i18n groups of `docs/standards.md` (PERF-*, SEC-*, I18N-*): check by reading code and config, and run tests where they exist.
4. Check each roadmap exit criterion for this step as its own row (ID `EXIT-n`).
5. Confirm `docs/open-questions.md` is updated for anything new (GEN-04).

## Report format
One table per group (GEN, EXIT, A11Y, SEO, LD, PERF, SEC, I18N, BRAND, PWA) with columns ID / Status (PASS, FAIL, N/A, MANUAL) / Evidence. Finish with:
- **Verdict:** DONE only if there are zero FAIL rows and every MANUAL row is listed for the PR description; otherwise NOT DONE.
- FAIL items with the concrete fix, ordered by severity.

## Rules
- Never report DONE without having run the commands in step 2 that exist on this branch; if a command is missing for this step, say so.
- Judge only from evidence you gathered; unverified items are MANUAL or FAIL, never PASS.
- Don't fix anything unless `` contains `--fix`.
