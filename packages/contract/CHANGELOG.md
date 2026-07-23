# @hayasedb/contract

## 0.4.0

### Minor Changes

- 279182a: Added genre as a full entity kind with contribution support: genres can be proposed alongside anime in a single multi-entity changeset, entity labels replaced with kinds, and the entity_kind enum migrated accordingly
- 1279222: Added a public Redis-cached stats endpoint and live landing page stats that poll while the tab is visible and animate between updates via NumberFlow

### Patch Changes

- 913e24d: Expose version in endpoints and ui
- Updated dependencies [279182a]
  - @hayasedb/domain@0.4.0

## 0.3.1

### Patch Changes

- 17f865b: Replace changeset notes with messages: `changeset.addNote` (`POST /changesets/{id}/notes`) is replaced by `changeset.addMessage` (`POST /changesets/{id}/messages`), `changeset.reject` now takes a `reason` instead of a `note`, and contribution schemas gain `changesetMessageSchema` / `changesetMessageBodySchema`.
- Updated dependencies [17f865b]
  - @hayasedb/domain@0.3.1

## 0.3.0

### Patch Changes

- @hayasedb/domain@0.3.0

## 0.2.1

### Patch Changes

- @hayasedb/domain@0.2.1

## 0.2.0

### Minor Changes

- 3163644: Add a community contribution and moderation system for anime entries

  Contributors now propose changes instead of editing entries directly. A proposal becomes a changeset of per-entity revisions, stored as JSONB snapshots and applied to the live entry only once a moderator approves it.

  - Web: `/contribute/new` and `/contribute/anime/[id]` to propose changes, `/contributions` to track submissions and their review status.
  - Admin: a `/submissions` queue to review, approve, reject with a reason, revert, and leave moderator notes.
  - API: new `contribution`, `revision`, `changeset`, `moderation`, and `history` modules with a per-entity handler registry (anime first), field-level diffing, and approval guards.
  - Contract: new `changeset` router — `submit`, `list`, `get`, `approve`, `reject`, `revert`, `withdraw`, `addNote`, and `stats`.

  Consolidate avatar and anime image handling into a dedicated media module

  Media storage moves out of the account and anime modules into one `MediaModule`. Rows are content-addressed and reference-counted, and unreferenced objects are swept from storage, so deleting a user or an anime no longer orphans files.

  Clear the client session when the API rejects a request as unauthenticated

  The oRPC client now detects unauthorized and forbidden responses and clears the local session, so a revoked or expired session no longer leaves the UI in a stale signed-in state.

### Patch Changes

- Updated dependencies [3163644]
  - @hayasedb/domain@0.2.0

## 0.1.0

### Minor Changes

- 3b3c18d: Initial release: end-to-end type-safe oRPC contract shared by the API and all clients.

### Patch Changes

- Updated dependencies [3b3c18d]
  - @hayasedb/domain@0.1.0
