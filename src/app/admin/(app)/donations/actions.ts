"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ReceiptError, reissueReceipt, resendReceipt, voidReceipt } from "@/lib/admin/donations";
import { requireCapability } from "@/lib/admin/guard";
import { recordOfflineDonation, OfflineDonationInput } from "@/lib/donations/offline";
import { rupeesToPaise } from "@/lib/money";
import { clientIp } from "@/lib/security/rate-limit";
import { formValues, issuesToErrors, type FormState } from "@/components/admin/form-state";

async function actor() {
  const admin = await requireCapability("receipts.manage");
  const h = await headers();
  return { userId: admin.id, ip: clientIp(h), userAgent: h.get("user-agent") };
}

const MESSAGES: Record<ReceiptError["code"], string> = {
  not_found: "That receipt or donation no longer exists.",
  not_paid: "Only paid donations have receipts.",
  voided: "This receipt is already void.",
  other_fy: "Receipts can only be reissued in the same financial year as the donation.",
  pan: "An 80G receipt needs the donor's PAN.",
  reason: "Give a reason (at least 5 characters).",
};
const fail = (error: unknown, values?: Record<string, string>): FormState => {
  if (error instanceof ReceiptError)
    return { status: "error", errors: { form: MESSAGES[error.code] }, values };
  throw error;
};

export async function resendAction(
  receiptId: string,
  donationId: string,
  _prev: FormState,
): Promise<FormState> {
  const a = await actor();
  try {
    await resendReceipt(receiptId, a);
  } catch (error) {
    if (error instanceof ReceiptError) return fail(error);
    console.error("Resend failed", error);
    return { status: "error", errors: { form: "The email could not be sent. Check the email settings." } };
  }
  revalidatePath(`/admin/donations/${donationId}`);
  return { status: "saved", message: "Receipt emailed again." };
}

export async function voidAction(
  receiptId: string,
  donationId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const a = await actor();
  try {
    await voidReceipt(receiptId, String(form.get("reason") ?? ""), a);
  } catch (error) {
    return fail(error, formValues(form));
  }
  revalidatePath(`/admin/donations/${donationId}`);
  return { status: "saved", message: "Receipt voided. Its number is kept." };
}

export async function reissueAction(
  donationId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const a = await actor();
  const v = formValues(form);
  const wants80g = v.wants80g === "on";
  const hasAddress = Boolean(v.line1 || v.city || v.state || v.pincode);
  const input = {
    name: v.name ?? "",
    wants80g,
    pan: v.pan?.trim() ? v.pan : null,
    address: hasAddress
      ? {
          line1: v.line1 ?? "",
          line2: v.line2 || undefined,
          city: v.city ?? "",
          state: v.state ?? "",
          pincode: v.pincode ?? "",
        }
      : null,
    reason: v.reason ?? "",
  };
  try {
    const { number } = await reissueReceipt(donationId, input, a);
    revalidatePath(`/admin/donations/${donationId}`);
    return { status: "saved", message: `New receipt ${number} issued and emailed; the old one is void.` };
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error)
      return {
        status: "error",
        errors: Object.fromEntries(
          Object.entries(
            issuesToErrors((error as { issues: { path: PropertyKey[]; message: string }[] }).issues),
          ).map(([k, m]) => [k.replace(/^address\./, ""), m]),
        ),
        values: v,
      };
    return fail(error, v);
  }
}

export async function offlineAction(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireCapability("donations.offline");
  const h = await headers();
  const v = formValues(form);
  let amountPaise = 0;
  try {
    amountPaise = rupeesToPaise(v.amount ?? "");
  } catch {
    return { status: "error", errors: { amount: "Enter an amount in rupees" }, values: v };
  }
  const hasAddress = Boolean(v.line1 || v.city || v.state || v.pincode);
  const parsed = OfflineDonationInput.safeParse({
    name: v.name,
    email: v.email,
    phone: v.phone,
    pan: v.pan?.trim() ? v.pan : null,
    address: hasAddress
      ? { line1: v.line1, line2: v.line2 || undefined, city: v.city, state: v.state, pincode: v.pincode }
      : null,
    amountPaise,
    causeId: v.causeId || null,
    mode: v.mode,
    instrumentRef: v.instrumentRef || null,
    instrumentDate: v.instrumentDate || null,
    bankName: v.bankName || null,
    receivedAt: v.receivedAt ? `${v.receivedAt}T12:00:00+05:30` : undefined,
    wants80g: v.wants80g === "on",
    notes: v.notes || null,
  });
  if (!parsed.success) {
    const errors = issuesToErrors(parsed.error.issues);
    return {
      status: "error",
      errors: Object.fromEntries(
        Object.entries(errors).map(([k, m]) => [
          k.replace(/^address\./, "").replace("amountPaise", "amount"),
          m,
        ]),
      ),
      values: v,
    };
  }
  const result = await recordOfflineDonation(parsed.data, {
    userId: admin.id,
    ip: clientIp(h),
    userAgent: h.get("user-agent"),
  });
  redirect(`/admin/donations/${result.donationId}?created=1`);
}
