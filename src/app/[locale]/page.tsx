import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { Eyebrow } from "@/components/ui/Typography";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Meta" });
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    alternates: {
      canonical: `/${locale}`,
      languages: { ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])), "x-default": "/en" },
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Home");

  return (
    <>
      <section className="mx-auto max-w-(--size-container-max) px-4 py-16 lg:px-8 lg:py-24">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="max-w-3xl text-4xl lg:text-5xl">{t("h1")}</h1>
        <p className="mt-6 max-w-2xl text-xl text-fg-muted">{t("intro")}</p>
      </section>
      <section aria-labelledby="why-h" className="bg-bg-subtle py-12 lg:py-20">
        <div className="mx-auto max-w-(--size-container-max) px-4 lg:px-8">
          <h2 id="why-h" className="sr-only">
            {t("whyTitle")}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {(["1", "2", "3"] as const).map((n) => (
              <div key={n} className="border-t-2 border-border-rule pt-3">
                <h3 className="mb-2 text-xl">{t(`trust${n}t`)}</h3>
                <p className="text-fg-muted">{t(`trust${n}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
