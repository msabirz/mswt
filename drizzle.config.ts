import { defineConfig } from "drizzle-kit";

// Used only for `npm run db:generate` (writes SQL to drizzle/). Never use `drizzle-kit push`.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  strict: true,
  verbose: true,
});
