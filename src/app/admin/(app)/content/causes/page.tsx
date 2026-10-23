import type { Metadata } from "next";
import Link from "next/link";
import { routing } from "@/i18n/routing";
import { inr } from "@/lib/admin/format";
import { listCauses } from "@/lib/admin/causes";
import { requireCapability } from "@/lib/admin/guard";
import { can } from "@/lib/admin/permissions";
import { DataTable, PageHeader, Td, Th, Tr } from "@/components/admin/ui";
import { Alert, Badge } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Causes" };
type Props = { searchParams: Promise<Record<string, string | undefined>> };

const STATUS_TONE = { draft: "neutral", active: "success", closed: "warning" } as const;

export default async function CausesPage({ searchParams }: Props) {
  const admin = await requireCapability("causes.read");
  const [rows, q] = await Promise.all([listCauses(), searchParams]);
  const write = can(admin.role, "causes.write");
  return (
    <>
      <PageHeader
        title="Causes"
        description="What donors can give towards. A cause appears in a language once that language's text is reviewed."
        actions={write ? <ButtonLink href="/admin/content/causes/new">New cause</ButtonLink> : null}
      />
      {q.deleted ? (
        <Alert tone="success" live="polite">
          <p>Cause deleted.</p>
        </Alert>
      ) : null}
      <DataTable caption="Causes">
        <thead>
          <tr>
            <Th>Cause</Th>
            <Th>Status</Th>
            <Th>Languages</Th>
            <Th align="right">Goal</Th>
            <Th align="right">Raised</Th>
            <Th align="right">Donations</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-fg-muted">
                No causes yet.
              </td>
            </tr>
          ) : (
            rows.map((c) => (
              <Tr key={c.id}>
                <Td header>
                  <Link
                    href={`/admin/content/causes/${c.id}`}
                    className="text-link-default underline underline-offset-4"
                  >
                    {c.translations.find((t) => t.locale === "en")?.title ?? c.slug}
                  </Link>
                  <span className="block text-xs font-normal text-fg-muted">/{c.slug}</span>
                </Td>
                <Td>
                  <Badge tone={STATUS_TONE[c.status]}>{c.status[0]!.toUpperCase() + c.status.slice(1)}</Badge>
                </Td>
                <Td>
                  <span className="flex flex-wrap gap-1">
                    {routing.locales.map((l) => {
                      const t = c.translations.find((x) => x.locale === l);
                      return t ? (
                        <Badge key={l} tone={t.reviewedAt ? "success" : "warning"}>
                          {l.toUpperCase()}
                          <span className="sr-only">{t.reviewedAt ? " reviewed" : " draft"}</span>
                        </Badge>
                      ) : null;
                    })}
                  </span>
                </Td>
                <Td align="right">{c.goalPaise ? inr(c.goalPaise) : "–"}</Td>
                <Td align="right">{inr(c.raisedPaise)}</Td>
                <Td align="right">{c.paidDonations}</Td>
              </Tr>
            ))
          )}
        </tbody>
      </DataTable>
    </>
  );
}
