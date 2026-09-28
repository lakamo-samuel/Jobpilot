ALTER TABLE "cvs" ALTER COLUMN "status" SET DEFAULT 'parsing';--> statement-breakpoint
ALTER TABLE "cvs" ADD COLUMN "extracted_text" text;--> statement-breakpoint
ALTER TABLE "cvs" ADD COLUMN "extracted_profile" jsonb;--> statement-breakpoint
ALTER TABLE "cvs" ADD COLUMN "extraction_error" text;
--> statement-breakpoint
UPDATE "cvs" SET "status" = 'parsing' WHERE "status" = 'ready' AND "deleted_at" IS NULL;
