import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { decryptPii } from "@/lib/crypto/pii";
import { matchRecoveryCode, verifyTotp } from "./totp";
import { verifyPassword } from "./password";

export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

export type AdminUser = typeof users.$inferSelect;

// A real hash, so that unknown emails take as long as wrong passwords (no user enumeration).
const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$HFf2m8XMtO0VY1gVRTuzfA$ateTelwDxb0KkW4XO3VYm3kt69jXe51vVoNTzCOhoS8";

export type PasswordStep =
  | { ok: true; userId: string; sessionVersion: number; needsSetup: boolean }
  | { ok: false; error: "invalid" | "locked" };

/** First factor. Five failures lock the account for 15 minutes (spec §5). */
export async function checkPassword(
  email: string,
  password: string,
  now = new Date(),
): Promise<PasswordStep> {
  const [user] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = lower(${email.trim()})`)
    .limit(1);
  if (!user || !user.isActive || !user.passwordHash) {
    await verifyPassword(DUMMY_HASH, password);
    return { ok: false, error: "invalid" };
  }
  if (user.lockedUntil && user.lockedUntil > now) return { ok: false, error: "locked" };
  if (!(await verifyPassword(user.passwordHash, password))) {
    const failed = (user.lockedUntil && user.lockedUntil <= now ? 0 : user.failedLogins) + 1;
    await db
      .update(users)
      .set({
        failedLogins: failed >= MAX_FAILED_LOGINS ? 0 : failed,
        lockedUntil:
          failed >= MAX_FAILED_LOGINS ? new Date(now.getTime() + LOCK_MINUTES * 60_000) : user.lockedUntil,
      })
      .where(eq(users.id, user.id));
    return { ok: false, error: failed >= MAX_FAILED_LOGINS ? "locked" : "invalid" };
  }
  await db.update(users).set({ failedLogins: 0, lockedUntil: null }).where(eq(users.id, user.id));
  return { ok: true, userId: user.id, sessionVersion: user.sessionVersion, needsSetup: !user.totpSecretEnc };
}

/**
 * Second factor: a TOTP code (no reuse) or a one-time recovery code. Failures count towards the
 * same lockout as passwords.
 */
export async function checkSecondFactor(
  userId: string,
  code: string,
  now = new Date(),
): Promise<{ ok: true; usedRecoveryCode: boolean } | { ok: false; error: "invalid" | "locked" }> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !user.isActive || !user.totpSecretEnc) return { ok: false, error: "invalid" };
  if (user.lockedUntil && user.lockedUntil > now) return { ok: false, error: "locked" };

  const step = verifyTotp(decryptPii(user.totpSecretEnc), code, user.totpLastStep, now.getTime());
  if (step !== null) {
    // Conditional update: two requests racing with the same code can't both succeed.
    const updated = await db
      .update(users)
      .set({ totpLastStep: step, failedLogins: 0, lastLoginAt: now })
      .where(and(eq(users.id, userId), sql`coalesce(${users.totpLastStep}, -1) < ${step}`))
      .returning({ id: users.id });
    if (updated.length) return { ok: true, usedRecoveryCode: false };
  } else {
    const hashes = user.recoveryCodesHash ?? [];
    const index = await matchRecoveryCode(code, hashes);
    if (index >= 0) {
      await db
        .update(users)
        .set({ recoveryCodesHash: hashes.filter((_, i) => i !== index), failedLogins: 0, lastLoginAt: now })
        .where(eq(users.id, userId));
      return { ok: true, usedRecoveryCode: true };
    }
  }
  const failed = user.failedLogins + 1;
  await db
    .update(users)
    .set({
      failedLogins: failed >= MAX_FAILED_LOGINS ? 0 : failed,
      lockedUntil:
        failed >= MAX_FAILED_LOGINS ? new Date(now.getTime() + LOCK_MINUTES * 60_000) : user.lockedUntil,
    })
    .where(eq(users.id, userId));
  return { ok: false, error: failed >= MAX_FAILED_LOGINS ? "locked" : "invalid" };
}

/** The signed-in user if the session is still valid (active, same session version, 2FA on). */
export async function activeUser(userId: string, sessionVersion: number): Promise<AdminUser | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !user.isActive || user.sessionVersion !== sessionVersion || !user.totpSecretEnc) return null;
  return user;
}
