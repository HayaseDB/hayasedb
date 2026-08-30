CREATE TYPE "public"."anime_episode_status" AS ENUM('UPCOMING', 'RELEASED', 'DELAYED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."anime_episode_type" AS ENUM('REGULAR', 'SPECIAL', 'RECAP', 'PROMO');--> statement-breakpoint
CREATE TYPE "public"."anime_season_kind" AS ENUM('SEASON', 'COUR', 'PART', 'ARC', 'SPECIALS');--> statement-breakpoint
CREATE TABLE "anime_episode" (
	"id" uuid PRIMARY KEY NOT NULL,
	"anime_id" uuid,
	"season_id" uuid,
	"number" numeric(8, 3),
	"position" integer NOT NULL,
	"type" "anime_episode_type" NOT NULL,
	"status" "anime_episode_status" NOT NULL,
	"air_date" date,
	"duration_seconds" integer,
	"still_media_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "anime_episode_anime_position_uq" UNIQUE("anime_id","position"),
	CONSTRAINT "anime_episode_season_position_uq" UNIQUE("season_id","position"),
	CONSTRAINT "anime_episode_owner_check" CHECK (num_nonnulls("anime_episode"."anime_id", "anime_episode"."season_id") = 1),
	CONSTRAINT "anime_episode_position_check" CHECK ("anime_episode"."position" >= 0),
	CONSTRAINT "anime_episode_number_check" CHECK ("anime_episode"."number" is null or "anime_episode"."number" >= 0),
	CONSTRAINT "anime_episode_duration_check" CHECK ("anime_episode"."duration_seconds" is null or "anime_episode"."duration_seconds" > 0)
);
--> statement-breakpoint
CREATE TABLE "anime_episode_translation" (
	"episode_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"overview" text,
	"original" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "anime_episode_translation_episode_id_locale_pk" PRIMARY KEY("episode_id","locale")
);
--> statement-breakpoint
CREATE TABLE "anime_season" (
	"id" uuid PRIMARY KEY NOT NULL,
	"anime_id" uuid NOT NULL,
	"kind" "anime_season_kind" NOT NULL,
	"number" numeric(8, 3),
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "anime_season_anime_position_uq" UNIQUE("anime_id","position"),
	CONSTRAINT "anime_season_position_check" CHECK ("anime_season"."position" >= 0),
	CONSTRAINT "anime_season_number_check" CHECK ("anime_season"."number" is null or "anime_season"."number" >= 0)
);
--> statement-breakpoint
CREATE TABLE "anime_season_translation" (
	"season_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"original" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "anime_season_translation_season_id_locale_pk" PRIMARY KEY("season_id","locale")
);
--> statement-breakpoint
ALTER TABLE "anime_episode" ADD CONSTRAINT "anime_episode_id_entity_id_fk" FOREIGN KEY ("id") REFERENCES "public"."entity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_episode" ADD CONSTRAINT "anime_episode_anime_id_anime_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_episode" ADD CONSTRAINT "anime_episode_season_id_anime_season_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."anime_season"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_episode" ADD CONSTRAINT "anime_episode_still_media_id_media_asset_id_fk" FOREIGN KEY ("still_media_id") REFERENCES "public"."media_asset"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_episode_translation" ADD CONSTRAINT "anime_episode_translation_episode_id_anime_episode_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."anime_episode"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_season" ADD CONSTRAINT "anime_season_id_entity_id_fk" FOREIGN KEY ("id") REFERENCES "public"."entity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_season" ADD CONSTRAINT "anime_season_anime_id_anime_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_season_translation" ADD CONSTRAINT "anime_season_translation_season_id_anime_season_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."anime_season"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "anime_episode_anime_type_number_uq" ON "anime_episode" USING btree ("anime_id","type","number") WHERE "anime_episode"."anime_id" is not null and "anime_episode"."number" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "anime_episode_season_type_number_uq" ON "anime_episode" USING btree ("season_id","type","number") WHERE "anime_episode"."season_id" is not null and "anime_episode"."number" is not null;--> statement-breakpoint
CREATE INDEX "anime_episode_still_media_idx" ON "anime_episode" USING btree ("still_media_id");--> statement-breakpoint
CREATE UNIQUE INDEX "anime_episode_translation_original_uq" ON "anime_episode_translation" USING btree ("episode_id") WHERE "anime_episode_translation"."original";--> statement-breakpoint
CREATE UNIQUE INDEX "anime_season_anime_kind_number_uq" ON "anime_season" USING btree ("anime_id","kind","number") WHERE "anime_season"."number" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "anime_season_translation_original_uq" ON "anime_season_translation" USING btree ("season_id") WHERE "anime_season_translation"."original";--> statement-breakpoint
ALTER TABLE "anime_season" DROP CONSTRAINT "anime_season_anime_position_uq";--> statement-breakpoint
ALTER TABLE "anime_season" ADD CONSTRAINT "anime_season_anime_position_uq" UNIQUE("anime_id","position") DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
ALTER TABLE "anime_episode" DROP CONSTRAINT "anime_episode_anime_position_uq";--> statement-breakpoint
ALTER TABLE "anime_episode" ADD CONSTRAINT "anime_episode_anime_position_uq" UNIQUE("anime_id","position") DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
ALTER TABLE "anime_episode" DROP CONSTRAINT "anime_episode_season_position_uq";--> statement-breakpoint
ALTER TABLE "anime_episode" ADD CONSTRAINT "anime_episode_season_position_uq" UNIQUE("season_id","position") DEFERRABLE INITIALLY DEFERRED;
