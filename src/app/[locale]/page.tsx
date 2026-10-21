import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as (typeof routing.locales)[number], namespace: "Meta" });
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
        "x-default": "/en",
      },
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as (typeof routing.locales)[number]);
  const t = await getTranslations("Home");

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 lg:py-24">
      <p className="mb-2 text-sm font-semibold tracking-[var(--tracking-caps)] text-brand uppercase">
        {t("eyebrow")}
      </p>
      <h1 className="max-w-3xl text-4xl leading-tight font-semibold text-balance lg:text-5xl">{t("h1")}</h1>
      <p className="mt-6 max-w-2xl text-xl text-fg-muted">{t("intro")}</p>
    </section>
  );
}
