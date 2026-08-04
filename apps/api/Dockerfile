# Build context: monorepo root (.)
FROM oven/bun:1.3.11 AS base
WORKDIR /app

FROM base AS pruner
COPY . .
RUN bunx turbo prune @maple/api --docker --out-dir /app/out

FROM base AS installer
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/bun.lock ./bun.lock
RUN apt-get update && \
  apt-get install -y --no-install-recommends python3 make g++ && \
  rm -rf /var/lib/apt/lists/*
RUN bun install
COPY --from=pruner /app/out/full/ ./
RUN bunx turbo typecheck

FROM node:22-bookworm-slim AS runner
WORKDIR /app

COPY --from=installer --chown=node:node /app /app
USER node

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

WORKDIR /app/apps/api
CMD ["sh", "-c", "exec node /app/node_modules/wrangler/bin/wrangler.js dev --ip 0.0.0.0 --port ${PORT:-8080} --inspector-port=$((${PORT:-8080} + 10000))"]
