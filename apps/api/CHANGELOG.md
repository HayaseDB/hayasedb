# @hayasedb/api

## 0.12.0

### Minor Changes

- db15ef6: Redesign the public API around REST conventions, with HTTP caching, cursor pagination and per-key rate limits
  
  The public surface grew out of the internal contract rather than being designed as a product, and it showed. `GET /anime/by-slug/{slug}` put a lookup strategy in the path and sat alongside `GET /anime/{id}`, giving one resource two URIs. There is now a single `GET /anime/{id}` that accepts either a UUID or a slug, serving both public and internal callers. `GET /genres/{id}` joins it, `/ping` is gone in favour of the existing `/health`, and the media routes become a proper subresource at `/anime/{id}/media` — the `{animeId}` spelling is retired so a segment is never parameterised under two names, which had put the API-access allowlist at risk of 403ing legitimate traffic.
  
  Collections answer with a consistent `{items, meta}` envelope, and detail responses stay bare. Query parameters read as an API rather than as storage: `sort` and `order` merge into one signed value such as `-createdAt`, `genreId` becomes `genre`, and `startYear` splits into `startYearMin` and `startYearMax` so a range like the nineties is expressible. Cursor pagination is added alongside offset paging rather than replacing it, since the page-number pager depends on `total`; cursors are opaque, carry the sort they were minted under, and are refused when replayed against a different one.
  
  Read endpoints now send `Cache-Control` and a strong `ETag`, answering a matching `If-None-Match` with a bodyless 304. Rate limits are reported on every keyed response through the IETF `RateLimit-*` headers alongside the legacy `X-RateLimit-*` aliases, and these are exposed through CORS so browser clients can actually read them.
  
  API keys gain per-key limits. Better Auth's own limiter is disabled so the Nest throttler is the single enforcement point and two counters can never disagree; the `apikey` row remains the durable configuration, cached in Redis by the same fingerprint the throttler already computes and invalidated when a key is deleted. The stored ceiling is normalised to the throttler's window, so a limit expressed per hour is no longer spent in a minute. The plugin defaults move to 60 requests per minute to match what was already being enforced, with a migration that backfills only the rows still on the old 1000-per-hour default and leaves customised limits untouched.
  
  Key owners can finally see their own usage: the listing reports live consumption read from the counter the limiter enforces against, so the numbers agree with the headers a caller receives. The rate-limit fields are grouped into a single `rateLimit` object and `referenceId` is dropped, since it is always the caller and only leaked an internal foreign-key name.

### Patch Changes

- Updated dependencies [04b5241]
- Updated dependencies [db15ef6]
  - @hayasedb/domain@0.12.0
  - @hayasedb/contract@0.12.0
  - @hayasedb/db@0.12.0
  - @hayasedb/auth@0.12.0
  - @hayasedb/cli@0.12.0
  - @hayasedb/mail@0.12.0
  - @hayasedb/storage@0.12.0

## 0.11.0

### Patch Changes

- ce9852b: Make `clean` remove `node_modules` and leftover runtime artifacts, so it produces a fresh checkout rather than a half-cleaned tree
  
  Workspace `node_modules` hold only symlinks into the root store, so removing them mid-run does not break the `turbo` binary resolved from the root.
- ad5305b: Add `@hayasedb/cli`, a project console exposed as the `hayasedb` bin (`bunx hayasedb`): `db migrate`, `user create/set-password/set-role`, and extensible seed sets under `seed <set>` with step selection (`--only`, or an interactive dependency-aware tree selector). The demo set is a committed AniList snapshot (45 anime with covers/banners/gallery, genres, relations, partial release dates) plus demo accounts with avatars and API keys, and deterministic community changesets covering every review outcome (pending/approved/rejected/withdrawn/superseded) — all seeded through the API so the revision system stays intact. Replaces the one-off `apps/api/src/seed-demo.ts` and `packages/db/src/migrate-cli.ts` scripts. The contract build now keeps `dist/openapi.public.json` across rebuilds and writes it atomically, fixing transient ENOENT errors in the web dev server.
- Updated dependencies [ad5305b]
  - @hayasedb/cli@0.11.0
  - @hayasedb/contract@0.11.0
  - @hayasedb/db@0.11.0
  - @hayasedb/auth@0.11.0
  - @hayasedb/domain@0.11.0
  - @hayasedb/mail@0.11.0
  - @hayasedb/storage@0.11.0

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

- 27b0847: Fix stale email verification state, where a verified user could keep being rejected as unverified for up to five minutes
  
  Better Auth rewrites its session cookie cache when an email is verified, but only on a response to the browser holding that cookie. Verifying in a different browser, a private window, or on a phone leaves the original browser with a stale cookie, and session reads short-circuit on it before reaching the database.
  
  - API: `auth.getSession` now forwards Better Auth's response cookie instead of discarding it. The client already requests an uncached read, which also refreshes the cookie cache, so a stale cookie repairs itself on the next session read
  - Nuxt: a `FORBIDDEN` unverified-email response triggers one session refresh, turning the worst case into a self-correcting retry
  - Contract: the rejection message is shared between the API check and the frontend predicate so they cannot drift
  - Web: `verify-email` continues with `router.replace` so the tokened URL leaves history
- Updated dependencies [35384f0]
- Updated dependencies [27b0847]
  - @hayasedb/contract@0.10.0
  - @hayasedb/auth@0.10.0
  - @hayasedb/db@0.10.0
  - @hayasedb/domain@0.10.0
  - @hayasedb/mail@0.10.0
  - @hayasedb/storage@0.10.0

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

### Patch Changes

- Updated dependencies [bba5b1d]
  - @hayasedb/storage@0.9.0
  - @hayasedb/domain@0.9.0
  - @hayasedb/db@0.9.0
  - @hayasedb/contract@0.9.0
  - @hayasedb/auth@0.9.0
  - @hayasedb/mail@0.9.0

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
  - @hayasedb/auth@0.8.0
  - @hayasedb/contract@0.8.0
  - @hayasedb/db@0.8.0
  - @hayasedb/domain@0.8.0
  - @hayasedb/mail@0.8.0

## 0.7.0

### Minor Changes

- 7f27c2c: Move every Better Auth endpoint into the oRPC contract so NestJS is the single source of truth for authentication
  
  - Contract: new `auth` router (session, sign-in/up/out, profile, email, password, sessions, accounts, verification, password reset, OAuth callback, API keys, admin user management) with typed inputs, shared output schemas, `BAD_REQUEST` and `TOO_MANY_REQUESTS` common errors, and `bff()` audiences per procedure
  - API: auth controllers implement the contract through thin `auth.api.*` facades with `returnHeaders` plus set-cookie forwarding; `@thallesp/nestjs-better-auth` keeps only its guard, decorators and service (`disableControllers: true`); explicit body parsers in `main.ts`; `@Roles('admin')` on every admin handler; Better Auth `APIError`s mapped to contract errors via `mapAuthError` and the catch-all error filter removed; global `HttpExceptionFilter` so guard rejections (401/403/404/429) use the oRPC error envelope; single throttler with per-route `RouteThrottle` on sign-in, sign-up, verification resend and password reset; OAuth callback served as an ordinary procedure returning 302
  - Docs: one OpenAPI generator, two sources (public, internal), auth excluded from the public doc
  - BFF: allowlist derived entirely from the contract, no `/api/auth` prefix carve-outs
  - Frontend: Better Auth client, `$auth` plugins and `useAuth` removed; all auth composables use the typed oRPC client through `callApi`/`useApiAction` with consistent toasts; session cache is client-only, session sync re-runs middleware on session id change, "Session expired" only fires when the session is really gone; sign-up refreshes the session and redirects; non-admin sign-in on the admin app is signed out with "Access denied"
  - Fixes found during verification: session list dates normalised from the Redis secondary storage, admin update no longer sends an undefined email, Better Auth 1.6.23 error codes mapped correctly
  
  API keys are available to every signed-in, email-verified user. Public URLs are unchanged (`/api/auth/...`), so registered OAuth redirect URIs and cookies keep working.

### Patch Changes

- Updated dependencies [7f27c2c]
  - @hayasedb/contract@0.7.0
  - @hayasedb/auth@0.7.0
  - @hayasedb/db@0.7.0
  - @hayasedb/domain@0.7.0
  - @hayasedb/mail@0.7.0

## 0.6.0

### Patch Changes

- @hayasedb/auth@0.6.0
  - @hayasedb/contract@0.6.0
  - @hayasedb/db@0.6.0
  - @hayasedb/domain@0.6.0
  - @hayasedb/mail@0.6.0

## 0.5.0

### Minor Changes

- 46900d5: Added API keys for direct API access: keys are created and managed on the new web settings page, authenticate requests via the x-api-key header, and are permitted per route through contract metadata
- 8d07a33: Scoped the production docs page to the public API reference only, keeping the internal and authentication specs available in development
- 46900d5: Shared the auth session across the web and admin apps by deriving the cookie domain from the configured frontend URLs, and login pages now redirect already signed-in users to their destination
- 46900d5: Added Redis-backed API rate limiting with separate buckets per client ip (600/min) and per API key (60/min), returning standard rate limit and Retry-After headers

### Patch Changes

- Updated dependencies [46900d5]
- Updated dependencies [46900d5]
- Updated dependencies [46900d5]
  - @hayasedb/auth@0.5.0
  - @hayasedb/db@0.5.0
  - @hayasedb/contract@0.5.0
  - @hayasedb/domain@0.5.0
  - @hayasedb/mail@0.5.0

## 0.4.1

### Patch Changes

- 42573ee: remove graceful draining and speed up healthchecks
  - @hayasedb/auth@0.4.1
  - @hayasedb/contract@0.4.1
  - @hayasedb/db@0.4.1
  - @hayasedb/domain@0.4.1
  - @hayasedb/mail@0.4.1

## 0.4.0

### Minor Changes

- 279182a: Added genre as a full entity kind with contribution support: genres can be proposed alongside anime in a single multi-entity changeset, entity labels replaced with kinds, and the entity_kind enum migrated accordingly
- 1279222: Added a public Redis-cached stats endpoint and live landing page stats that poll while the tab is visible and animate between updates via NumberFlow

### Patch Changes

- 913e24d: Expose version in endpoints and ui
- Updated dependencies [a6cbd77]
- Updated dependencies [279182a]
- Updated dependencies [1279222]
- Updated dependencies [913e24d]
  - @hayasedb/auth@0.4.0
  - @hayasedb/mail@0.4.0
  - @hayasedb/domain@0.4.0
  - @hayasedb/db@0.4.0
  - @hayasedb/contract@0.4.0

## 0.3.1

### Patch Changes

- 17f865b: - Replace changeset notes with the message timeline system across the contribution, moderation, and changeset-apply services; rejections now record a rejection message with a reason
  - Always include `API_PUBLIC_URL` in the CORS allowlist and Better Auth trusted origins
  - Point the auth OpenAPI document's server URL at `/api/auth` so requests from the reference UI target the correct base path
  - Improve the Dockerfile for smaller images and better build caching
- 17f865b: Update dependencies (bun minor/patch group).
- Updated dependencies [17f865b]
- Updated dependencies [17f865b]
- Updated dependencies [17f865b]
  - @hayasedb/contract@0.3.1
  - @hayasedb/db@0.3.1
  - @hayasedb/domain@0.3.1
  - @hayasedb/auth@0.3.1
  - @hayasedb/mail@0.3.1

## 0.3.0

### Minor Changes

- 0c8da56: Rework OAuth around a single static frontend origin.

  The auth `baseURL` is now pinned to `WEB_PUBLIC_URL` instead of being resolved per request from the forwarded host. The frontends already proxy `/api/auth/*` to the API, so the browser only ever talks to the frontend origin: OAuth redirect URIs are derived as `${WEB_PUBLIC_URL}/api/auth/callback/<provider>`, and the `state` cookie and the callback now land on the same host. This replaces the `{ allowedHosts, fallback, protocol }` dynamic `baseURL`, which trusted the proxied `x-forwarded-host` and produced a redirect URI that did not match where the OAuth cookies had been set, dropping users on `/?code=…&state=…` with no session.

  `AuthOptions.baseURL` and `AuthOptions.frontendBaseURL` are replaced by a single required `appURL`. Session cookies stay host-only (no `crossSubDomainCookies`), so each origin keeps its own session and the web and admin frontends never share one.

  **Breaking for deployments:**

  - `WEB_PUBLIC_URL` is now required and validated at boot.
  - OAuth callback URLs must be registered at the frontend origin, one app per environment:
    - `https://hayasedb.com/api/auth/callback/{github,discord}`
    - `https://staging.hayasedb.com/api/auth/callback/{github,discord}`
  - Staging and production must use distinct Discord applications; they currently share a `DISCORD_CLIENT_ID`.

### Patch Changes

- Updated dependencies [0c8da56]
  - @hayasedb/auth@0.3.0
  - @hayasedb/contract@0.3.0
  - @hayasedb/db@0.3.0
  - @hayasedb/domain@0.3.0
  - @hayasedb/mail@0.3.0

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
