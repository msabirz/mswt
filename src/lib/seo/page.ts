import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "./metadata";

/** buildMetadata for an inner page, with the localised site name filled in. */
export async function pageMetadata(input: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  locales?: readonly Locale[];
  type?: "website" | "article";
  noindex?: boolean;
}): Promise<Metadata> {
  const t = await getTranslations({ locale: input.locale, namespace: "Meta" });
  return buildMetadata({ ...input, siteName: t("siteName") });
}
