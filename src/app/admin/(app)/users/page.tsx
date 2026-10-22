import type { Metadata } from "next";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { requireCapability } from "@/lib/admin/guard";
import { ROLE_LABELS, ROLES } from "@/lib/admin/permissions";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { AdminForm } from "@/components/admin/AdminForm";
import { DataTable, PageHeader, Section, Card, Td, Th, Tr } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";
import { inviteAction } from "./actions";

export const metadata: Metadata = { title: "Users" };
const when = (d: Date | null) =>
  d
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }).format(d)
    : "Never";

export default async function UsersPage() {
  await requireCapability("users.manage");
  const list = await db.select().from(users).orderBy(asc(users.name));
  return (
    <>
      <PageHeader
        title="Users"
        description="Who can sign in to the admin, and with which role."
        actions={<ButtonLink href="#invite-h">Invite user</ButtonLink>}
      />
      <DataTable caption="Admin users">
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th>Last sign-in</Th>
          </tr>
        </thead>
        <tbody>
          {list.map((u) => (
            <Tr key={u.id}>
              <Td header>
                <Link
                  href={`/admin/users/${u.id}`}
                  className="text-link-default underline underline-offset-4"
                >
                  {u.name}
                </Link>
              </Td>
              <Td>{u.email}</Td>
              <Td>{ROLE_LABELS[u.role]}</Td>
              <Td>
                {!u.isActive ? (
                  <Badge tone="error">Deactivated</Badge>
                ) : !u.passwordHash ? (
                  <Badge tone="info">Invited</Badge>
                ) : !u.totpSecretEnc ? (
                  <Badge tone="warning">2FA not set up</Badge>
                ) : (
                  <Badge tone="success">Active</Badge>
                )}
              </Td>
              <Td className="whitespace-nowrap text-fg-muted">{when(u.lastLoginAt)}</Td>
            </Tr>
          ))}
        </tbody>
      </DataTable>
      <Card>
        <Section
          id="invite"
          title="Invite a user"
          description="You get a one-time link to send them. They choose a password and set up two-step verification."
        >
          <AdminForm
            id="invite"
            action={inviteAction}
            submitLabel="Create invite link"
            fields={[
              { name: "name", label: "Full name", required: true, autoComplete: "off" },
              { name: "email", label: "Email", type: "email", required: true, autoComplete: "off" },
              {
                name: "role",
                label: "Role",
                type: "select",
                defaultValue: "content_editor",
                options: ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
              },
            ]}
          />
        </Section>
      </Card>
    </>
  );
}
