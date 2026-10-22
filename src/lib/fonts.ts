import { Hind, Mukta, Noto_Sans, Noto_Sans_Devanagari, Noto_Sans_Gujarati } from "next/font/google";

// Poppins (the default site font) is self-hosted in public/fonts/poppins with @font-face rules in
// src/styles/fonts.css, so its files have fixed URLs: the layout preloads Latin on every page and
// Devanagari only on Hindi/Marathi pages. The other fonts come from next/font (self-hosted at build)
// and download only when a page uses them. next/font needs literal options in each call.
const mukta = Mukta({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "devanagari"],
  display: "swap",
  preload: false,
  variable: "--font-mukta",
});
const hind = Hind({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "devanagari"],
  display: "swap",
  preload: false,
  variable: "--font-hind",
});
const notoSans = Noto_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "devanagari"],
  display: "swap",
  preload: false,
  variable: "--font-noto-sans",
});
const notoDevanagari = Noto_Sans_Devanagari({
  weight: ["400", "500", "600", "700"],
  subsets: ["devanagari"],
  display: "swap",
  preload: false,
  variable: "--font-noto-devanagari",
});
const notoGujarati = Noto_Sans_Gujarati({
  weight: ["400", "500", "600", "700"],
  subsets: ["gujarati"],
  display: "swap",
  preload: false,
  variable: "--font-noto-gujarati",
});

/** Site font options for Settings → Appearance (matches the `site_font` DB enum). */
export const SITE_FONTS = {
  poppins: { label: "Poppins", variable: null },
  mukta: { label: "Mukta", variable: mukta.variable },
  hind: { label: "Hind", variable: hind.variable },
  noto_sans: { label: "Noto Sans", variable: notoSans.variable },
} as const;

export type SiteFont = keyof typeof SITE_FONTS;
export const DEFAULT_SITE_FONT: SiteFont = "poppins";

/** Classes that define the next/font CSS variables; put on <html>. */
export const fontVariables = [
  ...Object.values(SITE_FONTS).flatMap((f) => (f.variable ? [f.variable] : [])),
  notoDevanagari.variable,
  notoGujarati.variable,
].join(" ");

/**
 * Font files to preload for a page: the regular and semibold weights used above the fold.
 * Hindi/Marathi preload Devanagari instead of Latin; Gujarati text uses Noto Sans Gujarati (not preloaded).
 */
export function poppinsPreloads(locale: string, siteFont: SiteFont = DEFAULT_SITE_FONT): string[] {
  if (siteFont !== "poppins") return [];
  // Hindi/Marathi headlines are Devanagari: preload those two files (~40 KB each) instead of Latin.
  if (locale === "hi" || locale === "mr")
    return [400, 600].map((w) => `/fonts/poppins/poppins-devanagari-${w}.woff2`);
  return [400, 600].map((w) => `/fonts/poppins/poppins-latin-${w}.woff2`);
}
