# =====================================================================
# File: Dockerfile
# Description: Multi-stage container image for the QuantMind NestJS BFF —
#              the sole publicly routable, AI-mediating API (P1). Stage 1
#              builds TypeScript; stage 2 ships only prod deps + dist.
# =====================================================================

# ---- Build stage ----------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ---- Runtime stage --------------------------------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

# Non-root runtime user.
RUN addgroup -S quantmind && adduser -S quantmind -G quantmind
USER quantmind

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
    CMD node -e "require('http').get('http://127.0.0.1:8080/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/main.js"]
