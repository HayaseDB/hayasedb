CREATE TYPE "public"."change_op" AS ENUM('create', 'update', 'delete');--> statement-breakpoint
CREATE TYPE "public"."changeset_status" AS ENUM('draft', 'pending', 'approved', 'rejected', 'withdrawn', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."entity_kind" AS ENUM('anime');--> statement-breakpoint
CREATE TABLE "media_upload" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"uploader_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "change" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"changeset_id" uuid NOT NULL,
	"ord" smallint NOT NULL,
	"entity_kind" "entity_kind" NOT NULL,
	"entity_id" uuid NOT NULL,
	"op" "change_op" NOT NULL,
	"base_rev" integer,
	"payload" jsonb NOT NULL,
	"old_values" jsonb,
	"conflicted" boolean DEFAULT false NOT NULL,
	"applied_revision_id" uuid
);
--> statement-breakpoint
CREATE TABLE "changeset" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"author_id" text,
	"status" "changeset_status" DEFAULT 'pending' NOT NULL,
	"summary" text NOT NULL,
	"submitted_at" timestamp,
	"decided_at" timestamp,
	"decided_by_id" text,
	"supersedes_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "changeset_note" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"changeset_id" uuid NOT NULL,
	"author_id" text,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"kind" "entity_kind" NOT NULL,
	"head_rev" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp,
	"locked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_revision" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"entity_id" uuid NOT NULL,
	"rev" integer NOT NULL,
	"op" "change_op" NOT NULL,
	"snapshot" jsonb NOT NULL,
	"changed_fields" text[] DEFAULT '{}'::text[] NOT NULL,
	"changeset_id" uuid,
	"editor_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media_upload" ADD CONSTRAINT "media_upload_media_asset_id_media_asset_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_upload" ADD CONSTRAINT "media_upload_uploader_id_user_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change" ADD CONSTRAINT "change_changeset_id_changeset_id_fk" FOREIGN KEY ("changeset_id") REFERENCES "public"."changeset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change" ADD CONSTRAINT "change_applied_revision_id_entity_revision_id_fk" FOREIGN KEY ("applied_revision_id") REFERENCES "public"."entity_revision"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changeset" ADD CONSTRAINT "changeset_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changeset" ADD CONSTRAINT "changeset_decided_by_id_user_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changeset" ADD CONSTRAINT "changeset_supersedes_id_changeset_id_fk" FOREIGN KEY ("supersedes_id") REFERENCES "public"."changeset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changeset_note" ADD CONSTRAINT "changeset_note_changeset_id_changeset_id_fk" FOREIGN KEY ("changeset_id") REFERENCES "public"."changeset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changeset_note" ADD CONSTRAINT "changeset_note_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_revision" ADD CONSTRAINT "entity_revision_entity_id_entity_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_revision" ADD CONSTRAINT "entity_revision_changeset_id_changeset_id_fk" FOREIGN KEY ("changeset_id") REFERENCES "public"."changeset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_revision" ADD CONSTRAINT "entity_revision_editor_id_user_id_fk" FOREIGN KEY ("editor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_upload_uploader_idx" ON "media_upload" USING btree ("uploader_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "change_changeset_entity_uq" ON "change" USING btree ("changeset_id","entity_id");--> statement-breakpoint
CREATE INDEX "change_entity_idx" ON "change" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "changeset_pending_idx" ON "changeset" USING btree ("status","submitted_at") WHERE "changeset"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "changeset_author_idx" ON "changeset" USING btree ("author_id","created_at");--> statement-breakpoint
CREATE INDEX "entity_kind_idx" ON "entity" USING btree ("kind");--> statement-breakpoint
CREATE UNIQUE INDEX "entity_revision_entity_rev_uq" ON "entity_revision" USING btree ("entity_id","rev");--> statement-breakpoint
CREATE INDEX "entity_revision_changeset_idx" ON "entity_revision" USING btree ("changeset_id");--> statement-breakpoint
ALTER TABLE "anime" ADD CONSTRAINT "anime_id_entity_id_fk" FOREIGN KEY ("id") REFERENCES "public"."entity"("id") ON DELETE no action ON UPDATE no action;