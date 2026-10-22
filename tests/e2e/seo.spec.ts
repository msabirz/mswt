import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("sitemap.xml lists every locale with hreflang alternates", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const xml = await res.text();
  for (const l of ["en", "hi", "mr", "gu"]) expect(xml).toMatch(new RegExp(`<loc>[^<]*/${l}</loc>`));
  expect(xml).toContain('hreflang="x-default"');
  expect(xml).not.toContain("styleguide");
});

test("robots.txt blocks crawling outside production", async ({ request }) => {
  const text = await (await request.get("/robots.txt")).text();
  expect(text).toMatch(/Disallow: \/\s*$/m);
});

test("unknown paths return a real 404 page", async ({ page }) => {
  const res = await page.goto("/en/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
});

// Crawlers and no-JS clients read the raw HTML, not the browser DOM. For URLs that match no route the
// 404 must be complete server-rendered HTML (Next's default for notFound() is an empty client shell).
const NOT_FOUND = [
  { locale: "en", h1: "We can&#x27;t find that page", title: "Page not found" },
  { locale: "hi", h1: "यह पृष्ठ नहीं मिला", title: "पृष्ठ नहीं मिला" },
  { locale: "mr", h1: "हे पान सापडले नाही", title: "पान सापडले नाही" },
  { locale: "gu", h1: "આ પૃષ્ઠ મળ્યું નથી", title: "પૃષ્ઠ મળ્યું નથી" },
] as const;

for (const { locale, h1, title } of NOT_FOUND) {
  test(`/${locale}/<unknown path> is a complete server-rendered 404 (raw HTML)`, async ({ request }) => {
    const res = await request.get(`/${locale}/does-not-exist/deeper`);
    expect(res.status()).toBe(404);
    const html = await res.text();
    expect(html).not.toContain("__next_error__");
    expect(html).toMatch(new RegExp(`<html[^>]*lang="${locale}"`));
    expect(html).toMatch(new RegExp(`<h1[^>]*>${h1}</h1>`));
    expect(html).toContain(`<title>${title} | `);
    expect(html).toMatch(/<meta name="robots" content="noindex/);
    expect(html).toMatch(/<header[\s\S]*<nav[\s\S]*<main[\s\S]*<footer/);
    expect(html).toContain(`href="/${locale}"`);
  });
}

test("paths without a valid language fall back to a complete English 404", async ({ request }) => {
  for (const path of ["/fr", "/xx/yy"]) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(404);
    const html = await res.text();
    expect(html, path).not.toContain("__next_error__");
    expect(html, path).toMatch(/<html[^>]*lang="en"/);
    expect(html, path).toMatch(/<h1[^>]*>We can&#x27;t find that page<\/h1>/);
  }
});

test("an unknown content slug is still a 404 with noindex", async ({ request }) => {
  // The body is Next's client-rendered shell for notFound() (see docs/spec.md), but status and
  // robots must be right so the URL is never indexed.
  const res = await request.get("/en/causes/does-not-exist");
  expect(res.status()).toBe(404);
  expect(await res.text()).toMatch(/<meta name="robots" content="noindex/);
});

test("unknown locale ends in a 404", async ({ page }) => {
  const res = await page.goto("/fr");
  expect(res?.status()).toBe(404);
});

for (const locale of ["en", "hi"]) {
  test(`/${locale} has an og:image that is a 1200×630 PNG`, async ({ page, request }) => {
    await page.goto(`/${locale}`);
    const src = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(src).toBeTruthy();
    const img = await request.get(new URL(src!).pathname + new URL(src!).search);
    expect(img.status()).toBe(200);
    expect(img.headers()["content-type"]).toBe("image/png");
    const buf = await img.body();
    expect(buf.readUInt32BE(16)).toBe(1200);
    expect(buf.readUInt32BE(20)).toBe(630);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  });
}

test("hosts other than the real domain are noindex", async ({ request }) => {
  const res = await request.get("/en", { headers: { host: "mswelfaretrust.vercel.app" } });
  expect(res.headers()["x-robots-tag"]).toBe("noindex, nofollow");
});
