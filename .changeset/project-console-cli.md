---
'@hayasedb/cli': minor
'@hayasedb/contract': patch
'@hayasedb/api': patch
'@hayasedb/db': patch
---

Add `@hayasedb/cli`, a project console exposed as the `hayasedb` bin (`bunx hayasedb`): `db migrate`, `user create/set-password/set-role`, and extensible seed sets under `seed <set>` with step selection (`--only`, or an interactive dependency-aware tree selector). The demo set is a committed AniList snapshot (45 anime with covers/banners/gallery, genres, relations, partial release dates) plus demo accounts with avatars and API keys, and deterministic community changesets covering every review outcome (pending/approved/rejected/withdrawn/superseded) — all seeded through the API so the revision system stays intact. Replaces the one-off `apps/api/src/seed-demo.ts` and `packages/db/src/migrate-cli.ts` scripts. The contract build now keeps `dist/openapi.public.json` across rebuilds and writes it atomically, fixing transient ENOENT errors in the web dev server.
