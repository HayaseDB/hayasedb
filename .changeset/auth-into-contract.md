---
'@hayasedb/api': minor
'@hayasedb/contract': minor
'@hayasedb/auth': minor
'@hayasedb/nuxt': minor
'@hayasedb/web': minor
'@hayasedb/admin': minor
---

Move every Better Auth endpoint into the oRPC contract so NestJS is the single source of truth for authentication

- Contract: new `auth` router (session, sign-in/up/out, profile, email, password, sessions, accounts, verification, password reset, OAuth callback, API keys, admin user management) with typed inputs, shared output schemas, `BAD_REQUEST` and `TOO_MANY_REQUESTS` common errors, and `bff()` audiences per procedure
- API: auth controllers implement the contract through thin `auth.api.*` facades with `returnHeaders` plus set-cookie forwarding; `@thallesp/nestjs-better-auth` keeps only its guard, decorators and service (`disableControllers: true`); explicit body parsers in `main.ts`; `@Roles('admin')` on every admin handler; Better Auth `APIError`s mapped to contract errors via `mapAuthError` and the catch-all error filter removed; global `HttpExceptionFilter` so guard rejections (401/403/404/429) use the oRPC error envelope; single throttler with per-route `RouteThrottle` on sign-in, sign-up, verification resend and password reset; OAuth callback served as an ordinary procedure returning 302
- Docs: one OpenAPI generator, two sources (public, internal), auth excluded from the public doc
- BFF: allowlist derived entirely from the contract, no `/api/auth` prefix carve-outs
- Frontend: Better Auth client, `$auth` plugins and `useAuth` removed; all auth composables use the typed oRPC client through `callApi`/`useApiAction` with consistent toasts; session cache is client-only, session sync re-runs middleware on session id change, "Session expired" only fires when the session is really gone; sign-up refreshes the session and redirects; non-admin sign-in on the admin app is signed out with "Access denied"
- Fixes found during verification: session list dates normalised from the Redis secondary storage, admin update no longer sends an undefined email, Better Auth 1.6.23 error codes mapped correctly

API keys are available to every signed-in, email-verified user. Public URLs are unchanged (`/api/auth/...`), so registered OAuth redirect URIs and cookies keep working.
