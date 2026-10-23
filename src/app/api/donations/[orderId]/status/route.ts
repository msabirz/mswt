import { routing } from "@/i18n/routing";
import { donationStatus } from "@/lib/donations/status";

export const dynamic = "force-dynamic";

/** Polled by the thank-you page. Reads only; payment state changes come from the webhook. */
export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const asked = new URL(request.url).searchParams.get("locale");
  const locale = routing.locales.find((l) => l === asked) ?? routing.defaultLocale;
  const result = await donationStatus(orderId, locale);
  return Response.json(result, {
    status: result.status === "not_found" ? 404 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
