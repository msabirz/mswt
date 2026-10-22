import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { donations, receipts } from "@/lib/db/schema";
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
    };

/** What the thank-you page may show. Only the random order id is needed; no personal data leaves. */
export async function donationStatus(orderId: string): Promise<DonationStatus> {
  if (!/^MSWT-[A-Za-z0-9_-]{16}$/.test(orderId)) return { status: "not_found" };
  const [row] = await db
    .select({
      status: donations.status,
      total: donations.totalPaise,
      number: receipts.number,
      emailedAt: receipts.emailedAt,
    })
    .from(donations)
    .leftJoin(receipts, eq(receipts.donationId, donations.id))
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
    };
  if (row.status === "failed" || row.status === "expired") return { status: "failed" };
  return { status: "pending" };
}
