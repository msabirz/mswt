import type { Metadata } from "next";
import Link from "next/link";
import { requireCapability } from "@/lib/admin/guard";
import { istDate } from "@/lib/admin/format";
import { listMedia } from "@/lib/admin/media";
import { getMediaStorage } from "@/lib/storage/media";
import { MediaUploadForm } from "@/components/admin/MediaUploadForm";
import { Card, PageHeader, Section } from "@/components/admin/ui";
import { Alert, Badge } from "@/components/ui/Alert";
import { uploadMediaAction } from "../actions";

export const metadata: Metadata = { title: "Media" };
type Props = { searchParams: Promise<Record<string, string | undefined>> };

const kb = (n: number | null) => (n ? `${Math.round(n / 1024)} KB` : "–");

export default async function MediaPage({ searchParams }: Props) {
  await requireCapability("cms.write");
  const [items, q] = await Promise.all([listMedia(), searchParams]);
  const storage = getMediaStorage();
  return (
    <>
      <PageHeader
        title="Media"
        description="Photos for pages, causes and the gallery. Each needs alt text in every language it appears in."
      />
      {q.deleted ? (
        <Alert tone="success" live="polite">
          <p>Photo deleted.</p>
        </Alert>
      ) : null}
      <Card>
        <Section
          id="upload"
          title="Upload a photo"
          description="Add alt text in other languages after uploading."
        >
          <MediaUploadForm
            action={uploadMediaAction}
            disabled={
              storage
                ? undefined
                : "Media storage isn’t set up for this environment yet: a public R2 bucket with R2_MEDIA_BUCKET and R2_MEDIA_PUBLIC_URL (docs/manual-checks.md)."
            }
          />
        </Section>
      </Card>
      <section aria-labelledby="library-h" className="grid gap-3">
        <h2 id="library-h" className="text-lg">
          Library <span className="text-sm font-normal text-fg-muted">({items.length})</span>
        </h2>
        {items.length ? (
          <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 sm:grid-cols-3 xl:grid-cols-4">
            {items.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/admin/content/media/${m.id}`}
                  className="grid gap-2 rounded-lg border border-border-decorative bg-bg-canvas p-2 text-sm text-fg-default no-underline hover:border-border-input hover:bg-bg-subtle"
                >
                  {m.image.srcset ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.image.srcset.split(" ")[0]}
                      alt=""
                      width={m.width}
                      height={m.height}
                      loading="lazy"
                      className="aspect-[4/3] h-auto w-full rounded-md bg-bg-muted object-cover"
                    />
                  ) : (
                    <span className="block aspect-[4/3] w-full rounded-md bg-bg-muted" />
                  )}
                  <span className="truncate font-medium text-fg-strong">{m.filename}</span>
                  <span className="text-xs text-fg-muted">
                    {m.width}×{m.height} · {kb(m.bytes)} · {istDate(m.createdAt)}
                  </span>
                  <span className="flex flex-wrap gap-1">
                    {m.languages.map((l) => (
                      <Badge key={l} tone="neutral">
                        {l.toUpperCase()}
                      </Badge>
                    ))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-fg-muted">No photos yet.</p>
        )}
      </section>
    </>
  );
}
