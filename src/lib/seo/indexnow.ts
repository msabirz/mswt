import { siteUrl } from "./site";

export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
export const INDEXNOW_KEY_PATH = "/indexnow-key.txt";

export type IndexNowResult =
  { sent: false; reason: "not-production" | "no-key" | "no-urls" } | { sent: true; status: number };

/**
 * Tell Bing (and other IndexNow engines) that URLs changed. Runs only in production with a key set
 * in SEO settings (SEO-16). Called after content is published (Steps 6/8). Never throws.
 */
export async function pingIndexNow(
  urls: string[],
  {
    key,
    vercelEnv = process.env.VERCEL_ENV,
    fetchImpl = fetch,
  }: { key: string | null | undefined; vercelEnv?: string; fetchImpl?: typeof fetch },
): Promise<IndexNowResult> {
  if (vercelEnv !== "production") return { sent: false, reason: "not-production" };
  if (!key) return { sent: false, reason: "no-key" };
  if (urls.length === 0) return { sent: false, reason: "no-urls" };
  const origin = siteUrl();
  try {
    const res = await fetchImpl(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: origin.hostname,
        key,
        keyLocation: new URL(INDEXNOW_KEY_PATH, origin).toString(),
        urlList: urls.slice(0, 10000),
      }),
    });
    return { sent: true, status: res.status };
  } catch (error) {
    console.error("IndexNow ping failed", error);
    return { sent: true, status: 0 };
  }
}
