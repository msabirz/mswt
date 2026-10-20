# Open questions

Answer inline (or tick and add the value). IDs are referenced from `spec.md` and `brand.md`.

## A. Brand assets (blocking `docs/brand.md` + `tokens/design-tokens.json`)
- [ ] **A1** Logo master file — **SVG** preferred (or AI/EPS/PDF). PNG only is workable but colours/shapes get less precise. → `brand/logo/`
- [ ] **A2** Logo variants that exist: full colour, single-colour/mono, reversed (white on dark), stacked vs horizontal, icon/mark only (needed for favicon and maskable PWA icon).
- [ ] **A3** Official brand colour hex codes, if any were specified by the designer. → `brand/README.md`
- [ ] **A4** Brand font name (and files, if any) and **its licence** — does it allow web embedding/self-hosting? → `brand/fonts/`
- [ ] **A5** Is there a Hindi / Marathi / Gujarati version of the logo or wordmark?
- [ ] **A6** Who designed the logo, and is there any brand guideline document (clear space, do/don't)?
- [ ] **A7** Photography: do you have real photos of the Trust's work (with consent from people pictured, especially children)? Any images we must not use?

## B. Legal / tax / payments
- [ ] **B1** Trust PAN, 12A registration no. + date, 80G registration no. + validity (from–to), Trust registration no. and authority (Charity Commissioner, etc.).
- [ ] **B2** No FCRA: confirm the rule — block everyone without an Indian citizenship declaration, INR only, international cards disabled on Cashfree. Should NRIs who are Indian citizens paying from Indian (NRO/NRE) accounts be allowed? (Recommend confirming with the Trust's CA.)
- [ ] **B3** "Cover the gateway fee": what % to add (Cashfree pricing on your plan), and should the fee-cover amount be included in the 80G receipt amount? (Proposal: included.)
- [ ] **B4** Separate number series for non-80G acknowledgements (`MSWT/ACK/2026-27/000001`) — OK?
- [ ] **B5** Donor without PAN: issue acknowledgement only, and allow later conversion to an 80G receipt within the same FY — OK?
- [ ] **B6** "Anonymous" = hidden from public display only, identity still recorded (to avoid Section 115BBC tax on anonymous donations) — OK? Confirm with CA.
- [ ] **B7** Minimum and maximum online donation amount, and the preset amounts to show.
- [ ] **B8** Authorised signatory for receipts (name, designation) and a scanned signature/stamp image, if wanted on the PDF.
- [ ] **B9** Cashfree account: already approved (KYC done) or to be opened? Business/settlement account in the Trust's name?
- [ ] **B10** Refund policy terms (window, process) and who approves refunds.
- [ ] **B11** Legal texts (Privacy, Terms, Refund, 80G disclaimer): will the Trust's CA/lawyer provide or review drafts we write? DPDP Act 2023 grievance officer name and email.
- [ ] **B12** Financial year to start the receipt series: FY 2026-27 from go-live? Any receipts already issued this FY offline (to continue the series from a number)?

## C. Organization details (CMS Settings → JSON-LD, footer, receipts)
- [ ] **C1** Founding date (registration date).
- [ ] **C2** Registered address (street, locality, city, district, state, PIN) and, if different, the office address for visitors.
- [ ] **C3** Public phone number(s) and hours; WhatsApp number (display only — WhatsApp integration is Phase 2).
- [ ] **C4** Trustees: full name, role (Founder / Managing Trustee / Trustee…), photo, short bio — and which may be shown publicly.
- [ ] **C5** Official social profiles (URLs), or which to create before launch (`sameAs`).
- [ ] **C6** Trust name in Hindi, Marathi and Gujarati script (for `alternateName` and localised headers) — exact spelling approved by the Trust.
- [ ] **C7** Description / mission statement (1–2 sentences) in all 4 languages; areas served (cities/districts/states).
- [ ] **C8** Initial causes (names, descriptions, goals), and any annual reports / audited accounts to publish on Transparency.

## D. Operations & accounts
- [x] **D1** GitHub repository: `msabirz/mswt` (answered 2026-10-20).
- [ ] **D2** Who will be the admins (names, emails, role each)?
- [ ] **D3** Who human-reviews Hindi, Marathi and Gujarati translations?
- [ ] **D4** Outbound email provider: Resend (3,000/month free, best DX) vs Brevo (300/day free) vs MSG91 — proposal: **Resend**. Sender address (e.g. `receipts@mswelfaretrust.org`)?
- [ ] **D5** Domain `mswelfaretrust.org` — registered where, and is DNS already on Cloudflare?
- [ ] **D6** Vercel plan: the free **Hobby** plan is limited to non-commercial personal use; a donation-collecting site may need **Pro** (or a Vercel nonprofit arrangement). Please confirm before go-live.
- [ ] **D7** Analytics: none, Vercel Web Analytics, or a privacy-friendly tool (no cookie banner needed if cookieless)?
- [ ] **D8** Admin notification recipients for new donations and messages.
