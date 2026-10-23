import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { AwsClient } from "aws4fetch";
import { serverEnv } from "@/env/server";
import { isProduction } from "@/lib/secrets";

/**
 * Public storage for website photos (Step 8c): a public R2 bucket, or `.data/media` served by
 * /media-local outside production. Files are immutable: a new upload gets a new id.
 */
export interface MediaStorage {
  readonly name: "r2" | "local";
  /** Public base URL for keys, e.g. https://media.example.org or /media-local. */
  readonly publicBase: string;
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  remove(key: string): Promise<void>;
}

class R2MediaStorage implements MediaStorage {
  readonly name = "r2" as const;
  private readonly client: AwsClient;
  private readonly base: string;

  constructor(
    accountId: string,
    accessKeyId: string,
    secretAccessKey: string,
    bucket: string,
    readonly publicBase: string,
  ) {
    this.client = new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" });
    this.base = `https://${accountId}.r2.cloudflarestorage.com/${bucket}`;
  }

  private url(key: string) {
    return `${this.base}/${key.split("/").map(encodeURIComponent).join("/")}`;
  }

  async put(key: string, body: Uint8Array, contentType: string) {
    const res = await this.client.fetch(this.url(key), {
      method: "PUT",
      body: body as BodyInit,
      headers: { "content-type": contentType, "cache-control": "public, max-age=31536000, immutable" },
    });
    if (!res.ok) throw new Error(`R2 PUT ${key} failed (${res.status})`);
  }

  async remove(key: string) {
    const res = await this.client.fetch(this.url(key), { method: "DELETE" });
    if (!res.ok && res.status !== 404) throw new Error(`R2 DELETE ${key} failed (${res.status})`);
  }
}

export const LOCAL_MEDIA_DIR = ".data/media";

class LocalMediaStorage implements MediaStorage {
  readonly name = "local" as const;
  readonly publicBase = "/media-local";
  private path(key: string) {
    if (key.includes("..")) throw new Error("Bad storage key");
    return join(process.cwd(), LOCAL_MEDIA_DIR, key);
  }
  async put(key: string, body: Uint8Array) {
    await mkdir(dirname(this.path(key)), { recursive: true });
    await writeFile(this.path(key), body);
  }
  async remove(key: string) {
    await rm(this.path(key), { force: true });
  }
}

/** Null when the public bucket isn't set up yet in production (the admin says so). */
export function getMediaStorage(): MediaStorage | null {
  const e = serverEnv;
  if (
    e.R2_ACCOUNT_ID &&
    e.R2_ACCESS_KEY_ID &&
    e.R2_SECRET_ACCESS_KEY &&
    e.R2_MEDIA_BUCKET &&
    e.R2_MEDIA_PUBLIC_URL
  )
    return new R2MediaStorage(
      e.R2_ACCOUNT_ID,
      e.R2_ACCESS_KEY_ID,
      e.R2_SECRET_ACCESS_KEY,
      e.R2_MEDIA_BUCKET,
      e.R2_MEDIA_PUBLIC_URL,
    );
  if (e.VERCEL_ENV === "preview" || isProduction()) return null;
  return new LocalMediaStorage();
}
