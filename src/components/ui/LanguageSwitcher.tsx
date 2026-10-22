"use client";

import { usePathname } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { switchLocaleHref } from "@/config/nav";

export const LANGUAGE_NAMES: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  mr: "मराठी",
  gu: "ગુજરાતી",
};

/** Dropdown of the 4 languages. Uses <details>, so it works without JavaScript; JS only reads the path. */
export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() ?? `/${locale}`;
  return (
    <details className="group relative">
      <summary className="inline-flex min-h-(--size-target-comfortable) cursor-pointer list-none items-center gap-2 rounded-md border border-border-input px-3 font-medium [&::-webkit-details-marker]:hidden">
        <span className="sr-only">{label}: </span>
        <span lang={locale}>{LANGUAGE_NAMES[locale]}</span>
        <span aria-hidden="true" className="text-fg-muted group-open:rotate-180">
          ▾
        </span>
      </summary>
      <ul className="absolute right-0 z-20 m-0 mt-1 min-w-44 list-none rounded-lg border border-border-decorative bg-bg-canvas py-2 shadow-md">
        {routing.locales.map((l) => (
          <li key={l}>
            <a
              href={switchLocaleHref(pathname, l)}
              lang={l}
              hrefLang={l}
              aria-current={l === locale ? "true" : undefined}
              className="flex min-h-(--size-target-comfortable) items-center px-4 text-fg-default no-underline hover:bg-bg-subtle hover:text-fg-default aria-[current=true]:font-semibold aria-[current=true]:text-fg-brand"
            >
              {LANGUAGE_NAMES[l]}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
