# --- ETAPA BASE ---
FROM node:18-alpine AS base
RUN npm install -g pnpm

# --- ETAPA DE COMPILACIÓN (BUILDER) ---
FROM base AS builder
WORKDIR /app

# Copiamos archivos de definición
COPY package.json pnpm-lock.yaml ./

# Instalamos TODAS las dependencias (incluyendo devDeps para el build)
# Usamos --no-frozen-lockfile por si hay discrepancias de versión en el entorno Alpine
RUN pnpm install --no-frozen-lockfile

# Copiamos el resto del código fuente
COPY . .

# Ejecutamos el build de TypeScript
RUN pnpm run build

# --- ETAPA DE DEPENDENCIAS DE PRODUCCIÓN ---
FROM base AS prod-deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --no-frozen-lockfile

# --- ETAPA FINAL (RUNNER) ---
FROM base AS runner
WORKDIR /app

# Seteamos variables de entorno
ENV NODE_ENV production
# Render asigna el PORT automáticamente, pero definimos un default
ENV PORT 4000 

# Instalamos curl para el Healthcheck
RUN apk add --no-cache curl

# Configuración de seguridad (Usuario no root)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copiamos solo lo necesario desde las etapas anteriores
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

USER nodejs

EXPOSE 4000

# Healthcheck para que Render sepa que el servicio está listo
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Ejecución directa con Node para máxima eficiencia
CMD ["node", "dist/server.js"]