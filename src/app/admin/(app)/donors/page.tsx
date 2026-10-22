import type { Metadata } from "next";
import Link from "next/link";
import { requireCapability } from "@/lib/admin/guard";
import { DONOR_PAGE_SIZE, searchDonors } from "@/lib/admin/donors";
import { inr, istDate } from "@/lib/admin/format";
import { maskPan } from "@/lib/crypto/pii";
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
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Donors" };
type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function DonorsPage({ searchParams }: Props) {
  await requireCapability("donations.view");
  const q = await searchParams;
  const page = Math.max(1, Number(q.page) || 1);
  const { rows, total } = await searchDonors(q.q?.slice(0, 100), page);
  const pages = Math.max(1, Math.ceil(total / DONOR_PAGE_SIZE));
  const link = (p: number) => `?${new URLSearchParams({ ...(q.q ? { q: q.q } : {}), page: String(p) })}`;
  return (
    <>
      <PageHeader
        title="Donors"
        description="Everyone who has donated, newest activity first. Duplicates can be merged on a donor's page."
      />
      <FilterBar resetHref="/admin/donors">
        <FilterField id="d-q" label="Search" wide>
          <input
            id="d-q"
            name="q"
            type="search"
            defaultValue={q.q}
            placeholder="Name, email or phone"
            className={compactControl}
          />
        </FilterField>
      </FilterBar>
      <DataTable
        caption="Donors"
        footer={
          <nav aria-label="Donor pages" className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-fg-muted">
              {total} donors · page {page} of {pages}
            </span>
            <span className="flex gap-2">
              {page > 1 ? (
                <ButtonLink variant="secondary" href={link(page - 1)}>
                  Previous
                </ButtonLink>
              ) : null}
              {page < pages ? (
                <ButtonLink variant="secondary" href={link(page + 1)}>
                  Next
                </ButtonLink>
              ) : null}
            </span>
          </nav>
        }
      >
        <thead>
          <tr>
            <Th>Donor</Th>
            <Th>Phone</Th>
            <Th>PAN</Th>
            <Th>City</Th>
            <Th>Last donation</Th>
            <Th align="right">Donations</Th>
            <Th align="right">Total</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-fg-muted">
                No donors found.
              </td>
            </tr>
          ) : (
            rows.map((d) => (
              <Tr key={d.id}>
                <Td header>
                  <Link
                    href={`/admin/donors/${d.id}`}
                    className="text-link-default underline underline-offset-4"
                  >
                    {d.name}
                  </Link>
                  <span className="block text-xs font-normal text-fg-muted">{d.email}</span>
                </Td>
                <Td>{d.phone}</Td>
                <Td>{d.panLast4 ? maskPan(d.panLast4) : "–"}</Td>
                <Td>{d.city ?? "–"}</Td>
                <Td>{istDate(d.last ? new Date(d.last) : null)}</Td>
                <Td align="right">{d.count}</Td>
                <Td align="right" className="font-semibold text-fg-strong">
                  {inr(d.totalPaise)}
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </DataTable>
    </>
  );
}
