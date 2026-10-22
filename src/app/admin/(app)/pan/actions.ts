"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireCapability } from "@/lib/admin/guard";
import { PanAccessError, requestPanCode, verifyPanCode } from "@/lib/admin/pan-access";
import { clientIp } from "@/lib/security/rate-limit";
import type { FormState } from "@/components/admin/form-state";

async function actor() {
  const admin = await requireCapability("donations.view");
  const h = await headers();
  return { admin, actor: { userId: admin.id, ip: clientIp(h), userAgent: h.get("user-agent") } };
}

const MESSAGES: Record<PanAccessError["code"], string> = {
  rate: "Too many codes requested. Try again in an hour.",
  invalid: "That code is not right.",
  expired: "The code has expired. Ask for a new one.",
  attempts: "Too many wrong codes. Ask for a new one.",
};

export async function requestPanCodeAction(_prev: FormState): Promise<FormState> {
  const { admin, actor: a } = await actor();
  try {
    await requestPanCode(admin.id, a);
    return {
      status: "saved",
      message: `We emailed a 6-digit code to ${admin.email}. It expires in 10 minutes.`,
    };
  } catch (error) {
    if (error instanceof PanAccessError) return { status: "error", errors: { form: MESSAGES[error.code] } };
    console.error("PAN code email failed", error);
    return {
      status: "error",
      errors: { form: "The code email could not be sent. Check the email settings." },
    };
  }
}

export async function verifyPanCodeAction(
  path: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const { admin, actor: a } = await actor();
  try {
    await verifyPanCode(admin.id, String(form.get("code") ?? ""), a);
  } catch (error) {
    if (error instanceof PanAccessError) return { status: "error", errors: { code: MESSAGES[error.code] } };
    throw error;
  }
  revalidatePath(path);
  return { status: "saved", message: "Full PANs are visible for 15 minutes." };
}
