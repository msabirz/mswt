import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import "../globals.css";

const LANGUAGE_NAMES = { en: "English", hi: "हिन्दी", mr: "मराठी", gu: "ગુજરાતી" } as const;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  icons: { icon: "/brand/mswt-mark-compact.svg" },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Layout");

  return (
    <html lang={locale}>
      <body className="min-h-screen">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-10 focus:rounded-md focus:bg-inverse focus:px-4 focus:py-2 focus:text-white"
        >
          {t("skip")}
        </a>
        <header className="border-b border-subtle">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
            <a href={`/${locale}`} className="inline-flex">
              {/* eslint-disable-next-line @next/next/no-img-element -- SVG logo, no optimisation needed */}
              <img src="/brand/mswt-logo-horizontal.svg" alt={t("logoHome")} width={204} height={64} />
            </a>
            <nav aria-label={t("language")}>
              <ul className="flex flex-wrap gap-2">
                {routing.locales.map((l) => (
                  <li key={l}>
                    <a
                      href={`/${l}`}
                      lang={l}
                      hrefLang={l}
                      aria-current={l === locale ? "true" : undefined}
                      className="inline-flex min-h-11 items-center rounded-md px-3 underline-offset-4 hover:underline aria-[current=true]:font-semibold aria-[current=true]:text-brand"
                    >
                      {LANGUAGE_NAMES[l]}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <footer className="mt-24 border-t-2 border-rule bg-inverse text-on-inverse">
          <div className="mx-auto max-w-7xl px-4 py-10 text-sm">
            <p>{t("rights")}</p>
            <p>{t("reg")}</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
