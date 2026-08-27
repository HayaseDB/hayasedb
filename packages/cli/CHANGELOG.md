# @hayasedb/cli

## 0.12.0

### Patch Changes

- db15ef6: Redesign the public API around REST conventions, with HTTP caching, cursor pagination and per-key rate limits
  
  The public surface grew out of the internal contract rather than being designed as a product, and it showed. `GET /anime/by-slug/{slug}` put a lookup strategy in the path and sat alongside `GET /anime/{id}`, giving one resource two URIs. There is now a single `GET /anime/{id}` that accepts either a UUID or a slug, serving both public and internal callers. `GET /genres/{id}` joins it, `/ping` is gone in favour of the existing `/health`, and the media routes become a proper subresource at `/anime/{id}/media` — the `{animeId}` spelling is retired so a segment is never parameterised under two names, which had put the API-access allowlist at risk of 403ing legitimate traffic.
  
  Collections answer with a consistent `{items, meta}` envelope, and detail responses stay bare. Query parameters read as an API rather than as storage: `sort` and `order` merge into one signed value such as `-createdAt`, `genreId` becomes `genre`, and `startYear` splits into `startYearMin` and `startYearMax` so a range like the nineties is expressible. Cursor pagination is added alongside offset paging rather than replacing it, since the page-number pager depends on `total`; cursors are opaque, carry the sort they were minted under, and are refused when replayed against a different one.
  
  Read endpoints now send `Cache-Control` and a strong `ETag`, answering a matching `If-None-Match` with a bodyless 304. Rate limits are reported on every keyed response through the IETF `RateLimit-*` headers alongside the legacy `X-RateLimit-*` aliases, and these are exposed through CORS so browser clients can actually read them.
  
  API keys gain per-key limits. Better Auth's own limiter is disabled so the Nest throttler is the single enforcement point and two counters can never disagree; the `apikey` row remains the durable configuration, cached in Redis by the same fingerprint the throttler already computes and invalidated when a key is deleted. The stored ceiling is normalised to the throttler's window, so a limit expressed per hour is no longer spent in a minute. The plugin defaults move to 60 requests per minute to match what was already being enforced, with a migration that backfills only the rows still on the old 1000-per-hour default and leaves customised limits untouched.
  
  Key owners can finally see their own usage: the listing reports live consumption read from the counter the limiter enforces against, so the numbers agree with the headers a caller receives. The rate-limit fields are grouped into a single `rateLimit` object and `referenceId` is dropped, since it is always the caller and only leaked an internal foreign-key name.
- Updated dependencies [04b5241]
- Updated dependencies [db15ef6]
  - @hayasedb/domain@0.12.0
  - @hayasedb/contract@0.12.0
  - @hayasedb/db@0.12.0
  - @hayasedb/auth@0.12.0

## 0.11.0

### Minor Changes

- ad5305b: Add `@hayasedb/cli`, a project console exposed as the `hayasedb` bin (`bunx hayasedb`): `db migrate`, `user create/set-password/set-role`, and extensible seed sets under `seed <set>` with step selection (`--only`, or an interactive dependency-aware tree selector). The demo set is a committed AniList snapshot (45 anime with covers/banners/gallery, genres, relations, partial release dates) plus demo accounts with avatars and API keys, and deterministic community changesets covering every review outcome (pending/approved/rejected/withdrawn/superseded) — all seeded through the API so the revision system stays intact. Replaces the one-off `apps/api/src/seed-demo.ts` and `packages/db/src/migrate-cli.ts` scripts. The contract build now keeps `dist/openapi.public.json` across rebuilds and writes it atomically, fixing transient ENOENT errors in the web dev server.

### Patch Changes

- Updated dependencies [ad5305b]
  - @hayasedb/contract@0.11.0
  - @hayasedb/db@0.11.0
  - @hayasedb/auth@0.11.0
  - @hayasedb/domain@0.11.0
