#!/usr/bin/env node
// Builds the static design mockups into design/mockups/ (no dependencies).
// Usage: node scripts/build-mockups.mjs
import { mkdirSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { LOCALES, LANG_NAMES } from "../design/src/i18n.mjs";
import * as pub from "../design/src/pages-public.mjs";
import * as admin from "../design/src/pages-admin.mjs";
import { styleguide, index } from "../design/src/pages-meta.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "design/mockups");
rmSync(out, { recursive: true, force: true });

const files = {};
const put = (path, html) => (files[path] = html);

for (const l of LOCALES) {
  put(`${l}/home.html`, pub.home(l));
  put(`${l}/donate.html`, pub.donate(l));
}
put("en/donate-errors.html", pub.donate("en", { errors: true }));
put("hi/donate-errors.html", pub.donate("hi", { errors: true }));
put("en/thank-you.html", pub.thankYou());
put("en/about.html", pub.about());
put("en/causes.html", pub.causesList());
put("en/cause-detail.html", pub.causeDetail());
put("en/contact.html", pub.contact());
put("en/404.html", pub.notFound());
put("admin/login.html", admin.login());
put("admin/dashboard.html", admin.dashboard());
put("admin/donations.html", admin.donations());
put("admin/donation-new.html", admin.donationNew());
put("styleguide.html", styleguide(root));
put(
  "index.html",
  index([
    {
      id: "g-start",
      title: "Start here",
      links: [["styleguide.html", "Style guide: colours, type, components, logo"]],
    },
    {
      id: "g-home",
      title: "Home in each language",
      links: LOCALES.map((l) => [`${l}/home.html`, `Home — ${LANG_NAMES[l]}`]),
    },
    {
      id: "g-donate",
      title: "Donation flow",
      links: [
        ...LOCALES.map((l) => [`${l}/donate.html`, `Donate — ${LANG_NAMES[l]}`]),
        ["en/donate-errors.html", "Donate — validation errors (English)"],
        ["hi/donate-errors.html", "Donate — validation errors (हिन्दी)"],
        ["en/thank-you.html", "Thank you — confirming, paid and failed states"],
      ],
    },
    {
      id: "g-pages",
      title: "Other public pages (English)",
      links: [
        ["en/about.html", "About"],
        ["en/causes.html", "Causes"],
        ["en/cause-detail.html", "Cause detail"],
        ["en/contact.html", "Contact"],
        ["en/404.html", "Page not found"],
      ],
    },
    {
      id: "g-admin",
      title: "Admin (English only)",
      links: [
        ["admin/login.html", "Sign in and two-factor code"],
        ["admin/dashboard.html", "Dashboard"],
        ["admin/donations.html", "Donations list and filters"],
        ["admin/donation-new.html", "Record offline donation (cash over ₹2,000 warning)"],
      ],
    },
  ]),
);

for (const [path, html] of Object.entries(files)) {
  mkdirSync(dirname(join(out, path)), { recursive: true });
  writeFileSync(join(out, path), html);
}

mkdirSync(join(out, "assets"), { recursive: true });
copyFileSync(join(root, "design/tokens.css"), join(out, "assets/tokens.css"));
copyFileSync(join(root, "design/base.css"), join(out, "assets/base.css"));
for (const f of [
  "mswt-logo-horizontal.svg",
  "mswt-logo-horizontal-reversed.svg",
  "mswt-mark.svg",
  "mswt-mark-compact.svg",
]) {
  copyFileSync(join(root, "brand/logo", f), join(out, "assets", f));
}
console.log(`Built ${Object.keys(files).length} pages into design/mockups/`);
