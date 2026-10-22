import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { ROLE_LABELS } from "@/lib/admin/permissions";
import { AdminForm } from "@/components/admin/AdminForm";
import { changePasswordAction, recoveryCodesAction } from "./actions";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const admin = await requireAdmin();
  return (
    <div className="grid max-w-2xl gap-10">
      <div className="grid gap-1">
        <h1 className="text-3xl">My account</h1>
        <p className="text-fg-muted">
          {admin.name} · {admin.email} · {ROLE_LABELS[admin.role]}
        </p>
      </div>
      <section aria-labelledby="pw-h" className="grid gap-4">
        <h2 id="pw-h" className="text-xl">
          Change password
        </h2>
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
            },
            {
              name: "current",
              label: "Current password",
              type: "password",
              autoComplete: "current-password",
              required: true,
            },
            {
              name: "next",
              label: "New password",
              type: "password",
              autoComplete: "new-password",
              required: true,
              hint: "At least 12 characters. A few random words work well.",
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
      </section>
      <section aria-labelledby="rc-h" className="grid gap-4">
        <h2 id="rc-h" className="text-xl">
          Recovery codes
        </h2>
        <p>Used up or lost your recovery codes? Make a new set. The old ones stop working.</p>
        <AdminForm
          id="rc"
          action={recoveryCodesAction}
          submitLabel="Make new recovery codes"
          confirm="Make new recovery codes? Your old ones will stop working."
          fields={[]}
        />
      </section>
    </div>
  );
}
