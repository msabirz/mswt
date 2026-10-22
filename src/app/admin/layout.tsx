import type { Metadata } from "next";
import type { ReactNode } from "react";
import { fontVariables, DEFAULT_SITE_FONT } from "@/lib/fonts";
import "../globals.css";

// The admin is a separate root layout: English only, never indexed (SEO-07), not locale-prefixed.
export const metadata: Metadata = {
  title: { template: "%s | MSWT Admin", default: "MSWT Admin" },
  robots: { index: false, follow: false },
  icons: { icon: "/brand/mswt-mark-compact.svg" },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVariables} data-site-font={DEFAULT_SITE_FONT}>
      <body className="min-h-screen bg-bg-subtle text-fg-default">{children}</body>
    </html>
  );
}
