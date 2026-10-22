import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { recordAudit, type Actor } from "@/lib/audit";
import { db } from "@/lib/db/client";
import { paymentSettings } from "@/lib/db/schema";
import type { Tx } from "@/lib/db/tx";
import { PaymentSettingsInput } from "./payment-settings-input";

export { MIN_AMOUNT_FLOOR_PAISE, PaymentSettingsInput } from "./payment-settings-input";

export type PaymentSettings = typeof paymentSettings.$inferSelect;
export const PAYMENT_SETTINGS_TAG = "settings:payment";

const read = async (): Promise<PaymentSettings | null> =>
  (await db.select().from(paymentSettings).limit(1))[0] ?? null;

export const getPaymentSettings = unstable_cache(read, ["settings-payment"], {
  tags: [PAYMENT_SETTINGS_TAG],
});

/** Uncached read for server actions that must use the current limits. */
export const getPaymentSettingsFresh = read;

/** The only write path for payment settings (admin, settings-sync): validated and audited. */
export async function updatePaymentSettings(
  tx: Tx,
  input: PaymentSettingsInput,
  actor: Actor,
): Promise<void> {
  const data = PaymentSettingsInput.parse(input);
  const [before] = await tx.select().from(paymentSettings).where(eq(paymentSettings.id, 1)).for("update");
  const row = {
    ...data,
    presetAmountsPaise: [...data.presetAmountsPaise].sort((a, b) => a - b),
    updatedBy: actor.userId,
    updatedAt: new Date(),
  };
  await tx.update(paymentSettings).set(row).where(eq(paymentSettings.id, 1));
  await recordAudit(tx, actor, {
    action: "settings.payment.update",
    entityType: "payment_settings",
    entityId: "1",
    before,
    after: row,
  });
}
