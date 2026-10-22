import type { ReactNode } from "react";

/** Shown instead of a list when there is nothing to show yet. */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border-input bg-bg-subtle px-6 py-10 text-center text-fg-muted">
      <p>{children}</p>
    </div>
  );
}
