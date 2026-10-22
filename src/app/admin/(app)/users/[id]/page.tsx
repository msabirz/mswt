import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireCapability } from "@/lib/admin/guard";
import { ROLE_LABELS, ROLES } from "@/lib/admin/permissions";
import { db } from "@/lib/db/client";
import { auditLog, users } from "@/lib/db/schema";
import { AdminForm } from "@/components/admin/AdminForm";
import { Alert } from "@/components/ui/Alert";
import { TextLink } from "@/components/ui/TextLink";
import { activeAction, resetLinkAction, resetTwoFactorAction, roleAction } from "../actions";

export const metadata: Metadata = { title: "User" };
type Props = { params: Promise<{ id: string }> };

export default async function UserPage({ params }: Props) {
  const admin = await requireCapability("users.manage");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) notFound();
  const self = user.id === admin.id;
  const recent = await db
    .select()
    .from(auditLog)
    .where(eq(auditLog.entityId, id))
    .orderBy(desc(auditLog.createdAt))
    .limit(10);
  return (
    <div className="grid max-w-3xl gap-8">
      <p>
        <TextLink href="/admin/users">← All users</TextLink>
      </p>
      <div className="grid gap-1">
        <h1 className="text-3xl">{user.name}</h1>
        <p className="text-fg-muted">
          {user.email} · {ROLE_LABELS[user.role]} · {user.isActive ? "Active" : "Deactivated"} ·{" "}
          {user.totpSecretEnc ? "2FA on" : "2FA not set up"}
        </p>
      </div>
      {self ? (
        <Alert tone="info">
          <p>
            This is your own account. Change your password or recovery codes in{" "}
            <TextLink href="/admin/account">My account</TextLink>.
          </p>
        </Alert>
      ) : (
        <>
          <section aria-labelledby="role-h" className="grid gap-3">
            <h2 id="role-h" className="text-xl">
              Role
            </h2>
            <AdminForm
              id="role"
              action={roleAction.bind(null, user.id)}
              submitLabel="Change role"
              fields={[
                {
                  name: "role",
                  label: "Role",
                  type: "select",
                  defaultValue: user.role,
                  options: ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
                },
              ]}
            />
          </section>
          <section aria-labelledby="access-h" className="grid gap-6">
            <h2 id="access-h" className="text-xl">
              Access
            </h2>
            <AdminForm
              id="link"
              action={resetLinkAction.bind(null, user.id)}
              submitLabel={user.passwordHash ? "Create password-reset link" : "Create a new invite link"}
              fields={[]}
            />
            {user.totpSecretEnc ? (
              <AdminForm
                id="totp"
                action={resetTwoFactorAction.bind(null, user.id)}
                submitLabel="Reset two-step verification"
                confirm={`Reset two-step verification for ${user.name}? They will set it up again at next sign-in.`}
                fields={[]}
              />
            ) : null}
            <AdminForm
              id="active"
              action={activeAction.bind(null, user.id, !user.isActive)}
              submitLabel={user.isActive ? "Deactivate account" : "Reactivate account"}
              confirm={user.isActive ? `Deactivate ${user.name}? They are signed out at once.` : undefined}
              fields={[]}
            />
          </section>
        </>
      )}
      <section aria-labelledby="hist-h" className="grid gap-3">
        <h2 id="hist-h" className="text-xl">
          Recent changes
        </h2>
        {recent.length ? (
          <ul className="grid gap-1">
            {recent.map((e) => (
              <li key={e.id}>
                <code>{e.action}</code> –{" "}
                {new Intl.DateTimeFormat("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Kolkata",
                }).format(e.createdAt)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-fg-muted">No changes recorded.</p>
        )}
      </section>
    </div>
  );
}
