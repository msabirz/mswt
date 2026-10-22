"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireCapability } from "@/lib/admin/guard";
import { ROLES, type AdminRole } from "@/lib/admin/permissions";
import {
  createResetLink,
  inviteUser,
  InviteInput,
  resetTwoFactor,
  setActive,
  setRole,
  UserError,
} from "@/lib/admin/users";
import { clientIp } from "@/lib/security/rate-limit";
import { formValues, issuesToErrors, type FormState } from "@/components/admin/form-state";

const MESSAGES: Record<UserError["code"], string> = {
  exists: "A user with this email already exists.",
  self: "You can't change your own account here. Use My account.",
  not_found: "That user no longer exists.",
  last_super_admin: "There must always be at least one active Super Admin.",
  token: "The link is not valid.",
  password: "The password is not allowed.",
  current_password: "Your current password is not right.",
  code: "The code is not right.",
};

async function actor() {
  const admin = await requireCapability("users.manage");
  const h = await headers();
  return { admin, actor: { userId: admin.id, ip: clientIp(h), userAgent: h.get("user-agent") } };
}

async function linkUrl(kind: "invite" | "reset", token: string) {
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("x-forwarded-host") ?? h.get("host")}/admin/${kind}/${token}`;
}

function fail(error: unknown, values?: Record<string, string>): FormState {
  if (error instanceof UserError) return { status: "error", errors: { form: MESSAGES[error.code] }, values };
  throw error;
}

export async function inviteAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { actor: a } = await actor();
  const values = formValues(form);
  const parsed = InviteInput.safeParse(values);
  if (!parsed.success) return { status: "error", errors: issuesToErrors(parsed.error.issues), values };
  try {
    const { token } = await inviteUser(parsed.data, a);
    revalidatePath("/admin/users");
    return {
      status: "saved",
      message: `Invited. Send this one-time link to ${parsed.data.email} (valid for 72 hours): ${await linkUrl("invite", token)}`,
    };
  } catch (error) {
    return fail(error, values);
  }
}

export async function roleAction(userId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const { actor: a } = await actor();
  const role = String(form.get("role")) as AdminRole;
  if (!(ROLES as readonly string[]).includes(role))
    return { status: "error", errors: { role: "Choose a role" } };
  try {
    await setRole(userId, role, a);
    revalidatePath("/admin/users");
    return { status: "saved", message: "Role changed. Their current sessions have ended." };
  } catch (error) {
    return fail(error);
  }
}

export async function activeAction(userId: string, active: boolean, _prev?: FormState): Promise<FormState> {
  const { actor: a } = await actor();
  try {
    await setActive(userId, active, a);
    revalidatePath("/admin/users");
    return {
      status: "saved",
      message: active ? "Account reactivated." : "Account deactivated and signed out.",
    };
  } catch (error) {
    return fail(error);
  }
}

export async function resetTwoFactorAction(userId: string, _prev?: FormState): Promise<FormState> {
  const { actor: a } = await actor();
  try {
    await resetTwoFactor(userId, a);
    return {
      status: "saved",
      message: "Two-step verification reset. They will set it up again at their next sign-in.",
    };
  } catch (error) {
    return fail(error);
  }
}

export async function resetLinkAction(userId: string, _prev?: FormState): Promise<FormState> {
  const { actor: a } = await actor();
  try {
    const { token, kind } = await createResetLink(userId, a);
    return {
      status: "saved",
      message: `Send this one-time link to the user (valid for 72 hours): ${await linkUrl(kind, token)}`,
    };
  } catch (error) {
    return fail(error);
  }
}
