import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { requireCapability } from "@/lib/admin/guard";
import { db } from "@/lib/db/client";
import { seoSettings } from "@/lib/db/schema";
import type { FieldSpec } from "@/components/admin/form-state";
import { saveSeo } from "../actions";
import { LOCALE_FIELDS, SettingsPage } from "../SettingsPage";

export const metadata: Metadata = { title: "SEO" };

export default async function SeoSettingsPage() {
  await requireCapability("settings.seo");
  const [s] = await db.select().from(seoSettings).where(eq(seoSettings.id, 1));
  const fields: FieldSpec[] = [
    ...LOCALE_FIELDS.map((l) => ({
      name: `titleTemplate.${l.code}`,
      label: `Title template (${l.name})`,
      hint: "%s is replaced by the page title, e.g. %s | MS Welfare Trust",
      lang: l.lang,
      defaultValue: s?.titleTemplate[l.code] ?? "",
      group: "tt",
    })),
    ...LOCALE_FIELDS.map((l) => ({
      name: `defaultDescription.${l.code}`,
      label: `Default description (${l.name})`,
      type: "textarea" as const,
      rows: 2,
      lang: l.lang,
      hint: "Used where a page has no description of its own. About 150 characters.",
      defaultValue: s?.defaultDescription[l.code] ?? "",
    })),
    {
      name: "googleSiteVerification",
      label: "Google Search Console code",
      defaultValue: s?.googleSiteVerification ?? "",
      group: "v",
    },
    {
      name: "bingSiteVerification",
      label: "Bing Webmaster code",
      defaultValue: s?.bingSiteVerification ?? "",
      group: "v",
    },
    { name: "indexnowKey", label: "IndexNow key", defaultValue: s?.indexnowKey ?? "", group: "k" },
    {
      name: "twitterHandle",
      label: "X (Twitter) handle",
      defaultValue: s?.twitterHandle ?? "",
      hint: "e.g. @mswelfaretrust",
      group: "k",
    },
  ];
  return (
    <SettingsPage
      title="SEO"
      intro="How the site appears in search results and when shared. Only the codes from Google/Bing are needed to verify the site."
      id="seo"
      action={saveSeo}
      fields={fields}
    />
  );
}
