"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { ErrorSummary, FieldError, Hint, fieldControlProps } from "@/components/ui/Form";
import type { FormState } from "./form-state";
import { compactControl } from "./ui";

const MAX_SIDE = 2560;
const KEEP_AS_IS = 3 * 1024 * 1024;

/**
 * Photos straight from a phone are often 5–12 MB; Vercel accepts at most 4.5 MB per request. The
 * browser scales them to 2560 px (applying the camera's rotation) before upload; the server then
 * checks the file again and makes the web copies.
 */
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= KEEP_AS_IS) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
  return blob ? new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
}

export function MediaUploadForm({
  action,
  disabled,
}: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  disabled?: string;
}) {
  const [state, run, pending] = useActionState(action, { status: "idle" } as FormState);
  const [preparing, setPreparing] = useState(false);
  const errors = state.errors ?? {};
  const values = state.values ?? {};
  const busy = pending || preparing;

  useEffect(() => {
    if (state.status === "error") document.getElementById("upload-summary")?.focus();
  }, [state]);

  return (
    <form
      noValidate
      className="grid gap-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const file = form.get("file");
        setPreparing(true);
        try {
          if (file instanceof File && file.size) form.set("file", await shrink(file));
        } finally {
          setPreparing(false);
        }
        startTransition(() => run(form));
      }}
    >
      {disabled ? (
        <Alert tone="warning">
          <p>{disabled}</p>
        </Alert>
      ) : null}
      {Object.keys(errors).length ? (
        <ErrorSummary
          id="upload-summary"
          title="Please fix the following:"
          errors={Object.entries(errors).map(([name, message]) => ({ fieldId: `upload-${name}`, message }))}
        />
      ) : null}
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <div className="grid content-start gap-1.5 sm:col-span-2">
          <label htmlFor="upload-file" className="text-sm font-medium text-fg-strong">
            Photo <span className="ml-1 text-xs font-normal text-fg-muted">(required)</span>
          </label>
          <input
            {...fieldControlProps("upload-file", { hint: "x", error: errors.file, required: true })}
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={compactControl}
          />
          {errors.file ? (
            <FieldError id="upload-file-error">{errors.file}</FieldError>
          ) : (
            <Hint id="upload-file-hint">
              JPEG, PNG or WebP. Location and camera details are removed; web copies are made at 3 sizes.
            </Hint>
          )}
        </div>
        <div className="grid content-start gap-1.5">
          <label htmlFor="upload-alt" className="text-sm font-medium text-fg-strong">
            Alt text (English) <span className="ml-1 text-xs font-normal text-fg-muted">(required)</span>
          </label>
          <input
            {...fieldControlProps("upload-alt", { hint: "x", error: errors.alt, required: true })}
            name="alt"
            defaultValue={values.alt}
            maxLength={250}
            className={compactControl}
          />
          {errors.alt ? (
            <FieldError id="upload-alt-error">{errors.alt}</FieldError>
          ) : (
            <Hint id="upload-alt-hint">What the photo shows, for people who can’t see it.</Hint>
          )}
        </div>
        <div className="grid content-start gap-1.5">
          <label htmlFor="upload-caption" className="text-sm font-medium text-fg-strong">
            Caption (English)
          </label>
          <input
            id="upload-caption"
            name="caption"
            defaultValue={values.caption}
            maxLength={300}
            className={compactControl}
          />
        </div>
      </div>
      <div>
        <button
          type="submit"
          disabled={busy || Boolean(disabled)}
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-action-primary-bg px-4 text-sm font-semibold text-action-primary-fg hover:bg-action-primary-bg-hover disabled:cursor-not-allowed disabled:bg-bg-muted disabled:text-fg-disabled"
        >
          {preparing ? "Preparing photo…" : pending ? "Uploading…" : "Upload photo"}
        </button>
      </div>
    </form>
  );
}
