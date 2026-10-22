// Applies data/payment-settings.json to payment_settings through the same validated, audited
// service the admin will use (Step 8). Usage: npm run settings:sync  |  npm run settings:sync -- --check
import { readFileSync } from "node:fs";
import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });

const raw = JSON.parse(readFileSync("data/payment-settings.json", "utf8"));
delete raw.$comment;
const { PaymentSettingsInput } = await import("../src/lib/payment-settings-input");
const data = PaymentSettingsInput.parse(raw);
if (process.argv.includes("--check")) {
  console.log("data/payment-settings.json is valid.");
  process.exit(0);
}
const { withTx } = await import("../src/lib/db/tx");
const { updatePaymentSettings } = await import("../src/lib/payment-settings");
await withTx((tx) => updatePaymentSettings(tx, data, { userId: null, userAgent: "settings-sync" }));
console.log(
  `payment_settings updated on ${new URL(process.env.DATABASE_URL ?? "").host}. Revalidate "settings:payment" to publish.`,
);
process.exit(0);
