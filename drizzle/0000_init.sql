CREATE TYPE "public"."email_provider" AS ENUM('resend', 'brevo', 'msg91');--> statement-breakpoint
CREATE TYPE "public"."provider_mode" AS ENUM('sandbox', 'production');--> statement-breakpoint
CREATE TYPE "public"."site_font" AS ENUM('poppins', 'mukta', 'hind', 'noto_sans');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'accountant', 'content_editor');--> statement-breakpoint
CREATE TABLE "appearance_settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"site_font" "site_font" DEFAULT 'poppins' NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appearance_settings_single_row" CHECK ("appearance_settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"before" jsonb,
	"after" jsonb,
	"ip" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"from_name" text,
	"from_address" text,
	"reply_to" text,
	"admin_alert_recipients" text[] DEFAULT '{}'::text[] NOT NULL,
	"provider" "email_provider",
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_settings_single_row" CHECK ("email_settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "organization_settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"legal_name" text NOT NULL,
	"display_name" text NOT NULL,
	"alternate_names" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"description" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"founding_date" date,
	"trust_pan" text,
	"trust_registration_no" text,
	"registration_authority" text,
	"reg_12a_number" text,
	"reg_12a_date" date,
	"reg_80g_number" text,
	"reg_80g_valid_from" date,
	"reg_80g_valid_to" date,
	"street_address" text,
	"locality" text,
	"city" text,
	"district" text,
	"state" text,
	"pincode" text,
	"country" text DEFAULT 'IN' NOT NULL,
	"geo_lat" numeric(9, 6),
	"geo_lng" numeric(9, 6),
	"phones" text[] DEFAULT '{}'::text[] NOT NULL,
	"email" text,
	"contact_hours" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"area_served" text[] DEFAULT '{}'::text[] NOT NULL,
	"trustees" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"same_as" text[] DEFAULT '{}'::text[] NOT NULL,
	"logo_media_id" uuid,
	"signatory_name" text,
	"signatory_title" text,
	"signature_media_id" uuid,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_settings_single_row" CHECK ("organization_settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "payment_settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"min_amount_paise" bigint DEFAULT 10000 NOT NULL,
	"max_amount_paise" bigint,
	"preset_amounts_paise" bigint[] DEFAULT '{}'::bigint[] NOT NULL,
	"fee_cover_percent_bp" integer DEFAULT 0 NOT NULL,
	"fee_cover_enabled" boolean DEFAULT false NOT NULL,
	"cash_80g_limit_paise" bigint DEFAULT 200000 NOT NULL,
	"provider_mode" "provider_mode" DEFAULT 'sandbox' NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_settings_single_row" CHECK ("payment_settings"."id" = 1),
	CONSTRAINT "payment_settings_min_positive" CHECK ("payment_settings"."min_amount_paise" > 0),
	CONSTRAINT "payment_settings_max_gte_min" CHECK ("payment_settings"."max_amount_paise" is null or "payment_settings"."max_amount_paise" >= "payment_settings"."min_amount_paise"),
	CONSTRAINT "payment_settings_fee_bp_range" CHECK ("payment_settings"."fee_cover_percent_bp" between 0 and 1000)
);
--> statement-breakpoint
CREATE TABLE "seo_settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"title_template" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"default_description" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"default_og_image_id" uuid,
	"google_site_verification" text,
	"bing_site_verification" text,
	"indexnow_key" text,
	"twitter_handle" text,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seo_settings_single_row" CHECK ("seo_settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"totp_secret_enc" text,
	"totp_enabled_at" timestamp with time zone,
	"recovery_codes_hash" text[],
	"failed_logins" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appearance_settings" ADD CONSTRAINT "appearance_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_settings" ADD CONSTRAINT "email_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_settings" ADD CONSTRAINT "payment_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_settings" ADD CONSTRAINT "seo_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_idx" ON "users" USING btree (lower("email"));