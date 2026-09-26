CREATE TYPE "public"."agent_mode" AS ENUM('observe', 'prepare', 'auto');--> statement-breakpoint
CREATE TYPE "public"."cv_status" AS ENUM('ready', 'parsing', 'error');--> statement-breakpoint
CREATE TYPE "public"."opportunity_status" AS ENUM('NEW', 'QUALIFIED', 'SKIPPED', 'PREPARED', 'PENDING_APPROVAL', 'APPLIED', 'CONTACTED', 'REPLIED', 'INTERVIEW', 'INTERESTED', 'OFFER', 'WON', 'REJECTED', 'LOST', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."opportunity_type" AS ENUM('JOB', 'CLIENT', 'INBOUND');--> statement-breakpoint
CREATE TABLE "agent_policies" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"global_mode" "agent_mode" DEFAULT 'observe' NOT NULL,
	"paused" boolean DEFAULT true NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"actor" text NOT NULL,
	"event_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"trace_id" uuid NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_attempts" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cvs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"family_id" uuid NOT NULL,
	"label" text NOT NULL,
	"file_name" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"checksum" text NOT NULL,
	"byte_size" bigint NOT NULL,
	"version" integer NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"role_focus" text DEFAULT '' NOT NULL,
	"status" "cv_status" DEFAULT 'ready' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"failed_logins" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_facts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"value" text NOT NULL,
	"evidence_source" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "opportunity_type" NOT NULL,
	"company_name" text NOT NULL,
	"company_domain" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text,
	"work_mode" text,
	"compensation" jsonb,
	"deadline" timestamp with time zone,
	"source" text DEFAULT 'manual' NOT NULL,
	"source_url" text,
	"status" "opportunity_status" DEFAULT 'NEW' NOT NULL,
	"discovered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_policies" ADD CONSTRAINT "agent_policies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cvs" ADD CONSTRAINT "cvs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_facts" ADD CONSTRAINT "profile_facts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_user_created_idx" ON "audit_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_trace_idx" ON "audit_events" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "cvs_user_created_idx" ON "cvs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cvs_user_checksum_unique" ON "cvs" USING btree ("user_id","checksum");--> statement-breakpoint
CREATE UNIQUE INDEX "cvs_family_version_unique" ON "cvs" USING btree ("family_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "cvs_storage_key_unique" ON "cvs" USING btree ("storage_key");--> statement-breakpoint
CREATE UNIQUE INDEX "cvs_one_default_per_user" ON "cvs" USING btree ("user_id") WHERE "cvs"."is_default" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expiry_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "profile_facts_user_idx" ON "profile_facts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "opportunities_user_list_idx" ON "opportunities" USING btree ("user_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "opportunities_user_status_idx" ON "opportunities" USING btree ("user_id","status","type");--> statement-breakpoint
CREATE UNIQUE INDEX "opportunities_user_source_url_unique" ON "opportunities" USING btree ("user_id","source_url");