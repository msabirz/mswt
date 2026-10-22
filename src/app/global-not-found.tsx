import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Typography";
import { SiteShell } from "@/components/layout/SiteShell";

/**
 * 404 for every URL that matches no route (e.g. /en/does-not-exist). Next.js renders this without
 * any layout, so it builds the full page itself and the response is complete server-rendered HTML
 * with status 404 (crawlers and no-JS clients see the real page). Content routes that call
 * notFound() for an unknown slug use src/app/[locale]/not-found.tsx instead.
 */
// (Next.js adds <meta name="robots" content="noindex"> to not-found pages itself.)
export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const [t, tm] = await Promise.all([
    getTranslations({ locale, namespace: "NotFound" }),
    getTranslations({ locale, namespace: "Meta" }),
  ]);
  return {
    title: `${t("metaTitle")} | ${tm("siteName")}`,
    icons: { icon: "/brand/mswt-mark-compact.svg" },
  };
}

export default async function GlobalNotFound() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: "NotFound" });
  return (
    <SiteShell locale={locale}>
      <section className="mx-auto max-w-(--size-container-max) px-4 py-24 text-center lg:px-8">
        <Eyebrow>404</Eyebrow>
        <h1 className="text-4xl">{t("title")}</h1>
        <p className="mx-auto mt-4 max-w-xl text-fg-muted">{t("body")}</p>
        <div className="mt-8 flex justify-center">
          <ButtonLink href={`/${locale}`}>{t("home")}</ButtonLink>
        </div>
      </section>
    </SiteShell>
  );
}
