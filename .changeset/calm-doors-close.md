---
'@hayasedb/contract': minor
'@hayasedb/nuxt': minor
'@hayasedb/web': minor
'@hayasedb/admin': minor
---

Closed the Nuxt API proxy behind a contract-derived per-app allowlist that answers 404 for unlisted routes, strips untrusted headers and injects the internal service token
