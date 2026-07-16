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
RUN bunx turbo run build --filter=@hayasedb/web

FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3001
WORKDIR /app
COPY --from=builder --chown=node:node /app/apps/web/.output ./.output
USER node
EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
  CMD ["node", "-e", "const p=process.env.NITRO_PORT||3001;fetch(`http://127.0.0.1:${p}/`).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", ".output/server/index.mjs"]
