"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";

type ErrorStrings = { title: string; body: string; retry: string; home: string };

// English fallback only if the layout's translated strings are missing (they normally are present).
const FALLBACK: ErrorStrings = {
  title: "Something went wrong",
  body: "Sorry, this page couldn't be loaded. Please try again.",
  retry: "Try again",
  home: "Go to the home page",
};

let cached: { strings: ErrorStrings; home: string } | null = null;

/** Translated strings rendered by the server layout into #error-strings (no client i18n runtime). */
function readPageStrings(): { strings: ErrorStrings; home: string } {
  if (cached) return cached;
  let strings = FALLBACK;
  try {
    const raw = document.getElementById("error-strings")?.dataset.strings;
    if (raw) strings = { ...FALLBACK, ...(JSON.parse(raw) as Partial<ErrorStrings>) };
  } catch {}
  cached = { strings, home: `/${document.documentElement.lang || "en"}` };
  return cached;
}

const SERVER_SNAPSHOT = { strings: FALLBACK, home: "/en" };
const noSubscribe = () => () => {};

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { strings: t, home } = useSyncExternalStore(noSubscribe, readPageStrings, () => SERVER_SNAPSHOT);
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <section className="mx-auto max-w-(--size-container-max) px-4 py-24 text-center lg:px-8">
      <meta name="robots" content="noindex, nofollow" />
      <h1 className="text-4xl">{t.title}</h1>
      <p className="mx-auto mt-4 max-w-xl text-fg-muted">{t.body}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={() => reset()}>{t.retry}</Button>
        <ButtonLink variant="secondary" href={home}>
          {t.home}
        </ButtonLink>
      </div>
    </section>
  );
}
