import { and, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { routing, type Locale } from "@/i18n/routing";
import { db } from "@/lib/db/client";
import { pageTranslations } from "@/lib/db/schema";
import { CONTENT_SAFETY_REVALIDATE, CONTENT_TAG, isProduction } from "./source";

/** Home-only fields stored in page_translations.extras (Content → Pages → Home). */
export const HomeExtras = z.object({
  eyebrow: z.string().trim().max(120).default(""),
  points: z
    .array(z.object({ title: z.string().trim().min(1).max(80), text: z.string().trim().min(1).max(300) }))
    .length(3),
});
export type HomeExtras = z.infer<typeof HomeExtras>;

export type HomeContent = {
  title: string;
  h1: string;
  intro: string | null;
  eyebrow: string;
  points: HomeExtras["points"];
  seoTitle: string | null;
  seoDescription: string | null;
};

/**
 * The home page's editable text in `locale`, or null to use the built-in text (src/messages).
 * Same language rule as other content: production shows only reviewed text.
 */
export const getHomeContent = unstable_cache(
  async (locale: Locale): Promise<HomeContent | null> => {
    // generateMetadata can run before the layout rejects a non-locale segment (e.g. favicon.ico).
    if (!routing.locales.includes(locale)) return null;
    const [row] = await db
      .select()
      .from(pageTranslations)
      .where(and(eq(pageTranslations.pageKey, "home"), eq(pageTranslations.locale, locale)));
    if (!row || (isProduction() && !row.reviewedAt)) return null;
    const extras = HomeExtras.safeParse(row.extras ?? {});
    if (!extras.success) return null;
    return {
      title: row.title,
      h1: row.h1,
      intro: row.intro,
      eyebrow: extras.data.eyebrow,
      points: extras.data.points,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
    };
  },
  ["home-content"],
  { tags: [CONTENT_TAG], revalidate: CONTENT_SAFETY_REVALIDATE },
);
