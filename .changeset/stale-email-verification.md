---
'@hayasedb/api': patch
'@hayasedb/contract': patch
'@hayasedb/nuxt': patch
'@hayasedb/web': patch
---

Fix stale email verification state, where a verified user could keep being rejected as unverified for up to five minutes

Better Auth rewrites its session cookie cache when an email is verified, but only on a response to the browser holding that cookie. Verifying in a different browser, a private window, or on a phone leaves the original browser with a stale cookie, and session reads short-circuit on it before reaching the database.

- API: `auth.getSession` now forwards Better Auth's response cookie instead of discarding it. The client already requests an uncached read, which also refreshes the cookie cache, so a stale cookie repairs itself on the next session read
- Nuxt: a `FORBIDDEN` unverified-email response triggers one session refresh, turning the worst case into a self-correcting retry
- Contract: the rejection message is shared between the API check and the frontend predicate so they cannot drift
- Web: `verify-email` continues with `router.replace` so the tokened URL leaves history
