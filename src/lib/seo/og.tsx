import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import tokens from "../../../tokens/design-tokens.json";

export const OG_SIZE = { width: 1200, height: 630 };

const color = {
  canvas: tokens.color.white.$value,
  text: tokens.color.neutral["950"].$value,
  muted: tokens.color.neutral["700"].$value,
  rule: tokens.color.brand.green.$value,
};

const asset = (file: string) => readFile(join(process.cwd(), file));

/** Locales whose share card is pre-rendered by scripts/og-indic.mjs (Satori mis-shapes Indic scripts). */
const PRERENDERED = new Set(["hi", "mr", "gu"]);

/** The share card for a locale's home page: live render for English, committed PNG for Indic scripts. */
export async function localeOgImage(locale: string, title: string, subtitle: string): Promise<Response> {
  if (PRERENDERED.has(locale)) {
    const png = await asset(`public/og/${locale}.png`);
    return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
  }
  return renderOgImage({ title, subtitle });
}

/**
 * Share card (1200×630): logo, page title, subtitle and the green logo rule. Fonts are WOFF (Satori
 * can't read WOFF2): Poppins Latin + Devanagari, Noto Sans Gujarati. Colours come from the tokens.
 */
export async function renderOgImage({ title, subtitle }: { title: string; subtitle: string }) {
  const [logo, latin, devanagari, gujarati] = await Promise.all([
    asset("public/brand/mswt-logo-horizontal.svg"),
    asset("src/assets/og/poppins-latin-600.woff"),
    asset("src/assets/og/poppins-devanagari-600.woff"),
    asset("src/assets/og/noto-sans-gujarati-600.woff"),
  ]);
  const logoSrc = `data:image/svg+xml;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 80px",
        background: color.canvas,
        fontFamily: "Poppins, Noto Sans Gujarati",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img */}
      <img src={logoSrc} width={320} height={100} alt="" />
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", fontSize: 60, lineHeight: 1.3, color: color.text, fontWeight: 600 }}>
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 30, lineHeight: 1.4, color: color.muted, fontWeight: 600 }}>
          {subtitle}
        </div>
      </div>
      <div style={{ display: "flex", width: 160, height: 8, background: color.rule }} />
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: "Poppins", data: latin, weight: 600, style: "normal" },
        { name: "Poppins", data: devanagari, weight: 600, style: "normal" },
        { name: "Noto Sans Gujarati", data: gujarati, weight: 600, style: "normal" },
      ],
    },
  );
}
