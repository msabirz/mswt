# MS Welfare Trust — website + admin

Donation website and admin panel for **Munira Shoaib Welfare Trust** ("MS Welfare Trust", MSWT), an Indian charitable trust registered under **12A and 80G**. The Trust has **no FCRA registration**: foreign contributions must be blocked (Indian donors, Indian payment instruments only). Domain: `mswelfaretrust.org`. Owner/developer: Mohammed Sabir.

## Stack (fixed — ask before changing)
- Next.js App Router + TypeScript `strict`, Tailwind CSS (theme generated from `tokens/design-tokens.json`)
- Neon Postgres + Drizzle ORM — hand-reviewed SQL migration files in `drizzle/`, never interactive `drizzle-kit push`/prompts
- next-intl: `en`, `hi`, `mr`, `gu`; every public URL locale-prefixed; `/` → `/en`; x-default = `/en`
- Auth.js (credentials) + TOTP 2FA for every admin; roles Super Admin / Accountant / Content Editor
- Payments: Cashfree behind `PaymentProvider` adapter. **The verified webhook is the source of truth, never the redirect**
- Email: inbound Cloudflare Email Routing; outbound behind `EmailProvider` adapter (Resend / MSG91 / Brevo)
- Cloudflare R2 (images, receipt PDFs), Cloudflare Turnstile, Vercel hosting, Serwist PWA
- Vitest, Playwright + @axe-core/playwright, Lighthouse CI

## Folder conventions (from Step 2)
```
src/app/[locale]/…        public pages (server components by default; static via generateStaticParams)
src/i18n/                 next-intl routing, request config; src/proxy.ts is the locale proxy (Next 16)
src/app/admin/…           admin UI (English only, noindex, not locale-prefixed)
src/app/api/…             route handlers (webhooks, cron, forms) — noindex
src/components/ui/        design-system primitives (tokens only); see /en/styleguide (not in production)
src/components/layout/    SiteHeader, SiteFooter, AdminShell
src/config/nav.ts         every page + `ready` flag (only ready pages are linked)
src/styles/               theme.css (GENERATED from tokens), fonts.css (self-hosted Poppins), base.css
src/lib/fonts.ts          font registry, admin font options, per-locale preloads
public/fonts/poppins/     self-hosted Poppins (OFL) — fixed URLs for preloading
src/components/…          feature components
src/lib/payments/         PaymentProvider interface + cashfree adapter
src/lib/email/            EmailProvider interface + adapters + templates
src/lib/db/               Drizzle schema + queries
src/lib/seo/              buildMetadata, site/host helpers, OG renderer, IndexNow, JSON-LD builders (jsonld.ts)
src/components/seo/       <JsonLd> — the page's single structured-data block
data/organization.json    public Trust facts → `npm run org:sync` (until the Step 8 admin)
data/content/content.json real content (legal drafts, causes…) → `npm run content:sync`; `reviewed: true` goes live
data/sample/content.json  sample content for local/preview builds only (never in production)
src/lib/content/          block format, content file schema, loaders (language + review rule)
src/lib/settings.ts       cached DB settings (seo, organization) — revalidate tags after admin edits
src/lib/receipts/         numbering + PDF generation
src/messages/{en,hi,mr,gu}.json   UI strings (CMS content lives in the DB)
drizzle/                  SQL migrations
tokens/                   design tokens (source of truth for Figma + Tailwind)
design/                   Step 1 HTML mockups: generated tokens.css, base.css, templates, built pages
scripts/                  dependency-free build scripts (tokens-to-css, build-mockups)
brand/                    original logo + font assets (read-only)
tests/{unit,e2e}/         Vitest, Playwright
```

## Coding rules
- Money is **integer paise** (`bigint`/`integer`), never floats; format only at the edge.
- All dates stored as `timestamptz`, displayed and bucketed in **Asia/Kolkata**; financial year is **1 Apr – 31 Mar** (`2026-27`).
- No hard-coded colours, fonts, radii or shadows in components — use token-backed Tailwind classes only (see `docs/brand.md`). Tailwind's default palette is removed, and `npm run brand:lint` (in CI) enforces this.
- Reuse `src/components/ui` before writing new markup; new pages link only via `src/config/nav.ts`.
- Server components by default; `"use client"` only where interaction needs it.
- Every user-facing string goes through next-intl; every page has `generateMetadata` built with `buildMetadata()`.
- The build reads settings from the database: run `npm run db:migrate` before `npm run build` on a fresh DB.
- Content appears in a language only if translated (and reviewed, in production) — never fall back to English inside another language.
- Changing the home headline or site name? Re-run `node scripts/og-indic.mjs` (Indic share images).
- Secrets only in env vars (`.env.local`, Vercel env); `.env.example` lists names, never values.
- Validate all input on the server (zod); never trust client-sent amounts, fees or status.
- Every admin write goes through a service that records an audit-log entry.
- Webhook handlers: verify signature on the raw body, be idempotent, return 200 only after commit.

## Commands
`nvm use` (Node 24) · `npm run dev` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run build && npm run test:e2e && npm run lhci` · `npm run db:generate` (then review the SQL) · `npm run db:migrate` · `npm run tokens` · `npm run brand:lint`. Full list in README.md.

## Workflow
1. **Plan mode first** for every step: propose, wait for approval, then write.
2. **One branch + one PR per roadmap step** (names in `docs/roadmap.md`). Conventional commits.
3. **Never mark a step done without running the checks**: lint, typecheck, unit + e2e tests, build, and `/done-check` (plus the relevant `/a11y-audit`, `/seo-check`, `/jsonld-check`, `/pwa-check`, `/brand-check`). Report failures honestly.
4. Anything unknown goes in `docs/open-questions.md` — don't invent brand values, legal text or Trust details.

## Docs
- [docs/spec.md](docs/spec.md) — sitemap, data model, donation flow, receipts, admin & roles
- [docs/standards.md](docs/standards.md) — Definition of Done checklist (IDs used by slash commands)
- [docs/brand.md](docs/brand.md) + [tokens/design-tokens.json](tokens/design-tokens.json) — brand & tokens
- [docs/roadmap.md](docs/roadmap.md) — Steps 0–13 with branches and exit criteria
- [docs/open-questions.md](docs/open-questions.md) — what we still need from the Trust
