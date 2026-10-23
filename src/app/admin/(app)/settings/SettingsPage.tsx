import type { ReactNode } from "react";
import { AdminForm } from "@/components/admin/AdminForm";
import { PageHeader } from "@/components/admin/ui";
import type { FormSectionSpec, FormState } from "@/components/admin/form-state";

/** Shared frame for the settings pages: header, then the form in settings-style sections. */
export function SettingsPage({
  title,
  intro,
  id,
  action,
  sections,
  aside,
}: {
  title: string;
  intro: ReactNode;
  id: string;
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  sections: FormSectionSpec[];
  aside?: ReactNode;
}) {
  return (
    <>
      <PageHeader title={title} description={intro} />
      {aside}
      <AdminForm id={id} action={action} sections={sections} submitLabel="Save changes" sticky />
    </>
  );
}

export const LOCALE_FIELDS = [
  { code: "en", name: "English", lang: "en" },
  { code: "hi", name: "Hindi", lang: "hi" },
  { code: "mr", name: "Marathi", lang: "mr" },
  { code: "gu", name: "Gujarati", lang: "gu" },
] as const;
