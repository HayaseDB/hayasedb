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
    bunx turbo@${TURBO_VERSION} prune @hayasedb/admin --docker

FROM base AS builder
COPY --from=prepare /app/out/json/ .
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --ignore-scripts

COPY --from=prepare /app/out/full/ .
ARG GIT_SHA
ENV GIT_SHA=${GIT_SHA}
RUN --mount=type=cache,target=/app/.turbo/cache \
    bun run build

FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3002
ENV NITRO_SHUTDOWN_DISABLED=1
WORKDIR /app
COPY --from=builder --chown=node:node /app/apps/admin/.output ./.output
USER node
EXPOSE 3002

HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
  CMD ["node", "-e", "const p=process.env.NITRO_PORT||3002;fetch(`http://127.0.0.1:${p}/healthz`).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", ".output/server/index.mjs"]
