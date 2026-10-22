import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { recordAudit, type Actor } from "@/lib/audit";
import { db } from "@/lib/db/client";
import { paymentSettings } from "@/lib/db/schema";
import type { Tx } from "@/lib/db/tx";

export type PaymentSettings = typeof paymentSettings.$inferSelect;
export const PAYMENT_SETTINGS_TAG = "settings:payment";

/** Hard floor: the minimum must be above ₹5 (owner decision, 2026-10-22). */
export const MIN_AMOUNT_FLOOR_PAISE = 500;

const paise = z.number().int().positive();
export const PaymentSettingsInput = z
  .object({
    minAmountPaise: paise.gt(MIN_AMOUNT_FLOOR_PAISE, "The minimum must be above ₹5"),
    maxAmountPaise: paise.nullable(),
    presetAmountsPaise: z.array(paise).min(3).max(4),
    feeCoverEnabled: z.boolean(),
    feeCoverPercentBp: z.number().int().min(0).max(1000),
  })
  .superRefine((s, ctx) => {
    if (s.maxAmountPaise !== null && s.maxAmountPaise < s.minAmountPaise)
      ctx.addIssue({ code: "custom", path: ["maxAmountPaise"], message: "Maximum is below the minimum" });
    s.presetAmountsPaise.forEach((p, i) => {
      if (p < s.minAmountPaise || (s.maxAmountPaise !== null && p > s.maxAmountPaise))
        ctx.addIssue({ code: "custom", path: ["presetAmountsPaise", i], message: "Outside min/max" });
    });
    if (new Set(s.presetAmountsPaise).size !== s.presetAmountsPaise.length)
      ctx.addIssue({ code: "custom", path: ["presetAmountsPaise"], message: "Duplicate amounts" });
    if (s.feeCoverEnabled && s.feeCoverPercentBp === 0)
      ctx.addIssue({ code: "custom", path: ["feeCoverPercentBp"], message: "Set the fee percentage" });
  });
export type PaymentSettingsInput = z.infer<typeof PaymentSettingsInput>;

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
