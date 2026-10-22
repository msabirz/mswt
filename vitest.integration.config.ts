import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests that need a real, throwaway Postgres (CI service container, or `npm run db:local`).
// Never point DATABASE_URL at Neon for these: they write test donations.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 60_000,
    env: { PAYMENT_PROVIDER: "fake", R2_ACCOUNT_ID: "", BREVO_API_KEY: "", CASHFREE_APP_ID: "" },
  },
});
