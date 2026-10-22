import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "on-brand" | "ghost";
export type ButtonSize = "md" | "lg";

type StyleProps = { variant?: ButtonVariant; size?: ButtonSize; block?: boolean };

const base =
  "inline-flex items-center justify-center gap-2 rounded-md border font-semibold no-underline transition-colors duration-(--duration-fast) ease-standard min-h-(--size-target-comfortable)";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-action-primary-bg text-action-primary-fg hover:bg-action-primary-bg-hover hover:text-action-primary-fg active:bg-action-primary-bg-active",
  secondary:
    "border-action-secondary-border bg-action-secondary-bg text-action-secondary-fg hover:bg-action-secondary-bg-hover hover:text-action-secondary-fg",
  "on-brand":
    "border-transparent bg-bg-canvas text-action-secondary-fg hover:bg-bg-brand-subtle hover:text-action-secondary-fg",
  ghost: "border-border-input bg-transparent text-fg-default hover:bg-bg-subtle hover:text-fg-default",
};

const sizes: Record<ButtonSize, string> = {
  md: "px-5 py-2 text-base",
  lg: "min-h-12 px-8 py-2 text-lg",
};

const disabledClasses =
  "disabled:cursor-not-allowed disabled:border-border-decorative disabled:bg-bg-muted disabled:text-fg-disabled aria-disabled:cursor-not-allowed aria-disabled:border-border-decorative aria-disabled:bg-bg-muted aria-disabled:text-fg-disabled";

export function buttonClasses({ variant = "primary", size = "md", block }: StyleProps = {}): string {
  return cn(base, variants[variant], sizes[size], disabledClasses, block && "w-full");
}

export function Button({
  variant,
  size,
  block,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & StyleProps) {
  return <button type={type} className={cn(buttonClasses({ variant, size, block }), className)} {...props} />;
}

/** A link that looks like a button. Use for navigation (e.g. "Donate"), never for form submission. */
export function ButtonLink({
  variant,
  size,
  block,
  className,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & StyleProps & { href: string; children: ReactNode }) {
  return (
    <a className={cn(buttonClasses({ variant, size, block }), className)} {...props}>
      {children}
    </a>
  );
}
