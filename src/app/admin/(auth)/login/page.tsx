import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Alert } from "@/components/ui/Alert";
import { AdminForm } from "@/components/admin/AdminForm";
import { AuthCard } from "../AuthCard";
import { loginAction } from "../actions";

export const metadata: Metadata = { title: "Sign in" };
type Props = { searchParams: Promise<Record<string, string | undefined>> };

const NOTICES: Record<string, string> = {
  expired: "Your sign-in took too long. Please start again.",
  password: "Your password is set. Sign in to continue.",
  "signed-out": "You have signed out.",
};

export default async function LoginPage({ searchParams }: Props) {
  if ((await auth())?.user) redirect("/admin");
  const params = await searchParams;
  const notice = Object.keys(NOTICES).find((k) => params[k]);
  return (
    <AuthCard title="Sign in to the admin" lead="MS Welfare Trust staff only.">
      {notice ? (
        <Alert tone="info">
          <p>{NOTICES[notice]}</p>
        </Alert>
      ) : null}
      <AdminForm
        columns={1}
        id="login"
        action={loginAction}
        submitLabel="Continue"
        pendingLabel="Checking…"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "username", required: true },
          {
            name: "password",
            label: "Password",
            type: "password",
            autoComplete: "current-password",
            required: true,
          },
        ]}
      />
    </AuthCard>
  );
}
