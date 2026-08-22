# @hayasedb/api

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
