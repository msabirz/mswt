import { unstable_cache } from "next/cache";
import { db } from "@/lib/db/client";
import { appearanceSettings, emailSettings, organizationSettings, seoSettings } from "@/lib/db/schema";

export type SeoSettings = typeof seoSettings.$inferSelect;
export type OrganizationSettings = typeof organizationSettings.$inferSelect;

/** Cache tags; the admin revalidates these after saving settings (Step 8). */
export const SETTINGS_TAGS = {
  seo: "settings:seo",
  organization: "settings:organization",
  email: "settings:email",
  appearance: "settings:appearance",
} as const;

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

export type EmailSettings = typeof emailSettings.$inferSelect;
export const getEmailSettings = unstable_cache(
  async (): Promise<EmailSettings | null> => (await db.select().from(emailSettings).limit(1))[0] ?? null,
  ["settings-email"],
  { tags: [SETTINGS_TAGS.email] },
);

export type AppearanceSettings = typeof appearanceSettings.$inferSelect;
export const getAppearanceSettings = unstable_cache(
  async (): Promise<AppearanceSettings | null> =>
    (await db.select().from(appearanceSettings).limit(1))[0] ?? null,
  ["settings-appearance"],
  { tags: [SETTINGS_TAGS.appearance] },
);
