"use client";

import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AdminNavLinks } from "./AdminNavLinks";
import type { AdminNavGroup } from "./AdminShell";

/** Top bar with a menu button below the lg breakpoint. */
export function AdminMobileNav({
  brand,
  nav,
  account,
}: {
  brand: ReactNode;
  nav: AdminNavGroup[];
  account?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-20 border-b border-border-decorative bg-bg-canvas lg:hidden">
      <div className="flex items-center justify-between gap-4 px-4 py-2">
        {brand}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border-input px-3 text-sm font-semibold"
        >
          {open ? (
            <X aria-hidden="true" className="size-4" />
          ) : (
            <Menu aria-hidden="true" className="size-4" />
          )}
          Menu
        </button>
      </div>
      {open ? (
        <nav
          id="admin-mobile-nav"
          aria-label="Admin"
          className="grid gap-6 border-t border-border-decorative px-3 py-4"
        >
          <AdminNavLinks groups={nav} onNavigate={() => setOpen(false)} />
          {account}
        </nav>
      ) : null}
    </header>
  );
}
