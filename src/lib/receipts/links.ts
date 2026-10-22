import { createHmac, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/env/server";
import { secret } from "@/lib/secrets";

// Signed, expiring receipt download links (SEC-11): /api/receipts/{orderId}?e={expiry}&t={hmac}.
export const RECEIPT_LINK_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DEV_SECRET = "development-only-receipt-link-secret-0000";

function sign(orderId: string, expires: number): string {
  const key = secret("RECEIPT_LINK_SECRET", serverEnv.RECEIPT_LINK_SECRET, DEV_SECRET);
  return createHmac("sha256", key).update(`receipt:${orderId}:${expires}`).digest("base64url");
}

export function receiptLinkQuery(orderId: string, now = Date.now()): string {
  const expires = now + RECEIPT_LINK_TTL_MS;
  return `e=${expires}&t=${sign(orderId, expires)}`;
}

export function verifyReceiptLink(
  orderId: string,
  e: string | null,
  t: string | null,
  now = Date.now(),
): boolean {
  if (!e || !t || !/^\d{13}$/.test(e)) return false;
  const expires = Number(e);
  if (expires < now) return false;
  const expected = Buffer.from(sign(orderId, expires));
  const given = Buffer.from(t);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
