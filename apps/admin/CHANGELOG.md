# @hayasedb/admin

## 0.4.1

### Patch Changes

- 42573ee: remove graceful draining and speed up healthchecks
- Updated dependencies [42573ee]
  - @hayasedb/nuxt@0.4.1
  - @hayasedb/auth@0.4.1
  - @hayasedb/contract@0.4.1
  - @hayasedb/domain@0.4.1
  - @hayasedb/ui@0.4.1

## 0.4.0

### Minor Changes

- 279182a: Added genre as a full entity kind with contribution support: genres can be proposed alongside anime in a single multi-entity changeset, entity labels replaced with kinds, and the entity_kind enum migrated accordingly

### Patch Changes

- 913e24d: Expose version in endpoints and ui
- 65584b9: Improved deployment and health checks via adding health endpoints for swarm and dockerfiles
- 279182a: Added admin submission link in the web app and configurable admin URL
- Updated dependencies [a6cbd77]
- Updated dependencies [279182a]
- Updated dependencies [1279222]
- Updated dependencies [913e24d]
- Updated dependencies [65584b9]
- Updated dependencies [1279222]
- Updated dependencies [279182a]
  - @hayasedb/auth@0.4.0
  - @hayasedb/domain@0.4.0
  - @hayasedb/contract@0.4.0
  - @hayasedb/nuxt@0.4.0
  - @hayasedb/ui@0.4.0

## 0.3.1

### Patch Changes

- 17f865b: - Rework the submissions list and detail pages with the new meta panel, message timeline, and improved diff display
  - Rejecting a changeset now submits a rejection reason through the message system
  - Fix the sidebar open-submissions indicator not updating after moderating a submission
  - Improve the Dockerfile for smaller images and better build caching
- 17f865b: Update dependencies (bun minor/patch group).
- Updated dependencies [17f865b]
- Updated dependencies [17f865b]
- Updated dependencies [17f865b]
- Updated dependencies [17f865b]
- Updated dependencies [17f865b]
  - @hayasedb/contract@0.3.1
  - @hayasedb/nuxt@0.3.1
  - @hayasedb/ui@0.3.1
  - @hayasedb/domain@0.3.1
  - @hayasedb/auth@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies [0c8da56]
  - @hayasedb/auth@0.3.0
  - @hayasedb/nuxt@0.3.0
  - @hayasedb/contract@0.3.0
  - @hayasedb/domain@0.3.0
  - @hayasedb/ui@0.3.0

## 0.2.1

### Patch Changes

- Updated dependencies [58431f3]
  - @hayasedb/auth@0.2.1
  - @hayasedb/nuxt@0.2.1
  - @hayasedb/contract@0.2.1
  - @hayasedb/domain@0.2.1
  - @hayasedb/ui@0.2.1

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
  - @hayasedb/nuxt@0.2.0
  - @hayasedb/ui@0.2.0

## 0.1.0

### Minor Changes

- 3b3c18d: Initial release: Nuxt 4 SSR admin dashboard for managing anime entries, genres, and contribution moderation.

### Patch Changes

- Updated dependencies [3b3c18d]
- Updated dependencies [3b3c18d]
- Updated dependencies [3b3c18d]
- Updated dependencies [3b3c18d]
- Updated dependencies [3b3c18d]
  - @hayasedb/auth@0.1.0
  - @hayasedb/contract@0.1.0
  - @hayasedb/domain@0.1.0
  - @hayasedb/nuxt@0.1.0
  - @hayasedb/ui@0.1.0
