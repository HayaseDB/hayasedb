CREATE INDEX "changeset_note_changeset_idx" ON "changeset_note" USING btree ("changeset_id","created_at");--> statement-breakpoint
ALTER TABLE "entity" DROP COLUMN "locked_at";