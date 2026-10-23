import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo/page";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
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
    "paidLead",
    "amountLabel",
    "receiptTitle",
    "receiptNumber",
    "kind80g",
    "kindAck",
    "towards",
    "generalFund",
    "date",
    "email",
    "emailSent",
    "emailPending",
    "preparing",
    "download",
    "nextTitle",
    "next1",
    "next2For80g",
    "next2Ack",
    "next3",
    "transparency",
    "share",
    "shareText",
    "copied",
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
    <div className="mx-auto max-w-(--size-container-max) px-4 py-10 lg:px-8 lg:py-14">
      <Breadcrumbs
        label={tc("breadcrumb")}
        items={[{ label: tc("home"), href: `/${locale}` }, { label: t("title") }]}
      />
      {/* The page's single h1 is the outcome heading inside StatusPoller. */}
      <div className="mt-6">
        <StatusPoller locale={locale} t={strings} />
      </div>
    </div>
  );
}
