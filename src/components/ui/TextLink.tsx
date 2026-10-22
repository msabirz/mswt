import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Inline text link. Always underlined: link colour alone has only 1.89:1 contrast with body text. */
export function TextLink({
  className,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) {
  return (
    <a
      className={cn("text-link-default underline underline-offset-4 hover:text-link-hover", className)}
      {...props}
    >
      {children}
    </a>
  );
}
