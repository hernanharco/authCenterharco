# Backend Dockerfile
FROM node:18-alpine AS base

# Install pnpm globalmente
RUN npm install -g pnpm

# --- STAGE 1: Dependencias de Desarrollo ---
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
# 🔑 QUITAMOS --prod aquí para que instale TypeScript y podamos compilar
RUN pnpm install --dev --no-frozen-lockfile

# --- STAGE 2: Builder ---
FROM base AS builder
WORKDIR /app
# Copiamos TODOS los node_modules (incluyendo devDependencies)
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ahora 'tsc' sí existe y la compilación tendrá éxito
RUN pnpm run build

# --- STAGE 3: Dependencias de Producción ---
# Creamos una etapa limpia solo con lo necesario para ejecutar
FROM base AS prod-deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# 🔑 Aquí SÍ instalamos solo producción para que la imagen final sea ligera
RUN pnpm install --prod --no-frozen-lockfile

# --- STAGE 4: Runner (Imagen Final) ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
RUN apk add --no-cache curl

# Seguridad: No correr como root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copiamos solo lo esencial para el runtime
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

USER nodejs

EXPOSE 4000

# Modificamos el Healthcheck para ser más tolerantes en el arranque
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=5 \
  CMD curl -f http://localhost:4000/api/perfil || exit 1

# Usamos node directamente para evitar overhead de pnpm en el inicio
CMD ["node", "dist/index.js"]