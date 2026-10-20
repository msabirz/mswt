# Brand & design tokens

> **Status: PROVISIONAL.** No logo, font or colour assets were in `brand/` at Step 0, so every logo-derived value is **TBD** ([open-questions.md](open-questions.md) A1–A7). What *is* defined below doesn't depend on the logo: semantic status colours, a provisional neutral scale, Indic fallback fonts, type/spacing/motion scales and a11y sizes. When the assets arrive, a follow-up PR on this branch's successor fills the TBDs using the method in §2 and re-runs the contrast table.

Machine-readable source of truth: [`tokens/design-tokens.json`](../tokens/design-tokens.json) (W3C Design Tokens format, draft string syntax — `"#rrggbb"`, `"1rem"` — which Tokens Studio and Style Dictionary read today; we can move to the 2025.10 object syntax in Step 3 if the Tailwind build needs it). Components use **only** the `semantic.*` aliases, never core scales directly.

## 1. Logo analysis — TBD
To be written from `brand/logo/*.svg`:
- Colours used (exact hex from `fill`/`stroke`/`stop-color`), their share of the mark, gradients
- Geometry: rounded vs angular, stroke weight, symmetry, whether there's a separable icon/mark (needed for favicon and maskable icon)
- Wordmark style (serif / sans / script) → informs heading font pairing and Indic fallback style
- Imagery & shape language for the site (radius, card shapes, dividers, illustration style)

## 2. Colour

### Method (applies when the logo arrives)
1. Take hex codes from `brand/README.md`; else extract from the SVG; cluster near-duplicates; assign **primary / secondary / accent** by visual weight.
2. Build each 50–950 scale in **OKLCH**: fixed hue, lightness ramp 0.975 → 0.255, chroma eased toward both ends, clipped to sRGB gamut. The logo colour is pinned to the step whose lightness it naturally matches (recorded as e.g. "primary.600 = logo colour").
3. Re-tint the neutral scale slightly toward the primary hue.
4. Compute WCAG 2.x contrast for every pair in §2.4. If a logo colour fails as text, it is **accent-only** and `semantic.action.*` / link tokens point to a darker step of its scale.

### 2.1 Brand scales — TBD
`color.primary`, `color.secondary`, `color.accent` (50–950) — awaiting logo.

### 2.2 Provisional neutral + semantic scales
Neutral is an untinted cool grey (OKLCH hue 250, chroma 0.012) and will be re-tinted. Semantic hues: success 150, warning 70, error 27, info 245 — may shift slightly if a brand hue sits too close.

| Step | neutral | success | warning | error | info |
|---|---|---|---|---|---|
| 50 | `#f6f7f8` | `#effaf0` | `#fff5ea` | `#fff4f2` | `#f0f8ff` |
| 100 | `#ebedef` | `#dcf4e0` | `#ffe9d1` | `#ffe7e3` | `#deefff` |
| 200 | `#d8dbde` | `#bce8c4` | `#fad3a7` | `#fecdc7` | `#bde0fe` |
| 300 | `#bec3c8` | `#90d69e` | `#f1b66f` | `#fea99f` | `#8bcaff` |
| 400 | `#9ea4aa` | `#5dba75` | `#db9125` | `#ff6f64` | `#50aaf1` |
| 500 | `#82888f` | `#30a054` | `#ba7709` | `#ec3f3a` | `#198edb` |
| 600 | `#6b7177` | `#00873c` | `#9b6200` | `#ce1a1f` | `#0175ba` |
| 700 | `#575d63` | `#026f31` | `#805001` | `#af0011` | `#02619a` |
| 800 | `#44484d` | `#015725` | `#653e01` | `#8b000b` | `#014b79` |
| 900 | `#32363a` | `#01421a` | `#4c2e01` | `#6a0006` | `#01385c` |
| 950 | `#202326` | `#012c0f` | `#331d01` | `#480103` | `#01253f` |

### 2.3 Semantic aliases (what components use)
| Token | Value | Use |
|---|---|---|
| `semantic.bg.canvas` | white | Page background |
| `semantic.bg.subtle` | neutral.50 | Alternate sections |
| `semantic.bg.muted` | neutral.100 | Cards, table stripes |
| `semantic.bg.inverse` | neutral.900 | Footer (until a brand-dark exists) |
| `semantic.fg.default` | neutral.900 | Body text |
| `semantic.fg.strong` | neutral.950 | Headings |
| `semantic.fg.muted` | neutral.700 | Secondary text |
| `semantic.fg.hint` | neutral.600 | Placeholder/hint — lightest grey allowed for text on white |
| `semantic.fg.disabled` | neutral.400 | Disabled controls only |
| `semantic.fg.inverse` / `inverse-muted` | white / neutral.300 | Text on inverse bg |
| `semantic.border.decorative` | neutral.200 | Dividers (not input boundaries) |
| `semantic.border.input` | neutral.500 | Form control borders (≥ 3:1) |
| `semantic.status.{success,warning,error,info}.*` | bg 50 · fg 800 · fg-on-canvas 700 · icon 600 · solid-bg 700 · solid-fg white | Alerts, badges, field errors |
| `semantic.action.primary.*`, `semantic.link.*`, `semantic.focus.ring` | **TBD** | Need brand colours |

### 2.4 Contrast table (computed, WCAG 2.x relative luminance)
Pairs marked FAIL are **not allowed** for that use; they are listed so nobody reaches for them. "exempt" = decorative or disabled (no requirement), shown for information.

| Use | Foreground | Background | Ratio | Needs | Result |
|---|---|---|--:|--:|---|
| Body text | `neutral.900` #32363a | `white` #ffffff | 12.18:1 | 4.5:1 | PASS |
| Body text on subtle bg | `neutral.900` #32363a | `neutral.50` #f6f7f8 | 11.35:1 | 4.5:1 | PASS |
| Headings | `neutral.950` #202326 | `white` #ffffff | 15.79:1 | 4.5:1 | PASS |
| Muted text | `neutral.700` #575d63 | `white` #ffffff | 6.66:1 | 4.5:1 | PASS |
| Muted text on subtle bg | `neutral.700` #575d63 | `neutral.50` #f6f7f8 | 6.21:1 | 4.5:1 | PASS |
| Muted text on muted bg | `neutral.700` #575d63 | `neutral.100` #ebedef | 5.68:1 | 4.5:1 | PASS |
| Placeholder/hint (min) | `neutral.600` #6b7177 | `white` #ffffff | 4.94:1 | 4.5:1 | PASS |
| neutral.500 as text (reject?) | `neutral.500` #82888f | `white` #ffffff | 3.58:1 | 4.5:1 | FAIL |
| Disabled text (exempt, info) | `neutral.400` #9ea4aa | `white` #ffffff | 2.52:1 | — | exempt |
| Input border (UI) | `neutral.500` #82888f | `white` #ffffff | 3.58:1 | 3:1 | PASS |
| Decorative divider (exempt) | `neutral.200` #d8dbde | `white` #ffffff | 1.39:1 | — | exempt |
| neutral.300 as input border (reject?) | `neutral.300` #bec3c8 | `white` #ffffff | 1.78:1 | 3:1 | FAIL |
| Inverse text (footer) | `white` #ffffff | `neutral.900` #32363a | 12.18:1 | 4.5:1 | PASS |
| Inverse muted (footer) | `neutral.300` #bec3c8 | `neutral.900` #32363a | 6.86:1 | 4.5:1 | PASS |
| success alert text | `success.800` #015725 | `success.50` #effaf0 | 8.20:1 | 4.5:1 | PASS |
| success text on white | `success.700` #026f31 | `white` #ffffff | 6.32:1 | 4.5:1 | PASS |
| success icon/border on success.50 | `success.600` #00873c | `success.50` #effaf0 | 4.33:1 | 3:1 | PASS |
| white on success.700 (badge/button) | `white` #ffffff | `success.700` #026f31 | 6.32:1 | 4.5:1 | PASS |
| warning alert text | `warning.800` #653e01 | `warning.50` #fff5ea | 8.69:1 | 4.5:1 | PASS |
| warning text on white | `warning.700` #805001 | `white` #ffffff | 6.85:1 | 4.5:1 | PASS |
| warning icon/border on warning.50 | `warning.600` #9b6200 | `warning.50` #fff5ea | 4.71:1 | 3:1 | PASS |
| white on warning.700 (badge/button) | `white` #ffffff | `warning.700` #805001 | 6.85:1 | 4.5:1 | PASS |
| error alert text | `error.800` #8b000b | `error.50` #fff4f2 | 9.26:1 | 4.5:1 | PASS |
| error text on white | `error.700` #af0011 | `white` #ffffff | 7.42:1 | 4.5:1 | PASS |
| error icon/border on error.50 | `error.600` #ce1a1f | `error.50` #fff4f2 | 5.14:1 | 3:1 | PASS |
| white on error.700 (badge/button) | `white` #ffffff | `error.700` #af0011 | 7.42:1 | 4.5:1 | PASS |
| info alert text | `info.800` #014b79 | `info.50` #f0f8ff | 8.57:1 | 4.5:1 | PASS |
| info text on white | `info.700` #02619a | `white` #ffffff | 6.61:1 | 4.5:1 | PASS |
| info icon/border on info.50 | `info.600` #0175ba | `info.50` #f0f8ff | 4.60:1 | 3:1 | PASS |
| white on info.700 (badge/button) | `white` #ffffff | `info.700` #02619a | 6.61:1 | 4.5:1 | PASS |

**Results:** every approved pair passes. Two rejected uses: `neutral.500` as text (3.58:1 — use `neutral.600`+ for text) and `neutral.300` as an input border (1.78:1 — use `neutral.500`). Brand pairs (buttons, links, focus ring vs canvas, header/footer on brand colours) will be added with the brand scales.

### 2.5 Dark theme — recommendation: not in Phase 1
Donation, receipt and legal pages gain little from it and it roughly doubles visual QA and contrast verification. The two-layer token structure (core scales → `semantic.*`) means a dark set is a new alias mapping, not a component change — revisit in Phase 2 if analytics show demand.

## 3. Typography

| Token | Value | Status |
|---|---|---|
| `font.family.brand` | **TBD** (from `brand/fonts`) | Licence must permit web self-hosting (OFL, or a commercial web licence) — open-questions A4 |
| `font.family.devanagari` | Noto Sans Devanagari | Provisional, SIL OFL 1.1 (web OK). Hindi + Marathi |
| `font.family.gujarati` | Noto Sans Gujarati | Provisional, SIL OFL 1.1 |
| `font.family.system` | system-ui stack | Used until brand font is set |

- If the brand font is a serif or has a distinctive wordmark style, Indic fallbacks switch to a closer match (e.g. Noto Serif Devanagari/Gujarati, or Mukta / Hind Vadodara for a humanist sans). Decided in the follow-up once the font is known.
- Loading: `next/font/local` (brand) and `next/font/google` (Noto, self-hosted at build) with `display: "swap"`, subsets `latin` + `devanagari` / `gujarati` loaded only on their locales, `adjustFontFallback` to limit CLS.
- **Sizes** (rem, base 16px): xs .75 · sm .875 · base 1 · lg 1.125 · xl 1.25 · 2xl 1.5 · 3xl 1.875 · 4xl 2.25 · 5xl 3. Headings may use `clamp()` between adjacent steps; body never below `base`.
- **Line-height:** Latin tight 1.2 / snug 1.35 / body 1.5; **Indic** tight 1.4 / snug 1.55 / body 1.75 (room for matras and conjuncts). Applied by `:lang(hi)`, `:lang(mr)`, `:lang(gu)`.
- Weights 400/500/600/700, limited to the weights the brand font actually ships. No faux bold/italic; avoid letter-spacing on Indic scripts.

## 4. Spacing, sizes, shape, motion
- **Space:** 4px grid — `space.1` 0.25rem … `space.24` 6rem.
- **Targets:** `size.target-min` 24px (WCAG 2.5.8); `size.target-comfortable` 44px for primary buttons, nav and mobile controls.
- **Focus ring:** 3px width, 2px offset; colour TBD (brand), must reach 3:1 against both canvas and the component.
- **Breakpoints:** sm 40rem · md 48rem · lg 64rem · xl 80rem; container max 80rem.
- **Radius & shadow: TBD** — derived from the logo (rounded mark → generous radius; angular → small radius). Not invented here.
- **Motion:** fast 120ms · base 200ms · slow 320ms; easing standard `cubic-bezier(0.2,0,0,1)`. Everything non-essential off under `prefers-reduced-motion: reduce`; no autoplay carousels.

## 5. Logo usage — TBD rules, fixed placements
Rules to be set from the logo: clear space (multiple of a logo element's height), minimum size (px on screen, mm in print), approved variants (full colour, mono, reversed), don'ts (stretch, recolour, effects, busy backgrounds).

Required placements and the variant each needs:
| Placement | Variant / spec | Have it? |
|---|---|---|
| Header | Horizontal full colour SVG, `aria-label`/alt "MS Welfare Trust — home" | TBD |
| Footer | Reversed or full colour depending on footer bg | TBD |
| Favicon set | Icon/mark only: `favicon.ico` (32), `icon.svg`, `apple-touch-icon` 180 | TBD — needs separable mark |
| PWA | 192, 512 (`any`), 512 maskable (mark inside 80% safe zone on brand bg) | TBD |
| Open Graph template | 1200×630, logo + page title (Indic-capable font) | TBD |
| 80G receipt PDF header | Vector logo + legal name, works in greyscale print | TBD |
| Email header | PNG @2x, ≤ 600px wide, alt text, works on light/dark clients | TBD |
| JSON-LD `logo` | Square-ish PNG ≥ 112×112 (use 512×512) at a stable crawlable URL, e.g. `https://mswelfaretrust.org/brand/logo-512.png` | TBD |
