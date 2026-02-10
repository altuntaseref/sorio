# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies
RUN npm ci

# Copy source code (includes src/legal/templates)
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/typeorm.config.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/templates ./templates

EXPOSE 3000

# Set environment variable to run migrations on startup
ENV RUN_MIGRATIONS=true
ENV NODE_ENV=production

# Start the application (migrations will run automatically in main.ts)
# Coolify will use this as default, but you can override in Coolify settings
CMD node dist/src/main.js
