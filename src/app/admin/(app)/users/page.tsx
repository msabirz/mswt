import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { requireCapability } from "@/lib/admin/guard";
import { ROLE_LABELS, ROLES } from "@/lib/admin/permissions";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { AdminForm } from "@/components/admin/AdminForm";
import { Badge } from "@/components/ui/Alert";
import { TextLink } from "@/components/ui/TextLink";
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
    <div className="grid max-w-5xl gap-10">
      <h1 className="text-3xl">Users</h1>
      <section aria-labelledby="list-h" className="grid gap-4">
        <h2 id="list-h" className="text-xl">
          All users
        </h2>
        <div className="overflow-x-auto rounded-lg border border-border-decorative bg-bg-canvas">
          <table className="w-full text-left">
            <caption className="sr-only">Admin users</caption>
            <thead>
              <tr className="border-b border-border-decorative">
                {["Name", "Email", "Role", "Status", "Last sign-in"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className="border-b border-border-decorative last:border-0">
                  <th scope="row" className="px-4 py-3 font-normal">
                    <TextLink href={`/admin/users/${u.id}`}>{u.name}</TextLink>
                  </th>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{ROLE_LABELS[u.role]}</td>
                  <td className="px-4 py-3">
                    {!u.isActive ? (
                      <Badge tone="error">Deactivated</Badge>
                    ) : !u.passwordHash ? (
                      <Badge tone="info">Invited</Badge>
                    ) : !u.totpSecretEnc ? (
                      <Badge tone="warning">2FA not set up</Badge>
                    ) : (
                      <Badge tone="success">Active</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">{when(u.lastLoginAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section aria-labelledby="invite-h" className="grid max-w-2xl gap-4">
        <h2 id="invite-h" className="text-xl">
          Invite a user
        </h2>
        <p className="text-fg-muted">
          You get a one-time link to send them yourself. They choose a password and set up two-step
          verification.
        </p>
        <AdminForm
          id="invite"
          action={inviteAction}
          submitLabel="Create invite link"
          fields={[
            { name: "name", label: "Full name", required: true, autoComplete: "off", group: "who" },
            {
              name: "email",
              label: "Email",
              type: "email",
              required: true,
              autoComplete: "off",
              group: "who",
            },
            {
              name: "role",
              label: "Role",
              type: "select",
              defaultValue: "content_editor",
              options: ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
            },
          ]}
        />
      </section>
    </div>
  );
}
