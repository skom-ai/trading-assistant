# =====================================================================
# File: Dockerfile
# Description: Container image for the QuantMind Next-gen React (Vite) UI.
#              Builds the static bundle and serves it with `vite preview`
#              bound to all interfaces inside the compose network.
# Notes: The UI talks ONLY to the NestJS BFF (P1). Set VITE_BFF_BASE_URL
#        to the BFF origin when wiring live API calls.
# =====================================================================

# ---- Build stage ----------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# ---- Runtime stage --------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/vite.config.ts ./

EXPOSE 3000
# Preview server serves the built bundle on :3000 for all interfaces.
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "3000"]
