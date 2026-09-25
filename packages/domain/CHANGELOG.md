# @hayasedb/domain

## 0.13.1

### Patch Changes

- 51bb264: Rework the anime structure editor and the contribution review.
  
  **Field highlighting**
  
  - Highlight every edited field by the same rules, including translation fields such as the English title on the public contribution page.
  - Add the per-field cues that season, episode and image edits were missing, and highlight fields in the season and episode slideovers even though they render outside the form.
  
  **Seasons and episodes**
  
  - Rebuild the manager around scannable summary rows that show their own change state and open a slideover for editing.
  - Let an anime hold seasons and standalone episodes at once, ranked in one shared order, and reject two children sharing a position instead of rejecting mixed structures.
  - Validate each slideover against its own schema so a bad runtime or number reports inline instead of failing silently on submit.
  - Keep rows at a fixed height, drop the "N changed" counters in favour of the shared ring, and stop repeating the episode type in the number chip.
  - Replace the empty-season placeholder and its button with an add card shaped like the rows around it, and stop opening the editor right after adding.
  
  **Contribution review**
  
  - Group each review around its anime instead of one card per entity, nest episodes under the season that owns them, and always show the anime's current fields as context.
  - Nest an episode under a season the changeset only touches through its episodes, so the season still appears with its current fields.
  - Hide the parent links of a season or episode from its diff, title each card by its entity type alone so the name stays in the fields below, and stop writing a number as "3.000".
  - Give each card its entity icon and pin its header while the fields scroll, stacking the anime, season and episode headers at fixed heights so each sits flush under the one above.
  - Square off the header background so the card's rounded corners cut it, with the border drawn over it, and let each page declare where headers pin: below the navbar on the public page, at the top of the panel in admin.
  - Drop the footer from the contribution pages so the form is the last thing on the page.
- 572c027: Add one shared field comparator and change-tracking composable, so a field is considered changed by the same rules everywhere and empty values like `null`, `''` and `[]` no longer count as edits

## 0.13.0

### Minor Changes

- c6bc9bf: Localize anime and genre records, and model seasons and episodes as first-class entities
  
  Titles and descriptions used to live in fixed `titleRomaji` / `titleEnglish` / `titleNative` / `description` columns, which forced every entry into one editorial view of a work and left no room for the eighteen locales the site actually serves. Anime and genre text now lives in `anime_translation` and `genre_translation`, keyed by BCP-47 locale, with a partial unique index pinning exactly one original translation per record and case-insensitive per-locale uniqueness on genre names. `genre.name` becomes `genre.slug`, so the identifier no longer doubles as a display string that cannot be translated.
  
  Responses are negotiated from `Accept-Language` and answer with `Vary: Accept-Language`. One ranked locale list drives both the SQL ordering and the in-process pick, so the title chosen for a list row and the title chosen for a detail page can no longer disagree. When a client states no preference the English translation wins, with the original as the fallback for records that have no English text — the reverse of that order made a request without a header render native-script titles that no page in the product asks for. Nuxt now forwards the visitor's `Accept-Language` on server-rendered requests, which previously reached the API bare and rendered a different language than the client would.
  
  Seasons and episodes become revisionable entities alongside anime and genre. An episode belongs either to an anime or to a season, never both and never neither, enforced by a single `num_nonnulls` check rather than the four overlapping layers the first draft carried; the cross-row rule that an anime cannot hold both seasons and loose episodes moves onto the entity handler, so a violation arrives as an ordinary changeset conflict instead of a raw constraint error. Translations ride inside the entity document and are edited atomically as one revision, which retires the eight `/translations/{locale}` sub-resources.
  
  Ordering is standardized. `PUT /{collection}/order` replaces the `:reorder` colon-verbs, and the precondition that was previously read out of band from the raw request becomes a typed `expectedOrderEtag` field on the input. It was unreachable through the generated client before, so every save touching two or more rows answered 412; media reorder, which had no concurrency control at all, now carries the same precondition instead of silently letting two editors clobber each other.
  
  The structure editor is rebuilt on that surface, wired into both the admin form and the public contribution flow, with the diff planner keyed on stable serialization and on where an episode started rather than where it ended up, so moving an episode between seasons registers as a change. Episode-only contributions no longer synthesize an empty anime change, and a changeset that exceeds the per-changeset limit is refused with an explanation instead of a server error. The demo seed set is rewritten around the new shape, with localized genres, native and romanized titles for every entry, and seasons and episodes that exercise every season kind, episode type and episode status across both ownership modes.

## 0.12.0

### Minor Changes

- 04b5241: Set up `@nuxtjs/seo` across the web app with sitemap, robots, OG images, schema.org and canonical URLs
  
  The homepage title rendered as `HayaseDB · HayaseDB` because `app.head.title` set a real title value that every page without its own title inherited, which the title template then appended the site name to. The global title is gone and the homepage now sets its own, with the separator and site name coming from site config.
  
  Anime pages fall back through romaji and native titles when no English title exists, instead of rendering an empty heading, and get a generated social card that composites the cover art alongside the title, format, year and genres. `/explore` stays indexable when unfiltered and returns `noindex, follow` with a canonical to the unfiltered URL once filters or a search query are applied. Error pages are excluded from the index.
  
  `robots.txt` moves from a static file in `public/` to a generated route, and now disallows the account, auth and internal API paths. The sitemap is generated at runtime and lists every anime with its last modified date, degrading to the static routes if the API is unreachable.
  
  The admin app is excluded from search indexes entirely.

### Patch Changes

- db15ef6: Redesign the public API around REST conventions, with HTTP caching, cursor pagination and per-key rate limits
  
  The public surface grew out of the internal contract rather than being designed as a product, and it showed. `GET /anime/by-slug/{slug}` put a lookup strategy in the path and sat alongside `GET /anime/{id}`, giving one resource two URIs. There is now a single `GET /anime/{id}` that accepts either a UUID or a slug, serving both public and internal callers. `GET /genres/{id}` joins it, `/ping` is gone in favour of the existing `/health`, and the media routes become a proper subresource at `/anime/{id}/media` — the `{animeId}` spelling is retired so a segment is never parameterised under two names, which had put the API-access allowlist at risk of 403ing legitimate traffic.
  
  Collections answer with a consistent `{items, meta}` envelope, and detail responses stay bare. Query parameters read as an API rather than as storage: `sort` and `order` merge into one signed value such as `-createdAt`, `genreId` becomes `genre`, and `startYear` splits into `startYearMin` and `startYearMax` so a range like the nineties is expressible. Cursor pagination is added alongside offset paging rather than replacing it, since the page-number pager depends on `total`; cursors are opaque, carry the sort they were minted under, and are refused when replayed against a different one.
  
  Read endpoints now send `Cache-Control` and a strong `ETag`, answering a matching `If-None-Match` with a bodyless 304. Rate limits are reported on every keyed response through the IETF `RateLimit-*` headers alongside the legacy `X-RateLimit-*` aliases, and these are exposed through CORS so browser clients can actually read them.
  
  API keys gain per-key limits. Better Auth's own limiter is disabled so the Nest throttler is the single enforcement point and two counters can never disagree; the `apikey` row remains the durable configuration, cached in Redis by the same fingerprint the throttler already computes and invalidated when a key is deleted. The stored ceiling is normalised to the throttler's window, so a limit expressed per hour is no longer spent in a minute. The plugin defaults move to 60 requests per minute to match what was already being enforced, with a migration that backfills only the rows still on the old 1000-per-hour default and leaves customised limits untouched.
  
  Key owners can finally see their own usage: the listing reports live consumption read from the counter the limiter enforces against, so the numbers agree with the headers a caller receives. The rate-limit fields are grouped into a single `rateLimit` object and `referenceId` is dropped, since it is always the caller and only leaked an internal foreign-key name.

## 0.11.0

## 0.10.0

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
