"use server";

import { actorFor } from "@/lib/admin/actor";
import { MessageUpdateInput, updateMessage } from "@/lib/admin/messages";
import { formValues, issuesToErrors, type FormState } from "@/components/admin/form-state";

export async function updateMessageAction(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const { actor } = await actorFor("messages.write");
  const v = formValues(form);
  const parsed = MessageUpdateInput.safeParse({ status: v.status, assignedTo: v.assignedTo ?? "" });
  if (!parsed.success) return { status: "error", errors: issuesToErrors(parsed.error.issues), values: v };
  try {
    await updateMessage(id, parsed.data, actor);
  } catch (error) {
    return { status: "error", errors: { assignedTo: (error as Error).message }, values: v };
  }
  return { status: "saved", message: "Message updated." };
}
