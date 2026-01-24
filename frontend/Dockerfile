# 1. Base: Usamos Node 20 para cumplir con los requisitos de Next.js [Versión LTS]
FROM node:20-alpine AS base

# Instalamos pnpm globalmente de forma eficiente
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

# 2. Deps: Instalamos dependencias
FROM base AS deps
# libc6-compat es necesario para algunas librerías nativas en Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiamos los archivos de definición de paquetes
COPY package.json pnpm-lock.yaml ./
# Instalamos dependencias ignorando scripts de post-instalación para mayor seguridad
RUN pnpm install --frozen-lockfile

# 3. Builder: Compilamos la aplicación
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desactivamos la telemetría de Next.js durante el build
ENV NEXT_TELEMETRY_DISABLED 1

RUN pnpm run build

# 4. Runner: Imagen final de producción
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Seguridad: No ejecutar como root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiamos archivos necesarios del modo standalone
# Importante: next.config.js debe tener output: 'standalone'
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (res) => res.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "server.js"]