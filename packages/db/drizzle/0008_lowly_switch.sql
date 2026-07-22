ALTER TYPE "public"."entity_kind" RENAME TO "entity_kind_old";--> statement-breakpoint
CREATE TYPE "public"."entity_kind" AS ENUM('anime', 'genre');--> statement-breakpoint
ALTER TABLE "entity" ALTER COLUMN "kind" SET DATA TYPE "public"."entity_kind" USING "kind"::text::"public"."entity_kind";--> statement-breakpoint
ALTER TABLE "change" ALTER COLUMN "entity_kind" SET DATA TYPE "public"."entity_kind" USING "entity_kind"::text::"public"."entity_kind";--> statement-breakpoint
DROP TYPE "public"."entity_kind_old";--> statement-breakpoint
INSERT INTO "entity" ("id", "kind", "head_rev")
  SELECT g."id", 'genre', 1 FROM "genre" g
  ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
INSERT INTO "entity_revision" ("entity_id", "rev", "op", "snapshot", "changed_fields")
  SELECT g."id", 1, 'create', jsonb_build_object('name', g."name"), ARRAY['name']
  FROM "genre" g
  WHERE NOT EXISTS (
    SELECT 1 FROM "entity_revision" er WHERE er."entity_id" = g."id"
  );--> statement-breakpoint
ALTER TABLE "genre" ADD CONSTRAINT "genre_id_entity_id_fk" FOREIGN KEY ("id") REFERENCES "public"."entity"("id") ON DELETE no action ON UPDATE no action;
