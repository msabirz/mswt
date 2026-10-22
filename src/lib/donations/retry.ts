import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { donations } from "@/lib/db/schema";
import { getPaymentProvider, type PaymentProvider } from "@/lib/payments";

export type RetryResult =
  | {
      status: "checkout";
      orderId: string;
      sessionId: string;
      provider: "cashfree" | "fake";
      mode: "sandbox" | "production";
    }
  | { status: "paid" }
  | { status: "expired" };

/**
 * Another payment attempt for the same donation, so the donor never re-enters their details
 * (WCAG 3.3.7). Cashfree keeps an order open after a failed attempt until it expires; the same
 * payment session is reused, and the webhook still decides whether it was paid.
 */
export async function retryCheckout(
  orderId: string,
  provider: PaymentProvider = getPaymentProvider(),
): Promise<RetryResult> {
  if (!/^MSWT-[A-Za-z0-9_-]{16}$/.test(orderId)) return { status: "expired" };
  const [d] = await db.select().from(donations).where(eq(donations.publicOrderId, orderId)).limit(1);
  if (!d || d.mode !== "online" || !d.paymentSessionId || d.provider !== provider.name)
    return { status: "expired" };
  if (d.status === "paid" || d.status === "refunded") return { status: "paid" };
  if (d.status === "expired") return { status: "expired" };
  const order = await provider.getOrder(orderId).catch(() => null);
  if (order?.status === "paid") return { status: "paid" };
  if (order?.status !== "active") return { status: "expired" };
  await db
    .update(donations)
    .set({ status: "pending", updatedAt: new Date() })
    .where(and(eq(donations.id, d.id), inArray(donations.status, ["created", "pending", "failed"])));
  return {
    status: "checkout",
    orderId,
    sessionId: d.paymentSessionId,
    provider: provider.name,
    mode: provider.mode,
  };
}
