import { sql } from "drizzle-orm";
import type { Blocks } from "@/lib/content/blocks";
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
  primaryKey,
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

// ── Content (Step 6a) ────────────────────────────────────────────────────────────────────────
// Every content type has a *_translations table keyed (parent, locale). An item is published in a
// language only when that translation row exists (no silent fallback, I18N-03).

export const locale = pgEnum("locale", ["en", "hi", "mr", "gu"]);
export const publishStatus = pgEnum("publish_status", ["draft", "published"]);
export const causeStatus = pgEnum("cause_status", ["draft", "active", "closed"]);
export const pageKey = pgEnum("page_key", [
  "home",
  "about",
  "transparency",
  "contact",
  "privacy",
  "terms",
  "refund_policy",
  "disclaimer_80g",
]);
export const eventStatus = pgEnum("event_status", [
  "scheduled",
  "cancelled",
  "postponed",
  "rescheduled",
  "moved_online",
]);
export const eventAttendance = pgEnum("event_attendance", ["offline", "online", "mixed"]);
export const reportKind = pgEnum("report_kind", ["annual_report", "audited_accounts", "other"]);

const translationCols = () => ({
  locale: locale("locale").notNull(),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  /** Set when a human has reviewed this translation; production shows only reviewed text (SEO-13). */
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  updatedAt: updatedAt(),
});
const slugCol = () => text("slug").notNull();
const slugCheck = (name: string, col: unknown) => check(name, sql`${col} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`);
const blocks = (name: string) => jsonb(name).$type<Blocks>().default([]).notNull();

/** Images. `r2Key` stays null until uploads exist (Step 8); pages then show a placeholder. */
export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  r2Key: text("r2_key"),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  bytes: integer("bytes"),
  createdAt: createdAt(),
});

export const mediaTranslations = pgTable(
  "media_translations",
  {
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    locale: locale("locale").notNull(),
    altText: text("alt_text").notNull(),
    caption: text("caption"),
  },
  (t) => [primaryKey({ columns: [t.mediaId, t.locale] })],
);

export const causes = pgTable(
  "causes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: slugCol(),
    status: causeStatus("status").default("draft").notNull(),
    goalPaise: paise("goal_paise"),
    raisedPaise: paise("raised_paise").default(0).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    coverImageId: uuid("cover_image_id").references(() => media.id),
    is80gEligible: boolean("is_80g_eligible").default(true).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("causes_slug_idx").on(t.slug),
    slugCheck("causes_slug_format", t.slug),
    check("causes_goal_positive", sql`${t.goalPaise} is null or ${t.goalPaise} > 0`),
    check("causes_raised_non_negative", sql`${t.raisedPaise} >= 0`),
  ],
);

export const causeTranslations = pgTable(
  "cause_translations",
  {
    causeId: uuid("cause_id")
      .notNull()
      .references(() => causes.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    body: blocks("body"),
    ...translationCols(),
  },
  (t) => [primaryKey({ columns: [t.causeId, t.locale] })],
);

/** Fixed pages (about, legal…) keyed by page_key; their content is blocks per language. */
export const pages = pgTable("pages", {
  key: pageKey("key").primaryKey(),
  updatedAt: updatedAt(),
});

export const pageTranslations = pgTable(
  "page_translations",
  {
    pageKey: pageKey("page_key")
      .notNull()
      .references(() => pages.key, { onDelete: "cascade" }),
    title: text("title").notNull(),
    h1: text("h1").notNull(),
    intro: text("intro"),
    sections: blocks("sections"),
    ...translationCols(),
  },
  (t) => [primaryKey({ columns: [t.pageKey, t.locale] })],
);

export const galleryAlbums = pgTable(
  "gallery_albums",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: slugCol(),
    status: publishStatus("status").default("draft").notNull(),
    coverImageId: uuid("cover_image_id").references(() => media.id),
    sortOrder: integer("sort_order").default(0).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("gallery_albums_slug_idx").on(t.slug), slugCheck("gallery_albums_slug_format", t.slug)],
);

export const galleryAlbumTranslations = pgTable(
  "gallery_album_translations",
  {
    albumId: uuid("album_id")
      .notNull()
      .references(() => galleryAlbums.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    ...translationCols(),
  },
  (t) => [primaryKey({ columns: [t.albumId, t.locale] })],
);

export const galleryItems = pgTable(
  "gallery_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    albumId: uuid("album_id")
      .notNull()
      .references(() => galleryAlbums.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => [index("gallery_items_album_idx").on(t.albumId, t.sortOrder)],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: slugCol(),
    status: publishStatus("status").default("draft").notNull(),
    eventStatus: eventStatus("event_status").default("scheduled").notNull(),
    attendance: eventAttendance("attendance").default("offline").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    venueName: text("venue_name"),
    venueStreet: text("venue_street"),
    venueCity: text("venue_city"),
    venueRegion: text("venue_region"),
    venuePostalCode: text("venue_postal_code"),
    onlineUrl: text("online_url"),
    coverImageId: uuid("cover_image_id").references(() => media.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("events_slug_idx").on(t.slug),
    slugCheck("events_slug_format", t.slug),
    check("events_end_after_start", sql`${t.endsAt} is null or ${t.endsAt} >= ${t.startsAt}`),
    index("events_starts_idx").on(t.startsAt),
  ],
);

export const eventTranslations = pgTable(
  "event_translations",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    body: blocks("body"),
    ...translationCols(),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.locale] })],
);

export const newsPosts = pgTable(
  "news_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: slugCol(),
    status: publishStatus("status").default("draft").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    authorName: text("author_name"),
    coverImageId: uuid("cover_image_id").references(() => media.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("news_posts_slug_idx").on(t.slug),
    slugCheck("news_posts_slug_format", t.slug),
    check("news_posts_published_has_date", sql`${t.status} <> 'published' or ${t.publishedAt} is not null`),
    index("news_posts_published_idx").on(t.publishedAt),
  ],
);

export const newsTranslations = pgTable(
  "news_translations",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => newsPosts.id, { onDelete: "cascade" }),
    headline: text("headline").notNull(),
    excerpt: text("excerpt").notNull(),
    body: blocks("body"),
    ...translationCols(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.locale] })],
);

/** Transparency documents. The PDF lives in R2 (Step 8); until then pdf_r2_key is null. */
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fy: text("fy").notNull(),
    kind: reportKind("kind").notNull(),
    status: publishStatus("status").default("draft").notNull(),
    pdfR2Key: text("pdf_r2_key"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [check("reports_fy_format", sql`${t.fy} ~ '^[0-9]{4}-[0-9]{2}$'`)],
);

export const reportTranslations = pgTable(
  "report_translations",
  {
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    ...translationCols(),
  },
  (t) => [primaryKey({ columns: [t.reportId, t.locale] })],
);

export const messageStatus = pgEnum("message_status", ["new", "read", "replied", "spam"]);

/** Contact form submissions. The sender's IP is stored only as a salted hash (DPDP minimisation). */
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    locale: locale("locale").notNull(),
    ipHash: text("ip_hash").notNull(),
    status: messageStatus("status").default("new").notNull(),
    assignedTo: uuid("assigned_to").references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [
    index("messages_created_idx").on(t.createdAt),
    index("messages_ip_recent_idx").on(t.ipHash, t.createdAt),
  ],
);
