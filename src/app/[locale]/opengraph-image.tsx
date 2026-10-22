import { getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { OG_SIZE, localeOgImage } from "@/lib/seo/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "MS Welfare Trust";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [t, tm] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "Home" }),
    getTranslations({ locale: locale as Locale, namespace: "Meta" }),
  ]);
  return localeOgImage(locale, t("h1"), tm("siteName"));
}
