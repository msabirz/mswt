import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { SkipLink } from "@/components/ui/SkipLink";

export type AdminNavItem = { key: string; label: string; href: string };

/** Admin layout: dark sidebar + content area. English only (admin is not localised). Used from Step 8. */
export function AdminShell({
  nav,
  current,
  children,
}: {
  nav: AdminNavItem[];
  current?: string;
  children: ReactNode;
}) {
  return (
    <>
      <SkipLink label="Skip to main content" />
      <div className="grid min-h-screen grid-cols-[minmax(0,1fr)] lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="on-dark bg-bg-inverse px-4 py-6 text-fg-inverse-muted">
          <Logo variant="reversed" alt="MS Welfare Trust admin" width={200} className="mb-8" />
          <nav aria-label="Admin">
            <ul className="m-0 grid list-none gap-1 p-0">
              {nav.map((item) => (
                <li key={item.key}>
                  <a
                    href={item.href}
                    aria-current={item.key === current ? "page" : undefined}
                    className="flex min-h-(--size-target-comfortable) items-center rounded-md px-3 text-fg-inverse no-underline hover:bg-neutral-900 hover:text-fg-inverse aria-[current=page]:border-l-4 aria-[current=page]:border-link-inverse aria-[current=page]:bg-neutral-900"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <main id="main" tabIndex={-1} className="min-w-0 bg-bg-subtle p-6 lg:p-10">
          {children}
        </main>
      </div>
    </>
  );
}
