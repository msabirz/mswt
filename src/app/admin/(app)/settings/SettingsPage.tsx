import type { ReactNode } from "react";
import { AdminForm } from "@/components/admin/AdminForm";
import type { FieldSpec, FormState } from "@/components/admin/form-state";

/** Shared frame for the settings pages: heading, explanation, form. */
export function SettingsPage({
  title,
  intro,
  id,
  action,
  fields,
  aside,
}: {
  title: string;
  intro: ReactNode;
  id: string;
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  fields: FieldSpec[];
  aside?: ReactNode;
}) {
  return (
    <div className="grid max-w-4xl gap-8">
      <div className="grid gap-2">
        <h1 className="text-3xl">{title}</h1>
        <div className="text-fg-muted">{intro}</div>
      </div>
      {aside}
      <AdminForm id={id} action={action} fields={fields} submitLabel="Save" />
    </div>
  );
}

export const LOCALE_FIELDS = [
  { code: "en", name: "English", lang: "en" },
  { code: "hi", name: "Hindi", lang: "hi" },
  { code: "mr", name: "Marathi", lang: "mr" },
  { code: "gu", name: "Gujarati", lang: "gu" },
] as const;
