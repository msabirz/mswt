import { getLocale, getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Typography";

// Next.js returns HTTP 404 and adds <meta name="robots" content="noindex"> for this page.
export default async function NotFound() {
  const [t, tm, locale] = await Promise.all([
    getTranslations("NotFound"),
    getTranslations("Meta"),
    getLocale(),
  ]);
  return (
    <section className="mx-auto max-w-(--size-container-max) px-4 py-24 text-center lg:px-8">
      <title>{`${t("metaTitle")} | ${tm("siteName")}`}</title>
      <Eyebrow>404</Eyebrow>
      <h1 className="text-4xl">{t("title")}</h1>
      <p className="mx-auto mt-4 max-w-xl text-fg-muted">{t("body")}</p>
      <div className="mt-8 flex justify-center">
        <ButtonLink href={`/${locale}`}>{t("home")}</ButtonLink>
      </div>
    </section>
  );
}
