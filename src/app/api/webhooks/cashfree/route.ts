import { handlePaymentWebhook } from "@/lib/donations/webhook";
import { getPaymentProvider } from "@/lib/payments";
import { MemoryRateLimiter } from "@/lib/security/memory-limit";
import { clientIp } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

// Per-IP cap (SEC-03). Generous: Cashfree delivers from a few IPs and retries on 429.
const limiter = new MemoryRateLimiter(300, 60_000);

/** Cashfree payment + refund webhooks. The raw body is read once and verified before parsing. */
export async function POST(request: Request) {
  if (limiter.limited(clientIp(request.headers) ?? "unknown"))
    return Response.json({ ok: false, error: "rate" }, { status: 429, headers: { "Retry-After": "60" } });
  const raw = await request.text();
  const { status, body } = await handlePaymentWebhook(getPaymentProvider(), raw, request.headers);
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
