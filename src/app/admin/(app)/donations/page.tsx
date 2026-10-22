import type { Metadata } from "next";
import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { requireCapability } from "@/lib/admin/guard";
import { causeOptions, listDonations, PAGE_SIZE, parseFilters } from "@/lib/admin/donations";
import { inr, istDateTime, MODE_LABELS, STATUS_LABEL, STATUS_TONE } from "@/lib/admin/format";
import { can } from "@/lib/admin/permissions";
import { financialYear } from "@/lib/dates/fy";
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
import { Badge } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Donations" };
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function fyOptions(): string[] {
  const current = financialYear(new Date());
  const start = Number(current.slice(0, 4));
  return Array.from(
    { length: 5 },
    (_, i) => `${start - i}-${String((start - i + 1) % 100).padStart(2, "0")}`,
  );
}

export default async function DonationsPage({ searchParams }: Props) {
  const admin = await requireCapability("donations.view");
  const raw = await searchParams;
  const f = parseFilters(raw);
  const [{ rows, total, paidSumPaise, page }, causes] = await Promise.all([listDonations(f), causeOptions()]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(raw)) if (typeof v === "string" && v && k !== "page") p.set(k, v);
    for (const [k, v] of Object.entries(extra)) p.set(k, v);
    return p.toString();
  };
  const select = (
    id: string,
    name: keyof typeof f,
    options: { value: string; label: string }[],
    all = "All",
  ) => (
    <select id={id} name={name} defaultValue={String(f[name] ?? "")} className={compactControl}>
      <option value="">{all}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
  return (
    <>
      <PageHeader
        title="Donations"
        description="Online and offline donations. Paid totals count only completed payments."
        actions={
          <>
            <ButtonLink variant="secondary" href={`/admin/donations/export?${qs({ format: "csv" })}`}>
              <Download aria-hidden="true" className="size-4" /> CSV
            </ButtonLink>
            <ButtonLink variant="secondary" href={`/admin/donations/export?${qs({ format: "xlsx" })}`}>
              <Download aria-hidden="true" className="size-4" /> Excel
            </ButtonLink>
            {can(admin.role, "donations.offline") ? (
              <ButtonLink href="/admin/donations/new">
                <Plus aria-hidden="true" className="size-4" /> Offline donation
              </ButtonLink>
            ) : null}
          </>
        }
      />
      <FilterBar resetHref="/admin/donations">
        <FilterField id="f-q" label="Search" wide>
          <input
            id="f-q"
            name="q"
            type="search"
            defaultValue={f.q}
            placeholder="Name, email, phone, order or receipt no."
            className={compactControl}
          />
        </FilterField>
        <FilterField id="f-fy" label="Financial year">
          {select(
            "f-fy",
            "fy",
            fyOptions().map((v) => ({ value: v, label: v })),
            "Any",
          )}
        </FilterField>
        <FilterField id="f-status" label="Status">
          {select(
            "f-status",
            "status",
            ["paid", "pending", "failed", "expired", "refunded", "created"].map((v) => ({
              value: v,
              label: v[0]!.toUpperCase() + v.slice(1),
            })),
          )}
        </FilterField>
        <FilterField id="f-mode" label="Mode">
          {select(
            "f-mode",
            "mode",
            Object.entries(MODE_LABELS).map(([value, label]) => ({ value, label })),
          )}
        </FilterField>
        <FilterField id="f-kind" label="Receipt">
          {select("f-kind", "kind", [
            { value: "80g", label: "80G" },
            { value: "acknowledgement", label: "Acknowledgement" },
          ])}
        </FilterField>
        <FilterField id="f-cause" label="Cause" wide>
          {select("f-cause", "cause", [
            { value: "general", label: "General fund" },
            ...causes.map((c) => ({ value: c.id, label: c.title ?? c.slug })),
          ])}
        </FilterField>
        <FilterField id="f-from" label="From (IST)">
          <input id="f-from" type="date" name="from" defaultValue={f.from} className={compactControl} />
        </FilterField>
        <FilterField id="f-to" label="To (IST)">
          <input id="f-to" type="date" name="to" defaultValue={f.to} className={compactControl} />
        </FilterField>
        <FilterField id="f-min" label="Min ₹">
          <input id="f-min" name="min" inputMode="numeric" defaultValue={f.min} className={compactControl} />
        </FilterField>
        <FilterField id="f-max" label="Max ₹">
          <input id="f-max" name="max" inputMode="numeric" defaultValue={f.max} className={compactControl} />
        </FilterField>
      </FilterBar>
      <DataTable
        caption="Donations, newest first"
        footer={
          <nav aria-label="Donation pages" className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-fg-muted">
              {total} donations · paid total <strong className="text-fg-strong">{inr(paidSumPaise)}</strong> ·
              page {page} of {pages}
            </span>
            <span className="flex gap-2">
              {page > 1 ? (
                <ButtonLink variant="secondary" href={`?${qs({ page: String(page - 1) })}`}>
                  Previous
                </ButtonLink>
              ) : null}
              {page < pages ? (
                <ButtonLink variant="secondary" href={`?${qs({ page: String(page + 1) })}`}>
                  Next
                </ButtonLink>
              ) : null}
            </span>
          </nav>
        }
      >
        <thead>
          <tr>
            <Th>Date (IST)</Th>
            <Th>Donor</Th>
            <Th>Receipt</Th>
            <Th>Mode</Th>
            <Th>Status</Th>
            <Th align="right">Amount</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-fg-muted">
                No donations match these filters.
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <Tr key={r.id}>
                <Td className="whitespace-nowrap">{istDateTime(r.receivedAt ?? r.createdAt)}</Td>
                <Td header>
                  <Link
                    href={`/admin/donations/${r.id}`}
                    className="text-link-default underline underline-offset-4"
                  >
                    {r.name}
                  </Link>
                  <span className="block text-xs font-normal text-fg-muted">{r.email}</span>
                </Td>
                <Td>
                  {r.receiptNumber ?? "–"}
                  {r.receiptKind ? (
                    <span className="block text-xs text-fg-muted">
                      {r.receiptKind === "80g" ? "80G" : "Acknowledgement"}
                    </span>
                  ) : null}
                </Td>
                <Td>{MODE_LABELS[r.mode] ?? r.mode}</Td>
                <Td>
                  <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </Badge>
                </Td>
                <Td align="right" className="font-semibold text-fg-strong">
                  {inr(r.totalPaise)}
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </DataTable>
    </>
  );
}
