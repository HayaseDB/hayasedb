---
"@hayasedb/api": minor
"@hayasedb/auth": minor
"@hayasedb/nuxt": patch
---

Rework OAuth around a single static frontend origin.

The auth `baseURL` is now pinned to `WEB_PUBLIC_URL` instead of being resolved per request from the forwarded host. The frontends already proxy `/api/auth/*` to the API, so the browser only ever talks to the frontend origin: OAuth redirect URIs are derived as `${WEB_PUBLIC_URL}/api/auth/callback/<provider>`, and the `state` cookie and the callback now land on the same host. This replaces the `{ allowedHosts, fallback, protocol }` dynamic `baseURL`, which trusted the proxied `x-forwarded-host` and produced a redirect URI that did not match where the OAuth cookies had been set, dropping users on `/?code=…&state=…` with no session.

`AuthOptions.baseURL` and `AuthOptions.frontendBaseURL` are replaced by a single required `appURL`. Session cookies stay host-only (no `crossSubDomainCookies`), so each origin keeps its own session and the web and admin frontends never share one.

**Breaking for deployments:**

- `WEB_PUBLIC_URL` is now required and validated at boot.
- OAuth callback URLs must be registered at the frontend origin, one app per environment:
  - `https://hayasedb.com/api/auth/callback/{github,discord}`
  - `https://staging.hayasedb.com/api/auth/callback/{github,discord}`
- Staging and production must use distinct Discord applications; they currently share a `DISCORD_CLIENT_ID`.
