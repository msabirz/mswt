import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { SkipLink } from "@/components/ui/SkipLink";
import { AdminMobileNav } from "./AdminMobileNav";
import { AdminNavLinks } from "./AdminNavLinks";

export type AdminNavItem = { key: string; label: string; href: string; icon: string };
export type AdminNavGroup = { label: string; items: AdminNavItem[] };

/**
 * Admin layout: light sidebar with grouped navigation and the signed-in user at the bottom; on
 * small screens a top bar with a menu button. English only (admin is not localised).
 */
export function AdminShell({
  nav,
  account,
  children,
}: {
  nav: AdminNavGroup[];
  account?: ReactNode;
  children: ReactNode;
}) {
  const brand = (
    <Link href="/admin" className="inline-block w-fit">
      <Logo variant="horizontal" alt="MS Welfare Trust admin – home" width={200} />
    </Link>
  );
  return (
    <>
      <SkipLink label="Skip to main content" />
      <div className="min-h-screen bg-bg-subtle lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        <header className="sticky top-0 z-20 hidden h-screen flex-col gap-6 border-r border-border-decorative bg-bg-canvas px-3 py-5 lg:flex">
          <div className="px-3">{brand}</div>
          <nav aria-label="Admin" className="min-h-0 flex-1 overflow-y-auto">
            <AdminNavLinks groups={nav} />
          </nav>
          {account}
        </header>
        <AdminMobileNav brand={brand} nav={nav} account={account} />
        <main id="main" tabIndex={-1} className="min-w-0 px-4 py-6 md:px-8 lg:px-10 lg:py-8">
          <div className="mx-auto grid max-w-6xl gap-6">{children}</div>
        </main>
      </div>
    </>
  );
}
