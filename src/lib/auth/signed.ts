import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/env/server";
import { secret } from "@/lib/secrets";

// Small HMAC-signed values (login challenge cookie, sign-in ticket) and one-time link tokens.
const DEV_SECRET = "development-only-auth-secret-0000000000000000";
export const authSecret = () => secret("AUTH_SECRET", serverEnv.AUTH_SECRET, DEV_SECRET);

export function signValue<T extends object>(
  purpose: string,
  payload: T,
  ttlSeconds: number,
  now = Date.now(),
): string {
  const body = Buffer.from(JSON.stringify({ ...payload, p: purpose, exp: now + ttlSeconds * 1000 })).toString(
    "base64url",
  );
  const sig = createHmac("sha256", authSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readSignedValue<T extends object>(
  purpose: string,
  value: string | undefined | null,
  now = Date.now(),
): T | null {
  if (!value) return null;
  const [body, sig] = value.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(createHmac("sha256", authSecret()).update(body).digest("base64url"));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as T & { p: string; exp: number };
    if (data.p !== purpose || data.exp < now) return null;
    return data;
  } catch {
    return null;
  }
}

/** Random one-time token for invite/reset links; only its SHA-256 is stored. */
export function newLinkToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashLinkToken(token) };
}

export const hashLinkToken = (token: string) => createHash("sha256").update(token).digest("hex");
