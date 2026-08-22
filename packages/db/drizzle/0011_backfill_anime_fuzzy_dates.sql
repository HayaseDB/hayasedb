UPDATE "anime" SET
	"start_year" = extract(year from "start_date")::smallint,
	"start_month" = extract(month from "start_date")::smallint,
	"start_day" = extract(day from "start_date")::smallint
WHERE "start_date" IS NOT NULL;--> statement-breakpoint
UPDATE "anime" SET
	"end_year" = extract(year from "end_date")::smallint,
	"end_month" = extract(month from "end_date")::smallint,
	"end_day" = extract(day from "end_date")::smallint
WHERE "end_date" IS NOT NULL;
