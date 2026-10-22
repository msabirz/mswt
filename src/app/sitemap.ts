import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { PAGES, readyPages, type PageKey } from "@/config/nav";
import { absoluteUrl, languageAlternates } from "@/lib/seo/site";

const INDEXABLE: PageKey[] = (Object.keys(PAGES) as PageKey[]).filter((k) => k !== "donate");

/** Every ready, indexable page × 4 locales, each with hreflang alternates (SEO-05). */
export function sitemapEntries(lastModified = new Date()): MetadataRoute.Sitemap {
  return readyPages(INDEXABLE).flatMap((key) => {
    const path = PAGES[key].path;
    return routing.locales.map((locale) => ({
      url: absoluteUrl(locale, path),
      lastModified,
      alternates: { languages: languageAlternates(path) },
    }));
  });
}

export default function sitemap(): MetadataRoute.Sitemap {
  // Causes, news and events are added here from the CMS in Step 6.
  return sitemapEntries();
}
