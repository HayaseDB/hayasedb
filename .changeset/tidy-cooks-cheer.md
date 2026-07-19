---
"@hayasedb/api": patch
"@hayasedb/auth": patch
---

Fix session cookies not persisting across subdomains after OAuth sign-in. Cross-subdomain cookies now use a configurable `AUTH_COOKIE_DOMAIN` (e.g. `.hayasedb.com`) so the session set on the API host is shared with the web and admin apps, instead of being scoped host-only.
