# syntax=docker/dockerfile:1

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS deps

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-web,target=/pnpm/store pnpm install --frozen-lockfile

FROM node:${NODE_VERSION}-alpine AS build

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG WEB_VERSION=dev
ENV WEB_VERSION=$WEB_VERSION

RUN pnpm build

FROM node:${NODE_VERSION}-alpine AS production

RUN apk add --no-cache tini

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nuxt

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

COPY --from=build --chown=nuxt:nodejs /app/.output ./

USER nuxt

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "export NUXT_API_URL=${WEB_API_URL:-http://localhost:3000} && node server/index.mjs"]

LABEL org.opencontainers.image.source="https://github.com/hayasedb/hayasedb"
LABEL org.opencontainers.image.description="HayaseDB Web Frontend"
LABEL org.opencontainers.image.licenses="MIT"
