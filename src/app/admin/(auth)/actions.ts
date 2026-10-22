"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut, SIGN_IN_TICKET } from "@/auth";
import { checkPassword, checkSecondFactor } from "@/lib/auth/login";
import { signValue } from "@/lib/auth/signed";
import { CHALLENGE_COOKIE, readChallenge, setChallenge, type Challenge } from "@/lib/auth/challenge";
import { newTotpSecret } from "@/lib/auth/totp";
import { enrolTwoFactor, setPasswordFromLink, UserError } from "@/lib/admin/users";
import { MemoryRateLimiter } from "@/lib/security/memory-limit";
import { clientIp } from "@/lib/security/rate-limit";
import { formValues, type FormState } from "@/components/admin/form-state";

// Sign-in steps (SEC-09). The password step only issues a short-lived signed challenge cookie;
// a session exists only after the second factor.
const ipLimiter = new MemoryRateLimiter(30, 15 * 60_000);

async function rateLimited(): Promise<boolean> {
  return ipLimiter.limited(clientIp(await headers()) ?? "unknown");
}

const LOCKED = "Too many attempts. This account is locked for 15 minutes.";

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formValues(form);
  delete values.password;
  if (await rateLimited())
    return { status: "error", errors: { form: "Too many attempts from here. Try again later." }, values };
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password)
    return {
      status: "error",
      errors: {
        ...(email ? {} : { email: "Enter your email" }),
        ...(password ? {} : { password: "Enter your password" }),
      },
      values,
    };
  const result = await checkPassword(email, password);
  if (!result.ok)
    return {
      status: "error",
      errors: { form: result.error === "locked" ? LOCKED : "Email or password is incorrect." },
      values,
    };
  if (result.needsSetup) {
    await setChallenge({ uid: result.userId, sv: result.sessionVersion, setup: newTotpSecret() }, 15 * 60);
    redirect("/admin/2fa/setup");
  }
  await setChallenge({ uid: result.userId, sv: result.sessionVersion }, 5 * 60);
  redirect("/admin/2fa");
}

async function startSession(challenge: Challenge) {
  (await cookies()).delete({ name: CHALLENGE_COOKIE, path: "/admin" });
  const ticket = signValue(SIGN_IN_TICKET, { uid: challenge.uid, sv: challenge.sv }, 60);
  await signIn("credentials", { ticket, redirectTo: "/admin" });
}

export async function verifyCodeAction(_prev: FormState, form: FormData): Promise<FormState> {
  const challenge = await readChallenge();
  if (!challenge || challenge.setup) redirect("/admin/login?expired=1");
  if (await rateLimited())
    return { status: "error", errors: { form: "Too many attempts from here. Try again later." } };
  const code = String(form.get("code") ?? "");
  if (!code.trim())
    return { status: "error", errors: { code: "Enter the code from your authenticator app" } };
  const result = await checkSecondFactor(challenge.uid, code);
  if (!result.ok)
    return {
      status: "error",
      errors: { code: result.error === "locked" ? LOCKED : "That code is not right. Try the newest code." },
    };
  await startSession(challenge);
  return { status: "saved" };
}

export type SetupState = FormState & { recoveryCodes?: string[] };

export async function confirmSetupAction(_prev: SetupState, form: FormData): Promise<SetupState> {
  const challenge = await readChallenge();
  if (!challenge?.setup) redirect("/admin/login?expired=1");
  try {
    const recoveryCodes = await enrolTwoFactor(
      challenge.uid,
      challenge.setup,
      String(form.get("code") ?? ""),
    );
    // Recovery codes are shown once; the challenge now only allows starting the session.
    await setChallenge({ uid: challenge.uid, sv: challenge.sv }, 10 * 60);
    return { status: "saved", recoveryCodes };
  } catch (error) {
    if (error instanceof UserError && error.code === "code")
      return {
        status: "error",
        errors: { code: "That code is not right. Check the time on your phone and try the newest code." },
      };
    throw error;
  }
}

export async function finishSetupAction(): Promise<void> {
  const challenge = await readChallenge();
  if (!challenge || challenge.setup) redirect("/admin/login?expired=1");
  await startSession(challenge);
}

const PROBLEM: Record<string, string> = {
  short: "Use at least 12 characters.",
  long: "Use at most 200 characters.",
  common: "That password is too easy to guess.",
  personal: "Don't use your name or email in the password.",
};

const PasswordForm = z
  .object({ token: z.string(), password: z.string(), confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "The passwords don't match" });

export async function setPasswordAction(
  kind: "invite" | "reset",
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = PasswordForm.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error", errors: { confirm: "The passwords don't match" } };
  try {
    await setPasswordFromLink(parsed.data.token, kind, parsed.data.password);
  } catch (error) {
    if (error instanceof UserError && error.code === "password")
      return { status: "error", errors: { password: PROBLEM[error.detail ?? "short"]! } };
    if (error instanceof UserError && error.code === "token")
      return {
        status: "error",
        errors: { form: "This link has expired or was already used. Ask a Super Admin for a new one." },
      };
    throw error;
  }
  redirect("/admin/login?password=set");
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/admin/login?signed-out=1" });
}
