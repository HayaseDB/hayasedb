---
"@hayasedb/api": patch
"@hayasedb/auth": patch
---

Isolate auth sessions per subdomain. Session cookies are now always host-only (the cross-subdomain cookie mechanism and the `AUTH_COOKIE_DOMAIN` env var have been removed), so a session on one subdomain is never shared with another: `hayasedb.com`, `staging.hayasedb.com`, and `admin.hayasedb.com` each keep their own separate session. To keep OAuth working with host-only cookies, the auth `baseURL` is now resolved per request from the forwarded frontend host (via `allowedHosts` derived from `AUTH_TRUSTED_ORIGINS`), so the provider redirect returns to the same frontend origin that started sign-in instead of the API host. OAuth app callback URLs must point at the frontend origins (e.g. `https://hayasedb.com/api/auth/callback/github`).
