# syntax=docker/dockerfile:1

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS build

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm prune --prod

FROM node:${NODE_VERSION}-alpine AS production

RUN apk add --no-cache tini

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/package.json ./

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health/ready || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "--enable-source-maps", "dist/src/main.js"]

LABEL org.opencontainers.image.source="https://github.com/hayasedb/hayasedb"
LABEL org.opencontainers.image.description="HayaseDB API Server"
LABEL org.opencontainers.image.licenses="MIT"
