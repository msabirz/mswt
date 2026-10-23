import Link from "next/link";
import { routing, type Locale } from "@/i18n/routing";
import { LANGUAGES } from "@/lib/admin/languages";

export type TranslationState = "missing" | "draft" | "reviewed";
const STATE_LABEL: Record<TranslationState, string> = {
  missing: "Not written",
  draft: "Draft",
  reviewed: "Reviewed",
};
const DOT: Record<TranslationState, string> = {
  missing: "bg-bg-muted border border-border-input",
  draft: "bg-status-warning-solid-bg",
  reviewed: "bg-status-success-solid-bg",
};

/** One tab per language with its review state; each tab is a link (?lang=), so it works without JS. */
export function LanguageTabs({
  href,
  current,
  states,
}: {
  href: (locale: Locale) => string;
  current: Locale;
  states: Record<Locale, TranslationState>;
}) {
  return (
    <nav aria-label="Languages" className="overflow-x-auto">
      <ul className="m-0 flex min-w-max list-none gap-1 border-b border-border-decorative p-0">
        {routing.locales.map((l) => (
          <li key={l}>
            <Link
              href={href(l)}
              aria-current={l === current ? "page" : undefined}
              className="-mb-px flex min-h-11 items-center gap-2 border-b-2 border-transparent px-4 text-sm font-medium text-fg-muted no-underline hover:text-fg-strong aria-[current=page]:border-action-primary-bg aria-[current=page]:text-fg-strong"
            >
              <span lang={l}>{LANGUAGES[l].native}</span>
              <span aria-hidden="true" className={`size-2 rounded-full ${DOT[states[l]]}`} />
              <span className="sr-only">({STATE_LABEL[states[l]]})</span>
              <span aria-hidden="true" className="text-xs font-normal text-fg-muted">
                {STATE_LABEL[states[l]]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function translationState(row: { reviewedAt: Date | null } | undefined): TranslationState {
  return !row ? "missing" : row.reviewedAt ? "reviewed" : "draft";
}

export function pickLocale(value: string | undefined): Locale {
  return routing.locales.find((l) => l === value) ?? "en";
}
