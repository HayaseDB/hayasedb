---
'@hayasedb/db': patch
---

Migrate changeset notes to messages (migration 0007): rename the `changeset_note` table to `changeset_message`, add a `kind` enum column (`comment` | `rejection` | `system`), add a self-referencing `changeset.reverts_id` foreign key, and recreate the message foreign keys (cascade on changeset delete, set-null on author delete) and index.
