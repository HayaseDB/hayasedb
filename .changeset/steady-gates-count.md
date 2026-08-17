---
'@hayasedb/api': minor
---

Added Redis-backed API rate limiting with separate buckets per client ip (600/min) and per API key (60/min), returning standard rate limit and Retry-After headers
