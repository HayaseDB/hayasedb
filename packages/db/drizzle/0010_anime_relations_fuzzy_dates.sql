CREATE TYPE "public"."anime_relation_kind" AS ENUM('SEQUEL', 'SIDE_STORY', 'SPIN_OFF', 'SUMMARY', 'ALTERNATIVE', 'CHARACTER', 'OTHER');--> statement-breakpoint
ALTER TYPE "public"."anime_format" ADD VALUE 'TV_SHORT' BEFORE 'MOVIE';--> statement-breakpoint
ALTER TYPE "public"."anime_format" ADD VALUE 'MUSIC';--> statement-breakpoint
CREATE TABLE "anime_relation" (
	"source_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"kind" "anime_relation_kind" NOT NULL,
	CONSTRAINT "anime_relation_source_id_target_id_kind_pk" PRIMARY KEY("source_id","target_id","kind"),
	CONSTRAINT "anime_relation_not_self_check" CHECK ("anime_relation"."source_id" <> "anime_relation"."target_id"),
	CONSTRAINT "anime_relation_symmetric_order_check" CHECK ("anime_relation"."kind" not in ('ALTERNATIVE', 'CHARACTER', 'OTHER') or "anime_relation"."source_id" < "anime_relation"."target_id")
);
--> statement-breakpoint
DROP INDEX "entity_kind_idx";--> statement-breakpoint
ALTER TABLE "anime" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "anime" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "anime" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "anime" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "anime" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "anime_media" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "anime_media" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "genre" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "access_token_expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "refresh_token_expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "apikey" ALTER COLUMN "last_refill_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "apikey" ALTER COLUMN "last_request" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "apikey" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "apikey" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "apikey" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "ban_expires" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "changeset" ALTER COLUMN "submitted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "changeset" ALTER COLUMN "decided_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "changeset" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "changeset" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "changeset_message" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "changeset_message" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "entity" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entity" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entity" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "entity_revision" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entity_revision" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "media_asset" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "media_asset" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "media_upload" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "media_upload" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_avatar" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_avatar" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "anime" ADD COLUMN "start_year" smallint;--> statement-breakpoint
ALTER TABLE "anime" ADD COLUMN "start_month" smallint;--> statement-breakpoint
ALTER TABLE "anime" ADD COLUMN "start_day" smallint;--> statement-breakpoint
ALTER TABLE "anime" ADD COLUMN "end_year" smallint;--> statement-breakpoint
ALTER TABLE "anime" ADD COLUMN "end_month" smallint;--> statement-breakpoint
ALTER TABLE "anime" ADD COLUMN "end_day" smallint;--> statement-breakpoint
ALTER TABLE "anime_relation" ADD CONSTRAINT "anime_relation_source_id_anime_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."anime"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_relation" ADD CONSTRAINT "anime_relation_target_id_anime_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."anime"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "anime_relation_target_id_idx" ON "anime_relation" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "anime_status_idx" ON "anime" USING btree ("status");--> statement-breakpoint
CREATE INDEX "anime_format_idx" ON "anime" USING btree ("format");--> statement-breakpoint
CREATE INDEX "anime_start_idx" ON "anime" USING btree ("start_year","start_month","start_day");--> statement-breakpoint
CREATE INDEX "anime_created_at_idx" ON "anime" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "entity_kind_live_idx" ON "entity" USING btree ("kind") WHERE "entity"."deleted_at" is null;--> statement-breakpoint
ALTER TABLE "anime" ADD CONSTRAINT "anime_start_date_check" CHECK (("anime"."start_month" is null or ("anime"."start_year" is not null and "anime"."start_month" between 1 and 12)) and ("anime"."start_day" is null or ("anime"."start_month" is not null and "anime"."start_day" between 1 and 31)));--> statement-breakpoint
ALTER TABLE "anime" ADD CONSTRAINT "anime_end_date_check" CHECK (("anime"."end_month" is null or ("anime"."end_year" is not null and "anime"."end_month" between 1 and 12)) and ("anime"."end_day" is null or ("anime"."end_month" is not null and "anime"."end_day" between 1 and 31)));