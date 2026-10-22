import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { requireCapability } from "@/lib/admin/guard";
import { db } from "@/lib/db/client";
import { organizationSettings } from "@/lib/db/schema";
import type { FieldSpec } from "@/components/admin/form-state";
import { saveOrganization } from "../actions";
import { LOCALE_FIELDS, SettingsPage } from "../SettingsPage";

export const metadata: Metadata = { title: "Organization" };

export default async function OrganizationSettingsPage() {
  await requireCapability("settings.organization");
  const [o] = await db.select().from(organizationSettings).where(eq(organizationSettings.id, 1));
  const v = (x: string | null | undefined) => x ?? "";
  const fields: FieldSpec[] = [
    { name: "legalName", label: "Legal name", required: true, defaultValue: o?.legalName, group: "name" },
    { name: "displayName", label: "Short name", required: true, defaultValue: o?.displayName, group: "name" },
    ...LOCALE_FIELDS.map((l) => ({
      name: `alternateNames.${l.code}`,
      label: `Other names (${l.name})`,
      hint: "Comma-separated",
      lang: l.lang,
      defaultValue: (o?.alternateNames[l.code] ?? []).join(", "),
      group: "alt",
    })),
    ...LOCALE_FIELDS.map((l) => ({
      name: `description.${l.code}`,
      label: `Description (${l.name})`,
      type: "textarea" as const,
      rows: 3,
      lang: l.lang,
      defaultValue: v(o?.description[l.code]),
    })),
    {
      name: "trustPan",
      label: "Trust PAN",
      defaultValue: v(o?.trustPan),
      hint: "e.g. AAATM1234B",
      group: "reg1",
    },
    { name: "foundingDate", label: "Founded", type: "date", defaultValue: v(o?.foundingDate), group: "reg1" },
    {
      name: "trustRegistrationNo",
      label: "Trust registration no.",
      defaultValue: v(o?.trustRegistrationNo),
      group: "reg1",
    },
    {
      name: "registrationAuthority",
      label: "Registered with",
      defaultValue: v(o?.registrationAuthority),
      group: "reg1",
    },
    { name: "reg12aNumber", label: "12A registration no.", defaultValue: v(o?.reg12aNumber), group: "reg2" },
    { name: "reg12aDate", label: "12A date", type: "date", defaultValue: v(o?.reg12aDate), group: "reg2" },
    { name: "reg80gNumber", label: "80G registration no.", defaultValue: v(o?.reg80gNumber), group: "reg3" },
    {
      name: "reg80gValidFrom",
      label: "80G valid from",
      type: "date",
      defaultValue: v(o?.reg80gValidFrom),
      group: "reg3",
    },
    {
      name: "reg80gValidTo",
      label: "80G valid to",
      type: "date",
      defaultValue: v(o?.reg80gValidTo),
      group: "reg3",
    },
    { name: "streetAddress", label: "Street address", defaultValue: v(o?.streetAddress) },
    { name: "locality", label: "Area / locality", defaultValue: v(o?.locality), group: "addr" },
    { name: "city", label: "City", defaultValue: v(o?.city), group: "addr" },
    { name: "district", label: "District", defaultValue: v(o?.district), group: "addr" },
    { name: "state", label: "State", defaultValue: v(o?.state), group: "addr" },
    {
      name: "pincode",
      label: "PIN code",
      defaultValue: v(o?.pincode),
      inputMode: "numeric",
      maxLength: 6,
      group: "contact",
    },
    { name: "email", label: "Public email", type: "email", defaultValue: v(o?.email), group: "contact" },
    {
      name: "phones",
      label: "Phone numbers",
      type: "textarea",
      rows: 2,
      hint: "One per line",
      defaultValue: (o?.phones ?? []).join("\n"),
    },
    ...LOCALE_FIELDS.map((l) => ({
      name: `contactHours.${l.code}`,
      label: `Office hours (${l.name})`,
      lang: l.lang,
      defaultValue: v(o?.contactHours[l.code]),
      group: "hours",
    })),
    {
      name: "areaServed",
      label: "Areas served",
      type: "textarea",
      rows: 2,
      hint: "One per line",
      defaultValue: (o?.areaServed ?? []).join("\n"),
    },
    {
      name: "trustees",
      label: "Trustees",
      type: "textarea",
      rows: 4,
      hint: "One per line, as: Name | Role",
      defaultValue: (o?.trustees ?? []).map((t) => `${t.name} | ${t.role}`).join("\n"),
    },
    { name: "signatoryName", label: "Receipt signatory", defaultValue: v(o?.signatoryName), group: "sign" },
    {
      name: "signatoryTitle",
      label: "Signatory's title",
      defaultValue: v(o?.signatoryTitle),
      hint: "e.g. Managing Trustee",
      group: "sign",
    },
    {
      name: "sameAs",
      label: "Official profiles",
      type: "textarea",
      rows: 2,
      hint: "Full URLs, one per line (social media, registries)",
      defaultValue: (o?.sameAs ?? []).join("\n"),
    },
  ];
  return (
    <SettingsPage
      title="Organization"
      intro="Public facts about the Trust. They appear in the footer, on the About and Contact pages, in search-engine data and on receipts. Leave a field empty until the Trust confirms it."
      id="org"
      action={saveOrganization}
      fields={fields}
    />
  );
}
