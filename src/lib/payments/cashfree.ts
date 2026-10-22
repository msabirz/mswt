import { z } from "zod";
import { parseCashfreeWebhook } from "./cashfree-events";
import {
  paiseToRupeeAmount,
  rupeeAmountToPaise,
  type CreateOrderInput,
  type FetchedOrder,
  type OrderStatus,
  type PaymentProvider,
} from "./provider";
import { verifySignedWebhook } from "./signature";

const API_VERSION = "2025-01-01";
// Domestic instruments only: credit/debit cards, UPI, net banking, wallets. International cards and
// PayPal must also stay disabled on the Cashfree account (SEC-12, open-questions B2).
const PAYMENT_METHODS = "cc,dc,upi,nb,app";

const OrderResponse = z.object({
  order_id: z.string(),
  cf_order_id: z.union([z.string(), z.number()]).transform(String),
  order_status: z.string(),
  order_amount: z.union([z.number(), z.string()]),
  order_currency: z.string(),
  payment_session_id: z.string().optional(),
});
const Payments = z.array(
  z.object({
    cf_payment_id: z.union([z.string(), z.number()]).transform(String),
    payment_status: z.string(),
    payment_group: z.string().nullish(),
  }),
);

const STATUS: Record<string, OrderStatus> = {
  ACTIVE: "active",
  PAID: "paid",
  EXPIRED: "expired",
  TERMINATED: "failed",
  TERMINATION_REQUESTED: "failed",
};

export class CashfreeProvider implements PaymentProvider {
  readonly name = "cashfree" as const;
  private readonly base: string;

  constructor(
    private readonly appId: string,
    private readonly secretKey: string,
    readonly mode: "sandbox" | "production",
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.base = mode === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
  }

  private async call(path: string, init?: RequestInit): Promise<unknown> {
    const res = await this.fetchImpl(`${this.base}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        "x-api-version": API_VERSION,
        "x-client-id": this.appId,
        "x-client-secret": this.secretKey,
      },
      cache: "no-store",
    });
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const message = (body as { message?: string } | null)?.message ?? res.statusText;
      throw new Error(`Cashfree ${init?.method ?? "GET"} ${path} failed (${res.status}): ${message}`);
    }
    return body;
  }

  async createOrder(input: CreateOrderInput) {
    const order = OrderResponse.parse(
      await this.call("/orders", {
        method: "POST",
        body: JSON.stringify({
          order_id: input.orderId,
          order_amount: paiseToRupeeAmount(input.amountPaise),
          order_currency: "INR",
          customer_details: {
            customer_id: input.customer.id,
            customer_name: input.customer.name,
            customer_email: input.customer.email,
            customer_phone: input.customer.phone,
          },
          order_meta: {
            return_url: input.returnUrl,
            notify_url: input.notifyUrl,
            payment_methods: PAYMENT_METHODS,
          },
          order_note: input.note,
        }),
      }),
    );
    if (!order.payment_session_id) throw new Error("Cashfree returned no payment_session_id");
    return { providerOrderId: order.cf_order_id, paymentSessionId: order.payment_session_id };
  }

  async getOrder(orderId: string): Promise<FetchedOrder> {
    const id = encodeURIComponent(orderId);
    const order = OrderResponse.parse(await this.call(`/orders/${id}`));
    const result: FetchedOrder = {
      orderId: order.order_id,
      status: STATUS[order.order_status] ?? "active",
      amountPaise: rupeeAmountToPaise(order.order_amount),
      currency: order.order_currency,
    };
    if (result.status === "paid") {
      const paid = Payments.parse(await this.call(`/orders/${id}/payments`)).find(
        (p) => p.payment_status === "SUCCESS",
      );
      if (paid) result.payment = { id: paid.cf_payment_id, method: paid.payment_group ?? null };
    }
    return result;
  }

  verifyWebhook(rawBody: string, headers: Headers, now?: Date): boolean {
    return verifySignedWebhook(rawBody, headers, this.secretKey, now);
  }

  parseWebhook(rawBody: string) {
    return parseCashfreeWebhook(rawBody);
  }
}
