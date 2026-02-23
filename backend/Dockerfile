FROM node:20-alpine AS base
WORKDIR /app

# Backend build
FROM base AS backend-deps
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

FROM base AS backend
COPY --from=backend-deps /app/node_modules ./node_modules
COPY backend/ ./
EXPOSE 3001
CMD ["npx", "ts-node", "src/app.ts"]

