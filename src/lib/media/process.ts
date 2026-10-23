import sharp, { type Metadata } from "sharp";

export const MEDIA_WIDTHS = [640, 1280, 1920] as const;
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ACCEPTED = new Set(["jpeg", "png", "webp"]);

export class MediaError extends Error {
  constructor(readonly code: "format" | "size" | "dimensions") {
    super(code);
  }
}

export type ProcessedImage = {
  width: number;
  height: number;
  /** Widths actually produced (never larger than the original). */
  variants: number[];
  files: { width: number; body: Uint8Array }[];
  blur: string;
};

/**
 * Checks the real format, applies the camera's rotation, removes all metadata (EXIF, including
 * GPS: sharp drops it unless asked to keep it) and makes WebP copies at up to three widths.
 */
export async function processImage(input: Uint8Array): Promise<ProcessedImage> {
  if (input.byteLength > MAX_UPLOAD_BYTES) throw new MediaError("size");
  let meta: Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: 50_000_000 }).metadata();
  } catch {
    throw new MediaError("format");
  }
  if (!meta.format || !ACCEPTED.has(meta.format)) throw new MediaError("format");
  const rotated = (meta.orientation ?? 1) >= 5;
  const width = (rotated ? meta.height : meta.width) ?? 0;
  if (width < 200) throw new MediaError("dimensions");

  const widths = [...new Set(MEDIA_WIDTHS.map((w) => Math.min(w, width)))];
  const files: ProcessedImage["files"] = [];
  let height = 0;
  for (const w of widths) {
    const { data, info } = await sharp(input)
      .rotate()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
    files.push({ width: info.width, body: new Uint8Array(data) });
    height = info.height;
  }
  const blur = await sharp(input).rotate().resize({ width: 16 }).webp({ quality: 40 }).toBuffer();
  const largest = files.at(-1)!;
  return {
    width: largest.width,
    height,
    variants: files.map((f) => f.width),
    files,
    blur: `data:image/webp;base64,${blur.toString("base64")}`,
  };
}

/** A descriptive, kebab-case file name from the uploaded name (spec §2); "photo" if nothing is left. */
export function mediaSlug(filename: string): string {
  const base = filename
    .replace(/\.[a-z0-9]+$/i, "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return base || "photo";
}

export const variantKey = (prefix: string, width: number) => `${prefix}-${width}.webp`;
