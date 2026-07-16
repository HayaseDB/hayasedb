# syntax=docker/dockerfile:1
ARG BUN_VERSION=1.3.14

FROM oven/bun:${BUN_VERSION}-slim AS base
WORKDIR /app

FROM base AS prepare
RUN bun add -g turbo@2.10.5
COPY . .
RUN turbo prune @hayasedb/web --docker

FROM base AS builder
COPY --from=prepare /app/out/json/ .
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --ignore-scripts

COPY --from=prepare /app/out/full/ .
RUN bunx turbo run build

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
