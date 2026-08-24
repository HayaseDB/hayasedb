# @hayasedb/auth

## 0.10.0

### Patch Changes

- Updated dependencies [35384f0]
- Updated dependencies [27b0847]
  - @hayasedb/contract@0.10.0
  - @hayasedb/db@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [bba5b1d]
  - @hayasedb/db@0.9.0
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
  - @hayasedb/db@0.8.0

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
  - @hayasedb/db@0.7.0

## 0.6.0

### Patch Changes

- @hayasedb/contract@0.6.0
  - @hayasedb/db@0.6.0

## 0.5.0

### Minor Changes

- 46900d5: Added API keys for direct API access: keys are created and managed on the new web settings page, authenticate requests via the x-api-key header, and are permitted per route through contract metadata
- 46900d5: Shared the auth session across the web and admin apps by deriving the cookie domain from the configured frontend URLs, and login pages now redirect already signed-in users to their destination

### Patch Changes

- Updated dependencies [46900d5]
- Updated dependencies [46900d5]
  - @hayasedb/db@0.5.0
  - @hayasedb/contract@0.5.0

## 0.4.1

### Patch Changes

- @hayasedb/contract@0.4.1
- @hayasedb/db@0.4.1

## 0.4.0

### Patch Changes

- a6cbd77: Improved mail templates design
- Updated dependencies [279182a]
- Updated dependencies [1279222]
- Updated dependencies [913e24d]
  - @hayasedb/db@0.4.0
  - @hayasedb/contract@0.4.0

## 0.3.1

### Patch Changes

- Updated dependencies [17f865b]
- Updated dependencies [17f865b]
  - @hayasedb/contract@0.3.1
  - @hayasedb/db@0.3.1

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

- @hayasedb/contract@0.3.0
- @hayasedb/db@0.3.0

## 0.2.1

### Patch Changes

- 58431f3: Fix session cookies not persisting across subdomains after OAuth sign-in. Cross-subdomain cookies now use a configurable `AUTH_COOKIE_DOMAIN` (e.g. `.hayasedb.com`) so the session set on the API host is shared with the web and admin apps, instead of being scoped host-only.
  - @hayasedb/contract@0.2.1
  - @hayasedb/db@0.2.1

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
  - @hayasedb/db@0.2.0

## 0.1.0

### Minor Changes

- 3b3c18d: Initial release: Better Auth configuration and server factory with email/password sign-up, email verification, session management, avatar support, and self-service account deletion.

### Patch Changes

- Updated dependencies [3b3c18d]
- Updated dependencies [3b3c18d]
  - @hayasedb/contract@0.1.0
  - @hayasedb/db@0.1.0
