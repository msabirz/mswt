import type { Locale } from "@/i18n/routing";
import type { Blocks } from "@/lib/content/blocks";
import { getMediaViews } from "@/lib/content/media";
import { imageIds } from "@/lib/content/markup";
import { isProduction } from "@/lib/content/source";
import { RichText } from "@/components/ui/RichText";

/** Content blocks with their library photos loaded for this language. */
export async function ContentBody({ blocks, locale }: { blocks: Blocks; locale: Locale }) {
  const media = await getMediaViews(imageIds(blocks), locale);
  return <RichText blocks={blocks} media={media} markMissing={!isProduction()} />;
}
