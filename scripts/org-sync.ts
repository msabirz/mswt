// Upserts organization_settings (the single row, id 1) from data/organization.json.
// Used until the admin Settings page exists (Step 8).
// Usage: npm run org:sync            (validate + write to DATABASE_URL)
//        npm run org:sync -- --check (validate only; runs in CI)
import { readFileSync } from "node:fs";
import { config } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { z } from "zod";
import { organizationSettings } from "../src/lib/db/schema";

config({ path: [".env.local", ".env"], quiet: true });

const localised = z.partialRecord(z.enum(["en", "hi", "mr", "gu"]), z.string().min(1));
const date = z.iso.date().nullable();
const Org = z.object({
  legalName: z.string().min(1),
  displayName: z.string().min(1),
  alternateNames: z.partialRecord(z.enum(["en", "hi", "mr", "gu"]), z.array(z.string().min(1))),
  description: localised,
  foundingDate: date,
  trustPan: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/)
    .nullable(),
  trustRegistrationNo: z.string().nullable(),
  registrationAuthority: z.string().nullable(),
  reg12aNumber: z.string().nullable(),
  reg12aDate: date,
  reg80gNumber: z.string().nullable(),
  reg80gValidFrom: date,
  reg80gValidTo: date,
  streetAddress: z.string().nullable(),
  locality: z.string().nullable(),
  city: z.string().nullable(),
  district: z.string().nullable(),
  state: z.string().nullable(),
  pincode: z
    .string()
    .regex(/^\d{6}$/)
    .nullable(),
  phones: z.array(z.string().min(6)),
  email: z.email().nullable(),
  contactHours: localised,
  areaServed: z.array(z.string().min(1)),
  trustees: z.array(
    z.object({
      name: z.string().min(1),
      role: z.string().min(1),
      sort: z.number().int(),
      photoMediaId: z.uuid().optional(),
      bio: localised.optional(),
    }),
  ),
  sameAs: z.array(z.url()),
});

const raw = JSON.parse(readFileSync("data/organization.json", "utf8"));
delete raw.$comment;
const data = Org.parse(raw);
if (process.argv.includes("--check")) {
  console.log("data/organization.json is valid.");
  process.exit(0);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (see .env.example).");
  process.exit(1);
}
const sql = postgres(url, { max: 1, onnotice: () => {} });
try {
  const db = drizzle(sql);
  const row = { id: 1, ...data, updatedAt: new Date() };
  await db
    .insert(organizationSettings)
    .values(row)
    .onConflictDoUpdate({ target: organizationSettings.id, set: row });
  console.log(
    `organization_settings updated on ${new URL(url).host}. Redeploy or revalidate "settings:organization" to publish.`,
  );
} finally {
  await sql.end();
}
