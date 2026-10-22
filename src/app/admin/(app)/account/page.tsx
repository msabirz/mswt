import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { ROLE_LABELS } from "@/lib/admin/permissions";
import { AdminForm } from "@/components/admin/AdminForm";
import { Card, PageHeader, Section } from "@/components/admin/ui";
import { changePasswordAction, recoveryCodesAction } from "./actions";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const admin = await requireAdmin();
  return (
    <>
      <PageHeader
        title="My account"
        description={`${admin.name} · ${admin.email} · ${ROLE_LABELS[admin.role]}`}
      />
      <Card>
        <Section id="pw" title="Password" description="At least 12 characters. A few random words work well.">
          <AdminForm
            id="pw"
            action={changePasswordAction}
            submitLabel="Change password"
            fields={[
              {
                name: "username",
                label: "Email",
                type: "email",
                autoComplete: "username",
                defaultValue: admin.email,
                readOnly: true,
                span: "full",
              },
              {
                name: "current",
                label: "Current password",
                type: "password",
                autoComplete: "current-password",
                required: true,
                span: "full",
              },
              {
                name: "next",
                label: "New password",
                type: "password",
                autoComplete: "new-password",
                required: true,
              },
              {
                name: "confirm",
                label: "Repeat the new password",
                type: "password",
                autoComplete: "new-password",
                required: true,
              },
            ]}
          />
        </Section>
        <Section
          id="rc"
          title="Recovery codes"
          description="Used up or lost them? Make a new set; the old ones stop working."
        >
          <AdminForm
            id="rc"
            action={recoveryCodesAction}
            submitLabel="Make new recovery codes"
            variant="secondary"
            confirm="Make new recovery codes? Your old ones will stop working."
            fields={[]}
          />
        </Section>
      </Card>
    </>
  );
}
