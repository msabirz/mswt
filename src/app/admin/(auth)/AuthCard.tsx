import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { SkipLink } from "@/components/ui/SkipLink";

/** Centered card for the sign-in screens. */
export function AuthCard({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <SkipLink label="Skip to main content" />
      <main id="main" tabIndex={-1} className="mx-auto grid max-w-md gap-6 px-4 py-12">
        <Logo variant="horizontal" alt="MS Welfare Trust" width={200} />
        <div className="grid gap-6 rounded-lg border border-border-decorative bg-bg-canvas p-6 md:p-8">
          <div className="grid gap-2">
            <h1 className="text-2xl">{title}</h1>
            {lead ? <div className="text-fg-muted">{lead}</div> : null}
          </div>
          {children}
        </div>
      </main>
    </>
  );
}
