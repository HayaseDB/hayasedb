# syntax=docker/dockerfile:1
FROM oven/bun:1.3.14-slim AS prune
WORKDIR /app
COPY . .
RUN --mount=type=cache,target=/root/.install-cache \
    bun install --frozen-lockfile --ignore-scripts \
 && bunx turbo prune @hayasedb/api --docker

FROM oven/bun:1.3.14-slim AS deps
WORKDIR /app
COPY --from=prune /app/out/json/ .
RUN --mount=type=cache,target=/root/.install-cache \
    bun install --frozen-lockfile

FROM oven/bun:1.3.14-slim AS build
WORKDIR /app
COPY --from=deps /app/ .
COPY --from=prune /app/out/full/ .
RUN bunx turbo run build --filter=@hayasedb/api

FROM oven/bun:1.3.14-slim AS prod-deps
WORKDIR /app
COPY --from=prune /app/out/json/ .
RUN --mount=type=cache,target=/root/.install-cache \
    bun install --frozen-lockfile --production --ignore-scripts

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=prod-deps --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/packages ./packages
COPY --from=build --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /app/apps/api/package.json ./apps/api/package.json
WORKDIR /app/apps/api
USER node
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=90s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "dist/src/main"]
