CREATE TABLE "pan_access_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "receipts_donation_idx";--> statement-breakpoint
ALTER TABLE "donors" ADD COLUMN "merged_into_id" uuid;--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "replaces_receipt_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pan_access_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pan_access_codes" ADD CONSTRAINT "pan_access_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pan_access_codes_user_idx" ON "pan_access_codes" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "receipts_donation_live_idx" ON "receipts" USING btree ("donation_id") WHERE "receipts"."voided_at" is null;--> statement-breakpoint
CREATE INDEX "receipts_donation_idx" ON "receipts" USING btree ("donation_id");