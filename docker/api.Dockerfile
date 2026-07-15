# syntax=docker/dockerfile:1
FROM oven/bun:1.3.14-slim AS prune
WORKDIR /app
COPY . .
RUN bunx turbo@2.10.2 prune @hayasedb/api --docker

FROM oven/bun:1.3.14-slim AS deps
WORKDIR /app
COPY --from=prune /app/out/json/ .
RUN bun install --frozen-lockfile

FROM oven/bun:1.3.14-slim AS build
WORKDIR /app
COPY --from=deps /app/ .
COPY --from=prune /app/out/full/ .
RUN bunx turbo@2.10.2 run build --filter=@hayasedb/api

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/ .
WORKDIR /app/apps/api
USER node
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=90s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "dist/src/main"]
