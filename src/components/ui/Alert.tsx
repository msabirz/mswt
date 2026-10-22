import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone = "success" | "warning" | "error" | "info";

const tones: Record<Tone, { box: string; icon: string }> = {
  success: { box: "bg-status-success-bg text-status-success-fg border-status-success-icon", icon: "✓" },
  warning: { box: "bg-status-warning-bg text-status-warning-fg border-status-warning-icon", icon: "!" },
  error: { box: "bg-status-error-bg text-status-error-fg border-status-error-icon", icon: "!" },
  info: { box: "bg-status-info-bg text-status-info-fg border-status-info-icon", icon: "i" },
};

/**
 * Coloured message box. `live` makes screen readers announce it when it appears:
 * "polite" for status updates, "assertive" for errors that block progress.
 */
export function Alert({
  tone,
  title,
  children,
  live,
  className,
}: {
  tone: Tone;
  title?: ReactNode;
  children?: ReactNode;
  live?: "polite" | "assertive";
  className?: string;
}) {
  const role = live === "assertive" ? "alert" : live === "polite" ? "status" : undefined;
  return (
    <div
      role={role}
      className={cn("grid grid-cols-[auto_1fr] gap-3 rounded-md border-l-4 p-4", tones[tone].box, className)}
    >
      <span aria-hidden="true" className="font-bold">
        {tones[tone].icon}
      </span>
      <div className="grid gap-1 [&_a]:text-inherit">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children}
      </div>
    </div>
  );
}

const badgeTones: Record<Tone | "neutral", string> = {
  success: "bg-status-success-solid-bg text-status-success-solid-fg",
  warning: "bg-status-warning-solid-bg text-status-warning-solid-fg",
  error: "bg-status-error-solid-bg text-status-error-solid-fg",
  info: "bg-status-info-solid-bg text-status-info-solid-fg",
  neutral: "bg-bg-muted text-fg-default",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone | "neutral"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-(--size-target-min) items-center gap-1 rounded-sm px-2 text-xs font-semibold",
        badgeTones[tone],
      )}
    >
      {children}
    </span>
  );
}
