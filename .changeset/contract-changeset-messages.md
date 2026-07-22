---
'@hayasedb/contract': patch
---

Replace changeset notes with messages: `changeset.addNote` (`POST /changesets/{id}/notes`) is replaced by `changeset.addMessage` (`POST /changesets/{id}/messages`), `changeset.reject` now takes a `reason` instead of a `note`, and contribution schemas gain `changesetMessageSchema` / `changesetMessageBodySchema`.
