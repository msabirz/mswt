# Functional spec — Phase 1

Status: draft for review (Step 0). Items marked **[OQ-n]** depend on an answer in [open-questions.md](open-questions.md).

## 1. Sitemap

Locales: `en` (default), `hi`, `mr`, `gu`. `{l}` = locale. Slugs are ASCII and **shared across locales** (same slug for `/en/causes/education` and `/hi/causes/education`) so hreflang pairs are trivial; titles, H1s and body are localised.

### Public (indexable, server-rendered/static, in `sitemap.xml` with alternates)
| Page | URL | Notes |
|---|---|---|
| Root | `/` | 308 → `/en` (no content) |
| Home | `/{l}` | WebSite + NGO JSON-LD |
| About | `/{l}/about` | Trustees, Trust PAN, 12A/80G numbers + validity. AboutPage |
| Causes list | `/{l}/causes` | CollectionPage |
| Cause detail | `/{l}/causes/{slug}` | Unique title/H1 per locale, Donate CTA |
| Donate | `/{l}/donate` | `?cause={slug}` preselects. DonateAction. **Never cached by SW** |
| Gallery | `/{l}/gallery` | Albums; ImageObject per image |
| Gallery album | `/{l}/gallery/{slug}` | |
| Events list | `/{l}/events` | Upcoming + past |
| Event detail | `/{l}/events/{slug}` | Event JSON-LD |
| News list | `/{l}/news` | Paginated `?page=n` (canonical to itself) |
| News article | `/{l}/news/{slug}` | NewsArticle JSON-LD |
| Transparency | `/{l}/transparency` | Annual reports, audited accounts (PDF links on R2) |
| Contact | `/{l}/contact` | Form (Turnstile) + address/map link. ContactPage |
| Privacy policy | `/{l}/privacy` | DPDP Act 2023 compliant |
| Terms of use | `/{l}/terms` | |
| Refund policy | `/{l}/refund-policy` | Required by Cashfree |
| 80G disclaimer | `/{l}/80g-disclaimer` | Eligibility, cash limit, PAN rule, Form 10BE note |

### Public but `noindex` (not in sitemap)
| Page | URL |
|---|---|
| Thank you / status | `/{l}/donate/thank-you?order={publicOrderId}` — reads status from DB, polls until webhook lands |
| Offline fallback | `/{l}/offline` |
| 404 / 500 | localised `not-found` / `error` |

### Admin (English, `noindex, nofollow`, `Disallow` in robots, auth required)
`/admin/login`, `/admin/2fa`, `/admin` (dashboard), `/admin/donations`, `/admin/donations/new` (offline entry), `/admin/donations/{id}`, `/admin/donors`, `/admin/donors/{id}`, `/admin/causes`, `/admin/content/pages`, `/admin/content/gallery`, `/admin/content/events`, `/admin/content/news`, `/admin/content/menus`, `/admin/messages`, `/admin/reports`, `/admin/settings/organization`, `/admin/settings/seo`, `/admin/settings/payments`, `/admin/settings/email`, `/admin/settings/appearance`, `/admin/users`, `/admin/audit-log`.

### API (`noindex` header, `Disallow`, never cached)
`POST /api/donations/order`, `POST /api/webhooks/cashfree`, `GET /api/donations/{publicOrderId}/status`, `GET /api/receipts/{token}` (signed, expiring link to R2 PDF), `POST /api/contact`, `GET /api/cron/reconcile` (Vercel Cron, secret header), `POST /api/indexnow` (internal, on publish).

### Generated
`/sitemap.xml` (`app/sitemap.ts`, with `alternates.languages` for all 4 locales + x-default), `/robots.txt` (`app/robots.ts`), `/manifest.webmanifest`, `/sw.js`, `/{indexnow-key}.txt`, OG images via `opengraph-image.tsx` per route.

### SEO rules (as built in Step 4)
- Canonical origin = `NEXT_PUBLIC_SITE_URL`. Every page uses `buildMetadata()` (`src/lib/seo/metadata.ts`): absolute canonical, hreflang for en/hi/mr/gu + x-default → `/en…`, Open Graph (`en_IN`, `hi_IN`, `mr_IN`, `gu_IN`), Twitter `summary_large_image`.
- `robots.txt`: production allows `/` and disallows `/admin` and `/api`, plus a sitemap link; every other environment disallows all. Requests on a non-canonical host get `X-Robots-Tag: noindex, nofollow` (set in `src/proxy.ts`). In Step 12 the vercel.app host gets a 308 redirect to the domain.
- `sitemap.xml` lists only `ready` pages from `src/config/nav.ts` × 4 locales with alternates; CMS content is added in Step 6.
- Share images: English is rendered live by `next/og`. **Hindi, Marathi and Gujarati use PNGs pre-rendered in Chromium** (`scripts/og-indic.mjs` → `public/og/*.png`) because next/og's Satori mis-shapes Indic scripts (vowel signs and conjuncts). Re-run the script when the home headline or site name changes.
- **404 pages (Next.js 16.4 behaviour, verified 2026-10-23):** when a page calls `notFound()`, Next sends the correct 404 status but only an empty client-rendered shell as HTML (`<html id="__next_error__">`), even in a stock app. URLs that match **no route** are different: they get complete server HTML. So:
  - Unknown paths (`/en/does-not-exist`, `/fr`, `/xx/yy`) are deliberately **unmatched** (there is no catch-all route) and are rendered by `src/app/global-not-found.tsx` (`experimental.globalNotFound`): full localized page, correct `lang`/title, `noindex`, status 404. The language comes from the URL via next-intl's proxy header, with English as the fallback.
  - Unknown **content slugs** (`/en/causes/nope`, missing translation) still call `notFound()`: status 404 and `noindex` are correct, and browsers render the localized page, but the raw HTML is Next's empty shell. The only way to make that complete is `dynamicParams = false`, which would stop newly published content appearing without a redeploy, so it is not used. Revisit if the admin triggers a deploy on publish.
  - The error page (`error.tsx`) is localised and noindex.
- IndexNow: `pingIndexNow()` runs only in production with a key from `seo_settings`; the key is served at `/indexnow-key.txt`. Verification meta tags come from `seo_settings` when set (DNS TXT stays primary).

### Structured data (as built in Step 5)
- One `<script type="application/ld+json">` per page with an `@graph`, built by `src/lib/seo/jsonld.ts` and rendered by `<JsonLd>`.
- **Home:** NGO (full) + WebSite + WebPage. **About** (Step 6): NGO (full) + AboutPage + BreadcrumbList. **Contact:** ContactPage + BreadcrumbList. **Lists:** CollectionPage + BreadcrumbList. **Cause detail:** WebPage + BreadcrumbList + DonateAction. **Event:** Event + WebPage + BreadcrumbList. **News:** NewsArticle + WebPage + BreadcrumbList. **Gallery:** ImageObject per image. **404/styleguide:** none.
- The NGO node is built only from `organization_settings`, and empty fields are omitted, never invented. Until the admin exists (Step 8), the Trust's public facts live in `data/organization.json` and are written with `npm run org:sync` (`-- --check` validates in CI).
- Logo for search engines: `/brand/mswt-logo-512.png` (512×512).

### Content rules (as built in Step 6)
- **Language rule:** an item exists in a language only if it has a translation for that language; in **production that translation must also be reviewed** (`reviewed_at` set). Otherwise the page is a 404 in that language and is left out of lists, hreflang and the sitemap. There is no fallback to English.
- **Where content comes from:** production reads only the database. Local builds and Vercel previews fall back to `data/content/content.json` (real drafts, such as the legal pages) and then `data/sample/content.json` (sample content, shown with a "Sample content" banner) for any part the database doesn't have yet. Sample content is never written to the database.
- **Loading real content before the admin exists:** add it to `data/content/content.json` and run `npm run content:sync`. Translations marked `"reviewed": true` go live; the rest stay preview-only. The script then calls `POST /api/revalidate` (`REVALIDATE_SECRET`) to refresh the site.
- **Rich text** is stored as typed blocks (heading, paragraph, list, callout) with `**bold**` and `[links](…)`. Links are limited to site paths, https, mailto and tel. No HTML is stored.
- **Legal pages** (privacy, terms, refund, 80G) are English drafts marked unreviewed. They stay off production (404, not in navigation) until the Trust's CA approves them.
- **Images** are placeholders until Cloudflare R2 uploads exist (Step 8); gallery `ImageObject` and article images arrive then.
- **Contact form:** zod validation, Cloudflare Turnstile (test keys outside production), and a limit of 5 messages per IP per hour using a salted IP hash (the IP itself is never stored). Messages are saved to `messages`; the email notification comes in Step 9.
- **Migrations on Vercel:** the build runs `npm run db:migrate` before `next build`, so previews (Neon branch per preview) and production get new tables automatically. Migrations must stay additive and reviewed.

## 2. Data model (Drizzle / Postgres)

Conventions: `id uuid pk`, `created_at`/`updated_at timestamptz`, money `*_paise bigint`, soft delete `deleted_at` where content is editable. Translatable content uses a `*_translations` table keyed `(parent_id, locale)` with `locale` enum `en|hi|mr|gu`.

### Identity & audit
- **users** — email (unique), name, password_hash (argon2id), role enum `super_admin|accountant|content_editor`, totp_secret (encrypted at rest), totp_enabled_at, recovery_codes_hash[], failed_logins, locked_until, last_login_at, is_active
- **sessions / accounts / verification_tokens** — Auth.js tables
- **audit_log** — actor_user_id, action, entity_type, entity_id, before jsonb, after jsonb, ip, user_agent, created_at (append-only; no update/delete grants)

### Donations
- **donors** — full_name, email, phone, pan (uppercase, validated `[A-Z]{5}[0-9]{4}[A-Z]`), address_line1/2, city, state, pincode, is_indian_citizen_declared bool + declared_at, consent_marketing bool, created_via `online|offline`. Dedupe key: PAN, else email+phone.
- **causes** — slug, status `draft|active|closed`, goal_paise nullable, raised_paise (cached), sort_order, cover_image_id, is_80g_eligible bool (default true)
- **cause_translations** — title, summary, body (rich text JSON), seo_title, seo_description, og_image_id
- **donations** — public_order_id (random, URL-safe), donor_id, cause_id nullable (general fund), amount_paise (donation), fee_cover_paise (0 if unchecked), total_paise (= amount + fee_cover; what is charged), currency `INR` only, mode `online|cash|cheque|neft|upi_offline`, status `created|pending|paid|failed|expired|refunded`, provider `cashfree`, provider_order_id, provider_payment_id, provider_payment_method, instrument_ref (cheque no./UTR for offline), instrument_date, bank_name, is_anonymous (display only — see §4), wants_80g bool, pan_snapshot, name_snapshot, address_snapshot (frozen at payment time), received_at (IST semantics), fy (`2026-27`, derived from received_at), entered_by_user_id (offline), notes, locale
- **payment_events** — provider, event_type, provider_event_id (unique → idempotency), donation_id, signature_valid bool, payload jsonb, received_at, processed_at, error
- **receipts** — donation_id (unique), kind `80g|acknowledgement`, number (unique, e.g. `MSWT/2026-27/000123`), fy, seq, pdf_r2_key, issued_at, emailed_at, email_message_id, voided_at, void_reason, voided_by_user_id
- **receipt_sequences** — (kind, fy) pk, last_seq — incremented with `SELECT … FOR UPDATE` inside the payment-confirmation transaction → gapless, never reused
- **reconciliation_runs** — started_at, finished_at, checked, updated, errors jsonb

### Content (CMS)
- **pages** — key enum (`home|about|transparency|contact|privacy|terms|refund_policy|disclaimer_80g`), + **page_translations** — title, h1, sections jsonb (typed blocks), seo_title, seo_description, og_image_id, reviewed_by, reviewed_at (translation human-review flag)
- **media** — r2_key, filename (descriptive, kebab-case), mime, width, height, bytes, blurhash/lqip, + **media_translations** — alt_text, caption
- **gallery_albums** (+translations), **gallery_items** — album_id, media_id, sort_order
- **events** — slug, starts_at, ends_at, timezone (`Asia/Kolkata`), status `scheduled|cancelled|postponed|rescheduled|moved_online`, attendance `offline|online|mixed`, venue_name, venue_address fields, online_url, cover_image_id, + **event_translations** — title, summary, body, seo fields
- **news_posts** — slug, published_at, author_user_id / author_name, cover_image_id, status `draft|published`, + **news_translations** — headline, excerpt, body, seo fields
- **reports** — fy, kind `annual_report|audited_accounts|other`, pdf_r2_key, published_at, + translations (title)
- **menus** — location `header|footer`, + **menu_items** — parent_id, sort_order, target (page key / cause / URL), + translations (label)
- **messages** — name, email, phone, subject, body, locale, ip_hash, turnstile_ok, status `new|read|replied|spam`, assigned_to

### Settings (single-row tables, edited in admin; feed JSON-LD, footer, receipts, emails)
- **organization_settings** — legal_name ("Munira Shoaib Welfare Trust"), display_name ("MS Welfare Trust"), alternate_names jsonb (`{en:["MS Welfare Trust","MSWT"],hi:…,mr:…,gu:…}`), description per locale, founding_date, trust_pan, reg_12a_number + date, reg_80g_number + valid_from + valid_to, registration_authority/trust_reg_no, address (street, locality, city, state, pincode, country `IN`), geo (lat/lng, optional), phones[], email, contact_hours, area_served[], trustees jsonb (name, role, photo_media_id, bio per locale, sort), same_as[] (official social URLs), logo_media_id (≥112×112, crawlable), signatory_name, signatory_title, signature_media_id (for receipts)
- **seo_settings** — default title template per locale, default description per locale, default og_image_id, google_site_verification, bing_site_verification, indexnow_key, twitter_handle
- **payment_settings** — min_amount_paise, max_amount_paise, preset_amounts_paise[], fee_cover_percent_bp (basis points), fee_cover_enabled, cash_80g_limit_paise (200000), provider_mode `sandbox|production` (keys stay in env)
- **appearance_settings** — site_font enum `poppins|mukta|hind|noto_sans` (default `poppins`), updated_by, updated_at. Only fonts bundled at build time can be chosen (docs/brand.md §3)
- **email_settings** — from_name, from_address, reply_to, admin_alert_recipients[], provider

## 3. Donation flow (online)

```
Donor ──form──► Server action / POST /api/donations/order
                 1. Turnstile verify, rate limit (IP + email)
                 2. zod: amount integer paise, min ≤ amount ≤ max, cause active,
                    PAN format if wants_80g, Indian-citizen declaration = true
                 3. fee_cover = round(amount × fee_bp / 10000) if checked (server-computed)
                 4. upsert donor, insert donation(status=created), snapshots
                 5. PaymentProvider.createOrder(total, order_id, customer) → status=pending
              ◄── payment_session_id
Donor ──► Cashfree checkout (domestic instruments only; international cards disabled)
Cashfree ──► return_url /{l}/donate/thank-you?order=…   (UI only, shows "confirming…")
Cashfree ──► POST /api/webhooks/cashfree
                 1. verify signature over raw body + timestamp; reject stale timestamps
                 2. insert payment_events (unique provider_event_id) — duplicate → 200 no-op
                 3. PaymentProvider.getOrder(order_id) re-fetch; check amount == total_paise, currency INR
                 4. TX: donation → paid, update cause.raised_paise,
                        lock receipt_sequences(kind, fy) → assign number, insert receipt
                 5. after commit: render PDF → R2, email donor (receipt link + attachment),
                    alert admins; failures retried by job, never roll back the payment
Thank-you page polls GET /api/donations/{id}/status → shows receipt number / download.
```
- **Daily reconciliation** (Vercel Cron, `Asia/Kolkata` 03:00): for donations `pending` > 30 min, call `getOrder`; apply the same confirmation path (idempotent) or mark `expired/failed`. Also retries un-emailed receipts. Summary row in `reconciliation_runs` and email to Super Admin if anything changed.
- **Failure/refund:** refunds are processed in Cashfree dashboard; webhook `refund` → donation `refunded`, receipt voided (number kept, void reason recorded).

#### As built in Step 7 (2026-10-23)
- **Form** (`/{l}/donate`): 3–4 preset amounts + a typed amount, cause (active DB causes translated into the page language; `?cause=` preselects), fee cover (only when enabled), name, email, **mobile (required: Cashfree needs it)**, optional 80G receipt (then PAN + postal address required), "don't show my name publicly", Indian-citizen declaration, Turnstile. All errors are reported at once, server-side.
- **Limits:** minimum above ₹5 (DB check), 3–4 presets, max optional — `payment_settings`, edited through `updatePaymentSettings()` (validated + audited; `npm run settings:sync` until the admin). Provisional values: min ₹100, presets ₹500/1,000/2,500/5,000, no max, fee cover off (B3/B7).
- **Rate limits:** 30 orders per IP and 10 per email per hour (Indian mobile networks share IPs). Unsigned webhooks are rejected with 401 and are **not** stored (so they can't fill the database); every signed delivery is stored in `payment_events`.
- **Transactions:** confirmation, receipt numbering, refunds and offline entry run in `withTx()`; numbers come from an `INSERT … ON CONFLICT DO UPDATE … RETURNING` on `receipt_sequences`, which holds the row lock until commit (gapless; tested with 20 concurrent confirmations).
- **Statuses:** a failed attempt can still be followed by a successful one (`failed → paid`); `paid` is never downgraded. Orders unpaid after 3 days become `expired`.
- **Amount check:** the webhook re-fetches the order; a different amount or currency is recorded as an error and never marks the donation paid.
- **PAN at rest:** AES-256-GCM (`PII_ENCRYPTION_KEY`) + last 4 + HMAC lookup (donor de-duplication). Receipts print the PAN masked (`XXXXXX234F`).
- **Receipt PDF:** English, pdfkit, Poppins + Noto Sans Gujarati TTF (Devanagari/Gujarati names shape correctly). Missing Trust facts print `[to be confirmed: …]`; in production a receipt is not issued until B1/B8 are filled (the number is kept; reconciliation retries).
- **Delivery:** PDF → private R2 bucket → email via Brevo with the PDF attached and a signed link (`/api/receipts/{order}?e=…&t=…`, 30 days) that redirects to a 10-minute R2 URL. Failures never undo the payment; the daily run retries (max 5 email attempts).
- **Switch:** online donations are on locally and on previews (Cashfree sandbox) and off in production until `NEXT_PUBLIC_DONATIONS_LIVE=true` (go-live, Step 12).
- **Tests:** unit (`tests/unit/donations.test.ts`), Postgres (`tests/integration`, CI job "Migrations"), e2e with the fake gateway (`tests/e2e/donate.spec.ts`, CI only for flows that write).

### Offline donations (admin)
Accountant enters donor, amount, mode (cash/cheque/NEFT/UPI), instrument ref & date, received date → same receipt service. Cash > ₹2,000 → acknowledgement only (see §4).

## 4. Receipt rules
1. Issued only for `paid` donations (online via webhook; offline on save by Accountant/Super Admin).
2. **Number format** `MSWT/{FY}/{seq:06}` e.g. `MSWT/2026-27/000123`; FY derived from `received_at` in Asia/Kolkata (Apr–Mar). Gapless per FY, never reused; voided receipts keep their number. Acknowledgements use a separate series `MSWT/ACK/{FY}/{seq:06}` **[OQ-B4]**.
3. **80G receipt** requires: donor name, address, **PAN**, amount in figures and words, mode, date, instrument ref (offline), cause; Trust legal name, address, Trust PAN, 80G registration number + validity, signatory. Text: deduction subject to Section 80G conditions.
4. **Cash > ₹2,000** (Section 80G(5D)): no 80G receipt — acknowledgement only, with a note that the amount is not eligible for deduction. Admin form warns before saving.
5. **No PAN** → acknowledgement receipt (not 80G); donor can add PAN later via admin "regenerate as 80G" (same FY only, old ack voided) **[OQ-B5]**.
6. **Anonymous option = public-display only.** Identity (name, email/phone, and PAN for 80G) is still collected and stored: truly unidentified donations are taxed under Section 115BBC. "Anonymous" hides the name in any public listing/thank-you wall.
7. **Gateway fee cover:** whether the fee-cover amount is included in the 80G amount **[OQ-B3]** — default proposal: included (it is a voluntary payment to the Trust).
8. Website receipts are the Trust's own receipt; the statutory **Form 10BE** certificate is generated from the Income-tax portal after Form 10BD is filed (Phase 2 export). We capture every field 10BD needs now (donor ID type/number, address, mode, amount, section).
9. Foreign contributions are refused: donor must declare Indian citizenship; currency INR; international cards disabled on Cashfree **[OQ-B2]**.
10. Resend receipt (admin) re-sends the same PDF; edits to donor details after issue require void + reissue (audited).

## 5. Admin modules
| Module | Contents |
|---|---|
| Dashboard | Today / FY totals, by cause, pending count, last reconciliation, recent messages |
| Donations | Filters (date range, FY, cause, mode, status, 80G/ack, amount range, donor search), detail with event timeline, offline entry, resend receipt, void/reissue, CSV + XLSX export |
| Donors | Search, profile with donation history, merge duplicates, PAN masked except for Accountant/Super Admin |
| Causes | CRUD, 4-language translations, goal, status, sort |
| CMS | Pages (typed blocks per locale), gallery, events, news, menus, media library (alt text per locale required), SEO fields per item, translation review flag, preview, publish → revalidate + IndexNow |
| Messages | Inbox from contact form, status, assign, reply via mailto |
| Reports | FY donation register, cause-wise summary, 80G receipt register, acknowledgement register, mode-wise — CSV/XLSX/PDF |
| Settings | Organization, SEO, payments, email, **appearance** (site font from the curated list, with a 4-script live preview; see §2) |
| Users & roles | Invite, role, deactivate, force 2FA reset (Super Admin only) |
| Audit log | Filter by actor / entity / date; read-only |

### Role permissions
| Capability | Super Admin | Accountant | Content Editor |
|---|:-:|:-:|:-:|
| Dashboard (financial totals) | ✓ | ✓ | — (content stats only) |
| View donations / donors (full PAN) | ✓ | ✓ | — |
| Offline donation entry | ✓ | ✓ | — |
| Resend / void / reissue receipt | ✓ | ✓ | — |
| Export donations / reports | ✓ | ✓ | — |
| Causes CRUD | ✓ | read | ✓ |
| CMS (pages, gallery, events, news, menus, media) | ✓ | — | ✓ |
| Messages | ✓ | read | ✓ |
| Organization & SEO settings | ✓ | — | SEO only |
| Payment & email settings | ✓ | — | — |
| Appearance (site font) | ✓ | — | — |
| Users & roles | ✓ | — | — |
| Audit log | ✓ | own actions | own actions |

All roles: TOTP 2FA mandatory, session timeout 30 min idle, login rate-limited and locked after 5 failures.
