# @hayasedb/mail

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

### Patch Changes

- a6cbd77: Improved mail templates design

## 0.3.1

## 0.3.0

## 0.2.1

## 0.2.0

## 0.1.0

### Minor Changes

- 3b3c18d: Initial release: transactional email templates built with React Email, delivered via Resend or SMTP.
