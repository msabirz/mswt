import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import type { AlbumView, CauseView, EventView, NewsView } from "@/lib/content/queries";
import { formatDate, isoIst } from "@/lib/dates/format";
import { formatRupees } from "@/lib/money";
import { Badge } from "@/components/ui/Alert";
import { Card, CardBody, Progress } from "@/components/ui/Card";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

const titleLink = "text-fg-strong no-underline hover:underline";

export async function CauseCard({
  cause,
  locale,
  headingLevel = 3,
}: {
  cause: CauseView;
  locale: Locale;
  headingLevel?: 2 | 3;
}) {
  const t = await getTranslations("Causes");
  const H = `h${headingLevel}` as "h2" | "h3";
  const pct = cause.goalPaise ? Math.round((cause.raisedPaise / cause.goalPaise) * 100) : null;
  return (
    <Card>
      <ImagePlaceholder description={cause.title} className="rounded-none border-0" />
      <CardBody>
        <H className="text-xl">
          <a href={`/${locale}/causes/${cause.slug}`} className={titleLink}>
            {cause.title}
          </a>
        </H>
        {cause.status === "closed" ? <Badge>{t("closed")}</Badge> : null}
        <p className="text-fg-muted">{cause.summary}</p>
        {pct !== null ? (
          <div className="mt-auto">
            <Progress
              value={pct}
              label={t("progressLabel", { percent: Math.min(pct, 100) })}
              meta={
                <>
                  <span>{t("raised", { amount: formatRupees(cause.raisedPaise, locale) })}</span>
                  <span>{t("goal", { amount: formatRupees(cause.goalPaise!, locale) })}</span>
                </>
              }
            />
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

export function NewsCard({
  post,
  locale,
  publishedLabel,
}: {
  post: NewsView;
  locale: Locale;
  publishedLabel: string;
}) {
  return (
    <Card>
      <CardBody>
        <p className="text-sm text-fg-muted">
          <time dateTime={isoIst(post.publishedAt)}>{publishedLabel}</time>
        </p>
        <h3 className="text-xl">
          <a href={`/${locale}/news/${post.slug}`} className={titleLink}>
            {post.headline}
          </a>
        </h3>
        <p className="text-fg-muted">{post.excerpt}</p>
      </CardBody>
    </Card>
  );
}

const statusTone = {
  scheduled: "info",
  cancelled: "error",
  postponed: "warning",
  rescheduled: "warning",
  moved_online: "info",
} as const;

export async function EventCard({
  event,
  locale,
  headingLevel = 3,
}: {
  event: EventView;
  locale: Locale;
  headingLevel?: 2 | 3;
}) {
  const t = await getTranslations("Events");
  const H = `h${headingLevel}` as "h2" | "h3";
  return (
    <Card>
      <CardBody>
        <p className="text-sm text-fg-muted">
          <time dateTime={isoIst(event.startsAt)}>{formatDate(locale, event.startsAt, true)}</time>
        </p>
        <H className="text-xl">
          <a href={`/${locale}/events/${event.slug}`} className={titleLink}>
            {event.title}
          </a>
        </H>
        {event.eventStatus !== "scheduled" ? (
          <p>
            <Badge tone={statusTone[event.eventStatus]}>{t(`status.${event.eventStatus}`)}</Badge>
          </p>
        ) : null}
        <p className="text-fg-muted">{event.summary}</p>
      </CardBody>
    </Card>
  );
}

export async function AlbumCard({
  album,
  locale,
  headingLevel = 2,
}: {
  album: AlbumView;
  locale: Locale;
  headingLevel?: 2 | 3;
}) {
  const t = await getTranslations("Gallery");
  const H = `h${headingLevel}` as "h2" | "h3";
  return (
    <Card>
      <ImagePlaceholder description={album.items[0]?.alt ?? album.title} className="rounded-none border-0" />
      <CardBody>
        <H className="text-xl">
          <a href={`/${locale}/gallery/${album.slug}`} className={titleLink}>
            {album.title}
          </a>
        </H>
        <p className="text-sm text-fg-muted">{t("photos", { count: album.items.length })}</p>
      </CardBody>
    </Card>
  );
}
