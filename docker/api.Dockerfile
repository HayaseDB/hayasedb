# syntax=docker/dockerfile:1

FROM oven/bun:1.3.14-slim AS builder
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
COPY apps/web/package.json apps/web/
COPY apps/admin/package.json apps/admin/
COPY apps/api/package.json apps/api/
COPY packages/auth/package.json packages/auth/
COPY packages/config/package.json packages/config/
COPY packages/contract/package.json packages/contract/
COPY packages/db/package.json packages/db/
COPY packages/domain/package.json packages/domain/
COPY packages/mail/package.json packages/mail/
COPY packages/nuxt/package.json packages/nuxt/
COPY packages/ui/package.json packages/ui/
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --ignore-scripts
COPY . .
RUN bunx turbo run build --filter=@hayasedb/api

FROM oven/bun:1.3.14-slim AS prod-deps
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
COPY apps/api/package.json apps/api/
COPY packages/auth/package.json packages/auth/
COPY packages/config/package.json packages/config/
COPY packages/contract/package.json packages/contract/
COPY packages/db/package.json packages/db/
COPY packages/domain/package.json packages/domain/
COPY packages/mail/package.json packages/mail/
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --omit=dev --omit=peer --ignore-scripts --linker=hoisted

FROM node:22-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=prod-deps --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/packages/config/package.json ./packages/config/package.json
COPY --from=builder --chown=node:node /app/packages/domain/package.json ./packages/domain/package.json
COPY --from=builder --chown=node:node /app/packages/domain/dist ./packages/domain/dist
COPY --from=builder --chown=node:node /app/packages/contract/package.json ./packages/contract/package.json
COPY --from=builder --chown=node:node /app/packages/contract/dist ./packages/contract/dist
COPY --from=builder --chown=node:node /app/packages/db/package.json ./packages/db/package.json
COPY --from=builder --chown=node:node /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=node:node /app/packages/db/drizzle ./packages/db/drizzle
COPY --from=builder --chown=node:node /app/packages/auth/package.json ./packages/auth/package.json
COPY --from=builder --chown=node:node /app/packages/auth/dist ./packages/auth/dist
COPY --from=builder --chown=node:node /app/packages/mail/package.json ./packages/mail/package.json
COPY --from=builder --chown=node:node /app/packages/mail/dist ./packages/mail/dist
COPY --from=builder --chown=node:node /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=node:node /app/apps/api/dist ./apps/api/dist
WORKDIR /app/apps/api
USER node
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=90s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "dist/src/main"]
