import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireCapability } from "@/lib/admin/guard";
import { ROLE_LABELS, ROLES } from "@/lib/admin/permissions";
import { db } from "@/lib/db/client";
import { auditLog, users } from "@/lib/db/schema";
import { AdminForm } from "@/components/admin/AdminForm";
import { Alert, Badge } from "@/components/ui/Alert";
import { Card, PageHeader, Section } from "@/components/admin/ui";
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
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    }).format(d);
  return (
    <>
      <PageHeader
        back={{ href: "/admin/users", label: "All users" }}
        title={user.name}
        description={`${user.email} · ${ROLE_LABELS[user.role]}`}
        actions={
          <>
            <Badge tone={user.isActive ? "success" : "error"}>
              {user.isActive ? "Active" : "Deactivated"}
            </Badge>
            <Badge tone={user.totpSecretEnc ? "success" : "warning"}>
              {user.totpSecretEnc ? "2FA on" : "2FA not set up"}
            </Badge>
          </>
        }
      />
      {self ? (
        <Alert tone="info">
          <p>
            This is your own account. Change your password or recovery codes in{" "}
            <TextLink href="/admin/account">My account</TextLink>.
          </p>
        </Alert>
      ) : (
        <Card>
          <Section
            id="role"
            title="Role"
            description="What they can see and change. Their sessions end when it changes."
          >
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
          </Section>
          <Section
            id="link"
            title={user.passwordHash ? "Password reset" : "Invite link"}
            description="A one-time link, valid for 72 hours, that you send to them."
          >
            <AdminForm
              id="link"
              action={resetLinkAction.bind(null, user.id)}
              submitLabel={user.passwordHash ? "Create reset link" : "Create a new invite link"}
              variant="secondary"
              fields={[]}
            />
          </Section>
          {user.totpSecretEnc ? (
            <Section
              id="totp"
              title="Two-step verification"
              description="If they lost their phone and recovery codes."
            >
              <AdminForm
                id="totp"
                action={resetTwoFactorAction.bind(null, user.id)}
                submitLabel="Reset two-step verification"
                variant="secondary"
                confirm={`Reset two-step verification for ${user.name}? They will set it up again at next sign-in.`}
                fields={[]}
              />
            </Section>
          ) : null}
          <Section
            id="active"
            title={user.isActive ? "Deactivate" : "Reactivate"}
            description={
              user.isActive ? "They are signed out at once and can't sign in." : "They can sign in again."
            }
          >
            <AdminForm
              id="active"
              action={activeAction.bind(null, user.id, !user.isActive)}
              submitLabel={user.isActive ? "Deactivate account" : "Reactivate account"}
              variant={user.isActive ? "danger" : "secondary"}
              confirm={user.isActive ? `Deactivate ${user.name}? They are signed out at once.` : undefined}
              fields={[]}
            />
          </Section>
        </Card>
      )}
      <Card>
        <Section id="hist" title="Recent changes" description="The last 10 audit entries for this account.">
          {recent.length ? (
            <ul className="m-0 grid list-none gap-2 p-0 text-sm">
              {recent.map((e) => (
                <li key={e.id} className="flex flex-wrap justify-between gap-2">
                  <code className="text-fg-strong">{e.action}</code>
                  <span className="text-fg-muted">{fmt(e.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-sm text-fg-muted">No changes recorded.</p>
          )}
        </Section>
      </Card>
    </>
  );
}
