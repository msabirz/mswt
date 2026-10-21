import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  check,
  date,
  index,
  inet,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Conventions (docs/spec.md §2): uuid ids, timestamptz everywhere, money as bigint paise.
const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();
const paise = (name: string) => bigint(name, { mode: "number" });
type Localised = Partial<Record<"en" | "hi" | "mr" | "gu", string>>;

export const userRole = pgEnum("user_role", ["super_admin", "accountant", "content_editor"]);
export const providerMode = pgEnum("provider_mode", ["sandbox", "production"]);
export const emailProvider = pgEnum("email_provider", ["resend", "brevo", "msg91"]);
export const siteFont = pgEnum("site_font", ["poppins", "mukta", "hind", "noto_sans"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").notNull(),
    totpSecretEnc: text("totp_secret_enc"),
    totpEnabledAt: timestamp("totp_enabled_at", { withTimezone: true }),
    recoveryCodesHash: text("recovery_codes_hash").array(),
    failedLogins: integer("failed_logins").default(0).notNull(),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("users_email_lower_idx").on(sql`lower(${t.email})`)],
);

// Append-only: a trigger in drizzle/0001 rejects UPDATE and DELETE.
export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => users.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    before: jsonb("before"),
    after: jsonb("after"),
    ip: inet("ip"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
  },
  (t) => [
    index("audit_log_entity_idx").on(t.entityType, t.entityId),
    index("audit_log_actor_idx").on(t.actorUserId),
    index("audit_log_created_idx").on(t.createdAt),
  ],
);

// Single-row settings tables: id is always 1.
const singleRowId = () => smallint("id").primaryKey().default(1);
const updatedBy = () => uuid("updated_by").references(() => users.id);

export const organizationSettings = pgTable(
  "organization_settings",
  {
    id: singleRowId(),
    legalName: text("legal_name").notNull(),
    displayName: text("display_name").notNull(),
    alternateNames: jsonb("alternate_names")
      .$type<Partial<Record<keyof Localised, string[]>>>()
      .default({})
      .notNull(),
    description: jsonb("description").$type<Localised>().default({}).notNull(),
    foundingDate: date("founding_date"),
    trustPan: text("trust_pan"),
    trustRegistrationNo: text("trust_registration_no"),
    registrationAuthority: text("registration_authority"),
    reg12aNumber: text("reg_12a_number"),
    reg12aDate: date("reg_12a_date"),
    reg80gNumber: text("reg_80g_number"),
    reg80gValidFrom: date("reg_80g_valid_from"),
    reg80gValidTo: date("reg_80g_valid_to"),
    streetAddress: text("street_address"),
    locality: text("locality"),
    city: text("city"),
    district: text("district"),
    state: text("state"),
    pincode: text("pincode"),
    country: text("country").default("IN").notNull(),
    geoLat: numeric("geo_lat", { precision: 9, scale: 6 }),
    geoLng: numeric("geo_lng", { precision: 9, scale: 6 }),
    phones: text("phones")
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    email: text("email"),
    contactHours: jsonb("contact_hours").$type<Localised>().default({}).notNull(),
    areaServed: text("area_served")
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    trustees: jsonb("trustees")
      .$type<{ name: string; role: string; photoMediaId?: string; bio?: Localised; sort: number }[]>()
      .default([])
      .notNull(),
    sameAs: text("same_as")
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    logoMediaId: uuid("logo_media_id"),
    signatoryName: text("signatory_name"),
    signatoryTitle: text("signatory_title"),
    signatureMediaId: uuid("signature_media_id"),
    updatedBy: updatedBy(),
    updatedAt: updatedAt(),
  },
  (t) => [check("organization_settings_single_row", sql`${t.id} = 1`)],
);

export const seoSettings = pgTable(
  "seo_settings",
  {
    id: singleRowId(),
    titleTemplate: jsonb("title_template").$type<Localised>().default({}).notNull(),
    defaultDescription: jsonb("default_description").$type<Localised>().default({}).notNull(),
    defaultOgImageId: uuid("default_og_image_id"),
    googleSiteVerification: text("google_site_verification"),
    bingSiteVerification: text("bing_site_verification"),
    indexnowKey: text("indexnow_key"),
    twitterHandle: text("twitter_handle"),
    updatedBy: updatedBy(),
    updatedAt: updatedAt(),
  },
  (t) => [check("seo_settings_single_row", sql`${t.id} = 1`)],
);

export const paymentSettings = pgTable(
  "payment_settings",
  {
    id: singleRowId(),
    minAmountPaise: paise("min_amount_paise").default(10000).notNull(),
    // No maximum until the Trust decides (open-questions B7).
    maxAmountPaise: paise("max_amount_paise"),
    presetAmountsPaise: bigint("preset_amounts_paise", { mode: "number" })
      .array()
      .default(sql`'{}'::bigint[]`)
      .notNull(),
    // Fee-cover percentage in basis points; off until B3 is answered.
    feeCoverPercentBp: integer("fee_cover_percent_bp").default(0).notNull(),
    feeCoverEnabled: boolean("fee_cover_enabled").default(false).notNull(),
    // Section 80G(5D): cash above ₹2,000 is not deductible.
    cash80gLimitPaise: paise("cash_80g_limit_paise").default(200000).notNull(),
    providerMode: providerMode("provider_mode").default("sandbox").notNull(),
    updatedBy: updatedBy(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("payment_settings_single_row", sql`${t.id} = 1`),
    check("payment_settings_min_positive", sql`${t.minAmountPaise} > 0`),
    check(
      "payment_settings_max_gte_min",
      sql`${t.maxAmountPaise} is null or ${t.maxAmountPaise} >= ${t.minAmountPaise}`,
    ),
    check("payment_settings_fee_bp_range", sql`${t.feeCoverPercentBp} between 0 and 1000`),
  ],
);

export const emailSettings = pgTable(
  "email_settings",
  {
    id: singleRowId(),
    fromName: text("from_name"),
    fromAddress: text("from_address"),
    replyTo: text("reply_to"),
    adminAlertRecipients: text("admin_alert_recipients")
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    provider: emailProvider("provider"),
    updatedBy: updatedBy(),
    updatedAt: updatedAt(),
  },
  (t) => [check("email_settings_single_row", sql`${t.id} = 1`)],
);

export const appearanceSettings = pgTable(
  "appearance_settings",
  {
    id: singleRowId(),
    siteFont: siteFont("site_font").default("poppins").notNull(),
    updatedBy: updatedBy(),
    updatedAt: updatedAt(),
  },
  (t) => [check("appearance_settings_single_row", sql`${t.id} = 1`)],
);
