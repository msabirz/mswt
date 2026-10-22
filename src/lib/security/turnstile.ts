// Cloudflare Turnstile. Dev/preview use Cloudflare's official always-pass test keys; production
// must have real keys in Vercel env (NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY).
export const TEST_SITE_KEY = "1x00000000000000000000AA";
const TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const production = () => process.env.VERCEL_ENV === "production";

export function turnstileSiteKey(): string | null {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || (production() ? null : TEST_SITE_KEY);
}

function secretKey(): string | null {
  return process.env.TURNSTILE_SECRET_KEY || (production() ? null : TEST_SECRET_KEY);
}

/** Verify a Turnstile token on the server (SEC-04). Fails closed on any error. */
export async function verifyTurnstile(
  token: string,
  remoteIp: string | null,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const secret = secretKey();
  if (!secret || !token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);
    const res = await fetchImpl(VERIFY_URL, { method: "POST", body });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
