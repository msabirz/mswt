import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
export const E2E_REVALIDATE_SECRET = "e2e-only-revalidate-secret";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: "retain-on-failure" },
  // Admin specs change content in the shared test database (a real cause hides the sample causes the
  // public-page tests expect), so they run after the public projects have finished.
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /admin.*\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: /admin.*\.spec\.ts/ },
    {
      name: "admin-desktop",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /admin.*\.spec\.ts/,
      dependencies: ["desktop", "mobile"],
    },
    {
      name: "admin-mobile",
      use: { ...devices["Pixel 7"] },
      testMatch: /admin.*\.spec\.ts/,
      dependencies: ["desktop", "mobile"],
    },
  ],
  webServer: {
    // Tests run against the production build (`npm run build` first).
    command: `npx next start -p ${PORT}`,
    // Never send real email or upload to the real bucket from tests, even if .env.local has keys.
    // REVALIDATE_SECRET: lets admin specs refresh cached content after cleaning up (test value only).
    env: { BREVO_API_KEY: "", R2_ACCOUNT_ID: "", REVALIDATE_SECRET: E2E_REVALIDATE_SECRET },
    url: `http://127.0.0.1:${PORT}/en`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
