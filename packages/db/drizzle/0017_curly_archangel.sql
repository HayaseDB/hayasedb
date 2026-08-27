ALTER TABLE "apikey" ALTER COLUMN "rate_limit_time_window" SET DEFAULT 60000;--> statement-breakpoint
ALTER TABLE "apikey" ALTER COLUMN "rate_limit_max" SET DEFAULT 60;--> statement-breakpoint
UPDATE "apikey"
SET "rate_limit_time_window" = 60000,
    "rate_limit_max" = 60
WHERE "rate_limit_time_window" = 3600000
  AND "rate_limit_max" = 1000;
