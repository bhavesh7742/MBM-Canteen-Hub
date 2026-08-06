# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Runtime
FROM node:22-alpine AS runtime
WORKDIR /app

# Create non-root user (security)
RUN addgroup -S canteen && adduser -S canteen -G canteen

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Remove dev files
RUN rm -rf scripts/ seed.js seed_error.txt

USER canteen

EXPOSE 5000

# Health check maps to /api/health already in server.js
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
