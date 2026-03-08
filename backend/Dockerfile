# Stage 1: Install ALL deps and compile TypeScript
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci
COPY src/ ./src/
RUN npx tsc

# Stage 2: Production image with only compiled JS + prod deps
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3001
CMD ["node", "dist/app.js"]

