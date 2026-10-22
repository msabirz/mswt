import { routing, type Locale } from "@/i18n/routing";

/**
 * Every public page in the sitemap (docs/spec.md §1). `ready` turns a page on in the header/footer;
 * pages that don't exist yet are never linked, so the live site has no links to 404s.
 */
export const PAGES = {
  home: { path: "", ready: true },
  about: { path: "/about", ready: false },
  causes: { path: "/causes", ready: false },
  gallery: { path: "/gallery", ready: false },
  events: { path: "/events", ready: false },
  news: { path: "/news", ready: false },
  transparency: { path: "/transparency", ready: false },
  contact: { path: "/contact", ready: false },
  donate: { path: "/donate", ready: false },
  privacy: { path: "/privacy", ready: false },
  terms: { path: "/terms", ready: false },
  refund: { path: "/refund-policy", ready: false },
  disclaimer80g: { path: "/80g-disclaimer", ready: false },
} as const;

export type PageKey = keyof typeof PAGES;

export const MAIN_NAV: PageKey[] = [
  "about",
  "causes",
  "gallery",
  "events",
  "news",
  "transparency",
  "contact",
];
export const FOOTER_NAV: Record<"explore" | "trust", PageKey[]> = {
  explore: ["causes", "events", "news", "gallery"],
  trust: ["about", "transparency", "disclaimer80g"],
};
export const LEGAL_NAV: PageKey[] = ["privacy", "terms", "refund"];

export function readyPages(keys: readonly PageKey[]): PageKey[] {
  return keys.filter((k) => PAGES[k].ready);
}

export function pageHref(locale: Locale, key: PageKey): string {
  return `/${locale}${PAGES[key].path}`;
}

/** Same page in another language; falls back to that language's home for unknown paths. */
export function switchLocaleHref(pathname: string, target: Locale): string {
  const parts = pathname.split("/");
  const current = parts[1];
  if (current && (routing.locales as readonly string[]).includes(current)) {
    parts[1] = target;
    return parts.join("/") || `/${target}`;
  }
  return `/${target}`;
}
