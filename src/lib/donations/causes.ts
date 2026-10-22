import { and, asc, eq, isNotNull } from "drizzle-orm";
import type { Locale } from "@/i18n/routing";
import { db } from "@/lib/db/client";
import { causes, causeTranslations } from "@/lib/db/schema";
import { isProduction } from "@/lib/secrets";

/**
 * Causes a donor can choose on the donate form: active, in the database (not sample content), and
 * translated into this language (reviewed, in production). No fallback to English (I18N-03).
 */
export async function donatableCauses(locale: Locale): Promise<{ slug: string; title: string }[]> {
  return db
    .select({ slug: causes.slug, title: causeTranslations.title })
    .from(causes)
    .innerJoin(causeTranslations, eq(causeTranslations.causeId, causes.id))
    .where(
      and(
        eq(causes.status, "active"),
        eq(causeTranslations.locale, locale),
        isProduction() ? isNotNull(causeTranslations.reviewedAt) : undefined,
      ),
    )
    .orderBy(asc(causes.sortOrder), asc(causes.slug));
}
