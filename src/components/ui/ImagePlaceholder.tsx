import { cn } from "@/lib/cn";

const ratios = {
  wide: "aspect-video",
  photo: "aspect-[4/3]",
  square: "aspect-square",
  portrait: "aspect-[4/5]",
} as const;

/** Stand-in until the Trust's real photos arrive (no stock images). Describes the intended photo. */
export function ImagePlaceholder({
  description,
  ratio = "photo",
  round,
  className,
}: {
  description: string;
  ratio?: keyof typeof ratios;
  round?: boolean;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={description}
      className={cn(
        "flex items-end overflow-hidden border border-dashed border-border-input bg-bg-muted",
        round ? "aspect-square items-center justify-center rounded-full" : cn("rounded-lg", ratios[ratio]),
        className,
      )}
    >
      <span aria-hidden="true" className="m-2 rounded-sm bg-bg-canvas px-3 py-2 text-xs text-fg-muted">
        {description}
      </span>
    </div>
  );
}
