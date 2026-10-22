"use client";

import "./globals.css";

// Last-resort error page when the root layout itself fails. English only: translations may be unavailable.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <head>
        <title>Something went wrong | MS Welfare Trust</title>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className="bg-bg-canvas text-fg-default">
        <main className="mx-auto max-w-xl px-4 py-24 text-center">
          <h1 className="text-4xl">Something went wrong</h1>
          <p className="mt-4 text-fg-muted">
            Please try again. If it keeps happening, email info@mswelfaretrust.org.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-8 min-h-(--size-target-comfortable) rounded-md bg-action-primary-bg px-5 font-semibold text-action-primary-fg"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
