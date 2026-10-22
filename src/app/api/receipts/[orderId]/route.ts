import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { donations, receipts } from "@/lib/db/schema";
import { ensureReceiptPdf, receiptFilename } from "@/lib/donations/deliver";
import { verifyReceiptLink } from "@/lib/receipts/links";
import { getReceiptStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store, private" };

/** Receipt download behind a signed, expiring link (SEC-11): redirects to a 10-minute R2 URL. */
export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const url = new URL(request.url);
  if (!verifyReceiptLink(orderId, url.searchParams.get("e"), url.searchParams.get("t")))
    return new Response("This receipt link is invalid or has expired.", { status: 403, headers: NO_STORE });

  const [row] = await db
    .select({ id: receipts.id, number: receipts.number })
    .from(receipts)
    .innerJoin(donations, eq(donations.id, receipts.donationId))
    .where(eq(donations.publicOrderId, orderId))
    .limit(1);
  if (!row) return new Response("Receipt not found.", { status: 404, headers: NO_STORE });

  let key: string;
  try {
    key = await ensureReceiptPdf(row.id);
  } catch (error) {
    console.error(`Receipt ${row.number} could not be generated`, error);
    return new Response("Your receipt is being prepared. Please try again later.", {
      status: 503,
      headers: { ...NO_STORE, "Retry-After": "3600" },
    });
  }
  const storage = getReceiptStorage();
  const filename = receiptFilename(row.number);
  const signed = await storage.signedUrl(key, filename);
  if (signed) return new Response(null, { status: 302, headers: { ...NO_STORE, Location: signed } });
  return new Response(Buffer.from(await storage.get(key)), {
    headers: {
      ...NO_STORE,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
