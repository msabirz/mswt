import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Browser, type Page } from "@playwright/test";
import { hash } from "@node-rs/argon2";
import { Secret, TOTP } from "otpauth";
import postgres from "postgres";

// Shared helpers for admin e2e tests. They write users to the test database, so specs using them
// run only in CI or against `npm run db:local`.
export const PASSWORD = "e2e admin passphrase 2026";
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

export async function expectAccessible(page: Page) {
  // The error boundary also has one h1 and passes axe: make sure we're checking the real page.
  await expect(page.getByRole("heading", { name: "Something went wrong" })).toHaveCount(0);
  const { violations } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
}

export const uniqueEmail = (role: string) =>
  `e2e-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;

export async function createUser(role: "super_admin" | "accountant" | "content_editor") {
  const db = postgres(process.env.DATABASE_URL!);
  const address = uniqueEmail(role);
  await db`insert into users (email, name, role, password_hash)
           values (${address}, ${`E2E ${role}`}, ${role}, ${await hash(PASSWORD)})`;
  await db.end();
  return address;
}

/** Password → first-time 2FA setup (key read from the page) → recovery codes → admin home. */
export async function signInFirstTime(page: Page, address: string, password = PASSWORD) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(address);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Set up two-step verification" })).toBeVisible();
  await expectAccessible(page);
  const key = (await page.locator("code").first().textContent())!.replace(/\s/g, "");
  const totp = new TOTP({ secret: Secret.fromBase32(key) });
  await page.getByLabel(/6-digit code/).fill(totp.generate());
  await page.getByRole("button", { name: "Turn on two-step verification" }).click();
  await expect(page.getByRole("heading", { name: "Save your recovery codes" })).toBeFocused();
  const codes = await page.getByRole("list", { name: "Recovery codes" }).locator("li").allTextContents();
  expect(codes).toHaveLength(10);
  await page.getByRole("button", { name: /I have saved my codes/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Welcome/ })).toBeVisible();
  return { totp, codes };
}

export async function newPage(browser: Browser) {
  return (await browser.newContext()).newPage();
}

/** Newest message the test server's stand-in email provider wrote to .data/outbox.jsonl. */
export function latestEmailTo(address: string): { subject: string; text: string } | null {
  try {
    const lines = readFileSync(".data/outbox.jsonl", "utf8").trim().split("\n").reverse();
    for (const line of lines) {
      const m = JSON.parse(line) as { to: string; subject: string; text: string };
      if (m.to === address) return m;
    }
  } catch {
    return null;
  }
  return null;
}
