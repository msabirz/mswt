"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DonorContactInput, mergeDonors, MergeError, updateDonorContact } from "@/lib/admin/donors";
import { requireCapability } from "@/lib/admin/guard";
import { clientIp } from "@/lib/security/rate-limit";
import { formValues, issuesToErrors, type FormState } from "@/components/admin/form-state";

async function actorFor(capability: "receipts.manage" | "donors.merge") {
  const admin = await requireCapability(capability);
  const h = await headers();
  return { userId: admin.id, ip: clientIp(h), userAgent: h.get("user-agent") };
}

export async function updateDonorAction(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const actor = await actorFor("receipts.manage");
  const v = formValues(form);
  const parsed = DonorContactInput.safeParse(v);
  if (!parsed.success) return { status: "error", errors: issuesToErrors(parsed.error.issues), values: v };
  await updateDonorContact(id, parsed.data, actor);
  revalidatePath(`/admin/donors/${id}`);
  return {
    status: "saved",
    message: "Donor details saved. Receipts already issued are unchanged.",
    values: v,
  };
}

export async function mergeDonorAction(
  sourceId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await actorFor("donors.merge");
  const target = String(form.get("target") ?? "").trim();
  const targetId = target.match(/[0-9a-f-]{36}/)?.[0];
  if (!targetId) return { status: "error", errors: { target: "Paste the other donor's page address or ID" } };
  try {
    await mergeDonors(sourceId, targetId, actor);
  } catch (error) {
    if (error instanceof MergeError) return { status: "error", errors: { form: error.message } };
    throw error;
  }
  redirect(`/admin/donors/${targetId}?merged=1`);
}
