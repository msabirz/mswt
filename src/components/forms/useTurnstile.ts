"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; language?: string }) => string;
      reset: (id?: string) => void;
    };
  }
}

const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/**
 * Loads Cloudflare Turnstile only once the visitor starts using the form (PERF-06): a one-off
 * focusin listener on the form renders the widget into `box`.
 */
export function useTurnstile(
  form: RefObject<HTMLFormElement | null>,
  box: RefObject<HTMLDivElement | null>,
  siteKey: string | null,
  locale: string,
) {
  const widget = useRef<string | null>(null);
  useEffect(() => {
    const el = form.current;
    if (!el || !siteKey) return;
    const render = () => {
      if (window.turnstile && box.current && !widget.current) {
        widget.current = window.turnstile.render(box.current, { sitekey: siteKey, language: locale });
      }
    };
    const start = () => {
      if (window.turnstile) return render();
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SRC}"]`);
      if (existing) return existing.addEventListener("load", render, { once: true });
      const s = document.createElement("script");
      s.src = TURNSTILE_SRC;
      s.async = true;
      s.addEventListener("load", render, { once: true });
      document.head.appendChild(s);
    };
    el.addEventListener("focusin", start, { once: true });
    return () => el.removeEventListener("focusin", start);
  }, [form, box, siteKey, locale]);
  return useCallback(() => {
    if (widget.current) window.turnstile?.reset(widget.current);
  }, []);
}
