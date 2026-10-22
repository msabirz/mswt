import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readChallenge } from "@/lib/auth/challenge";
import { AdminForm } from "@/components/admin/AdminForm";
import { AuthCard } from "../AuthCard";
import { verifyCodeAction } from "../actions";

export const metadata: Metadata = { title: "Two-step verification" };

export default async function TwoFactorPage() {
  const challenge = await readChallenge();
  if (!challenge || challenge.setup) redirect("/admin/login?expired=1");
  return (
    <AuthCard
      title="Two-step verification"
      lead="Enter the 6-digit code from your authenticator app, or one of your recovery codes."
    >
      <AdminForm
        columns={1}
        id="totp"
        action={verifyCodeAction}
        submitLabel="Sign in"
        pendingLabel="Checking…"
        fields={[
          {
            name: "code",
            label: "Code",
            autoComplete: "one-time-code",
            inputMode: "text",
            required: true,
            maxLength: 20,
            hint: "6 digits, or a recovery code like abcde-fghjk",
          },
        ]}
      />
    </AuthCard>
  );
}
