import { retryCheckout } from "@/lib/donations/retry";

export const dynamic = "force-dynamic";

/** "Try again" on the thank-you page: reopens checkout for the same donation. */
export async function POST(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const result = await retryCheckout(orderId);
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
