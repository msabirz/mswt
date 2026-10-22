import type { Metadata } from "next";
import { and, count, desc, eq, gte, lt, type SQL } from "drizzle-orm";
import { requireCapability } from "@/lib/admin/guard";
import { can } from "@/lib/admin/permissions";
import { db } from "@/lib/db/client";
import { auditLog, users } from "@/lib/db/schema";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Form";

export const metadata: Metadata = { title: "Audit log" };
const PAGE_SIZE = 50;
type Props = { searchParams: Promise<Record<string, string | undefined>> };

// IST day boundaries for the date filter.
const istStart = (d: string) => new Date(`${d}T00:00:00+05:30`);
const fmt = (d: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(d);

export default async function AuditLogPage({ searchParams }: Props) {
  const admin = await requireCapability("audit.read.all", "audit.read.own");
  const all = can(admin.role, "audit.read.all");
  const q = await searchParams;
  const page = Math.max(1, Number(q.page) || 1);
  const date = /^\d{4}-\d{2}-\d{2}$/;

  const where: SQL[] = [];
  // Accountants and Content Editors see only their own actions (spec §5).
  if (!all) where.push(eq(auditLog.actorUserId, admin.id));
  else if (q.actor && /^[0-9a-f-]{36}$/.test(q.actor)) where.push(eq(auditLog.actorUserId, q.actor));
  if (q.entity && /^[a-z_]{1,40}$/.test(q.entity)) where.push(eq(auditLog.entityType, q.entity));
  if (q.from && date.test(q.from)) where.push(gte(auditLog.createdAt, istStart(q.from)));
  if (q.to && date.test(q.to))
    where.push(lt(auditLog.createdAt, new Date(istStart(q.to).getTime() + 86_400_000)));
  const filter = where.length ? and(...where) : undefined;

  const [rows, [total], people, entities] = await Promise.all([
    db
      .select({ log: auditLog, actor: users.name })
      .from(auditLog)
      .leftJoin(users, eq(users.id, auditLog.actorUserId))
      .where(filter)
      .orderBy(desc(auditLog.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(auditLog).where(filter),
    all ? db.select({ id: users.id, name: users.name }).from(users).orderBy(users.name) : Promise.resolve([]),
    db.selectDistinct({ e: auditLog.entityType }).from(auditLog).orderBy(auditLog.entityType),
  ]);
  const pages = Math.max(1, Math.ceil((total?.n ?? 0) / PAGE_SIZE));
  const link = (p: number) =>
    `?${new URLSearchParams({ ...Object.fromEntries(Object.entries(q).filter(([, v]) => v) as [string, string][]), page: String(p) })}`;

  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <h1 className="text-3xl">Audit log</h1>
        <p className="text-fg-muted">
          {all ? "Every change made in the admin." : "Changes you made."} Entries can’t be edited or deleted.
        </p>
      </div>
      <form
        method="get"
        className="grid items-end gap-4 rounded-lg border border-border-decorative bg-bg-canvas p-4 md:grid-cols-5"
      >
        {all ? (
          <FormField id="f-actor" label="Person">
            {(p) => (
              <Select {...p} name="actor" defaultValue={q.actor ?? ""}>
                <option value="">Everyone</option>
                {people.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        ) : null}
        <FormField id="f-entity" label="Record type">
          {(p) => (
            <Select {...p} name="entity" defaultValue={q.entity ?? ""}>
              <option value="">All</option>
              {entities.map(({ e }) => (
                <option key={e} value={e}>
                  {e.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField id="f-from" label="From (IST)">
          {(p) => <Input {...p} type="date" name="from" defaultValue={q.from} />}
        </FormField>
        <FormField id="f-to" label="To (IST)">
          {(p) => <Input {...p} type="date" name="to" defaultValue={q.to} />}
        </FormField>
        <div>
          <Button type="submit">Filter</Button>
        </div>
      </form>
      <div className="overflow-x-auto rounded-lg border border-border-decorative bg-bg-canvas">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Audit entries, newest first</caption>
          <thead>
            <tr className="border-b border-border-decorative">
              {["When (IST)", "Who", "Action", "Record", "Details"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-fg-muted">
                  No entries match.
                </td>
              </tr>
            ) : (
              rows.map(({ log, actor }) => (
                <tr key={log.id} className="border-b border-border-decorative align-top last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">{fmt(log.createdAt)}</td>
                  <td className="px-4 py-3">
                    {actor ?? (log.userAgent ? `System (${log.userAgent})` : "System")}
                  </td>
                  <td className="px-4 py-3">
                    <code>{log.action}</code>
                  </td>
                  <td className="px-4 py-3">
                    {log.entityType}
                    {log.entityId ? <span className="block text-fg-muted">{log.entityId}</span> : null}
                  </td>
                  <td className="px-4 py-3">
                    {log.before || log.after ? (
                      <details>
                        <summary className="cursor-pointer">Show</summary>
                        <pre className="mt-2 max-w-xl overflow-x-auto text-xs whitespace-pre-wrap">
                          {JSON.stringify({ before: log.before, after: log.after }, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      "–"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <nav aria-label="Audit log pages" className="flex items-center gap-4">
        {page > 1 ? (
          <ButtonLink variant="secondary" href={link(page - 1)}>
            Newer
          </ButtonLink>
        ) : null}
        <span>
          Page {page} of {pages}
        </span>
        {page < pages ? (
          <ButtonLink variant="secondary" href={link(page + 1)}>
            Older
          </ButtonLink>
        ) : null}
      </nav>
    </div>
  );
}
