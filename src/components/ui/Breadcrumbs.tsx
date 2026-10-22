export type Crumb = { label: string; href?: string };

/** Breadcrumb trail. The last item is the current page (no link). JSON-LD is added in Step 5. */
export function Breadcrumbs({ items, label }: { items: Crumb[]; label: string }) {
  return (
    <nav aria-label={label} className="mb-6 text-sm">
      <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-2">
              {i > 0 ? (
                <span aria-hidden="true" className="text-fg-hint">
                  /
                </span>
              ) : null}
              {last || !c.href ? (
                <span aria-current={last ? "page" : undefined} className="text-fg-muted">
                  {c.label}
                </span>
              ) : (
                <a
                  href={c.href}
                  className="text-link-default underline underline-offset-4 hover:text-link-hover"
                >
                  {c.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
