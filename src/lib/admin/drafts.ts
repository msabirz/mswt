import type { Locale } from "@/i18n/routing";
import { ContentFileSchema } from "@/lib/content/format";
import drafts from "../../../data/content/content.json";
import type { ContentPageKey } from "./content-pages";

const file = ContentFileSchema.parse(drafts);

/**
 * The reviewed-by-nobody drafts in data/content (legal pages), offered as the starting text when a
 * page has no saved version in that language yet. Bundled, so production can use them too.
 */
export function pageDraft(key: ContentPageKey, locale: Locale) {
  if (key === "home") return null;
  return file.pages[key]?.[locale] ?? null;
}
