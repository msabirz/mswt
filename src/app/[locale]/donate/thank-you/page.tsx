import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo/page";
import { PageHeader } from "@/components/content/PageHeader";
import { StatusPoller, type ThankYouStrings } from "./StatusPoller";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "ThankYou" });
  return pageMetadata({
    locale,
    path: "/donate/thank-you",
    title: t("title"),
    description: t("checking"),
    noindex: true,
  });
}

/**
 * Where Cashfree sends the donor back. It shows the status the webhook recorded, polling until it
 * arrives; the redirect itself never changes a payment (CLAUDE.md). The page is static per locale;
 * the order id is read in the browser, so no personal data is rendered on the server.
 */
export default async function ThankYouPage({ params }: Props) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const [t, tc] = await Promise.all([getTranslations("ThankYou"), getTranslations("Common")]);
  const keys = [
    "checking",
    "checkingHint",
    "paidTitle",
    "paid",
    "receipt",
    "download",
    "emailed",
    "failedTitle",
    "failed",
    "retry",
    "retrying",
    "pendingTitle",
    "pending",
    "notFound",
    "home",
  ] as const;
  const strings = Object.fromEntries(keys.map((k) => [k, t.raw(k) as string])) as ThankYouStrings;
  return (
    <div className="mx-auto max-w-(--size-container-max) px-4 py-12 lg:px-8">
      <PageHeader
        crumbs={[{ label: tc("home"), href: `/${locale}` }, { label: t("title") }]}
        crumbLabel={tc("breadcrumb")}
        title={t("title")}
      />
      <StatusPoller locale={locale} t={strings} />
    </div>
  );
}
