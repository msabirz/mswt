import type { Metadata } from "next";
import { linkUser } from "@/lib/admin/users";
import { Alert } from "@/components/ui/Alert";
import { AdminForm } from "@/components/admin/AdminForm";
import { AuthCard } from "../../AuthCard";
import { setPasswordAction } from "../../actions";

export const metadata: Metadata = { title: "Choose a new password" };
type Props = { params: Promise<{ token: string }> };

export default async function Page({ params }: Props) {
  const { token } = await params;
  const found = await linkUser(token, "reset");
  if (!found)
    return (
      <AuthCard title="This link has expired">
        <Alert tone="warning">
          <p>The link was already used or is more than 72 hours old. Ask a Super Admin for a new one.</p>
        </Alert>
      </AuthCard>
    );
  return (
    <AuthCard
      title="Choose a new password"
      lead={`For ${found.user.email}. Then you will set up two-step verification.`}
    >
      <AdminForm
        id="password"
        action={setPasswordAction.bind(null, "reset")}
        hidden={{ token }}
        submitLabel="Save password"
        fields={[
          {
            name: "username",
            label: "Email",
            type: "email",
            autoComplete: "username",
            defaultValue: found.user.email,
            readOnly: true,
            hint: "For your password manager",
          },
          {
            name: "password",
            label: "New password",
            type: "password",
            autoComplete: "new-password",
            required: true,
            hint: "At least 12 characters. A few random words work well.",
          },
          {
            name: "confirm",
            label: "Repeat the password",
            type: "password",
            autoComplete: "new-password",
            required: true,
          },
        ]}
      />
    </AuthCard>
  );
}
