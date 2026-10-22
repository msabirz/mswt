import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { FOOTER_NAV, LEGAL_NAV, pageHref, readyPages, type PageKey } from "@/config/nav";
import { Logo } from "@/components/ui/Logo";

const linkClass =
  "inline-flex min-h-(--size-target-min) items-center text-link-inverse underline underline-offset-4";

export async function SiteFooter({ locale }: { locale: Locale }) {
  const [t, tn, tl] = await Promise.all([
    getTranslations("Footer"),
    getTranslations("Nav"),
    getTranslations("Layout"),
  ]);
  const label = (k: PageKey) =>
    k === "privacy" || k === "terms" || k === "refund" || k === "disclaimer80g" ? t(k) : tn(k as "about");
  const groups = (["explore", "trust"] as const)
    .map((g) => ({ g, items: readyPages(FOOTER_NAV[g]) }))
    .filter((x) => x.items.length > 0);
  const legal = readyPages(LEGAL_NAV);

  return (
    <footer className="on-dark mt-24 border-t-2 border-border-rule bg-bg-inverse py-12 text-fg-inverse-muted">
      <div className="mx-auto grid max-w-(--size-container-max) gap-8 px-4 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div className="grid content-start gap-4">
          <a href={pageHref(locale, "home")} className="inline-flex">
            <Logo variant="reversed" alt={tl("logoHome")} width={240} lazy />
          </a>
          <p className="max-w-prose">{t("about")}</p>
          <p className="text-sm">{t("noFcra")}</p>
        </div>
        {groups.map(({ g, items }) => (
          <nav key={g} aria-label={t(g)}>
            <h2 className="mb-3 text-base text-fg-inverse">{t(g)}</h2>
            <ul className="m-0 grid list-none gap-1 p-0">
              {items.map((k) => (
                <li key={k}>
                  <a href={pageHref(locale, k)} className={linkClass}>
                    {label(k)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div>
          <h2 className="mb-3 text-base text-fg-inverse">{t("help")}</h2>
          <ul className="m-0 grid list-none gap-1 p-0">
            <li>
              <a href="mailto:info@mswelfaretrust.org" className={linkClass}>
                info@mswelfaretrust.org
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-(--size-container-max) flex-wrap justify-between gap-4 border-t border-neutral-800 px-4 pt-6 text-sm lg:px-8">
        <p>
          {tl("rights")}. {tl("reg")}.
        </p>
        {legal.length > 0 ? (
          <ul className="m-0 flex list-none flex-wrap gap-x-4 p-0">
            {legal.map((k) => (
              <li key={k}>
                <a href={pageHref(locale, k)} className={linkClass}>
                  {label(k)}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </footer>
  );
}
