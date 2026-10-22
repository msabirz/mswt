import { createHmac, timingSafeEqual } from "node:crypto";

/** Webhooks older (or newer) than this are rejected as replays (SEC-08). */
export const WEBHOOK_TOLERANCE_MS = 5 * 60 * 1000;

/** Cashfree's scheme: base64(HMAC-SHA256(timestamp + rawBody, secret)). */
export function signWebhook(timestamp: string, rawBody: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(timestamp + rawBody)
    .digest("base64");
}

export function verifySignedWebhook(
  rawBody: string,
  headers: Headers,
  secret: string,
  now: Date = new Date(),
): boolean {
  const signature = headers.get("x-webhook-signature");
  const timestamp = headers.get("x-webhook-timestamp");
  if (!signature || !timestamp || !/^\d{10,13}$/.test(timestamp)) return false;
  // Cashfree sends milliseconds; accept seconds too.
  const ms = timestamp.length === 13 ? Number(timestamp) : Number(timestamp) * 1000;
  if (Math.abs(now.getTime() - ms) > WEBHOOK_TOLERANCE_MS) return false;
  const expected = Buffer.from(signWebhook(timestamp, rawBody, secret));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
