import { cookies, headers } from "next/headers";
import { readSignedValue, signValue } from "./signed";

// The signed, short-lived cookie between the password step and the 2FA step (no session yet).
export const CHALLENGE_COOKIE = "mswt_admin_challenge";
const CHALLENGE = "admin-challenge";
export type Challenge = { uid: string; sv: number; setup?: string };

export async function setChallenge(value: Challenge, ttlSeconds: number) {
  const h = await headers();
  (await cookies()).set(CHALLENGE_COOKIE, signValue(CHALLENGE, value, ttlSeconds), {
    httpOnly: true,
    sameSite: "lax",
    secure: (h.get("x-forwarded-proto") ?? "http") === "https",
    path: "/admin",
    maxAge: ttlSeconds,
  });
}

export async function readChallenge(): Promise<Challenge | null> {
  return readSignedValue<Challenge>(CHALLENGE, (await cookies()).get(CHALLENGE_COOKIE)?.value);
}
