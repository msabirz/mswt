import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";

// Admin layout pieces: compact, card-based, token classes only (docs/brand.md).

/** Page title row: optional back link, title, description, and actions on the right. */
export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="grid gap-2">
      {back ? (
        <Link
          href={back.href}
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-fg-muted no-underline hover:text-fg-strong"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-2xl">{title}</h1>
          {description ? <p className="m-0 max-w-2xl text-sm text-fg-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

/** White card with a border; the base surface of the admin. */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-border-decorative bg-bg-canvas", className)}>{children}</div>
  );
}

/** Settings-style section: title + description on the left, content on the right (stacked on small screens). */
export function Section({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  const headingId = id ? `${id}-h` : undefined;
  return (
    <section
      aria-labelledby={headingId}
      className="grid gap-4 border-b border-border-decorative p-5 last:border-b-0 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-8 md:p-6"
    >
      <div className="grid content-start gap-1">
        <h2 id={headingId} className="text-base font-semibold text-fg-strong">
          {title}
        </h2>
        {description ? <p className="m-0 text-sm text-fg-muted">{description}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** Small figure tile for the dashboard. */
export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Card className="grid gap-2 p-5">
      <div className="flex items-center justify-between gap-2 text-sm font-medium text-fg-muted">
        {label}
        {icon ? (
          <span aria-hidden="true" className="text-fg-brand">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="m-0 text-2xl font-semibold text-fg-strong">{value}</p>
      {hint ? <p className="m-0 text-xs text-fg-muted">{hint}</p> : null}
    </Card>
  );
}

/** Compact data table inside a card. Pass <thead>/<tbody> rows built with Th/Td. */
export function DataTable({
  caption,
  children,
  footer,
}: {
  caption: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          {children}
        </table>
      </div>
      {footer ? <div className="border-t border-border-decorative px-4 py-3 text-sm">{footer}</div> : null}
    </Card>
  );
}

export function Th({
  children,
  align,
  className,
}: {
  children?: ReactNode;
  align?: "right";
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-border-decorative bg-bg-subtle px-4 py-2.5 text-xs font-semibold tracking-wide whitespace-nowrap text-fg-muted uppercase",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align,
  className,
  header,
}: {
  children?: ReactNode;
  align?: "right";
  className?: string;
  /** Render as the row's header cell (first column). */
  header?: boolean;
}) {
  const cls = cn("px-4 py-2.5 align-top", align === "right" && "text-right tabular-nums", className);
  return header ? (
    <th scope="row" className={cn(cls, "font-medium")}>
      {children}
    </th>
  ) : (
    <td className={cls}>{children}</td>
  );
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="border-b border-border-decorative last:border-b-0 hover:bg-bg-subtle">{children}</tr>;
}

/** Label/value pairs, two columns on wide screens. */
export function Details({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="m-0 grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {items.map((i) => (
        <div key={i.label} className="grid gap-0.5">
          <dt className="text-xs font-semibold tracking-wide text-fg-muted uppercase">{i.label}</dt>
          <dd className="m-0 text-sm break-words text-fg-default">{i.value ?? "–"}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A GET filter form laid out as one compact row (wraps on small screens). */
export function FilterBar({ children, resetHref }: { children: ReactNode; resetHref: string }) {
  return (
    <Card className="p-4">
      <form method="get" className="flex flex-wrap items-end gap-3">
        {children}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="min-h-10 rounded-md bg-action-primary-bg px-4 text-sm font-semibold text-action-primary-fg hover:bg-action-primary-bg-hover"
          >
            Apply
          </button>
          <Link href={resetHref} className="min-h-10 content-center px-2 text-sm font-medium text-fg-muted">
            Reset
          </Link>
        </div>
      </form>
    </Card>
  );
}

/** Compact labelled control for FilterBar. */
export function FilterField({
  id,
  label,
  children,
  wide,
}: {
  id: string;
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={cn("grid gap-1", wide ? "w-full sm:w-64" : "w-full sm:w-40")}>
      <label htmlFor={id} className="text-xs font-semibold text-fg-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

export const compactControl =
  "w-full min-h-10 rounded-md border border-border-input bg-bg-canvas px-3 py-1.5 text-sm text-fg-default placeholder:text-fg-hint";
