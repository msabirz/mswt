import type { Locale } from "@/i18n/routing";

/** Language names in the admin (English UI), with the native name for tabs. */
export const LANGUAGES: Record<Locale, { name: string; native: string }> = {
  en: { name: "English", native: "English" },
  hi: { name: "Hindi", native: "हिन्दी" },
  mr: { name: "Marathi", native: "मराठी" },
  gu: { name: "Gujarati", native: "ગુજરાતી" },
};
