# mswelfaretrust.org

Donation website and admin panel for Munira Shoaib Welfare Trust (MS Welfare Trust). Project rules are in [CLAUDE.md](CLAUDE.md); specs, standards and the roadmap are in [docs/](docs/).

## Setup
Requires Node 24 (via nvm) and npm 11.

```bash
nvm use            # reads .nvmrc (24)
npm ci
cp .env.example .env.local   # then fill in DATABASE_URL from Neon
npm run db:migrate
npm run dev        # http://localhost:3000 → /en
```

Design system: components in `src/components/ui`, all states on `/en/styleguide` (local and Vercel previews only; 404 in production).

## Commands
| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev server, production build, production server |
| `npm run lint` · `typecheck` · `format:check` | ESLint (incl. jsx-a11y strict), `tsc --noEmit`, Prettier |
| `npm test` | Vitest unit tests (`tests/unit`) |
| `npm run test:e2e` | Playwright + axe against the production build (run `npm run build` first) |
| `npm run lhci` | Lighthouse CI with the budgets in `lighthouserc.json` (run `npm run build` first) |
| `npm run db:generate` | Write a new SQL migration from `src/lib/db/schema.ts` into `drizzle/` (review it before committing) |
| `npm run db:migrate` | Apply migrations in `drizzle/` to `DATABASE_URL` |
| `npm run tokens` · `tokens:check` | Regenerate / verify `src/styles/theme.css` (Tailwind theme) and `design/tokens.css` from `tokens/design-tokens.json` |
| `node scripts/og-indic.mjs` | Re-render the Hindi/Marathi/Gujarati share images (`public/og/*.png`) in Chromium |
| `npm run org:sync` | Write `data/organization.json` to `organization_settings` (`-- --check` only validates) |
| `npm run content:sync` | Write `data/content/content.json` to the database and refresh the site (`-- --check` only validates) |
| `npm run brand:lint` | Fail on colour, font, radius or shadow literals in `src/` (use token classes) |
| `npm run mockups` | Rebuild the Step 1 HTML mockups in `design/mockups/` |

CI (`.github/workflows/ci.yml`) runs all of these on every pull request. It applies the migrations to a throwaway Postgres 17 and runs Lighthouse against the build.
