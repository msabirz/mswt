"use server";

import { and, count, eq, gt, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { routing, type Locale } from "@/i18n/routing";
import { db } from "@/lib/db/client";
import { donations } from "@/lib/db/schema";
import { createOnlineDonation, DonationClosedError } from "@/lib/donations/create";
import { validateDonation, type DonateErrorCode, type DonateField } from "@/lib/donations/schema";
import { donationsEnabled } from "@/lib/flags";
import { getPaymentSettingsFresh } from "@/lib/payment-settings";
import { clientIp, hashIp } from "@/lib/security/rate-limit";
import { verifyTurnstile } from "@/lib/security/turnstile";

export type DonateState =
  | { status: "idle" }
  | {
      status: "error";
      errors: Partial<Record<DonateField | "form", DonateErrorCode>>;
      values: Record<string, string>;
    }
  | {
      status: "checkout";
      orderId: string;
      sessionId: string;
      provider: "cashfree" | "fake";
      mode: "sandbox" | "production";
    };

// Many Indian mobile users share one IP (carrier-grade NAT), so the IP limit is loose and a
// tighter per-email limit stops one person retrying in a loop.
const MAX_ORDERS_PER_IP_HOUR = 30;
const MAX_ORDERS_PER_EMAIL_HOUR = 10;
const FIELDS = [
  "preset",
  "custom",
  "cause",
  "name",
  "email",
  "phone",
  "pan",
  "line1",
  "line2",
  "city",
  "state",
  "pincode",
];
const FLAGS = ["wants80g", "anonymous", "coverFee", "citizen"];

/**
 * Donate form: validate on the server, verify Turnstile, rate-limit by hashed IP, store the
 * donation and open the gateway order. The client then hands the session to Cashfree's checkout.
 */
export async function startDonation(_prev: DonateState, form: FormData): Promise<DonateState> {
  const values = Object.fromEntries([...FIELDS, ...FLAGS].map((k) => [k, String(form.get(k) ?? "")]));
  const localeRaw = String(form.get("locale") ?? "en");
  const locale: Locale = (routing.locales as readonly string[]).includes(localeRaw)
    ? (localeRaw as Locale)
    : "en";
  if (!donationsEnabled()) return { status: "error", errors: { form: "closed" }, values };

  const settings = await getPaymentSettingsFresh();
  if (!settings) return { status: "error", errors: { form: "server" }, values };
  // A typed amount wins over the preset buttons; presets are paise, typed amounts rupees.
  const amount = values.custom?.trim() || (values.preset ? String(Number(values.preset) / 100) : "");
  const parsed = validateDonation(settings, { ...values, amount });
  if (!parsed.ok) return { status: "error", errors: parsed.errors, values };

  const h = await headers();
  const ip = clientIp(h);
  // The widget writes its own token field; take the first one that has a value.
  const token = form.getAll("cf-turnstile-response").map(String).find(Boolean) ?? "";
  if (!(await verifyTurnstile(token, ip))) return { status: "error", errors: { form: "captcha" }, values };

  try {
    const ipHash = hashIp(ip);
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const [byIp] = await db
      .select({ n: count() })
      .from(donations)
      .where(and(eq(donations.ipHash, ipHash), gt(donations.createdAt, since)));
    const [byEmail] = await db
      .select({ n: count() })
      .from(donations)
      .where(
        and(
          sql`lower(${donations.emailSnapshot}) = lower(${parsed.data.email})`,
          gt(donations.createdAt, since),
        ),
      );
    if ((byIp?.n ?? 0) >= MAX_ORDERS_PER_IP_HOUR || (byEmail?.n ?? 0) >= MAX_ORDERS_PER_EMAIL_HOUR)
      return { status: "error", errors: { form: "rate" }, values };

    const proto = h.get("x-forwarded-proto") ?? "http";
    const origin = `${proto}://${h.get("x-forwarded-host") ?? h.get("host")}`;
    const created = await createOnlineDonation(parsed.data, { settings, locale, ipHash, origin });
    return {
      status: "checkout",
      orderId: created.publicOrderId,
      sessionId: created.paymentSessionId,
      provider: created.provider,
      mode: created.mode,
    };
  } catch (error) {
    if (error instanceof DonationClosedError) return { status: "error", errors: { cause: "closed" }, values };
    console.error("Donation could not be started", error);
    return { status: "error", errors: { form: "server" }, values };
  }
}
