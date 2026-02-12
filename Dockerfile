# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY backend/package*.json ./
COPY backend/tsconfig*.json ./
COPY backend/nest-cli.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY backend/src ./src
COPY backend/typeorm.config.ts ./
COPY backend/tsconfig.json ./

# Build the application
RUN echo "Starting build process..." && \
    npm run build && \
    echo "Build completed. Checking output..." && \
    echo "--- Contents of /app/dist ---" && \
    ls -la /app/dist/ && \
    echo "--- Looking for main.js ---" && \
    find /app/dist -name "main.js" && \
    echo "--- Verifying build structure ---" && \
    (test -f /app/dist/src/main.js && echo "✅ dist/src/main.js exists" || (echo "❌ dist/src/main.js not found" && exit 1)) && \
    (test -f /app/dist/src/app.module.js && echo "✅ dist/src/app.module.js exists" || echo "⚠️  dist/src/app.module.js not found")

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder
RUN echo "Copying files from builder stage..." && \
    ls -la /app/ || echo "App directory exists"
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/typeorm.config.ts ./
COPY --from=builder /app/tsconfig.json ./
# Copy .data folder for seed script
COPY .data ./.data

# Verify copied files
RUN echo "Verifying copied files in production stage..." && \
    ls -la /app/ && \
    ls -la /app/dist/ && \
    (test -f /app/dist/src/main.js && echo "✅ dist/src/main.js exists" || (echo "❌ dist/src/main.js not found" && exit 1)) && \
    (test -f /app/dist/src/app.module.js && echo "✅ dist/src/app.module.js exists" || echo "⚠️  dist/src/app.module.js not found") && \
    echo "✅ Production stage verification successful - dist/src/main.js exists"

EXPOSE 3000

ENV RUN_MIGRATIONS=true \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

# Install Chromium and dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Start the application (migrations will run automatically in main.ts)
# Note: NestJS builds to dist/src/, so we use dist/src/main.js
CMD node dist/src/main.js
