import type { MetadataRoute } from "next";
import { routing, type Locale } from "@/i18n/routing";
import { PAGES, readyPages, type PageKey } from "@/config/nav";
import { albumsFrom, causesFrom, eventsFrom, newsFrom } from "@/lib/content/queries";
import { getSiteContent, type SiteContent } from "@/lib/content/source";
import { absoluteUrl, languageAlternates } from "@/lib/seo/site";

const INDEXABLE: PageKey[] = Object.keys(PAGES) as PageKey[];

function entry(path: string, locales: readonly Locale[], lastModified: Date): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: absoluteUrl(locale, path),
    lastModified,
    alternates: { languages: languageAlternates(path, locales) },
  }));
}

/** Every ready page × 4 locales, each with hreflang alternates (SEO-05). */
export function sitemapEntries(lastModified = new Date()): MetadataRoute.Sitemap {
  return readyPages(INDEXABLE).flatMap((key) => entry(PAGES[key].path, routing.locales, lastModified));
}

/** Content items, each listed only in the languages it is published in. */
export function contentEntries(content: SiteContent, lastModified = new Date()): MetadataRoute.Sitemap {
  const collect = (prefix: string, list: (l: Locale) => { slug: string }[]) => {
    const locales = new Map<string, Locale[]>();
    for (const l of routing.locales)
      for (const item of list(l)) locales.set(item.slug, [...(locales.get(item.slug) ?? []), l]);
    return [...locales].flatMap(([slug, ls]) => entry(`${prefix}/${slug}`, ls, lastModified));
  };
  return [
    ...collect("/causes", (l) => causesFrom(content, l)),
    ...collect("/events", (l) => eventsFrom(content, l)),
    ...collect("/news", (l) => newsFrom(content, l)),
    ...collect("/gallery", (l) => albumsFrom(content, l)),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [...sitemapEntries(), ...contentEntries(await getSiteContent())];
}
