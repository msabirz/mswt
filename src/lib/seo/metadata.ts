import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { OG_LOCALES, absoluteUrl, languageAlternates } from "./site";
import { routing } from "@/i18n/routing";

export type PageMetaInput = {
  locale: Locale;
  /** Path after the locale, e.g. "" for home or "/causes/education". */
  path: string;
  title: string;
  description: string;
  /** Site name in the page's language (for og:site_name). */
  siteName: string;
  /** Absolute or root-relative image URL; defaults to the page's opengraph-image route. */
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  /** Use the title as-is instead of applying the layout's "%s | Site" template. */
  absoluteTitle?: boolean;
  /** Languages this page exists in (content items); defaults to all four. */
  locales?: readonly Locale[];
};

/** Metadata for one localised page: canonical, hreflang, Open Graph, Twitter, robots (SEO-01…08). */
export function buildMetadata(input: PageMetaInput): Metadata {
  const {
    locale,
    path,
    title,
    description,
    siteName,
    image,
    type = "website",
    noindex,
    absoluteTitle,
    locales,
  } = input;
  const url = absoluteUrl(locale, path);
  const images = image ? [{ url: image, width: 1200, height: 630, alt: title }] : undefined;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url, languages: noindex ? undefined : languageAlternates(path, locales) },
    openGraph: {
      type,
      url,
      title,
      description,
      siteName,
      locale: OG_LOCALES[locale],
      alternateLocale: (locales ?? routing.locales).filter((l) => l !== locale).map((l) => OG_LOCALES[l]),
      ...(images ? { images } : {}),
    },
    twitter: { card: "summary_large_image", title, description, ...(images ? { images } : {}) },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
  };
}
