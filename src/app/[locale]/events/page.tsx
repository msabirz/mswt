import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getEvents, splitEvents } from "@/lib/content/queries";
import { breadcrumbList, pageGraph, webPage } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/page";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHeader } from "@/components/content/PageHeader";
import { SampleBanner } from "@/components/content/Banners";
import { EventCard } from "@/components/content/Cards";
import { EmptyState } from "@/components/ui/EmptyState";
import { HeadingRule } from "@/components/ui/Typography";

// Upcoming/past is decided when the page is rendered, so refresh at least hourly.
export const revalidate = 3600;
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "Events" });
  return pageMetadata({ locale, path: "/events", title: t("title"), description: t("description") });
}

export default async function EventsPage({ params }: Props) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const [t, tc, events] = await Promise.all([
    getTranslations("Events"),
    getTranslations("Common"),
    getEvents(locale),
  ]);
  const { upcoming, past } = splitEvents(events);
  const crumbs = [
    { name: tc("home"), path: "" },
    { name: t("title"), path: "/events" },
  ];
  return (
    <div className="mx-auto max-w-(--size-container-max) px-4 py-12 lg:px-8">
      <JsonLd
        graph={pageGraph([
          webPage({
            type: "CollectionPage",
            locale,
            path: "/events",
            name: t("title"),
            description: t("description"),
            hasBreadcrumb: true,
          }),
          breadcrumbList(locale, "/events", crumbs),
        ])}
      />
      <PageHeader
        crumbs={[{ label: tc("home"), href: `/${locale}` }, { label: t("title") }]}
        crumbLabel={tc("breadcrumb")}
        title={t("title")}
        lead={t("description")}
      />
      <SampleBanner show={events.some((e) => e.isSample)} />
      {[
        { id: "upcoming", title: t("upcoming"), items: upcoming, empty: t("emptyUpcoming") },
        { id: "past", title: t("past"), items: past, empty: t("emptyPast") },
      ].map((group) => (
        <section key={group.id} aria-labelledby={`${group.id}-h`} className="mb-14">
          <HeadingRule id={`${group.id}-h`} className="mb-6 text-3xl">
            {group.title}
          </HeadingRule>
          {group.items.length === 0 ? (
            <EmptyState>{group.empty}</EmptyState>
          ) : (
            <ul className="m-0 grid list-none gap-6 p-0 md:grid-cols-2 lg:grid-cols-3">
              {group.items.map((e) => (
                <li key={e.slug} className="grid">
                  <EventCard event={e} locale={locale} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
