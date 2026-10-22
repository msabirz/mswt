import { donationStatus } from "@/lib/donations/status";

export const dynamic = "force-dynamic";

/** Polled by the thank-you page. Reads only; payment state changes come from the webhook. */
export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const result = await donationStatus(orderId);
  return Response.json(result, {
    status: result.status === "not_found" ? 404 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
