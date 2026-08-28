CREATE TABLE "anime_translation" (
	"anime_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"original" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "anime_translation_anime_id_locale_pk" PRIMARY KEY("anime_id","locale")
);
--> statement-breakpoint
CREATE TABLE "genre_translation" (
	"genre_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "genre_translation_genre_id_locale_pk" PRIMARY KEY("genre_id","locale")
);
--> statement-breakpoint
ALTER TABLE "anime_translation" ADD CONSTRAINT "anime_translation_anime_id_anime_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genre_translation" ADD CONSTRAINT "genre_translation_genre_id_genre_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genre"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "anime_translation_original_uq" ON "anime_translation" USING btree ("anime_id") WHERE "anime_translation"."original";--> statement-breakpoint
CREATE UNIQUE INDEX "genre_translation_locale_name_uq" ON "genre_translation" USING btree ("locale",lower("name"));--> statement-breakpoint
ALTER TABLE "genre" ADD COLUMN "slug" text;--> statement-breakpoint

INSERT INTO "anime_translation" ("anime_id", "locale", "title", "description", "original")
SELECT "id", 'ja-Jpan', "title_native", NULL, true
FROM "anime"
WHERE "title_native" IS NOT NULL AND btrim("title_native") <> '';--> statement-breakpoint

INSERT INTO "anime_translation" ("anime_id", "locale", "title", "description", "original")
SELECT a."id", 'ja-Latn', a."title_romaji", NULL,
	NOT EXISTS (SELECT 1 FROM "anime_translation" t WHERE t."anime_id" = a."id" AND t."original")
FROM "anime" a
WHERE a."title_romaji" IS NOT NULL AND btrim(a."title_romaji") <> '';--> statement-breakpoint

INSERT INTO "anime_translation" ("anime_id", "locale", "title", "description", "original")
SELECT a."id", 'en', coalesce(nullif(btrim(a."title_english"), ''), nullif(btrim(a."title_romaji"), ''), nullif(btrim(a."title_native"), ''), a."slug"), a."description",
	NOT EXISTS (SELECT 1 FROM "anime_translation" t WHERE t."anime_id" = a."id" AND t."original")
FROM "anime" a
WHERE (a."title_english" IS NOT NULL AND btrim(a."title_english") <> '') OR a."description" IS NOT NULL;--> statement-breakpoint

INSERT INTO "anime_translation" ("anime_id", "locale", "title", "description", "original")
SELECT a."id", 'en', a."slug", NULL, true
FROM "anime" a
WHERE NOT EXISTS (SELECT 1 FROM "anime_translation" t WHERE t."anime_id" = a."id");--> statement-breakpoint

WITH folded AS (
	SELECT "id",
		coalesce(nullif(trim(both '-' from regexp_replace(lower(regexp_replace(normalize("name", NFKD), '[̀-ͯ]', '', 'g')), '[^a-z0-9]+', '-', 'g')), ''), 'genre') AS base_slug
	FROM "genre"
), candidates AS (
	SELECT "id", base_slug,
		row_number() OVER (PARTITION BY base_slug ORDER BY "id") AS duplicate_number
	FROM folded
)
UPDATE "genre" g
SET "slug" = CASE
	WHEN c.duplicate_number = 1 THEN c.base_slug
	ELSE c.base_slug || '-' || left(g."id"::text, 8)
END
FROM candidates c
WHERE c."id" = g."id";--> statement-breakpoint

INSERT INTO "genre_translation" ("genre_id", "locale", "name")
SELECT "id", 'en', "name" FROM "genre";--> statement-breakpoint
ALTER TABLE "genre" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "genre" DROP CONSTRAINT "genre_name_unique";--> statement-breakpoint
ALTER TABLE "anime" DROP COLUMN "title_romaji";--> statement-breakpoint
ALTER TABLE "anime" DROP COLUMN "title_english";--> statement-breakpoint
ALTER TABLE "anime" DROP COLUMN "title_native";--> statement-breakpoint
ALTER TABLE "anime" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "genre" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "genre" ADD CONSTRAINT "genre_slug_unique" UNIQUE("slug");
