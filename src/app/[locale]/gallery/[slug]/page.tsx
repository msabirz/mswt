import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { albumsFrom, getAlbum } from "@/lib/content/queries";
import { getSiteContent } from "@/lib/content/source";
import { breadcrumbList, pageGraph, webPage } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/page";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHeader } from "@/components/content/PageHeader";
import { SampleBanner } from "@/components/content/Banners";
import { EmptyState } from "@/components/ui/EmptyState";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

export const revalidate = 3600;
type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const content = await getSiteContent();
  return routing.locales.flatMap((locale) =>
    albumsFrom(content, locale).map((a) => ({ locale, slug: a.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const album = await getAlbum(locale as Locale, slug);
  if (!album) return {};
  return pageMetadata({
    locale: locale as Locale,
    path: `/gallery/${slug}`,
    title: album.seoTitle ?? album.title,
    description: album.seoDescription ?? album.description ?? album.title,
    locales: album.locales,
  });
}

export default async function AlbumPage({ params }: Props) {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);
  const album = await getAlbum(locale, slug);
  if (!album) notFound();
  const [t, tc] = await Promise.all([getTranslations("Gallery"), getTranslations("Common")]);
  const path = `/gallery/${slug}`;
  const crumbs = [
    { name: tc("home"), path: "" },
    { name: t("title"), path: "/gallery" },
    { name: album.title, path },
  ];
  // ImageObject nodes are added once photos have real URLs (R2, Step 8); placeholders have none.
  return (
    <div className="mx-auto max-w-(--size-container-max) px-4 py-12 lg:px-8">
      <JsonLd
        graph={pageGraph([
          webPage({
            type: "CollectionPage",
            locale,
            path,
            name: album.title,
            description: album.description,
            hasBreadcrumb: true,
          }),
          breadcrumbList(locale, path, crumbs),
        ])}
      />
      <PageHeader
        crumbs={[
          { label: tc("home"), href: `/${locale}` },
          { label: t("title"), href: `/${locale}/gallery` },
          { label: album.title },
        ]}
        crumbLabel={tc("breadcrumb")}
        title={album.title}
        lead={album.description}
      />
      <SampleBanner show={album.isSample} />
      {album.items.length === 0 ? (
        <EmptyState>{t("photoPending")}</EmptyState>
      ) : (
        <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {album.items.map((item, i) => (
            <li key={i}>
              <figure className="m-0 grid gap-2">
                <ImagePlaceholder description={item.alt} />
                {item.caption ? (
                  <figcaption className="text-sm text-fg-muted">{item.caption}</figcaption>
                ) : null}
              </figure>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
