#!/usr/bin/env node
// Renders the Hindi/Marathi/Gujarati share cards (1200×630) in real Chromium, which shapes Indic
// scripts correctly (next/og's Satori does not). Output: public/og/{hi,mr,gu}.png (committed).
// Re-run after changing Home.h1 / Meta.siteName or the brand: node scripts/og-indic.mjs
import { readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const tokens = JSON.parse(readFileSync(join(root, "tokens/design-tokens.json"), "utf8"));
const c = {
  canvas: tokens.color.white.$value,
  text: tokens.color.neutral["950"].$value,
  muted: tokens.color.neutral["700"].$value,
  rule: tokens.color.brand.green.$value,
};
const font = (f) =>
  `data:font/${f.endsWith(".woff2") ? "woff2" : "woff"};base64,${readFileSync(join(root, f)).toString("base64")}`;
const logo = `data:image/svg+xml;base64,${readFileSync(join(root, "public/brand/mswt-logo-horizontal.svg")).toString("base64")}`;
const SCRIPT_FONT = {
  hi: font("public/fonts/poppins/poppins-devanagari-600.woff2"),
  mr: font("public/fonts/poppins/poppins-devanagari-600.woff2"),
  gu: font("src/assets/og/noto-sans-gujarati-600.woff"),
};

mkdirSync(join(root, "public/og"), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const locale of ["hi", "mr", "gu"]) {
  const m = JSON.parse(readFileSync(join(root, `src/messages/${locale}.json`), "utf8"));
  await page.setContent(`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><style>
    @font-face { font-family: Card; font-weight: 600; src: url("${SCRIPT_FONT[locale]}"); }
    @font-face { font-family: CardLatin; font-weight: 600; src: url("${font("public/fonts/poppins/poppins-latin-600.woff2")}"); }
    html, body { margin: 0; width: 1200px; height: 630px; background: ${c.canvas}; }
    body { box-sizing: border-box; padding: 64px 80px; display: flex; flex-direction: column; justify-content: space-between;
           font-family: CardLatin, Card, sans-serif; font-weight: 600; }
    h1 { margin: 0 0 20px; font-size: 60px; line-height: 1.4; color: ${c.text}; font-weight: 600; }
    p { margin: 0; font-size: 30px; line-height: 1.5; color: ${c.muted}; }
    .rule { width: 160px; height: 8px; background: ${c.rule}; }
  </style></head><body>
    <img src="${logo}" width="320" height="100" alt="">
    <div><h1>${m.Home.h1}</h1><p>${m.Meta.siteName}</p></div>
    <div class="rule"></div>
  </body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(root, `public/og/${locale}.png`) });
  console.log(`Wrote public/og/${locale}.png`);
}
await browser.close();
