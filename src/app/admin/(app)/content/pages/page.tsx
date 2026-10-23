import type { Metadata } from "next";
import Link from "next/link";
import { routing } from "@/i18n/routing";
import { requireCapability } from "@/lib/admin/guard";
import { istDateTime } from "@/lib/admin/format";
import { CONTENT_PAGES } from "@/lib/admin/content-pages";
import { LANGUAGES } from "@/lib/admin/languages";
import { db } from "@/lib/db/client";
import { pageTranslations } from "@/lib/db/schema";
import { translationState } from "@/components/admin/LanguageTabs";
import { DataTable, PageHeader, Td, Th, Tr } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Alert";

export const metadata: Metadata = { title: "Pages" };

const TONE = { missing: "neutral", draft: "warning", reviewed: "success" } as const;

export default async function PagesPage() {
  await requireCapability("cms.write");
  const rows = await db.select().from(pageTranslations);
  return (
    <>
      <PageHeader
        title="Pages"
        description="The site's fixed pages, one per language. Production shows a language only once its text is marked reviewed."
      />
      <DataTable caption="Pages and their languages">
        <thead>
          <tr>
            <Th>Page</Th>
            {routing.locales.map((l) => (
              <Th key={l}>{LANGUAGES[l].name}</Th>
            ))}
            <Th>Last change</Th>
          </tr>
        </thead>
        <tbody>
          {CONTENT_PAGES.map((p) => {
            const mine = rows.filter((r) => r.pageKey === p.key);
            const last = mine.reduce<Date | null>((a, r) => (!a || r.updatedAt > a ? r.updatedAt : a), null);
            return (
              <Tr key={p.key}>
                <Td header>
                  <Link
                    href={`/admin/content/pages/${p.key}`}
                    className="text-link-default underline underline-offset-4"
                  >
                    {p.label}
                  </Link>
                </Td>
                {routing.locales.map((l) => {
                  const state = translationState(mine.find((r) => r.locale === l));
                  return (
                    <Td key={l}>
                      <Badge tone={TONE[state]}>
                        {state === "missing" ? "Not written" : state === "draft" ? "Draft" : "Reviewed"}
                      </Badge>
                    </Td>
                  );
                })}
                <Td>{last ? istDateTime(last) : "–"}</Td>
              </Tr>
            );
          })}
        </tbody>
      </DataTable>
    </>
  );
}
