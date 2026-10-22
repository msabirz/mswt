import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { requireCapability } from "@/lib/admin/guard";
import { db } from "@/lib/db/client";
import { appearanceSettings } from "@/lib/db/schema";
import { DEFAULT_SITE_FONT, SITE_FONTS } from "@/lib/fonts";
import { saveAppearance } from "../actions";
import { SettingsPage } from "../SettingsPage";

export const metadata: Metadata = { title: "Appearance" };

const SAMPLES = [
  { lang: "en", text: "Donate to education, healthcare and relief" },
  { lang: "hi", text: "शिक्षा, स्वास्थ्य और राहत के लिए दान करें" },
  { lang: "mr", text: "शिक्षण, आरोग्य आणि मदतकार्यासाठी देणगी द्या" },
  { lang: "gu", text: "શિક્ષણ, આરોગ્ય અને રાહત માટે દાન કરો" },
];

export default async function AppearanceSettingsPage() {
  await requireCapability("settings.appearance");
  const [s] = await db.select().from(appearanceSettings).where(eq(appearanceSettings.id, 1));
  const keys = Object.keys(SITE_FONTS) as (keyof typeof SITE_FONTS)[];
  return (
    <SettingsPage
      title="Appearance"
      intro="The font used across the public site. Gujarati text always uses Noto Sans Gujarati."
      id="look"
      action={saveAppearance}
      aside={
        <section aria-labelledby="preview-h" className="grid gap-4">
          <h2 id="preview-h" className="text-xl">
            Preview
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {keys.map((k) => (
              <div
                key={k}
                data-site-font={k}
                className="grid gap-1 rounded-lg border border-border-decorative bg-bg-canvas p-4"
              >
                <p className="m-0 text-sm font-semibold text-fg-muted">{SITE_FONTS[k].label}</p>
                {SAMPLES.map((sample) => (
                  <p key={sample.lang} lang={sample.lang} className="m-0 text-lg">
                    {sample.text}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </section>
      }
      fields={[
        {
          name: "siteFont",
          label: "Site font",
          type: "select",
          defaultValue: s?.siteFont ?? DEFAULT_SITE_FONT,
          options: keys.map((k) => ({ value: k, label: SITE_FONTS[k].label })),
        },
      ]}
    />
  );
}
