# syntax=docker/dockerfile:1
FROM oven/bun:1.3.14-slim AS prune
WORKDIR /app
COPY . .
RUN --mount=type=cache,target=/root/.install-cache \
    bun install --frozen-lockfile --ignore-scripts \
 && bunx turbo prune @hayasedb/web --docker

FROM oven/bun:1.3.14-slim AS deps
WORKDIR /app
COPY --from=prune /app/out/json/ .
RUN --mount=type=cache,target=/root/.install-cache \
    bun install --frozen-lockfile

FROM oven/bun:1.3.14-slim AS build
WORKDIR /app
COPY --from=deps /app/ .
COPY --from=prune /app/out/full/ .
RUN bunx turbo run build --filter=@hayasedb/web

FROM node:22-slim AS runtime
ENV NODE_ENV=production
ENV NITRO_PORT=3001
ENV NITRO_HOST=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app/apps/web/.output ./.output
USER node
EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3001/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", ".output/server/index.mjs"]
