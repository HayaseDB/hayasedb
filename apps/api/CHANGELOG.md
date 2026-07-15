# @hayasedb/api

## 0.1.0

### Minor Changes

- 0235aff: Initial release of the rewritten HayaseDB platform.

  A Bun and Turbo monorepo with three apps (NestJS/oRPC API, Nuxt 4 web frontend, Nuxt 4 admin dashboard) built on eight shared packages.

  - Anime, genre, account, health, and system modules behind a typed oRPC contract
  - Better Auth with email/password, GitHub and Discord OAuth, email verification, and password reset
  - Drizzle/Postgres schema, Redis, and MinIO media storage
  - Public web: landing, explore, anime detail, settings, legal
  - Admin: anime CRUD, genre management, user administration
  - Docker Swarm deploy behind Traefik, images published to GHCR

### Patch Changes

- Updated dependencies [0235aff]
  - @hayasedb/auth@0.1.0
  - @hayasedb/contract@0.1.0
  - @hayasedb/db@0.1.0
  - @hayasedb/domain@0.1.0
  - @hayasedb/mail@0.1.0
