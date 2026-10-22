import { createHash } from "node:crypto";

export const MAX_MESSAGES_PER_HOUR = 5;

/** Salted hash of the sender's IP: enough to rate-limit, without storing the IP itself (DPDP). */
export function hashIp(ip: string | null, salt: string | undefined = process.env.IP_HASH_SALT): string {
  return createHash("sha256")
    .update(`${salt ?? "dev-only-salt"}:${ip ?? "unknown"}`)
    .digest("hex");
}

/** The client IP as seen by Vercel (first x-forwarded-for entry). */
export function clientIp(headers: Headers): string | null {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || null;
}

export function isRateLimited(recentCount: number): boolean {
  return recentCount >= MAX_MESSAGES_PER_HOUR;
}
