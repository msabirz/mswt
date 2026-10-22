import { cn } from "@/lib/cn";
import { buttonClasses } from "./Button";

/** Previous/next pagination with the current page announced (links are plain anchors, no JS). */
export function Pagination({
  page,
  total,
  hrefFor,
  labels,
}: {
  page: number;
  total: number;
  hrefFor: (page: number) => string;
  labels: { nav: string; previous: string; next: string; pageOf: string };
}) {
  if (total <= 1) return null;
  return (
    <nav aria-label={labels.nav} className="mt-10 flex flex-wrap items-center justify-between gap-4">
      {page > 1 ? (
        <a href={hrefFor(page - 1)} rel="prev" className={buttonClasses({ variant: "secondary" })}>
          ← {labels.previous}
        </a>
      ) : (
        <span />
      )}
      <p aria-current="page" className="text-fg-muted">
        {labels.pageOf}
      </p>
      {page < total ? (
        <a href={hrefFor(page + 1)} rel="next" className={cn(buttonClasses({ variant: "secondary" }))}>
          {labels.next} →
        </a>
      ) : (
        <span />
      )}
    </nav>
  );
}
