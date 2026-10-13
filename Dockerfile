# ============================================================
# BRChain — imagem de produção (Next.js 15 standalone)
# Build multi-stage: deps → builder → runner (imagem final enxuta).
# ============================================================

# ---- 1) Dependências -----------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
# Instala só o necessário para resolver as dependências (cache eficiente).
COPY package.json package-lock.json ./
RUN npm ci

# ---- 2) Build ------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Desliga a telemetria do Next no build.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- 3) Runtime ----------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Usuário sem privilégios.
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

# Artefatos do build standalone (servidor + node_modules mínimos).
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Scripts + schema para operações manuais (migração/moderador/seed) via
# `docker compose exec`. Dependem de mysql2/bcryptjs, que o standalone copia
# para node_modules por estarem em serverExternalPackages (next.config.mjs).
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/db ./db

USER nextjs
EXPOSE 3000

# server.js é gerado pelo output "standalone".
CMD ["node", "server.js"]
