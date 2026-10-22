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
