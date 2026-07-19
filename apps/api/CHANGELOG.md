# @hayasedb/api

## 0.2.1

### Patch Changes

- 58431f3: Fix session cookies not persisting across subdomains after OAuth sign-in. Cross-subdomain cookies now use a configurable `AUTH_COOKIE_DOMAIN` (e.g. `.hayasedb.com`) so the session set on the API host is shared with the web and admin apps, instead of being scoped host-only.
- Updated dependencies [58431f3]
  - @hayasedb/auth@0.2.1
  - @hayasedb/contract@0.2.1
  - @hayasedb/db@0.2.1
  - @hayasedb/domain@0.2.1
  - @hayasedb/mail@0.2.1

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
  - @hayasedb/contract@0.2.0
  - @hayasedb/domain@0.2.0
  - @hayasedb/auth@0.2.0
  - @hayasedb/db@0.2.0
  - @hayasedb/mail@0.2.0

## 0.1.0

### Minor Changes

- 3b3c18d: Initial release: NestJS backend implementing the shared oRPC contract, with anime, genre, media, user, and contribution modules, sharp-based image processing, and S3-compatible object storage (MinIO).

### Patch Changes

- Updated dependencies [3b3c18d]
- Updated dependencies [3b3c18d]
- Updated dependencies [3b3c18d]
- Updated dependencies [3b3c18d]
- Updated dependencies [3b3c18d]
  - @hayasedb/auth@0.1.0
  - @hayasedb/contract@0.1.0
  - @hayasedb/db@0.1.0
  - @hayasedb/domain@0.1.0
  - @hayasedb/mail@0.1.0
