import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Small tracked label above a heading. Uppercase only for Latin scripts (tracking is 0 for Indic). */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "mb-2 text-sm font-semibold tracking-caps text-fg-brand uppercase [:lang(hi)_&]:normal-case [:lang(mr)_&]:normal-case [:lang(gu)_&]:normal-case",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Heading followed by the short green rule from the logo. */
export function HeadingRule({
  as: Tag = "h2",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { as?: "h1" | "h2" | "h3" }) {
  return (
    <Tag
      className={cn(
        "after:mt-3 after:block after:w-12 after:border-b-2 after:border-border-rule after:content-['']",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

/** Full-width rule in the logo green (decorative). */
export function Rule({ className }: { className?: string }) {
  return <hr className={cn("m-0 border-0 border-t-2 border-border-rule", className)} />;
}

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
