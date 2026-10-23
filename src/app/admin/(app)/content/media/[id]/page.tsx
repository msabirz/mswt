import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { requireCapability } from "@/lib/admin/guard";
import { istDateTime } from "@/lib/admin/format";
import { getMediaItem, mediaUsage } from "@/lib/admin/media";
import { LANGUAGES } from "@/lib/admin/languages";
import { AdminForm } from "@/components/admin/AdminForm";
import { Card, Details, PageHeader, Section } from "@/components/admin/ui";
import { ResponsiveImage } from "@/components/content/ResponsiveImage";
import { Alert } from "@/components/ui/Alert";
import { deleteMediaAction, updateMediaTextAction } from "../../actions";

export const metadata: Metadata = { title: "Photo" };
type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> };

export default async function MediaItemPage({ params, searchParams }: Props) {
  await requireCapability("cms.write");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [item, usage, q] = await Promise.all([getMediaItem(id), mediaUsage(id), searchParams]);
  if (!item) notFound();
  const { row, image, text } = item;
  return (
    <>
      <PageHeader back={{ href: "/admin/content/media", label: "Media" }} title={row.filename} />
      {q.uploaded ? (
        <Alert tone="success" live="polite">
          <p>Photo uploaded. Add alt text in the other languages it will appear in.</p>
        </Alert>
      ) : null}
      <Card>
        <Section id="photo" title="Photo">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_16rem]">
            <ResponsiveImage
              image={image}
              alt={image.alt ?? row.filename}
              sizes="(min-width: 768px) 480px, 100vw"
            />
            <Details
              items={[
                { label: "Size", value: `${row.width}×${row.height}` },
                { label: "Copies", value: row.variants.map((w) => `${w}px`).join(", ") || "None" },
                { label: "Uploaded", value: istDateTime(row.createdAt) },
              ]}
            />
          </div>
        </Section>
        <Section id="usage" title="Used in" description="A photo that is used can't be deleted.">
          {usage.length ? (
            <ul className="m-0 grid gap-1 pl-5 text-sm">
              {usage.map((u) => (
                <li key={u.label}>
                  <Link href={u.href} className="text-link-default">
                    {u.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-sm text-fg-muted">Not used yet.</p>
          )}
        </Section>
      </Card>
      <AdminForm
        id="media-text"
        action={updateMediaTextAction.bind(null, id)}
        submitLabel="Save"
        sticky
        sections={routing.locales.map((l) => ({
          title: LANGUAGES[l].name,
          description:
            l === "en"
              ? "Required."
              : "Leave empty if the photo won't appear in this language. Pages can't be marked reviewed while a photo lacks alt text in their language.",
          fields: [
            {
              name: `alt_${l}`,
              label: "Alt text",
              required: l === "en",
              lang: l,
              defaultValue: text[l]?.alt ?? "",
              maxLength: 250,
              span: "full",
            },
            {
              name: `caption_${l}`,
              label: "Caption",
              lang: l,
              defaultValue: text[l]?.caption ?? "",
              maxLength: 300,
              span: "full",
            },
          ],
        }))}
      />
      {usage.length === 0 ? (
        <Card>
          <Section id="delete" title="Delete" description="Removes the photo and its web copies.">
            <AdminForm
              id="delete-media"
              action={deleteMediaAction.bind(null, id)}
              submitLabel="Delete photo"
              variant="danger"
              confirm="Delete this photo? This can't be undone."
              fields={[]}
            />
          </Section>
        </Card>
      ) : null}
    </>
  );
}
