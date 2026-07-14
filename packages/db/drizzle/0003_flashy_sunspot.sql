CREATE TYPE "public"."anime_format" AS ENUM('TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL');--> statement-breakpoint
CREATE TYPE "public"."anime_media_type" AS ENUM('COVER', 'BANNER', 'GALLERY');--> statement-breakpoint
CREATE TYPE "public"."anime_status" AS ENUM('FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS');--> statement-breakpoint
CREATE TABLE "anime" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"slug" text NOT NULL,
	"format" "anime_format",
	"status" "anime_status",
	"title_romaji" text,
	"title_english" text,
	"title_native" text,
	"description" text,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "anime_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "anime_genre" (
	"anime_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	CONSTRAINT "anime_genre_anime_id_genre_id_pk" PRIMARY KEY("anime_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "anime_media" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"anime_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"type" "anime_media_type" NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "genre" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "genre_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "media_asset" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"storage_key" text NOT NULL,
	"bucket" text NOT NULL,
	"checksum_sha256" text NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"blurhash" text,
	"original_filename" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "media_asset_storage_key_unique" UNIQUE("storage_key"),
	CONSTRAINT "media_asset_checksum_sha256_unique" UNIQUE("checksum_sha256"),
	CONSTRAINT "media_asset_mime_type_check" CHECK ("media_asset"."mime_type" in ('image/webp', 'image/jpeg', 'image/png', 'image/avif'))
);
--> statement-breakpoint
ALTER TABLE "anime_genre" ADD CONSTRAINT "anime_genre_anime_id_anime_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_genre" ADD CONSTRAINT "anime_genre_genre_id_genre_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genre"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_media" ADD CONSTRAINT "anime_media_anime_id_anime_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_media" ADD CONSTRAINT "anime_media_media_id_media_asset_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_asset"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "anime_genre_genre_id_idx" ON "anime_genre" USING btree ("genre_id");--> statement-breakpoint
CREATE INDEX "anime_media_anime_id_type_idx" ON "anime_media" USING btree ("anime_id","type","position");--> statement-breakpoint
CREATE UNIQUE INDEX "anime_media_anime_media_type_uq" ON "anime_media" USING btree ("anime_id","media_id","type");