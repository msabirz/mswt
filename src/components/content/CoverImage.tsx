import type { Locale } from "@/i18n/routing";
import { getMediaViews } from "@/lib/content/media";
import { cn } from "@/lib/cn";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { ResponsiveImage } from "./ResponsiveImage";

/** A cover photo from the library, or the placeholder when none is set or it lacks alt text here. */
export async function CoverImage({
  mediaId,
  locale,
  fallback,
  ratio = "photo",
  sizes,
  priority,
  className,
}: {
  mediaId: string | null;
  locale: Locale;
  fallback: string;
  ratio?: "photo" | "wide";
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const image = mediaId ? (await getMediaViews([mediaId], locale))[mediaId] : undefined;
  if (!image?.alt || !image.src)
    return <ImagePlaceholder description={image?.alt ?? fallback} ratio={ratio} className={className} />;
  return (
    <ResponsiveImage
      image={image}
      alt={image.alt}
      sizes={sizes}
      priority={priority}
      className={cn(ratio === "wide" ? "aspect-video" : "aspect-[4/3]", className)}
    />
  );
}
