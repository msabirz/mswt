CREATE TYPE "public"."donation_mode" AS ENUM('online', 'cash', 'cheque', 'neft', 'upi_offline');--> statement-breakpoint
CREATE TYPE "public"."donation_status" AS ENUM('created', 'pending', 'paid', 'failed', 'expired', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."donor_created_via" AS ENUM('online', 'offline');--> statement-breakpoint
CREATE TYPE "public"."receipt_kind" AS ENUM('80g', 'acknowledgement');--> statement-breakpoint
CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_order_id" text NOT NULL,
	"donor_id" uuid NOT NULL,
	"cause_id" uuid,
	"amount_paise" bigint NOT NULL,
	"fee_cover_paise" bigint DEFAULT 0 NOT NULL,
	"total_paise" bigint NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"mode" "donation_mode" NOT NULL,
	"status" "donation_status" DEFAULT 'created' NOT NULL,
	"provider" text,
	"provider_order_id" text,
	"provider_payment_id" text,
	"provider_payment_method" text,
	"payment_session_id" text,
	"instrument_ref" text,
	"instrument_date" date,
	"bank_name" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"wants_80g" boolean DEFAULT false NOT NULL,
	"name_snapshot" text NOT NULL,
	"email_snapshot" text NOT NULL,
	"pan_enc_snapshot" text,
	"pan_last4_snapshot" text,
	"address_snapshot" jsonb,
	"received_at" timestamp with time zone,
	"fy" text,
	"entered_by_user_id" uuid,
	"notes" text,
	"locale" "locale" DEFAULT 'en' NOT NULL,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "donations_inr_only" CHECK ("donations"."currency" = 'INR'),
	CONSTRAINT "donations_amount_positive" CHECK ("donations"."amount_paise" > 0),
	CONSTRAINT "donations_fee_non_negative" CHECK ("donations"."fee_cover_paise" >= 0),
	CONSTRAINT "donations_total" CHECK ("donations"."total_paise" = "donations"."amount_paise" + "donations"."fee_cover_paise"),
	CONSTRAINT "donations_paid_has_date" CHECK ("donations"."status" not in ('paid', 'refunded') or ("donations"."received_at" is not null and "donations"."fy" is not null)),
	CONSTRAINT "donations_fy_format" CHECK ("donations"."fy" is null or "donations"."fy" ~ '^[0-9]{4}-[0-9]{2}$')
);
--> statement-breakpoint
CREATE TABLE "donors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"pan_enc" text,
	"pan_last4" text,
	"pan_hmac" text,
	"address_line1" text,
	"address_line2" text,
	"city" text,
	"state" text,
	"pincode" text,
	"is_indian_citizen_declared" boolean NOT NULL,
	"declared_at" timestamp with time zone NOT NULL,
	"consent_marketing" boolean DEFAULT false NOT NULL,
	"created_via" "donor_created_via" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "donors_indian_citizen" CHECK ("donors"."is_indian_citizen_declared"),
	CONSTRAINT "donors_pincode_format" CHECK ("donors"."pincode" is null or "donors"."pincode" ~ '^[1-9][0-9]{5}$')
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"event_type" text NOT NULL,
	"provider_event_id" text NOT NULL,
	"donation_id" uuid,
	"signature_valid" boolean NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "receipt_sequences" (
	"kind" "receipt_kind" NOT NULL,
	"fy" text NOT NULL,
	"last_seq" integer NOT NULL,
	CONSTRAINT "receipt_sequences_kind_fy_pk" PRIMARY KEY("kind","fy"),
	CONSTRAINT "receipt_sequences_seq" CHECK ("receipt_sequences"."last_seq" >= 0)
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"donation_id" uuid NOT NULL,
	"kind" "receipt_kind" NOT NULL,
	"number" text NOT NULL,
	"fy" text NOT NULL,
	"seq" integer NOT NULL,
	"pdf_r2_key" text,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"emailed_at" timestamp with time zone,
	"email_message_id" text,
	"email_attempts" integer DEFAULT 0 NOT NULL,
	"voided_at" timestamp with time zone,
	"void_reason" text,
	"voided_by_user_id" uuid,
	CONSTRAINT "receipts_seq_positive" CHECK ("receipts"."seq" > 0)
);
--> statement-breakpoint
CREATE TABLE "reconciliation_runs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"checked" integer DEFAULT 0 NOT NULL,
	"updated" integer DEFAULT 0 NOT NULL,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_settings" DROP CONSTRAINT "payment_settings_min_positive";--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_donor_id_donors_id_fk" FOREIGN KEY ("donor_id") REFERENCES "public"."donors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_cause_id_causes_id_fk" FOREIGN KEY ("cause_id") REFERENCES "public"."causes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_entered_by_user_id_users_id_fk" FOREIGN KEY ("entered_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_voided_by_user_id_users_id_fk" FOREIGN KEY ("voided_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "donations_public_order_id_idx" ON "donations" USING btree ("public_order_id");--> statement-breakpoint
CREATE INDEX "donations_status_created_idx" ON "donations" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "donations_donor_idx" ON "donations" USING btree ("donor_id");--> statement-breakpoint
CREATE INDEX "donations_cause_idx" ON "donations" USING btree ("cause_id");--> statement-breakpoint
CREATE INDEX "donations_ip_recent_idx" ON "donations" USING btree ("ip_hash","created_at");--> statement-breakpoint
CREATE INDEX "donations_fy_idx" ON "donations" USING btree ("fy");--> statement-breakpoint
CREATE UNIQUE INDEX "donors_pan_hmac_idx" ON "donors" USING btree ("pan_hmac") WHERE "donors"."pan_hmac" is not null;--> statement-breakpoint
CREATE INDEX "donors_email_phone_idx" ON "donors" USING btree (lower("email"),"phone");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_events_provider_event_idx" ON "payment_events" USING btree ("provider","provider_event_id");--> statement-breakpoint
CREATE INDEX "payment_events_donation_idx" ON "payment_events" USING btree ("donation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "receipts_donation_idx" ON "receipts" USING btree ("donation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "receipts_number_idx" ON "receipts" USING btree ("number");--> statement-breakpoint
CREATE UNIQUE INDEX "receipts_kind_fy_seq_idx" ON "receipts" USING btree ("kind","fy","seq");--> statement-breakpoint
-- Hand-added: provisional suggested amounts (₹500 / ₹1,000 / ₹2,500 / ₹5,000) so the existing row
-- satisfies the new 3–4 presets rule. The Trust changes them in the admin (open-questions B7).
UPDATE "payment_settings" SET "preset_amounts_paise" = '{50000,100000,250000,500000}'::bigint[]
WHERE cardinality("preset_amounts_paise") = 0;--> statement-breakpoint
ALTER TABLE "payment_settings" ADD CONSTRAINT "payment_settings_min_above_5_rupees" CHECK ("payment_settings"."min_amount_paise" > 500);--> statement-breakpoint
ALTER TABLE "payment_settings" ADD CONSTRAINT "payment_settings_presets_count" CHECK (cardinality("payment_settings"."preset_amounts_paise") between 3 and 4);