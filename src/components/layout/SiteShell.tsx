import type { ReactNode } from "react";
import { preload } from "react-dom";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { DEFAULT_SITE_FONT, fontVariables, poppinsPreloads } from "@/lib/fonts";
import { getAppearanceSettings } from "@/lib/settings";
import { SkipLink } from "@/components/ui/SkipLink";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import "@/app/globals.css";

/**
 * The page frame: <html lang>, skip link, header, <main>, footer. Used by the locale layout and by
 * app/global-not-found.tsx (which Next.js renders without any layout), so both look the same.
 */
export async function SiteShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  setRequestLocale(locale);
  const [t, messages, appearance] = await Promise.all([
    getTranslations("Layout"),
    getMessages(),
    getAppearanceSettings().catch(() => null),
  ]);
  const siteFont = appearance?.siteFont ?? DEFAULT_SITE_FONT;
  for (const href of poppinsPreloads(locale, siteFont))
    preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });

  return (
    // Site font: Settings → Appearance (appearance_settings.site_font).
    <html lang={locale} className={fontVariables} data-site-font={siteFont}>
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
