import { and, eq, isNull } from "drizzle-orm";
import type { Locale } from "@/i18n/routing";
import { db } from "@/lib/db/client";
import { causeTranslations, donations, receipts } from "@/lib/db/schema";
import { receiptLinkQuery } from "@/lib/receipts/links";

export type DonationStatus =
  | { status: "not_found" }
  | { status: "pending" | "failed" }
  | {
      status: "paid";
      amountPaise: number;
      receiptNumber: string | null;
      receiptUrl: string | null;
      emailed: boolean;
      /** 80G receipt or acknowledgement; null until the receipt is issued. */
      kind: "80g" | "acknowledgement" | null;
      /** The cause's public title in the page's language; null for the general fund (or untranslated). */
      cause: string | null;
      /** When the payment was received (ISO), shown as a date in IST. */
      receivedAt: string | null;
    };

/** What the thank-you page may show. Only the random order id is needed; no personal data leaves. */
export async function donationStatus(orderId: string, locale: Locale = "en"): Promise<DonationStatus> {
  if (!/^MSWT-[A-Za-z0-9_-]{16}$/.test(orderId)) return { status: "not_found" };
  const [row] = await db
    .select({
      status: donations.status,
      total: donations.totalPaise,
      number: receipts.number,
      kind: receipts.kind,
      emailedAt: receipts.emailedAt,
      receivedAt: donations.receivedAt,
      cause: causeTranslations.title,
    })
    .from(donations)
    // The live receipt only: a corrected donation also has voided ones (Step 8b).
    .leftJoin(receipts, and(eq(receipts.donationId, donations.id), isNull(receipts.voidedAt)))
    .leftJoin(
      causeTranslations,
      and(eq(causeTranslations.causeId, donations.causeId), eq(causeTranslations.locale, locale)),
    )
    .where(eq(donations.publicOrderId, orderId))
    .limit(1);
  if (!row) return { status: "not_found" };
  if (row.status === "paid" || row.status === "refunded")
    return {
      status: "paid",
      amountPaise: row.total,
      receiptNumber: row.number,
      receiptUrl: row.number ? `/api/receipts/${orderId}?${receiptLinkQuery(orderId)}` : null,
      emailed: Boolean(row.emailedAt),
      kind: row.kind ?? null,
      cause: row.cause ?? null,
      receivedAt: row.receivedAt?.toISOString() ?? null,
    };
  if (row.status === "failed" || row.status === "expired") return { status: "failed" };
  return { status: "pending" };
}
