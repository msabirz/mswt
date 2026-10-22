import { hash, verify } from "@node-rs/argon2";

// argon2id (SEC-09) with the library defaults (m=19 MiB, t=2, p=1: OWASP's minimum profile).
export const hashPassword = (password: string) => hash(password);

export async function verifyPassword(stored: string | null, password: string): Promise<boolean> {
  if (!stored) return false;
  try {
    return await verify(stored, password);
  } catch {
    return false;
  }
}

export const MIN_PASSWORD_LENGTH = 12;
const COMMON = new Set(
  [
    "password1234",
    "123456789012",
    "qwertyuiopas",
    "iloveyou1234",
    "welcome12345",
    "admin1234567",
    "passwordpassword",
    "mswelfaretrust",
    "muniraShoaib",
    "letmein12345",
    "1234567890ab",
    "abcdefghijkl",
  ].map((p) => p.toLowerCase()),
);

export type PasswordProblem = "short" | "long" | "common" | "personal";

/** NIST 800-63B style: length, no common or personal passwords, no composition rules. */
export function passwordProblem(password: string, personal: string[] = []): PasswordProblem | null {
  if (password.length < MIN_PASSWORD_LENGTH) return "short";
  if (password.length > 200) return "long";
  const lower = password.toLowerCase();
  if (COMMON.has(lower) || /^(.)\1+$/.test(password)) return "common";
  for (const p of personal) {
    const v = p.toLowerCase().split("@")[0]?.trim();
    if (v && v.length >= 4 && lower.includes(v)) return "personal";
  }
  return null;
}
