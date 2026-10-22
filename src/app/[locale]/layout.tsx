import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { DEFAULT_SITE_FONT, fontVariables, poppinsPreloads } from "@/lib/fonts";
import { SkipLink } from "@/components/ui/SkipLink";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import "../globals.css";

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
      </body>
    </html>
  );
}
