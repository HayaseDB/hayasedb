# syntax=docker/dockerfile:1
ARG BUN_VERSION=1.3.14
ARG NODE_VERSION=22

FROM oven/bun:${BUN_VERSION}-slim AS prune
WORKDIR /app
COPY . .
RUN bunx turbo@2.10.2 prune @hayasedb/admin --docker

FROM oven/bun:${BUN_VERSION}-slim AS deps
WORKDIR /app
COPY --from=prune /app/out/json/ .
RUN bun install --frozen-lockfile

FROM oven/bun:${BUN_VERSION}-slim AS build
WORKDIR /app
COPY --from=deps /app/ .
COPY --from=prune /app/out/full/ .
RUN bunx turbo@2.10.2 run build --filter=@hayasedb/admin

FROM node:${NODE_VERSION}-slim AS runtime
ENV NODE_ENV=production
ENV NITRO_PORT=3002
ENV NITRO_HOST=0.0.0.0
WORKDIR /app
COPY --from=build /app/apps/admin/.output ./.output
USER node
EXPOSE 3002

HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3002/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", ".output/server/index.mjs"]
