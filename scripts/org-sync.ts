// Upserts organization_settings (the single row, id 1) from data/organization.json.
// The admin's Settings → Organization page does the same (Step 8a); this stays for seeding and CI.
// Usage: npm run org:sync            (validate + write to DATABASE_URL)
//        npm run org:sync -- --check (validate only; runs in CI)
import { readFileSync } from "node:fs";
import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });

const raw = JSON.parse(readFileSync("data/organization.json", "utf8"));
delete raw.$comment;
const { OrganizationInput } = await import("../src/lib/admin/settings/schemas");
const data = OrganizationInput.parse(raw);
if (process.argv.includes("--check")) {
  console.log("data/organization.json is valid.");
  process.exit(0);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (see .env.example).");
  process.exit(1);
}
// Same audited service as the admin's Settings → Organization page.
const { withTx } = await import("../src/lib/db/tx");
const { updateOrganization } = await import("../src/lib/admin/settings/service");
await withTx((tx) => updateOrganization(tx, data, { userId: null, userAgent: "org-sync" }));
console.log(
  `organization_settings updated on ${new URL(url).host}. Redeploy or revalidate "settings:organization" to publish.`,
);
process.exit(0);
