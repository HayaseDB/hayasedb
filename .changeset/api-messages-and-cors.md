---
'@hayasedb/api': patch
---

- Replace changeset notes with the message timeline system across the contribution, moderation, and changeset-apply services; rejections now record a rejection message with a reason
- Always include `API_PUBLIC_URL` in the CORS allowlist and Better Auth trusted origins
- Point the auth OpenAPI document's server URL at `/api/auth` so requests from the reference UI target the correct base path
- Improve the Dockerfile for smaller images and better build caching
