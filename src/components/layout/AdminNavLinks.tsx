"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminNavItem } from "./AdminShell";

/** Admin sidebar links; marks the current section with aria-current. */
export function AdminNavLinks({ nav }: { nav: AdminNavItem[] }) {
  const pathname = usePathname();
  const current = [...nav]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))?.key;
  return (
    <ul className="m-0 grid list-none gap-1 p-0">
      {nav.map((item) => (
        <li key={item.key}>
          <Link
            href={item.href}
            aria-current={item.key === current ? "page" : undefined}
            className="flex min-h-(--size-target-comfortable) items-center rounded-md px-3 text-fg-inverse no-underline hover:bg-neutral-900 hover:text-fg-inverse aria-[current=page]:border-l-4 aria-[current=page]:border-link-inverse aria-[current=page]:bg-neutral-900"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
