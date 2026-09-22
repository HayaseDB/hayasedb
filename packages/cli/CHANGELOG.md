# @hayasedb/cli

## 0.13.0

### Minor Changes

- c6bc9bf: Localize anime and genre records, and model seasons and episodes as first-class entities
  
  Titles and descriptions used to live in fixed `titleRomaji` / `titleEnglish` / `titleNative` / `description` columns, which forced every entry into one editorial view of a work and left no room for the eighteen locales the site actually serves. Anime and genre text now lives in `anime_translation` and `genre_translation`, keyed by BCP-47 locale, with a partial unique index pinning exactly one original translation per record and case-insensitive per-locale uniqueness on genre names. `genre.name` becomes `genre.slug`, so the identifier no longer doubles as a display string that cannot be translated.
  
  Responses are negotiated from `Accept-Language` and answer with `Vary: Accept-Language`. One ranked locale list drives both the SQL ordering and the in-process pick, so the title chosen for a list row and the title chosen for a detail page can no longer disagree. When a client states no preference the English translation wins, with the original as the fallback for records that have no English text — the reverse of that order made a request without a header render native-script titles that no page in the product asks for. Nuxt now forwards the visitor's `Accept-Language` on server-rendered requests, which previously reached the API bare and rendered a different language than the client would.
  
  Seasons and episodes become revisionable entities alongside anime and genre. An episode belongs either to an anime or to a season, never both and never neither, enforced by a single `num_nonnulls` check rather than the four overlapping layers the first draft carried; the cross-row rule that an anime cannot hold both seasons and loose episodes moves onto the entity handler, so a violation arrives as an ordinary changeset conflict instead of a raw constraint error. Translations ride inside the entity document and are edited atomically as one revision, which retires the eight `/translations/{locale}` sub-resources.
  
  Ordering is standardized. `PUT /{collection}/order` replaces the `:reorder` colon-verbs, and the precondition that was previously read out of band from the raw request becomes a typed `expectedOrderEtag` field on the input. It was unreachable through the generated client before, so every save touching two or more rows answered 412; media reorder, which had no concurrency control at all, now carries the same precondition instead of silently letting two editors clobber each other.
  
  The structure editor is rebuilt on that surface, wired into both the admin form and the public contribution flow, with the diff planner keyed on stable serialization and on where an episode started rather than where it ended up, so moving an episode between seasons registers as a change. Episode-only contributions no longer synthesize an empty anime change, and a changeset that exceeds the per-changeset limit is refused with an explanation instead of a server error. The demo seed set is rewritten around the new shape, with localized genres, native and romanized titles for every entry, and seasons and episodes that exercise every season kind, episode type and episode status across both ownership modes.

### Patch Changes

- Updated dependencies [c6bc9bf]
  - @hayasedb/contract@0.13.0
  - @hayasedb/db@0.13.0
  - @hayasedb/domain@0.13.0
  - @hayasedb/auth@0.13.0

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
