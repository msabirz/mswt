import type { Metadata } from "next";
import { and, count, desc, eq, gte, lt, type SQL } from "drizzle-orm";
import { requireCapability } from "@/lib/admin/guard";
import { can } from "@/lib/admin/permissions";
import { db } from "@/lib/db/client";
import { auditLog, users } from "@/lib/db/schema";
import { ButtonLink } from "@/components/ui/Button";
import {
  compactControl,
  DataTable,
  FilterBar,
  FilterField,
  PageHeader,
  Td,
  Th,
  Tr,
} from "@/components/admin/ui";

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
    <>
      <PageHeader
        title="Audit log"
        description={`${all ? "Every change made in the admin." : "Changes you made."} Entries can’t be edited or deleted.`}
      />
      <FilterBar resetHref="/admin/audit-log">
        {all ? (
          <FilterField id="f-actor" label="Person" wide>
            <select id="f-actor" name="actor" defaultValue={q.actor ?? ""} className={compactControl}>
              <option value="">Everyone</option>
              {people.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </FilterField>
        ) : null}
        <FilterField id="f-entity" label="Record type" wide>
          <select id="f-entity" name="entity" defaultValue={q.entity ?? ""} className={compactControl}>
            <option value="">All</option>
            {entities.map(({ e }) => (
              <option key={e} value={e}>
                {e.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField id="f-from" label="From (IST)">
          <input id="f-from" type="date" name="from" defaultValue={q.from} className={compactControl} />
        </FilterField>
        <FilterField id="f-to" label="To (IST)">
          <input id="f-to" type="date" name="to" defaultValue={q.to} className={compactControl} />
        </FilterField>
      </FilterBar>
      <DataTable
        caption="Audit entries, newest first"
        footer={
          <nav aria-label="Audit log pages" className="flex items-center justify-between gap-4">
            <span className="text-fg-muted">
              Page {page} of {pages} · {total?.n ?? 0} entries
            </span>
            <span className="flex gap-2">
              {page > 1 ? (
                <ButtonLink variant="secondary" href={link(page - 1)}>
                  Newer
                </ButtonLink>
              ) : null}
              {page < pages ? (
                <ButtonLink variant="secondary" href={link(page + 1)}>
                  Older
                </ButtonLink>
              ) : null}
            </span>
          </nav>
        }
      >
        <thead>
          <tr>
            <Th>When (IST)</Th>
            <Th>Who</Th>
            <Th>Action</Th>
            <Th>Record</Th>
            <Th>Details</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-fg-muted">
                No entries match.
              </td>
            </tr>
          ) : (
            rows.map(({ log, actor }) => (
              <Tr key={log.id}>
                <Td className="whitespace-nowrap">{fmt(log.createdAt)}</Td>
                <Td>{actor ?? (log.userAgent ? `System (${log.userAgent})` : "System")}</Td>
                <Td>
                  <code className="text-fg-strong">{log.action}</code>
                </Td>
                <Td>
                  {log.entityType.replaceAll("_", " ")}
                  {log.entityId ? <span className="block text-xs text-fg-muted">{log.entityId}</span> : null}
                </Td>
                <Td>
                  {log.before || log.after ? (
                    <details>
                      <summary className="cursor-pointer text-link-default">Show</summary>
                      <pre className="mt-2 max-w-xl overflow-x-auto rounded-md bg-bg-subtle p-3 text-xs whitespace-pre-wrap">
                        {JSON.stringify({ before: log.before, after: log.after }, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    "–"
                  )}
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </DataTable>
    </>
  );
}
