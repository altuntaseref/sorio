# Production stage
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Template dosyaları artık dist içinde olacak
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/typeorm.config.ts ./
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3000

ENV RUN_MIGRATIONS=true
ENV NODE_ENV=production

CMD node dist/src/main.js