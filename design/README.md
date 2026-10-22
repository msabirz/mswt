# Design mockups (Step 1)

> Since Step 3 these mockups are **reference only**. The real components live in `src/components/ui` (all states on `/en/styleguide`), and the Tailwind theme is generated into `src/styles/theme.css` from the same tokens.

These static HTML pages are the design sign-off for Phase 1. They are built **only** from the brand tokens. Step 3 (design system) and Step 6 (public pages) lift their structure and classes.

## Layout
| Path | What |
|---|---|
| `tokens.css` | **Generated** from `tokens/design-tokens.json` by `scripts/tokens-to-css.mjs`. Variable names follow Tailwind v4 theme namespaces (`--color-*`, `--font-*`, `--text-*`, `--leading-*`, `--radius-*`, `--shadow-*`, `--spacing-*`, `--breakpoint-*`, `--ease-*`), so Step 3 can move them into `@theme` unchanged |
| `base.css` | Element defaults and component classes. It uses only `var(--…)` values from tokens.css |
| `src/*.mjs` | Page templates and sample strings (`i18n.mjs` and `donate-i18n.mjs` hold the en/hi/mr/gu text) |
| `mockups/` | **Generated** output: 22 pages plus copies of the CSS and logos in `mockups/assets/` |

## Commands
```bash
node scripts/tokens-to-css.mjs          # after editing tokens/design-tokens.json
node scripts/tokens-to-css.mjs --check  # CI-style check that tokens.css is up to date
node scripts/build-mockups.mjs          # rebuild design/mockups/
python3 -m http.server 4173 --directory design/mockups   # then open http://127.0.0.1:4173
```
No npm packages are needed. Fonts load from Google Fonts **for the mockups only**; production self-hosts them through `next/font`.

## Rules
- Never hand-edit `tokens.css` or `mockups/`. Change the tokens or the templates, then rebuild.
- No literal colours, fonts, radii or shadows in `base.css` or the templates.
- Content is sample only. Highlighted `[…]` items are Trust details we still need ([open-questions](../docs/open-questions.md)). Hindi, Marathi and Gujarati text is a sample translation that needs human review.

## Checks run on this step
- **axe-core 4.10** (WCAG 2.0/2.1/2.2 A and AA plus best practices) on all 22 pages at 360px and 1440px: 0 violations.
- **No horizontal scrolling** at 360px or 1440px on any page.
- **Brand lint:** no colour, font, radius or shadow literals outside `tokens.css`.
- **Visual review** of the Devanagari and Gujarati pages: no missing glyphs (tofu) and no clipped matras.

## Figma (optional)
To get editable Figma frames, open any page and import it with the **html.to.design** Figma plugin. Tokens can be imported into Figma variables from `tokens/design-tokens.json` with Tokens Studio. The tokens and the code remain the source of truth.
