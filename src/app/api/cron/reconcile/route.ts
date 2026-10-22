import { timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/env/server";
import { reconcile } from "@/lib/donations/reconcile";
import { secret } from "@/lib/secrets";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Vercel Cron (vercel.json, 03:00 IST). Vercel sends "Authorization: Bearer $CRON_SECRET". */
export async function GET(request: Request) {
  const expected = Buffer.from(
    `Bearer ${secret("CRON_SECRET", serverEnv.CRON_SECRET, "development-cron-secret")}`,
  );
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  if (given.length !== expected.length || !timingSafeEqual(given, expected))
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  const result = await reconcile();
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
