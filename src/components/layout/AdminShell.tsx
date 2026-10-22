import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { SkipLink } from "@/components/ui/SkipLink";
import { AdminNavLinks } from "./AdminNavLinks";

export type AdminNavItem = { key: string; label: string; href: string };

/** Admin layout: dark sidebar + content area. English only (admin is not localised). */
export function AdminShell({
  nav,
  account,
  children,
}: {
  nav: AdminNavItem[];
  /** Signed-in user and sign-out, shown under the navigation. */
  account?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <SkipLink label="Skip to main content" />
      <div className="grid min-h-screen grid-cols-[minmax(0,1fr)] lg:grid-cols-[16rem_minmax(0,1fr)]">
        <header className="on-dark grid content-start gap-8 bg-bg-inverse px-4 py-6 text-fg-inverse-muted">
          <Link href="/admin" className="inline-block w-fit">
            <Logo variant="reversed" alt="MS Welfare Trust admin – home" width={200} />
          </Link>
          <nav aria-label="Admin">
            <AdminNavLinks nav={nav} />
          </nav>
          {account}
        </header>
        <main id="main" tabIndex={-1} className="min-w-0 bg-bg-subtle p-6 lg:p-10">
          {children}
        </main>
      </div>
    </>
  );
}
