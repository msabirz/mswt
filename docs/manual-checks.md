# Manual checks pending

Checks that automated tests can't cover or that are waiting on accounts or keys. Tick each one when done and note the date. Steps are listed in order.

## Step 7: Donations

### Waiting on accounts (SMS verification)
- [ ] **M7-1 Cashfree sandbox keys.** Sign up in the Cashfree merchant dashboard (Test mode, no KYC). Go to Developers → API Keys → Test and add these to `.env.local`:
  `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_ENV=sandbox`.
  Ask Cashfree to keep **international payments disabled** on the account (no FCRA, SEC-12).
- [ ] **M7-2 Brevo key and sender.** Create an API key (SMTP & API → API keys) and add `BREVO_API_KEY` to `.env.local`. `EMAIL_FROM_ADDRESS` must be a verified sender. Add Brevo's SPF and DKIM records to the domain's DNS (B14). In Brevo → Security → **Authorised IPs**, turn off IP blocking for the API key: Vercel sends from changing IP addresses, and Brevo already rejected a local test send because of this.
- [ ] **M7-3 Vercel environment variables (Preview only for now).** Add every variable from `.env.example` that is set in `.env.local` (R2, Brevo, Cashfree, `PII_ENCRYPTION_KEY`, `RECEIPT_LINK_SECRET`, `CRON_SECRET`). **Do not** set `NEXT_PUBLIC_DONATIONS_LIVE` (it stays off until go-live). Use the **same** `PII_ENCRYPTION_KEY` everywhere that shares a database.

### End-to-end test on the Vercel preview (after M7-1 to M7-3)
Previews are behind Vercel's login (Deployment Protection), which would also block Cashfree's webhooks and return pages. In Vercel → Project → Settings → Deployment Protection, create a **Protection Bypass for Automation** secret. Then set the Cashfree webhook URL (Developers → Webhooks, payment and refund events) to
`https://<preview-url>/api/webhooks/cashfree?x-vercel-protection-bypass=<secret>`.
Open the preview in a browser where you are signed in to Vercel.

- [ ] **M7-4 Successful payment.** On `/en/donate`, donate ₹100 with the 80G option (PAN in the format `ABCDE1234F`, with an address). Pay in the Cashfree test checkout with a test UPI ID or test card from Cashfree's docs. Expect:
  - The thank-you page shows "Thank you for your donation" and a receipt number `MSWT/2026-27/000001`.
  - "Download receipt (PDF)" opens the PDF.
- [ ] **M7-5 Receipt PDF.** Check:
  - The logo appears in the header.
  - Your name, the masked PAN (`XXXXXX…`), the amount in figures and in words, the mode and the date (IST).
  - Trust facts still show `[to be confirmed: …]` until B1/B8 are filled in.
- [ ] **M7-6 Receipt in R2.** Cloudflare → R2 → the receipts bucket → `receipts/2026-27/` contains the PDF. The bucket has no public access.
- [ ] **M7-7 Receipt email (Brevo).** The email arrives in the inbox (not spam) in the page's language, with the PDF attached and a working download link. Repeat once from `/hi/donate` and check that the email is in Hindi.
- [ ] **M7-8 Failed payment.** Choose a failure option in the Cashfree test checkout. Expect "Payment not completed" and a "Try again" button. No receipt is issued.
- [ ] **M7-9 Closed tab (no redirect).** Pay successfully but close the tab before returning to the site. The webhook should still mark the donation paid, and the receipt email should still arrive.
- [ ] **M7-10 Webhook signature.** In Cashfree's webhook logs, the deliveries to `/api/webhooks/cashfree` return **200**. A retried delivery also returns 200 and doesn't create a second receipt.
- [ ] **M7-11 Refund.** Refund the M7-4 payment from the Cashfree dashboard. In the database, the donation becomes `refunded` and the receipt is voided with the same number.
- [ ] **M7-12 Daily reconciliation.** In Vercel → Project → Cron Jobs, `/api/cron/reconcile` is listed (03:00 IST). Run it once from there. It returns 200, and `reconciliation_runs` has a new row.

### Accessibility and devices
- [ ] **M7-13 Screen reader.** Test the full donate flow on `/en/donate` and `/hi/donate` with VoiceOver (Safari, iPhone and Mac) and with NVDA (Chrome, Windows). Check that:
  - Every field is announced with its label.
  - Errors are read out.
  - The thank-you result is announced (A11Y-21).
- [ ] **M7-14 Phone check.** Make the donation on a real Android phone (Chrome) and a real iPhone (Safari), paying with UPI in the Cashfree test checkout. Check that the form is easy to fill and the page returns from the UPI app correctly.

### Before go-live (not needed for the Step 7 PR)
- [ ] **M7-15 Trust facts on receipts.** Fill in B1 (Trust PAN, 12A and 80G numbers and validity) and B8 (signatory) in `data/organization.json`, then run `npm run org:sync`. Production won't issue receipts until these are filled in.
- [ ] **M7-16 CA review.** The CA checks the receipt and acknowledgement wording and approves printing the donor's PAN masked (B13), along with the legal pages (B11).
- [ ] **M7-17 Amounts.** The Trust confirms the minimum and suggested amounts, and whether fee cover is on (B3, B7). Update `data/payment-settings.json` and run `npm run settings:sync`.
- [ ] **M7-18 Production switch.** Add Cashfree **production** keys (after KYC) with `CASHFREE_ENV=production` and the production webhook URL. Then set `NEXT_PUBLIC_DONATIONS_LIVE=true` in Vercel Production, and make one real ₹10 donation and refund it.

## Step 8a: Admin sign-in

- [ ] **M8-1 First Super Admin on production.** After merging, with `AUTH_SECRET` in Vercel (Production and Preview), run `npm run admin:create` with `DATABASE_URL` pointing at the production Neon database. Sign in at `/admin/login` and set up 2FA with your phone's authenticator app. Print or store the 10 recovery codes.
- [ ] **M8-2 Authenticator apps.** Check that setup works with Google Authenticator, Microsoft Authenticator and 1Password (scan the QR code, and also type the key by hand).
- [ ] **M8-3 Password managers.** Your password manager offers to save the password on the invite page and fills it on the sign-in page. Pasting works in every field (A11Y-16).
- [ ] **M8-4 Invite a second person** as a Content Editor. They open the link, set a password and set up 2FA. Check they see only Home, SEO, Audit log and My account.
- [ ] **M8-5 Screen reader** (VoiceOver/NVDA): sign in, 2FA, one settings save and the audit log, with every field and message announced.
- [ ] **M8-6 Idle timeout.** Leave the admin open for 31 minutes; the next click goes to the sign-in page.
