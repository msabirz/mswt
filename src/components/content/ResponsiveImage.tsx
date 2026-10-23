import { cn } from "@/lib/cn";
import type { ImageView } from "@/lib/media/view";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

/**
 * A library photo with srcset (640/1280/1920 WebP), fixed width/height (no layout shift) and a
 * blurred preview while it loads. `priority` for the one image above the fold (LCP).
 */
export function ResponsiveImage({
  image,
  alt,
  sizes = "(min-width: 1024px) 768px, 100vw",
  priority = false,
  className,
}: {
  image: ImageView;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  if (!image.src || !image.srcset) return <ImagePlaceholder description={alt} className={className} />;
  return (
    // Plain <img>: the copies are already resized at upload, so the image optimizer isn't needed.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.src}
      srcSet={image.srcset}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      style={image.blur ? { backgroundImage: `url(${image.blur})`, backgroundSize: "cover" } : undefined}
      className={cn("h-auto w-full rounded-lg bg-bg-muted object-cover", className)}
    />
  );
}
