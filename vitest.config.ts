import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    environment: "node",
    // Unit tests never touch a database; postgres.js connects lazily, so a dummy URL is enough to import modules.
    env: { DATABASE_URL: "postgres://test:test@127.0.0.1:5432/unit-tests-no-db" },
  },
});
