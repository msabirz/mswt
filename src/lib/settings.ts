import { unstable_cache } from "next/cache";
import { db } from "@/lib/db/client";
import { organizationSettings, seoSettings } from "@/lib/db/schema";

export type SeoSettings = typeof seoSettings.$inferSelect;
export type OrganizationSettings = typeof organizationSettings.$inferSelect;

/** Cache tags; the admin revalidates these after saving settings (Step 8). */
export const SETTINGS_TAGS = { seo: "settings:seo", organization: "settings:organization" } as const;

export const getSeoSettings = unstable_cache(
  async (): Promise<SeoSettings | null> => (await db.select().from(seoSettings).limit(1))[0] ?? null,
  ["settings-seo"],
  { tags: [SETTINGS_TAGS.seo] },
);

export const getOrganizationSettings = unstable_cache(
  async (): Promise<OrganizationSettings | null> =>
    (await db.select().from(organizationSettings).limit(1))[0] ?? null,
  ["settings-organization"],
  { tags: [SETTINGS_TAGS.organization] },
);
