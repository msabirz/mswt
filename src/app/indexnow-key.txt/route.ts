import { getSeoSettings } from "@/lib/settings";

// IndexNow key file (public by design). 404 until a key is set in SEO settings.
export async function GET() {
  const key = (await getSeoSettings())?.indexnowKey;
  if (!key) return new Response("Not found", { status: 404 });
  return new Response(key, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
