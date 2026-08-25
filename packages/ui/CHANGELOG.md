# @hayasedb/ui

## 0.11.0

### Patch Changes

- ce9852b: Make the admin and web interfaces usable on mobile viewports
  
  - Filters: search, selects and actions align on one baseline and break to a two-column grid below `lg`, where five controls cannot share a row. Every list shows its result count with a `Reset filters` action that appears only while filters are active, and empty states distinguish "no matches" from "no data" through `UEmpty`
  - Tables: replace fixed column widths with `min-w-*` and swap `table-fixed` for `min-w-full`, so columns keep their legible width and the table scrolls inside its own container instead of compressing
  - Anime form: the tab list switches to `horizontal` below `lg` through the native `UTabs` `orientation` prop, keeping Reka's indicator, `aria-orientation` and arrow-key axis correct on both layouts
  - Layouts: stack row-based lists, cards and form footers below `sm`, and raise `xs` buttons to `sm` for touch targets
  - Replace hover-only affordances with tappable ones: the drift popover becomes a focusable `UButton` on click, and tooltip-only timestamps move inline
  - Add `viewport-fit=cover` with `env(safe-area-inset-*)` padding on `body` so content clears notches and home indicators
- Updated dependencies [ad5305b]
  - @hayasedb/contract@0.11.0
  - @hayasedb/domain@0.11.0

## 0.10.0

### Minor Changes

- 35384f0: Serve the public API reference from the web app as a first-class `Docs` route, generated from the contract at build time so the page no longer depends on the API being reachable
  
  - Contract: `buildOpenApiDocument` and `buildPublicOpenApiDocument` are exported from `@hayasedb/contract`, replacing the generator that `apps/api/src/openapi.ts` had duplicated. Both documents are now expressed through one `OpenAPIGenerator` instance, and `shouldHoistDef` becomes module-private since it existed only to feed that duplicate. The API keeps ownership of the internal description and its `internalToken` scheme; only the generator construction is shared
  - Contract build: `tsdown` emits `dist/openapi.public.json` through `onSuccess`, exposed as the `@hayasedb/contract/openapi.json` subpath export. Generation runs inside the single `tsdown` invocation rather than an `&&` chain, so it also regenerates on `tsdown --watch` rebuilds, where the previous chain left the artifact stale. It runs after the preset's `clean`, and the emitter fails the build when the published method and path pairs diverge from the contract's api-key routes, naming what is missing or unexpected, so an endpoint cannot silently drop out of the published spec. `onSuccess` is a string command because tsdown's native config loader resolves imports through `nativeImport`, which cannot follow the extensionless TS imports in `src/`
  - Web: `/docs` renders the reference through Scalar inside a same-origin iframe served by a Nitro route at `/_reference`. The iframe is the isolation boundary, not a workaround: the Scalar standalone bundle unconditionally appends a `<style id="scalar-style">` element to `document.head` containing a full Tailwind build with a `*, :before, :after, ::backdrop` reset, and uses no shadow DOM, so either in-app embedding path would overwrite the application theme. Theming is passed through Scalar's native `customCss` key rather than a hand-written `<style>` tag, and the reference is pinned to light with `darkMode: false` and `hideDarkModeToggle: true` to match the app, which pins `colorMode` to light and ships no toggle
  - Web: `/openapi.json` serves the generated document with `servers[0].url` rewritten from `apiPublicUrl` at request time, so one build artifact serves every environment. Only `standalone.js` is staged into `public/_docs`, resolved through the package's own `browser` field, which is the sanctioned pointer since `exports` blocks the deep path. Mounting the whole `dist/browser/` directory had been publishing 40 MB of source maps and `chunks/` files that the standalone build never requests; the served surface is now 4.1 MB
  - Web: the page mirrors the iframe's hash onto the parent URL so sidebar navigation produces shareable `/docs#tag/…` links and deep links load scrolled. Scalar navigates via `history.replaceState`, which emits no `hashchange`, and the native `onSidebarClick` callback misses scroll-driven changes, so the hash is polled
  - Config: `@scalar/api-reference` is declared in the root catalog like every other shared dependency rather than pinned in `apps/web`. `apiDocsUrl` is replaced by `apiPublicUrl`, removing a second environment variable that only ever held `apiPublicUrl + '/docs'`. The API key modal now links to the in-app route instead of opening the API host in a new tab
  - Layouts: the session block shared byte-for-byte by `default.vue` and the new `docs.vue` moves into a `useLayoutSession` composable. Ordering `useRuntimeConfig()` and `useAccountActions()` ahead of the awaited session fixes a pre-existing `NUXT_E1001` warning, since `useAccountActions()` reaches `useNuxtApp()` through `useApiClient()` and both layouts had been calling it after an `await`
  - Tests: the contract suite asserts that the published document matches the contract's api-key routes exactly, and that no `/auth`, `/account`, `/changeset`, `/revision` or `/media` path appears in it, so a procedure cannot reach the public spec by mistake
  
  `apps/api` keeps serving both the public and internal specs at `/docs`; the internal document is useful outside production and is never published, so narrowing it stays out of this change. Deployments must set `NUXT_PUBLIC_API_PUBLIC_URL` in place of `NUXT_PUBLIC_API_DOCS_URL`; both derive from the existing `API_PUBLIC_URL`, so no new value is introduced.

### Patch Changes

- Updated dependencies [35384f0]
- Updated dependencies [27b0847]
  - @hayasedb/contract@0.10.0
  - @hayasedb/domain@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [bba5b1d]
  - @hayasedb/domain@0.9.0
  - @hayasedb/contract@0.9.0

## 0.8.0

### Minor Changes

- 2b91fb8: Add a full automated test suite across the monorepo: Vitest unit and integration projects, Playwright end-to-end coverage, and the CI jobs that run them
  
  - Runner: Vitest 4 on the Bun runtime (`bun --bun vitest`) with a root `vitest.config.ts` aggregating per-package projects and shared `nodeProject`/`integrationProject` presets in `vitest.presets.ts`; coverage runs on Node (`test:coverage`) because the v8 merge step overflows under Bun. New scripts: `test`, `test:unit`, `test:watch`, `test:coverage`, `test:integration`, `test:e2e`, `test:e2e:smoke`; `check` now runs lint, check-types, unit tests and format
  - Unit tests: pure logic in `domain` (fuzzy dates, relations, stable stringify, property-based via `@fast-check/vitest`), `contract` (route matcher, schemas, meta, OpenAPI surface snapshot), `db` (migration helpers), `mail` (rendering), `auth`, `nuxt` (auth middleware, `callApi`, oRPC errors, rate-limit notice, safe redirect, session invalidation, BFF allowlist), `ui` utils, and API units for guards, env schema, cookie domain, error mapping, exception filter, media processing, revision diff and changeset guards. Nuxt-side suites use `@nuxt/test-utils` with `happy-dom`
  - Integration tests: Testcontainers-backed Postgres, Redis and MinIO drive the real Nest application through `createTestApp` (auth signup/verify/session/password reset, api access and guard order, anime CRUD/list/media, genres, avatars, media upload, contribution and changeset apply, user deletion) plus a migrator test in `db`
  - End-to-end: new private `@hayasedb/e2e` workspace with Playwright specs for signup and verification, login redirect, password reset, anime browsing, contribution and moderation, and API keys through the BFF, with storage/API/asset fixtures and an admin auth setup project
  - CI: `ci.yml` splits into four independent `ubuntu-24.04` jobs (`build`, `unit`, `integration`, `e2e`) that all run in parallel, with no cross-job dependencies. Shared toolchain setup lives in a `./.github/actions/setup` composite action taking a job-scoped Turbo cache key, so every job restores from the `build` job's warm cache without overwriting it. Read-only default permissions, an lcov coverage artifact, a Playwright report artifact, and `--affected` filtering dropped so every run covers the whole graph. Turbo gains cacheable `test` inputs plus uncached `test:integration` and `test:e2e` tasks with explicit `passThroughEnv`
  
  Fixes found while writing the tests:
  
  - API: Better Auth `APIError`s thrown outside oRPC handlers are now mapped by `HttpExceptionFilter`, so bad API keys return 401 instead of 500; `INVALID_API_KEY` maps to `UNAUTHORIZED`; Better Auth logs are routed through the Nest logger
  - Contract: the validation error code is renamed from `INPUT_VALIDATION_FAILED` to the oRPC-standard `UNPROCESSABLE_CONTENT` (422); the route matcher no longer misses lowercase `head` requests
  - Nuxt: `safeRedirectPath` rejects backslashes and control characters
  - UI: `describeDevice` detects iOS before macOS so iPads are not reported as macOS; `ChangesetMetaPanel` accepts `Serialized<ChangesetDetail>` to match payloads that cross SSR
  - API bootstrap is extracted into `configureApp` so tests build the same application as production, and `.env` is not loaded when `NODE_ENV=test`
  
  Housekeeping: `bun@1.4.0` and Node `22.22`, the catalog is sorted and extended with test dependencies, `nest build` ignores `*.test.ts`, the API type-checks through `tsconfig.test.json`, and coverage, Playwright reports and snapshots are ignored by git and Prettier. Accessibility labels and test ids added to a few inputs are user-visible only as improved labelling.

### Patch Changes

- Updated dependencies [2b91fb8]
  - @hayasedb/contract@0.8.0
  - @hayasedb/domain@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [7f27c2c]
  - @hayasedb/contract@0.7.0
  - @hayasedb/domain@0.7.0

## 0.6.0

### Minor Changes

- 6e3fd5e: Pre-bundled all scanned icons into the client bundle so they render instantly without runtime fetching, and replaced client-formatted dates with the hydration-safe NuxtTime component

### Patch Changes

- 7585079: Pin nuxt to 4.5.1: 4.5.2 regressed template-scope typing so auto-imported utils used only inside a template failed vue-tsc with TS2339
- e5ae7d9: Show the description "Show more" toggle only when the clamped text actually overflows, measured from the rendered element instead of a character-count guess
- @hayasedb/contract@0.6.0
  - @hayasedb/domain@0.6.0

## 0.5.0

### Minor Changes

- 46900d5: Added API keys for direct API access: keys are created and managed on the new web settings page, authenticate requests via the x-api-key header, and are permitted per route through contract metadata

### Patch Changes

- Updated dependencies [46900d5]
- Updated dependencies [46900d5]
  - @hayasedb/contract@0.5.0
  - @hayasedb/domain@0.5.0

## 0.4.1

### Patch Changes

- @hayasedb/contract@0.4.1
- @hayasedb/domain@0.4.1

## 0.4.0

### Minor Changes

- 279182a: Added genre as a full entity kind with contribution support: genres can be proposed alongside anime in a single multi-entity changeset, entity labels replaced with kinds, and the entity_kind enum migrated accordingly
- 1279222: Added a public Redis-cached stats endpoint and live landing page stats that poll while the tab is visible and animate between updates via NumberFlow
- 1279222: Added the landing page with hero, anime cover marquee, features, stats and recently added sections, built on motion-v animations with reduced-motion support

### Patch Changes

- 913e24d: Expose version in endpoints and ui
- Updated dependencies [279182a]
- Updated dependencies [1279222]
- Updated dependencies [913e24d]
  - @hayasedb/domain@0.4.0
  - @hayasedb/contract@0.4.0

## 0.3.1

### Patch Changes

- 17f865b: Update dependencies (bun minor/patch group).
- 17f865b: - Replace `ChangesetNotes` with a `ChangesetTimeline` component rendering comments, rejections, and system events
  - Add `ChangesetMetaPanel` for changeset status and metadata
  - Improve diff rendering in `ChangeDiffTable` and `DiffLongText`
  - Add `formatDate` utilities and timeline helpers in the contribution utils
- Updated dependencies [17f865b]
- Updated dependencies [17f865b]
  - @hayasedb/contract@0.3.1
  - @hayasedb/domain@0.3.1

## 0.3.0

### Patch Changes

- @hayasedb/contract@0.3.0
- @hayasedb/domain@0.3.0

## 0.2.1

### Patch Changes

- @hayasedb/contract@0.2.1
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
  - @hayasedb/contract@0.2.0
  - @hayasedb/domain@0.2.0

## 0.1.0

### Minor Changes

- 3b3c18d: Initial release: presentational Nuxt UI component layer with auth, account, and shared component groups.

### Patch Changes

- Updated dependencies [3b3c18d]
- Updated dependencies [3b3c18d]
  - @hayasedb/contract@0.1.0
  - @hayasedb/domain@0.1.0
