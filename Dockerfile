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
    ls -la /app/ && \
    ls -la /app/dist/ && \
    ls -la /app/dist/main.js && \
    echo "✅ Build verification successful - dist/main.js exists"

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

# Verify copied files
RUN echo "Verifying copied files in production stage..." && \
    ls -la /app/ && \
    ls -la /app/dist/ && \
    ls -la /app/dist/main.js && \
    echo "✅ Production stage verification successful - dist/main.js exists"

EXPOSE 3000

# Set environment variable to run migrations on startup
ENV RUN_MIGRATIONS=true
ENV NODE_ENV=production

# Start the application (migrations will run automatically in main.ts)
CMD node dist/main.js
