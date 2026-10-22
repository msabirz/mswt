import { cn } from "@/lib/cn";

// Intrinsic sizes of the SVGs in public/brand (from the traced artwork).
const VARIANTS = {
  horizontal: { src: "/brand/mswt-logo-horizontal.svg", ratio: 1560 / 489, minWidth: 200 },
  reversed: { src: "/brand/mswt-logo-horizontal-reversed.svg", ratio: 1560 / 489, minWidth: 200 },
  mark: { src: "/brand/mswt-mark.svg", ratio: 1199 / 1261, minWidth: 48 },
  compact: { src: "/brand/mswt-mark-compact.svg", ratio: 1, minWidth: 16 },
} as const;

export type LogoVariant = keyof typeof VARIANTS;

/** Logo sizes are clamped to the brand minimums (docs/brand.md §5.2). */
export function logoSize(variant: LogoVariant, width: number): { width: number; height: number } {
  const v = VARIANTS[variant];
  const w = Math.max(width, v.minWidth);
  return { width: Math.round(w), height: Math.round(w / v.ratio) };
}

export function Logo({
  variant = "horizontal",
  width = 204,
  alt,
  className,
  lazy,
}: {
  variant?: LogoVariant;
  width?: number;
  /** Accessible name, e.g. "MS Welfare Trust – home". Use "" only for a decorative repeat. */
  alt: string;
  className?: string;
  /** Below-the-fold logos (footer): load lazily so they don't compete with the page's main content. */
  lazy?: boolean;
}) {
  const size = logoSize(variant, width);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG artwork, no raster optimisation needed
    <img
      src={VARIANTS[variant].src}
      alt={alt}
      width={size.width}
      height={size.height}
      loading={lazy ? "lazy" : undefined}
      decoding="async"
      className={cn("block h-auto max-w-none", className)}
    />
  );
}
