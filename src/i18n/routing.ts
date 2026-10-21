import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "hi", "mr", "gu"],
  defaultLocale: "en",
  localePrefix: "always",
  // "/" always goes to /en (x-default); no Accept-Language guessing.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
