# Multi-stage build dla aplikacji React + Node.js
FROM node:18-alpine AS base

# Instalacja FFmpeg (wymagany dla @ffmpeg/ffmpeg)
RUN apk add --no-cache ffmpeg

# Etap 1: Build aplikacji React
FROM base AS client-builder
WORKDIR /app/client

# Kopiowanie plików konfiguracyjnych
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Instalacja zależności (potrzebne dev dependencies do build)
RUN npm ci

# Kopiowanie kodu źródłowego
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Build aplikacji
RUN npm run build

# Etap 2: Serwer Node.js
FROM base AS server-builder
WORKDIR /app

# Kopiowanie plików serwera i package.json
COPY server/ ./server/
COPY package*.json ./

# Instalacja zależności serwera
RUN npm ci --only=production

# Etap 3: Final image
FROM base AS production
WORKDIR /app

# Utworzenie użytkownika non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Kopiowanie zbudowanej aplikacji React
COPY --from=client-builder --chown=nextjs:nodejs /app/client/dist ./public

# Kopiowanie serwera i package.json
COPY --from=server-builder --chown=nextjs:nodejs /app/server ./server
COPY --from=server-builder --chown=nextjs:nodejs /app/package*.json ./

# Sprawdzenie struktury katalogów
RUN ls -la /app && echo "--- Server directory ---" && ls -la /app/server

# Utworzenie katalogów
RUN mkdir -p public/sounds && chown -R nextjs:nodejs public

# Przełączenie na użytkownika non-root
USER nextjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Uruchomienie serwera
CMD ["node", "server/index.js"]
