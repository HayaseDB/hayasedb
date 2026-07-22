# syntax=docker/dockerfile:1
ARG BUN_VERSION=1.3.14
ARG TURBO_VERSION=2.10.5

FROM oven/bun:${BUN_VERSION}-slim AS base
ENV TURBO_TELEMETRY_DISABLED=1 \
    DO_NOT_TRACK=1
WORKDIR /app

FROM base AS prepare
ARG TURBO_VERSION
COPY . .
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bunx turbo@${TURBO_VERSION} prune @hayasedb/api --docker

FROM base AS builder
COPY --from=prepare /app/out/json/ .
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --ignore-scripts

COPY --from=prepare /app/out/full/ .
RUN --mount=type=cache,target=/app/.turbo/cache \
    bun run build

FROM base AS prod-deps
COPY --from=prepare /app/out/json/ .
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production --ignore-scripts --linker=hoisted

FROM node:22-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=node:node /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=node:node /app/packages ./packages
WORKDIR /app/apps/api
USER node
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=90s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "dist/src/main"]
