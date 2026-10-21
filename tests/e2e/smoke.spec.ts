import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const LOCALES = ["en", "hi", "mr", "gu"] as const;

for (const locale of LOCALES) {
  test.describe(`/${locale}`, () => {
    test("renders with the right language, one h1 and no serious a11y issues", async ({ page }) => {
      const response = await page.goto(`/${locale}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main#main")).toHaveCount(1);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
    });

    test("has canonical and hreflang alternates for all locales", async ({ page }) => {
      await page.goto(`/${locale}`);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/${locale}$`));
      for (const l of [...LOCALES, "x-default"]) {
        await expect(page.locator(`link[rel="alternate"][hreflang="${l}"]`)).toHaveCount(1);
      }
    });
  });
}

test("skip link moves focus to main content", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard check runs on desktop");
  await page.goto("/en");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
});

test("root permanently redirects to /en", async ({ request }) => {
  const response = await request.get("/", { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers()["location"]).toBe("/en");
});

test("security headers are set", async ({ request }) => {
  const headers = (await request.get("/en")).headers();
  expect(headers["strict-transport-security"]).toContain("max-age=63072000");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["content-security-policy-report-only"]).toContain("frame-ancestors 'none'");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("admin and api are noindex", async ({ request }) => {
  for (const path of ["/admin", "/api/health"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.headers()["x-robots-tag"], path).toBe("noindex, nofollow");
  }
});
