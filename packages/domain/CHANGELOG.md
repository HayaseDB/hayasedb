# @hayasedb/domain

## 0.9.0

### Minor Changes

- bba5b1d: Replace the hard-wired MinIO integration with a provider-agnostic storage layer selected by environment, add a filesystem driver so tests and local development run without object-storage infrastructure, and drop the S3 vocabulary that had leaked into the database
  
  - New `@hayasedb/storage` package following the `@hayasedb/mail` driver pattern: a `StorageDriver` interface (`put`, `get`, `removeByPrefix`, `publicUrl`, `init`, plus `provider` and `container`), a `StorageConfig` discriminated union, and a `createStorage` factory that switches on the driver with an exhaustive `never` check. `init()` replaces the S3-specific bucket bootstrap so each driver prepares its own container (bucket create plus policy, or `mkdir -p`), and is invoked from a Nest lifecycle hook to keep construction synchronous
  - Drivers: `minio` ports the existing client calls and builds path-style public URLs; `local` stores bytes at `${rootDir}/${key}` with a `.meta.json` sidecar so `contentType` and `cacheControl` survive a round trip, which a filesystem cannot otherwise record. A single `resolveKey` helper guards every method and returns `null` for traversal, absolute and empty keys, making a hostile key indistinguishable from a miss. A shared contract suite is exported from `@hayasedb/storage/testing` and run against both drivers
  - API wiring mirrors `apps/api/src/mail/`: a `STORAGE` token, a `@Global()` `StorageModule` registered in `AppModule`, and a `StorageLifecycle` bootstrap hook. `StorageService` is deleted and consumers inject the token instead. The module was previously imported by the anime, contribution and moderation modules without being used; those imports are removed. `nestjs-minio-client` is dropped in favour of a direct `minio` dependency in the package
  - `LocalStorageController` serves the local driver at `/api/files/*` using the Express 5 named-wildcard param, marked `@OpenEndpoint()` and `@AllowAnonymous()` because the API-access, throttler and auth guards are all global; `OpenEndpoint` also skips throttling, which matters when one page loads many images. Bytes are served through `driver.get()` so the controller never handles a filesystem path, and requests are refused unless the local driver is active
  - Environment: `MINIO_*` becomes `STORAGE_*`, and the storage block is now a discriminated union on `STORAGE_DRIVER` rather than a flat object with conditional refinements. Only the selected driver's variables are read, validated and present on the parsed result, so `minio` requires its endpoint and credentials while `local` requires `STORAGE_LOCAL_ROOT`, and variables belonging to the other driver are ignored. `STORAGE_DRIVER` is required rather than defaulted: defaulting it would silently select `minio` and then report a missing endpoint instead of a missing driver. `local` is rejected when `NODE_ENV=production` because the filesystem is not shared across API replicas
  - Because a union cannot be narrowed through a `ConfigService` path lookup, the storage factory now consumes the validated `Env` object via `getValidatedEnv()` and narrows on `env.STORAGE_DRIVER`. Reading a MinIO variable on the local branch is a compile error
  - URLs: `MEDIA_KEY_NAMESPACE` is removed, so object keys are `<sha>/original.webp` and public URLs no longer contain a doubled `media/media/` segment. The remaining path segment is the bucket, which must stay first because Traefik routes the CDN host at the MinIO S3 root by host rule with no path stripping
  - Database: `media_asset.bucket` is dropped and replaced by a provider-neutral `storage_provider`, and `storage_key` now holds a bare checksum. Migrations `0013`-`0016` follow the established add-nullable, backfill, `SET NOT NULL` sequence, mirroring `0010`-`0012`: adding a `NOT NULL` column without a default fails on a populated table, and the migrator applies every pending file in one transaction, so the whole deploy would abort. `0015` is hand-written because the namespace was stored inside `storage_key`, so removing the code alone would leave legacy rows resolving to the old path
  - Tests: the integration harness runs on the local driver with a temporary root and a pre-allocated port, so `STORAGE_PUBLIC_URL` is absolute for tests that fetch a stored URL directly, and the root is removed on teardown. MinIO leaves the shared integration setup and is started only by the storage contract test, so the remaining suites no longer pay for a container. `media.service.test.ts` replaces its `as unknown as` cast with a literal checked by `satisfies StorageDriver`, so interface changes now fail to compile. End-to-end runs on the local driver, and `ensure-db.ts` clears the storage root wherever it drops the kept database, since the database and the object store became independently resettable once storage moved off MinIO
  - CI: the end-to-end job loses its MinIO container, health-poll loop and dependence on Docker
  
  Deploying this requires manual steps: rename the storage variables in each environment, keeping the MinIO key values unchanged because the compose stack derives the server's root credentials from them; then move existing objects from the `media/` prefix to the bucket root and rewrite the absolute URLs stored in `user.image`. Migrations normalise `storage_key` automatically at boot, so stored images resolve to the new path as soon as the API restarts and stay unreachable until the objects are moved.

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

## 0.7.0

## 0.6.0

## 0.5.0

## 0.4.1

## 0.4.0

### Minor Changes

- 279182a: Added genre as a full entity kind with contribution support: genres can be proposed alongside anime in a single multi-entity changeset, entity labels replaced with kinds, and the entity_kind enum migrated accordingly

## 0.3.1

### Patch Changes

- 17f865b: Add the `MESSAGE_KINDS` tuple (`comment` | `rejection` | `system`) and `MessageKind` type for changeset messages.

## 0.3.0

## 0.2.1

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

## 0.1.0

### Minor Changes

- 3b3c18d: Initial release: single source of truth for domain enums and shared constants used by db, contract, and frontends.
