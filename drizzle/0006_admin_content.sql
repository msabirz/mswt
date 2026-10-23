ALTER TABLE "media" ADD COLUMN "variants" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "blur" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "uploaded_by" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "page_translations" ADD COLUMN "extras" jsonb;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "messages_status_idx" ON "messages" USING btree ("status","created_at");