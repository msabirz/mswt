import { getLocale, getTranslations } from "next-intl/server";

export default async function NotFound() {
  const [t, locale] = await Promise.all([getTranslations("NotFound"), getLocale()]);
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 text-center">
      <h1 className="text-4xl font-semibold">{t("title")}</h1>
      <p className="mx-auto mt-4 max-w-xl text-fg-muted">{t("body")}</p>
      <p className="mt-8">
        <a href={`/${locale}`} className="text-brand underline underline-offset-4">
          {t("home")}
        </a>
      </p>
    </section>
  );
}
