import { randomBytes } from "node:crypto";
import { Secret, TOTP } from "otpauth";
import { hashPassword, verifyPassword } from "./password";

const PERIOD = 30;
const ISSUER = "MS Welfare Trust";

export function newTotpSecret(): string {
  return new Secret({ size: 20 }).base32;
}

function totp(secretBase32: string, label = "admin") {
  return new TOTP({
    issuer: ISSUER,
    label,
    algorithm: "SHA1",
    digits: 6,
    period: PERIOD,
    secret: Secret.fromBase32(secretBase32),
  });
}

/** otpauth:// URI for authenticator apps (shown as a QR code). */
export function totpUri(secretBase32: string, email: string): string {
  return totp(secretBase32, email).toString();
}

/**
 * Checks a 6-digit code, allowing one step of clock drift either way. Returns the time step it
 * matched so the caller can refuse it next time (no replay), or null.
 */
export function verifyTotp(
  secretBase32: string,
  code: string,
  lastStep: number | null,
  now: number = Date.now(),
): number | null {
  const token = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(token)) return null;
  const delta = totp(secretBase32).validate({ token, timestamp: now, window: 1 });
  if (delta === null) return null;
  const step = Math.floor(now / 1000 / PERIOD) + delta;
  if (lastStep !== null && step <= lastStep) return null;
  return step;
}

/** For tests and tooling: the current code. */
export const currentTotp = (secretBase32: string, now = Date.now()) =>
  totp(secretBase32).generate({ timestamp: now });

// ── Recovery codes ──────────────────────────────────────────────────────────────────────────
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function newRecoveryCodes(count = 10): string[] {
  return Array.from({ length: count }, () => {
    const bytes = randomBytes(10);
    const chars = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
    return `${chars.slice(0, 5)}-${chars.slice(5, 10)}`;
  });
}

export const hashRecoveryCodes = (codes: string[]) => Promise.all(codes.map((c) => hashPassword(c)));

/** Index of the matching (unused) recovery code, or -1. */
export async function matchRecoveryCode(code: string, hashes: string[]): Promise<number> {
  const normalised = code.trim().toLowerCase().replace(/\s/g, "");
  if (!/^[a-z0-9]{5}-[a-z0-9]{5}$/.test(normalised)) return -1;
  for (let i = 0; i < hashes.length; i++) if (await verifyPassword(hashes[i]!, normalised)) return i;
  return -1;
}
