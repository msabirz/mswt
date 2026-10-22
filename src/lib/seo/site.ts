import { routing, type Locale } from "@/i18n/routing";

/** Canonical origin, e.g. https://mswelfaretrust.org (from NEXT_PUBLIC_SITE_URL). */
export function siteUrl(): URL {
  return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
}

/** Absolute URL for a locale + path ("" for the locale home). */
export function absoluteUrl(locale: Locale, path = ""): string {
  return new URL(`/${locale}${path}`, siteUrl()).toString();
}

export const OG_LOCALES: Record<Locale, string> = { en: "en_IN", hi: "hi_IN", mr: "mr_IN", gu: "gu_IN" };

/** hreflang map for one page: every locale plus x-default → English. */
export function languageAlternates(path = ""): Record<string, string> {
  return {
    ...Object.fromEntries(routing.locales.map((l) => [l, absoluteUrl(l, path)])),
    "x-default": absoluteUrl("en", path),
  };
}

/** True when the request host is the canonical one; other hosts (*.vercel.app) must be noindex. */
export function isCanonicalHost(host: string | null | undefined, canonical: URL = siteUrl()): boolean {
  if (!host) return false;
  return host.toLowerCase().split(":")[0] === canonical.hostname.toLowerCase();
}

/** Robots policy: only production may be crawled. */
export function crawlAllowed(vercelEnv: string | undefined = process.env.VERCEL_ENV): boolean {
  return vercelEnv === "production";
}
