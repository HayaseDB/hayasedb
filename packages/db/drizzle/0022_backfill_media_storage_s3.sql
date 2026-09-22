UPDATE "media_asset"
SET "storage_provider" = 's3'
WHERE "storage_provider" = 'minio';
