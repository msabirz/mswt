import { serverEnv } from "@/env/server";
import { getPaymentProvider } from "@/lib/payments";
import { FakeProvider } from "@/lib/payments/fake";
import { isProduction } from "@/lib/secrets";

export const dynamic = "force-dynamic";

// Stand-in for Cashfree's checkout page when PAYMENT_PROVIDER=fake (tests, local work without
// Cashfree keys). Never served in production or when Cashfree is the active provider.
function enabled(): boolean {
  if (isProduction() || serverEnv.VERCEL_ENV === "production") return false;
  try {
    return getPaymentProvider().name === "fake";
  } catch {
    return false;
  }
}
const notFound = () => new Response("Not found", { status: 404 });
const ORDER_RE = /^MSWT-[A-Za-z0-9_-]{16}$/;

const OUTCOMES = {
  pay: "Pay (webhook now)",
  "pay-delayed": "Pay (webhook after 4 s)",
  "pay-duplicate": "Pay (webhook sent twice)",
  "pay-no-webhook": "Pay (no webhook: reconciliation must find it)",
  fail: "Fail the payment",
} as const;

export async function GET(request: Request) {
  if (!enabled()) return notFound();
  const order = new URL(request.url).searchParams.get("order") ?? "";
  if (!ORDER_RE.test(order) || !FakeProvider.order(order)) return notFound();
  const buttons = Object.entries(OUTCOMES)
    .map(([value, label]) => `<button name="outcome" value="${value}">${label}</button>`)
    .join("\n");
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Fake payment gateway</title></head>
<body><main><h1>Fake payment gateway</h1><p>Test order <code>${order}</code>. Nothing is charged.</p>
<form method="post"><input type="hidden" name="order" value="${order}">${buttons}</form></main></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!enabled()) return notFound();
  const form = await request.formData();
  const order = String(form.get("order") ?? "");
  const outcome = String(form.get("outcome") ?? "") as keyof typeof OUTCOMES;
  if (!ORDER_RE.test(order) || !FakeProvider.order(order) || !(outcome in OUTCOMES)) return notFound();

  const hook = FakeProvider.settle(order, outcome === "fail" ? "failed" : "paid");
  const webhookUrl = new URL("/api/webhooks/cashfree", request.url);
  const deliver = () => fetch(webhookUrl, { method: "POST", headers: hook.headers, body: hook.body });
  if (outcome === "pay" || outcome === "fail") await deliver();
  if (outcome === "pay-duplicate") await Promise.all([deliver(), deliver()]);
  if (outcome === "pay-delayed") setTimeout(() => void deliver(), 4000);
  // The browser returns to the thank-you page, which never changes the payment status itself.
  return new Response(null, {
    status: 303,
    headers: { Location: new URL(hook.returnUrl).pathname + new URL(hook.returnUrl).search },
  });
}
