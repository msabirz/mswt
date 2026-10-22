import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { turnstileSiteKey } from "@/lib/contact/turnstile";
import { breadcrumbList, pageGraph, webPage } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/page";
import { getOrganizationSettings } from "@/lib/settings";
import { PAGES } from "@/config/nav";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHeader } from "@/components/content/PageHeader";
import { Panel } from "@/components/ui/Card";
import { TextLink } from "@/components/ui/TextLink";
import { ContactForm, type ContactStrings } from "./ContactForm";

export const revalidate = 3600;
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "Contact" });
  return pageMetadata({ locale, path: "/contact", title: t("title"), description: t("description") });
}

export default async function ContactPage({ params }: Props) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const [t, tc, org] = await Promise.all([
    getTranslations("Contact"),
    getTranslations("Common"),
    getOrganizationSettings(),
  ]);
  const crumbs = [
    { name: tc("home"), path: "" },
    { name: t("title"), path: "/contact" },
  ];
  const address = org
    ? [org.streetAddress, org.locality, org.city, org.state, org.pincode].filter(Boolean).join(", ")
    : "";
  const strings: ContactStrings = {
    name: t("name"),
    email: t("emailField"),
    phone: t("phoneField"),
    subject: t("subject"),
    message: t("message"),
    select: t("select"),
    subjects: {
      donation: t("subjects.donation"),
      help: t("subjects.help"),
      volunteer: t("subjects.volunteer"),
      other: t("subjects.other"),
    },
    required: tc("required"),
    optional: tc("optional"),
    send: t("send"),
    sending: t("sending"),
    sent: t("sent"),
    errorSummary: t("errorSummary"),
    captcha: t("captcha"),
    errors: {
      name: t("errors.name"),
      email: t("errors.email"),
      phone: t("errors.phone"),
      subject: t("errors.subject"),
      message: t("errors.message"),
      captcha: t("errors.captcha"),
      rate: t("errors.rate"),
      server: t("errors.server"),
    },
  };
  return (
    <div className="mx-auto max-w-(--size-container-max) px-4 py-12 lg:px-8">
      <JsonLd
        graph={pageGraph([
          webPage({
            type: "ContactPage",
            locale,
            path: "/contact",
            name: t("title"),
            description: t("description"),
            hasBreadcrumb: true,
          }),
          breadcrumbList(locale, "/contact", crumbs),
        ])}
      />
      <PageHeader
        crumbs={[{ label: tc("home"), href: `/${locale}` }, { label: t("title") }]}
        crumbLabel={tc("breadcrumb")}
        title={t("title")}
        lead={t("description")}
      />
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="form-h">
          <h2 id="form-h" className="mb-6 text-2xl">
            {t("formTitle")}
          </h2>
          <ContactForm locale={locale} siteKey={turnstileSiteKey()} t={strings} />
          <p className="mt-6 text-sm text-fg-muted">
            {PAGES.privacy.ready ? (
              <TextLink href={`/${locale}/privacy`}>{t("privacy")}</TextLink>
            ) : (
              t("privacy")
            )}
          </p>
        </section>
        <Panel className="grid gap-4">
          <h2 className="text-xl">{t("office")}</h2>
          {address ? <address className="not-italic">{address}</address> : null}
          <dl className="m-0 grid gap-3">
            <div>
              <dt className="font-semibold text-fg-strong">{t("email")}</dt>
              <dd className="m-0">
                <TextLink href={`mailto:${org?.email ?? "info@mswelfaretrust.org"}`}>
                  {org?.email ?? "info@mswelfaretrust.org"}
                </TextLink>
              </dd>
            </div>
            {org?.phones?.length ? (
              <div>
                <dt className="font-semibold text-fg-strong">{t("phone")}</dt>
                <dd className="m-0">
                  {org.phones.map((p) => (
                    <TextLink key={p} href={`tel:${p.replace(/\s/g, "")}`}>
                      {p}
                    </TextLink>
                  ))}
                </dd>
              </div>
            ) : null}
            {org?.contactHours?.[locale] ? (
              <div>
                <dt className="font-semibold text-fg-strong">{t("hours")}</dt>
                <dd className="m-0">{org.contactHours[locale]}</dd>
              </div>
            ) : null}
          </dl>
        </Panel>
      </div>
    </div>
  );
}
