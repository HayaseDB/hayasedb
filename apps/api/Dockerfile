# syntax=docker/dockerfile:1

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS base

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/sdk/package.json ./packages/sdk/

FROM base AS deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS build
COPY packages/shared/ ./packages/shared/
COPY packages/sdk/ ./packages/sdk/
RUN pnpm --filter @hayasedb/shared build && pnpm --filter @hayasedb/sdk build
COPY apps/api/ ./apps/api/
RUN pnpm --filter @hayasedb/api build
RUN pnpm --filter @hayasedb/api deploy --prod /app/deploy

FROM node:${NODE_VERSION}-alpine AS production

RUN apk add --no-cache tini wget

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

COPY --from=build --chown=nestjs:nodejs /app/deploy/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/deploy/package.json ./

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV API_PORT=3000

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health/liveness || exit 1

LABEL org.opencontainers.image.source="https://github.com/HayaseDB/hayasedb" \
      org.opencontainers.image.description="HayaseDB API Server" \
      org.opencontainers.image.licenses="UNLICENSED"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "--enable-source-maps", "dist/main"]
