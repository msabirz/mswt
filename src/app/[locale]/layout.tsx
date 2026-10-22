import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import { hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { DEFAULT_SITE_FONT, fontVariables, poppinsPreloads } from "@/lib/fonts";
import { getSeoSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/seo/site";
import { SkipLink } from "@/components/ui/SkipLink";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const [t, seo] = await Promise.all([
    getTranslations({ locale: lang, namespace: "Meta" }),
    getSeoSettings(),
  ]);
  const template = seo?.titleTemplate[lang] || `%s | ${t("siteName")}`;
  return {
    metadataBase: siteUrl(),
    title: { template, default: t("homeTitle") },
    description: seo?.defaultDescription[lang] || t("homeDescription"),
    applicationName: t("siteName"),
    icons: { icon: "/brand/mswt-mark-compact.svg" },
    verification: {
      ...(seo?.googleSiteVerification ? { google: seo.googleSiteVerification } : {}),
      ...(seo?.bingSiteVerification ? { other: { "msvalidate.01": seo.bingSiteVerification } } : {}),
    },
  };
}

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
  const [t, messages] = await Promise.all([getTranslations("Layout"), getMessages()]);
  for (const href of poppinsPreloads(locale))
    preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });

  return (
    // The site font becomes admin-configurable in Step 8 (appearance_settings.site_font).
    <html lang={locale} className={fontVariables} data-site-font={DEFAULT_SITE_FONT}>
      <body className="min-h-screen bg-bg-canvas text-fg-default">
        <SkipLink label={t("skip")} />
        <SiteHeader locale={locale} />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter locale={locale} />
        {/* Strings for the client error page (src/app/[locale]/error.tsx), without shipping an i18n runtime. */}
        <div id="error-strings" hidden data-strings={JSON.stringify(messages.Error)} />
      </body>
    </html>
  );
}
