---
'@hayasedb/contract': minor
'@hayasedb/db': minor
'@hayasedb/api': minor
'@hayasedb/domain': minor
'@hayasedb/nuxt': minor
'@hayasedb/ui': minor
'@hayasedb/web': minor
'@hayasedb/admin': minor
'@hayasedb/cli': minor
---

Localize anime and genre records, and model seasons and episodes as first-class entities

Titles and descriptions used to live in fixed `titleRomaji` / `titleEnglish` / `titleNative` / `description` columns, which forced every entry into one editorial view of a work and left no room for the eighteen locales the site actually serves. Anime and genre text now lives in `anime_translation` and `genre_translation`, keyed by BCP-47 locale, with a partial unique index pinning exactly one original translation per record and case-insensitive per-locale uniqueness on genre names. `genre.name` becomes `genre.slug`, so the identifier no longer doubles as a display string that cannot be translated.

Responses are negotiated from `Accept-Language` and answer with `Vary: Accept-Language`. One ranked locale list drives both the SQL ordering and the in-process pick, so the title chosen for a list row and the title chosen for a detail page can no longer disagree. When a client states no preference the English translation wins, with the original as the fallback for records that have no English text — the reverse of that order made a request without a header render native-script titles that no page in the product asks for. Nuxt now forwards the visitor's `Accept-Language` on server-rendered requests, which previously reached the API bare and rendered a different language than the client would.

Seasons and episodes become revisionable entities alongside anime and genre. An episode belongs either to an anime or to a season, never both and never neither, enforced by a single `num_nonnulls` check rather than the four overlapping layers the first draft carried; the cross-row rule that an anime cannot hold both seasons and loose episodes moves onto the entity handler, so a violation arrives as an ordinary changeset conflict instead of a raw constraint error. Translations ride inside the entity document and are edited atomically as one revision, which retires the eight `/translations/{locale}` sub-resources.

Ordering is standardized. `PUT /{collection}/order` replaces the `:reorder` colon-verbs, and the precondition that was previously read out of band from the raw request becomes a typed `expectedOrderEtag` field on the input. It was unreachable through the generated client before, so every save touching two or more rows answered 412; media reorder, which had no concurrency control at all, now carries the same precondition instead of silently letting two editors clobber each other.

The structure editor is rebuilt on that surface, wired into both the admin form and the public contribution flow, with the diff planner keyed on stable serialization and on where an episode started rather than where it ended up, so moving an episode between seasons registers as a change. Episode-only contributions no longer synthesize an empty anime change, and a changeset that exceeds the per-changeset limit is refused with an explanation instead of a server error. The demo seed set is rewritten around the new shape, with localized genres, native and romanized titles for every entry, and seasons and episodes that exercise every season kind, episode type and episode status across both ownership modes.
