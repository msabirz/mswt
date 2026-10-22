import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const LOCALES = ["en", "hi", "mr", "gu"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const locale of LOCALES) {
  test(`/${locale}/styleguide has no serious a11y issues`, async ({ page }) => {
    await page.goto(`/${locale}/styleguide`);
    await expect(page.getByRole("heading", { level: 1, name: "Style guide" })).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}

test("styleguide is noindex", async ({ page }) => {
  await page.goto("/en/styleguide");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

for (const path of ["/en", "/hi", "/gu/styleguide"]) {
  test(`no horizontal scroll at 320px on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("mobile menu toggles and exposes its state", async ({ page, isMobile }) => {
  test.skip(!isMobile, "menu button only shows on small screens");
  await page.goto("/mr");
  const toggle = page.getByRole("button", { name: "मेनू" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#site-nav")).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#site-nav")).toBeVisible();
});

test("language switcher keeps the current page", async ({ page, isMobile }) => {
  await page.goto("/en/styleguide");
  if (isMobile) await page.getByRole("button", { name: "Menu" }).click();
  await page.locator("summary", { hasText: "English" }).click();
  await page.getByRole("link", { name: "ગુજરાતી" }).click();
  await expect(page).toHaveURL(/\/gu\/styleguide$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "gu");
});

test("dialog closes with Escape and returns focus", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard check runs on desktop");
  await page.goto("/en/styleguide");
  const opener = page.getByRole("button", { name: "Open dialog" });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: /Void receipt/ });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("focused controls show a visible focus ring", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard check runs on desktop");
  await page.goto("/en/styleguide");
  const button = page.getByRole("button", { name: "Primary", exact: true });
  await button.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  const outline = await button.evaluate((el) => {
    const s = getComputedStyle(el);
    return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
  });
  expect(outline.style).toBe("solid");
  expect(outline.width).toBeGreaterThanOrEqual(3);
});
