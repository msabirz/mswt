import { routing, type Locale } from "@/i18n/routing";

/** Canonical origin, e.g. https://mswelfaretrust.org (from NEXT_PUBLIC_SITE_URL). */
export function siteUrl(): URL {
  return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
}

/**
 * Origin of this deployment, for links that must come back to the same database (receipt links in
 * emails): the branch URL on Vercel previews, the canonical origin everywhere else.
 */
export function appOrigin(): string {
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_BRANCH_URL)
    return `https://${process.env.VERCEL_BRANCH_URL}`;
  return siteUrl().origin;
}

/** Absolute URL for a locale + path ("" for the locale home). */
export function absoluteUrl(locale: Locale, path = ""): string {
  return new URL(`/${locale}${path}`, siteUrl()).toString();
}

export const OG_LOCALES: Record<Locale, string> = { en: "en_IN", hi: "hi_IN", mr: "mr_IN", gu: "gu_IN" };

/**
 * hreflang map for one page: each locale it exists in, plus x-default → English (or the first
 * available language when there is no English version).
 */
export function languageAlternates(
  path = "",
  locales: readonly Locale[] = routing.locales,
): Record<string, string> {
  const fallback = locales.includes("en") ? "en" : locales[0];
  return {
    ...Object.fromEntries(locales.map((l) => [l, absoluteUrl(l, path)])),
    ...(fallback ? { "x-default": absoluteUrl(fallback, path) } : {}),
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
