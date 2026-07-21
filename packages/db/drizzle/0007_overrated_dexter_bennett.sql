CREATE TYPE "public"."changeset_message_kind" AS ENUM('comment', 'rejection', 'system');--> statement-breakpoint
ALTER TABLE "changeset_note" RENAME TO "changeset_message";--> statement-breakpoint
ALTER TABLE "changeset_message" DROP CONSTRAINT "changeset_note_changeset_id_changeset_id_fk";
--> statement-breakpoint
ALTER TABLE "changeset_message" DROP CONSTRAINT "changeset_note_author_id_user_id_fk";
--> statement-breakpoint
DROP INDEX "changeset_note_changeset_idx";--> statement-breakpoint
ALTER TABLE "changeset" ADD COLUMN "reverts_id" uuid;--> statement-breakpoint
ALTER TABLE "changeset_message" ADD COLUMN "kind" "changeset_message_kind" DEFAULT 'comment' NOT NULL;--> statement-breakpoint
ALTER TABLE "changeset" ADD CONSTRAINT "changeset_reverts_id_changeset_id_fk" FOREIGN KEY ("reverts_id") REFERENCES "public"."changeset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changeset_message" ADD CONSTRAINT "changeset_message_changeset_id_changeset_id_fk" FOREIGN KEY ("changeset_id") REFERENCES "public"."changeset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changeset_message" ADD CONSTRAINT "changeset_message_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "changeset_message_changeset_idx" ON "changeset_message" USING btree ("changeset_id","created_at");--> statement-breakpoint
ALTER TABLE "changeset_message" RENAME CONSTRAINT "changeset_note_pkey" TO "changeset_message_pkey";