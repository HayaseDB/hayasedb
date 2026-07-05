# syntax=docker/dockerfile:1
ARG BUN_VERSION=1.3.14
ARG NODE_VERSION=22

FROM oven/bun:${BUN_VERSION}-slim AS prune
WORKDIR /app
COPY . .
RUN bunx turbo@2.10.2 prune @hayasedb/api --docker

FROM oven/bun:${BUN_VERSION}-slim AS deps
WORKDIR /app
COPY --from=prune /app/out/json/ .
RUN bun install --frozen-lockfile

FROM oven/bun:${BUN_VERSION}-slim AS build
WORKDIR /app
COPY --from=deps /app/ .
COPY --from=prune /app/out/full/ .
RUN bunx turbo@2.10.2 run build --filter=@hayasedb/api

FROM node:${NODE_VERSION}-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/ .
WORKDIR /app/apps/api
USER node
EXPOSE 3000
CMD ["node", "dist/src/main"]
