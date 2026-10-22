import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getAlbums } from "@/lib/content/queries";
import { breadcrumbList, pageGraph, webPage } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/page";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHeader } from "@/components/content/PageHeader";
import { SampleBanner } from "@/components/content/Banners";
import { AlbumCard } from "@/components/content/Cards";
import { EmptyState } from "@/components/ui/EmptyState";

export const revalidate = 3600;
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "Gallery" });
  return pageMetadata({ locale, path: "/gallery", title: t("title"), description: t("description") });
}

export default async function GalleryPage({ params }: Props) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const [t, tc, albums] = await Promise.all([
    getTranslations("Gallery"),
    getTranslations("Common"),
    getAlbums(locale),
  ]);
  const crumbs = [
    { name: tc("home"), path: "" },
    { name: t("title"), path: "/gallery" },
  ];
  return (
    <div className="mx-auto max-w-(--size-container-max) px-4 py-12 lg:px-8">
      <JsonLd
        graph={pageGraph([
          webPage({
            type: "CollectionPage",
            locale,
            path: "/gallery",
            name: t("title"),
            description: t("description"),
            hasBreadcrumb: true,
          }),
          breadcrumbList(locale, "/gallery", crumbs),
        ])}
      />
      <PageHeader
        crumbs={[{ label: tc("home"), href: `/${locale}` }, { label: t("title") }]}
        crumbLabel={tc("breadcrumb")}
        title={t("title")}
        lead={t("description")}
      />
      <SampleBanner show={albums.some((a) => a.isSample)} />
      {albums.length === 0 ? (
        <EmptyState>{t("empty")}</EmptyState>
      ) : (
        <ul className="m-0 grid list-none gap-6 p-0 md:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <li key={a.slug} className="grid">
              <AlbumCard album={a} locale={locale} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
