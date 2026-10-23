import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { requireCapability } from "@/lib/admin/guard";
import { db } from "@/lib/db/client";
import { seoSettings } from "@/lib/db/schema";
import type { FormSectionSpec } from "@/components/admin/form-state";
import { saveSeo } from "../actions";
import { LOCALE_FIELDS, SettingsPage } from "../SettingsPage";

export const metadata: Metadata = { title: "SEO" };

export default async function SeoSettingsPage() {
  await requireCapability("settings.seo");
  const [s] = await db.select().from(seoSettings).where(eq(seoSettings.id, 1));
  const sections: FormSectionSpec[] = [
    {
      title: "Page titles",
      description: "%s is replaced by each page's title, e.g. %s | MS Welfare Trust.",
      fields: LOCALE_FIELDS.map((l) => ({
        name: `titleTemplate.${l.code}`,
        label: l.name,
        lang: l.lang,
        defaultValue: s?.titleTemplate[l.code] ?? "",
      })),
    },
    {
      title: "Default description",
      description: "Used where a page has no description of its own. About 150 characters.",
      fields: LOCALE_FIELDS.map((l) => ({
        name: `defaultDescription.${l.code}`,
        label: l.name,
        type: "textarea" as const,
        rows: 2,
        lang: l.lang,
        defaultValue: s?.defaultDescription[l.code] ?? "",
      })),
    },
    {
      title: "Verification & sharing",
      description: "Codes from Google Search Console and Bing Webmaster Tools.",
      fields: [
        {
          name: "googleSiteVerification",
          label: "Google code",
          defaultValue: s?.googleSiteVerification ?? "",
        },
        { name: "bingSiteVerification", label: "Bing code", defaultValue: s?.bingSiteVerification ?? "" },
        { name: "indexnowKey", label: "IndexNow key", defaultValue: s?.indexnowKey ?? "" },
        {
          name: "twitterHandle",
          label: "X (Twitter) handle",
          defaultValue: s?.twitterHandle ?? "",
          hint: "e.g. @mswelfaretrust",
        },
      ],
    },
  ];
  return (
    <SettingsPage
      title="SEO"
      intro="How the site appears in search results and when shared."
      id="seo"
      action={saveSeo}
      sections={sections}
    />
  );
}
