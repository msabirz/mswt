"use server";

import { requireAdmin } from "@/lib/admin/guard";
import { changeOwnPassword, regenerateRecoveryCodes, UserError } from "@/lib/admin/users";
import type { FormState } from "@/components/admin/form-state";

const PROBLEM: Record<string, string> = {
  short: "Use at least 12 characters.",
  long: "Use at most 200 characters.",
  common: "That password is too easy to guess.",
  personal: "Don't use your name or email in the password.",
};

export async function changePasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const next = String(form.get("next") ?? "");
  if (next !== String(form.get("confirm") ?? ""))
    return { status: "error", errors: { confirm: "The new passwords don't match" } };
  try {
    await changeOwnPassword(admin.id, String(form.get("current") ?? ""), next);
    return { status: "saved", message: "Password changed." };
  } catch (error) {
    if (error instanceof UserError && error.code === "current_password")
      return { status: "error", errors: { current: "Your current password is not right" } };
    if (error instanceof UserError && error.code === "password")
      return { status: "error", errors: { next: PROBLEM[error.detail ?? "short"]! } };
    throw error;
  }
}

export async function recoveryCodesAction(_prev: FormState): Promise<FormState> {
  const admin = await requireAdmin();
  const codes = await regenerateRecoveryCodes(admin.id);
  return {
    status: "saved",
    message: `New recovery codes (your old ones no longer work). Save them now; they are not shown again: ${codes.join("  ")}`,
  };
}
