import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { CONTENT_TAG } from "@/lib/content/source";
import { PAYMENT_SETTINGS_TAG } from "@/lib/payment-settings";
import { SETTINGS_TAGS } from "@/lib/settings";
import { pingIndexNow } from "@/lib/seo/indexnow";
import { getSeoSettings } from "@/lib/settings";

const ALLOWED_TAGS = [
  CONTENT_TAG,
  SETTINGS_TAGS.seo,
  SETTINGS_TAGS.organization,
  PAYMENT_SETTINGS_TAG,
] as const;
const Body = z.object({
  tags: z.array(z.enum(ALLOWED_TAGS)).min(1),
  urls: z.array(z.url()).max(1000).optional(),
});

function authorised(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Refreshes cached content/settings after a write (content:sync now, the admin from Step 8) and
 * tells IndexNow about changed URLs in production. Protected by REVALIDATE_SECRET.
 */
export async function POST(request: Request) {
  if (!authorised(request.headers.get("x-revalidate-secret"), process.env.REVALIDATE_SECRET)) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid body" }, { status: 400 });
  for (const tag of parsed.data.tags) revalidateTag(tag, "max");
  const indexNow = parsed.data.urls?.length
    ? await pingIndexNow(parsed.data.urls, { key: (await getSeoSettings())?.indexnowKey })
    : { sent: false as const, reason: "no-urls" as const };
  return Response.json({ revalidated: parsed.data.tags, indexNow });
}
