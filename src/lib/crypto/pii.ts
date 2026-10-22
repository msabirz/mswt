import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { serverEnv } from "@/env/server";
import { secret } from "@/lib/secrets";

// PAN (and later TOTP secrets) are encrypted at rest with AES-256-GCM (SEC-11).
// Stored format: "v1:" + base64(iv[12] | tag[16] | ciphertext).
const DEV_KEY = Buffer.alloc(32, 7).toString("base64");

function key(): Buffer {
  const k = Buffer.from(secret("PII_ENCRYPTION_KEY", serverEnv.PII_ENCRYPTION_KEY, DEV_KEY), "base64");
  if (k.length !== 32) throw new Error("PII_ENCRYPTION_KEY must be 32 bytes, base64-encoded");
  return k;
}

export function encryptPii(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `v1:${Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64")}`;
}

export function decryptPii(stored: string): string {
  if (!stored.startsWith("v1:")) throw new Error("Unknown PII ciphertext version");
  const raw = Buffer.from(stored.slice(3), "base64");
  const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
}

/** Keyed hash for finding the same PAN again without decrypting every row. */
export function piiLookupHash(value: string): string {
  return createHmac("sha256", key()).update(`pan:${value}`).digest("hex");
}

/** "XXXXXX234F": the last 4 characters only, for display (SEC-11). */
export function maskPan(last4: string | null | undefined): string {
  return last4 ? `XXXXXX${last4}` : "";
}

/**
 * decryptPii for display: a value that can't be decrypted (wrong or rotated PII_ENCRYPTION_KEY)
 * shows a placeholder and is logged, instead of failing the whole page or export.
 */
export function decryptPiiForDisplay(stored: string): string {
  try {
    return decryptPii(stored);
  } catch (error) {
    console.error("PII value could not be decrypted (check PII_ENCRYPTION_KEY)", (error as Error).message);
    return "[can't be decrypted]";
  }
}
