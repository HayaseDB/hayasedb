UPDATE "media_asset"
SET "storage_key" = substring("storage_key" from 7)
WHERE "storage_key" LIKE 'media/%';--> statement-breakpoint
UPDATE "media_asset"
SET "storage_provider" = 'minio'
WHERE "storage_provider" IS NULL;
