CREATE TYPE "public"."cause_status" AS ENUM('draft', 'active', 'closed');--> statement-breakpoint
CREATE TYPE "public"."event_attendance" AS ENUM('offline', 'online', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('scheduled', 'cancelled', 'postponed', 'rescheduled', 'moved_online');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('en', 'hi', 'mr', 'gu');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('new', 'read', 'replied', 'spam');--> statement-breakpoint
CREATE TYPE "public"."page_key" AS ENUM('home', 'about', 'transparency', 'contact', 'privacy', 'terms', 'refund_policy', 'disclaimer_80g');--> statement-breakpoint
CREATE TYPE "public"."publish_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."report_kind" AS ENUM('annual_report', 'audited_accounts', 'other');--> statement-breakpoint
CREATE TABLE "cause_translations" (
	"cause_id" uuid NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"body" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"locale" "locale" NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cause_translations_cause_id_locale_pk" PRIMARY KEY("cause_id","locale")
);
--> statement-breakpoint
CREATE TABLE "causes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"status" "cause_status" DEFAULT 'draft' NOT NULL,
	"goal_paise" bigint,
	"raised_paise" bigint DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"cover_image_id" uuid,
	"is_80g_eligible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "causes_slug_format" CHECK ("causes"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "causes_goal_positive" CHECK ("causes"."goal_paise" is null or "causes"."goal_paise" > 0),
	CONSTRAINT "causes_raised_non_negative" CHECK ("causes"."raised_paise" >= 0)
);
--> statement-breakpoint
CREATE TABLE "event_translations" (
	"event_id" uuid NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"body" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"locale" "locale" NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_translations_event_id_locale_pk" PRIMARY KEY("event_id","locale")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"event_status" "event_status" DEFAULT 'scheduled' NOT NULL,
	"attendance" "event_attendance" DEFAULT 'offline' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"venue_name" text,
	"venue_street" text,
	"venue_city" text,
	"venue_region" text,
	"venue_postal_code" text,
	"online_url" text,
	"cover_image_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_format" CHECK ("events"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "events_end_after_start" CHECK ("events"."ends_at" is null or "events"."ends_at" >= "events"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "gallery_album_translations" (
	"album_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"locale" "locale" NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gallery_album_translations_album_id_locale_pk" PRIMARY KEY("album_id","locale")
);
--> statement-breakpoint
CREATE TABLE "gallery_albums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"cover_image_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gallery_albums_slug_format" CHECK ("gallery_albums"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "gallery_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"album_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"r2_key" text,
	"filename" text NOT NULL,
	"mime" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"bytes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_translations" (
	"media_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"alt_text" text NOT NULL,
	"caption" text,
	CONSTRAINT "media_translations_media_id_locale_pk" PRIMARY KEY("media_id","locale")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"locale" "locale" NOT NULL,
	"ip_hash" text NOT NULL,
	"status" "message_status" DEFAULT 'new' NOT NULL,
	"assigned_to" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"author_name" text,
	"cover_image_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_posts_slug_format" CHECK ("news_posts"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "news_posts_published_has_date" CHECK ("news_posts"."status" <> 'published' or "news_posts"."published_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "news_translations" (
	"post_id" uuid NOT NULL,
	"headline" text NOT NULL,
	"excerpt" text NOT NULL,
	"body" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"locale" "locale" NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_translations_post_id_locale_pk" PRIMARY KEY("post_id","locale")
);
--> statement-breakpoint
CREATE TABLE "page_translations" (
	"page_key" "page_key" NOT NULL,
	"title" text NOT NULL,
	"h1" text NOT NULL,
	"intro" text,
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"locale" "locale" NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "page_translations_page_key_locale_pk" PRIMARY KEY("page_key","locale")
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"key" "page_key" PRIMARY KEY NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_translations" (
	"report_id" uuid NOT NULL,
	"title" text NOT NULL,
	"locale" "locale" NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_translations_report_id_locale_pk" PRIMARY KEY("report_id","locale")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fy" text NOT NULL,
	"kind" "report_kind" NOT NULL,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"pdf_r2_key" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reports_fy_format" CHECK ("reports"."fy" ~ '^[0-9]{4}-[0-9]{2}$')
);
--> statement-breakpoint
ALTER TABLE "cause_translations" ADD CONSTRAINT "cause_translations_cause_id_causes_id_fk" FOREIGN KEY ("cause_id") REFERENCES "public"."causes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cause_translations" ADD CONSTRAINT "cause_translations_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "causes" ADD CONSTRAINT "causes_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_translations" ADD CONSTRAINT "event_translations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_translations" ADD CONSTRAINT "event_translations_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_album_translations" ADD CONSTRAINT "gallery_album_translations_album_id_gallery_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."gallery_albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_album_translations" ADD CONSTRAINT "gallery_album_translations_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_albums" ADD CONSTRAINT "gallery_albums_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_album_id_gallery_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."gallery_albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_translations" ADD CONSTRAINT "media_translations_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_translations" ADD CONSTRAINT "news_translations_post_id_news_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."news_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_translations" ADD CONSTRAINT "news_translations_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_translations" ADD CONSTRAINT "page_translations_page_key_pages_key_fk" FOREIGN KEY ("page_key") REFERENCES "public"."pages"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_translations" ADD CONSTRAINT "page_translations_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_translations" ADD CONSTRAINT "report_translations_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_translations" ADD CONSTRAINT "report_translations_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "causes_slug_idx" ON "causes" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_starts_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "gallery_albums_slug_idx" ON "gallery_albums" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "gallery_items_album_idx" ON "gallery_items" USING btree ("album_id","sort_order");--> statement-breakpoint
CREATE INDEX "messages_created_idx" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "messages_ip_recent_idx" ON "messages" USING btree ("ip_hash","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "news_posts_slug_idx" ON "news_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "news_posts_published_idx" ON "news_posts" USING btree ("published_at");