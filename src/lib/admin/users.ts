import { and, eq, gt, isNull, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { recordAudit, type Actor } from "@/lib/audit";
import { encryptPii } from "@/lib/crypto/pii";
import { userTokens, users } from "@/lib/db/schema";
import { db } from "@/lib/db/client";
import { withTx, type Tx } from "@/lib/db/tx";
import { hashPassword, passwordProblem, verifyPassword, type PasswordProblem } from "@/lib/auth/password";
import { hashRecoveryCodes, newRecoveryCodes, verifyTotp } from "@/lib/auth/totp";
import { hashLinkToken, newLinkToken } from "@/lib/auth/signed";
import { ROLES, type AdminRole } from "./permissions";

// All user changes go through here: validated, in one transaction, with an audit entry (SEC-10).
// Secrets (password hashes, TOTP, recovery codes) never go into the audit log.

export const LINK_TTL_HOURS = 72;
export class UserError extends Error {
  constructor(
    readonly code:
      | "exists"
      | "self"
      | "not_found"
      | "last_super_admin"
      | "token"
      | "password"
      | "current_password"
      | "code",
    readonly detail?: PasswordProblem,
  ) {
    super(code);
  }
}

const safe = (u: typeof users.$inferSelect) => ({
  email: u.email,
  name: u.name,
  role: u.role,
  isActive: u.isActive,
  twoFactor: Boolean(u.totpSecretEnc),
});

export const InviteInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z
    .email()
    .max(200)
    .transform((e) => e.toLowerCase()),
  role: z.enum(ROLES),
});

async function issueToken(tx: Tx, userId: string, kind: "invite" | "reset", actorId: string | null) {
  // A new link replaces any unused one of the same kind.
  await tx
    .update(userTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(userTokens.userId, userId), eq(userTokens.kind, kind), isNull(userTokens.usedAt)));
  const { token, hash } = newLinkToken();
  await tx.insert(userTokens).values({
    userId,
    kind,
    tokenHash: hash,
    expiresAt: new Date(Date.now() + LINK_TTL_HOURS * 3600_000),
    createdBy: actorId,
  });
  return token;
}

/** Creates the user (no password yet) and returns the one-time invite token for the link. */
export async function inviteUser(input: z.input<typeof InviteInput>, actor: Actor) {
  const d = InviteInput.parse(input);
  return withTx(async (tx) => {
    const [existing] = await tx
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.email}) = ${d.email}`);
    if (existing) throw new UserError("exists");
    const [user] = await tx
      .insert(users)
      .values({ ...d, passwordHash: null })
      .returning();
    const token = await issueToken(tx, user!.id, "invite", actor.userId);
    await recordAudit(tx, actor, {
      action: "user.invite",
      entityType: "user",
      entityId: user!.id,
      after: safe(user!),
    });
    return { userId: user!.id, token };
  });
}

async function otherUser(tx: Tx, userId: string, actor: Actor) {
  if (userId === actor.userId) throw new UserError("self");
  const [user] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
  if (!user) throw new UserError("not_found");
  return user;
}

async function assertNotLastSuperAdmin(tx: Tx, user: typeof users.$inferSelect) {
  if (user.role !== "super_admin" || !user.isActive) return;
  const [row] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(users)
    .where(and(eq(users.role, "super_admin"), eq(users.isActive, true), ne(users.id, user.id)));
  if ((row?.n ?? 0) === 0) throw new UserError("last_super_admin");
}

export async function setRole(userId: string, role: AdminRole, actor: Actor) {
  z.enum(ROLES).parse(role);
  await withTx(async (tx) => {
    const user = await otherUser(tx, userId, actor);
    if (role !== "super_admin") await assertNotLastSuperAdmin(tx, user);
    const [after] = await tx
      .update(users)
      .set({ role, sessionVersion: user.sessionVersion + 1, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    await recordAudit(tx, actor, {
      action: "user.role",
      entityType: "user",
      entityId: userId,
      before: safe(user),
      after: safe(after!),
    });
  });
}

export async function setActive(userId: string, active: boolean, actor: Actor) {
  await withTx(async (tx) => {
    const user = await otherUser(tx, userId, actor);
    if (!active) await assertNotLastSuperAdmin(tx, user);
    const [after] = await tx
      .update(users)
      .set({ isActive: active, sessionVersion: user.sessionVersion + 1, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    await recordAudit(tx, actor, {
      action: active ? "user.reactivate" : "user.deactivate",
      entityType: "user",
      entityId: userId,
      before: safe(user),
      after: safe(after!),
    });
  });
}

/** Clears 2FA: the user must set it up again at next login. Ends their sessions. */
export async function resetTwoFactor(userId: string, actor: Actor) {
  await withTx(async (tx) => {
    const user = await otherUser(tx, userId, actor);
    await tx
      .update(users)
      .set({
        totpSecretEnc: null,
        totpEnabledAt: null,
        totpLastStep: null,
        recoveryCodesHash: null,
        sessionVersion: user.sessionVersion + 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    await recordAudit(tx, actor, { action: "user.2fa_reset", entityType: "user", entityId: userId });
  });
}

/** One-time password-reset link (or a fresh invite link if they never set a password). */
export async function createResetLink(
  userId: string,
  actor: Actor,
): Promise<{ token: string; kind: "invite" | "reset" }> {
  return withTx(async (tx) => {
    const user = await otherUser(tx, userId, actor);
    const kind = user.passwordHash ? "reset" : "invite";
    const token = await issueToken(tx, user.id, kind, actor.userId);
    await recordAudit(tx, actor, { action: `user.${kind}_link`, entityType: "user", entityId: userId });
    return { token, kind };
  });
}

/** The user behind a valid, unused, unexpired link (or null). */
export async function linkUser(token: string, kind: "invite" | "reset") {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const [row] = await db
    .select({ user: users, tokenId: userTokens.id })
    .from(userTokens)
    .innerJoin(users, eq(users.id, userTokens.userId))
    .where(
      and(
        eq(userTokens.tokenHash, hashLinkToken(token)),
        eq(userTokens.kind, kind),
        isNull(userTokens.usedAt),
        gt(userTokens.expiresAt, new Date()),
        eq(users.isActive, true),
      ),
    );
  return row ?? null;
}

/** Sets the password from an invite or reset link; the link can't be used again. */
export async function setPasswordFromLink(token: string, kind: "invite" | "reset", password: string) {
  const found = await linkUser(token, kind);
  if (!found) throw new UserError("token");
  const problem = passwordProblem(password, [found.user.email, found.user.name]);
  if (problem) throw new UserError("password", problem);
  const passwordHash = await hashPassword(password);
  await withTx(async (tx) => {
    const used = await tx
      .update(userTokens)
      .set({ usedAt: new Date() })
      .where(and(eq(userTokens.id, found.tokenId), isNull(userTokens.usedAt)))
      .returning({ id: userTokens.id });
    if (!used.length) throw new UserError("token");
    await tx
      .update(users)
      .set({
        passwordHash,
        failedLogins: 0,
        lockedUntil: null,
        sessionVersion: found.user.sessionVersion + 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, found.user.id));
    await recordAudit(
      tx,
      { userId: found.user.id },
      {
        action: kind === "invite" ? "user.invite_accepted" : "user.password_reset",
        entityType: "user",
        entityId: found.user.id,
      },
    );
  });
  return found.user.email;
}

export async function changeOwnPassword(userId: string, current: string, next: string) {
  await withTx(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
    if (!user) throw new UserError("not_found");
    if (!(await verifyPassword(user.passwordHash, current))) throw new UserError("current_password");
    const problem = passwordProblem(next, [user.email, user.name]);
    if (problem) throw new UserError("password", problem);
    await tx
      .update(users)
      .set({ passwordHash: await hashPassword(next), updatedAt: new Date() })
      .where(eq(users.id, userId));
    await recordAudit(
      tx,
      { userId },
      { action: "user.password_change", entityType: "user", entityId: userId },
    );
  });
}

/** Saves a confirmed authenticator and returns 10 recovery codes (shown once). */
export async function enrolTwoFactor(userId: string, secretBase32: string, code: string): Promise<string[]> {
  const step = verifyTotp(secretBase32, code, null);
  if (step === null) throw new UserError("code");
  const codes = newRecoveryCodes();
  const hashes = await hashRecoveryCodes(codes);
  await withTx(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
    if (!user || !user.isActive) throw new UserError("not_found");
    if (user.totpSecretEnc) throw new UserError("code"); // already set up
    await tx
      .update(users)
      .set({
        totpSecretEnc: encryptPii(secretBase32),
        totpEnabledAt: new Date(),
        totpLastStep: step,
        recoveryCodesHash: hashes,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    await recordAudit(tx, { userId }, { action: "user.2fa_enrolled", entityType: "user", entityId: userId });
  });
  return codes;
}

export async function regenerateRecoveryCodes(userId: string): Promise<string[]> {
  const codes = newRecoveryCodes();
  const hashes = await hashRecoveryCodes(codes);
  await withTx(async (tx) => {
    await tx
      .update(users)
      .set({ recoveryCodesHash: hashes, updatedAt: new Date() })
      .where(eq(users.id, userId));
    await recordAudit(
      tx,
      { userId },
      { action: "user.recovery_codes", entityType: "user", entityId: userId },
    );
  });
  return codes;
}
