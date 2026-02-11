# --- Build Stage ---
    FROM node:20-slim AS builder

    WORKDIR /app
    
    # Puppeteer'ın gereksiz indirmesini engelle
    ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
    
    COPY package*.json ./
    COPY tsconfig*.json ./
    COPY nest-cli.json ./
    
    # Bağımlılıkları yükle
    RUN npm ci
    
    # Kaynak kodu kopyala ve derle
    COPY . .
    RUN npm run build
    
    # --- Production Stage ---
    FROM node:20-slim AS production
    
    WORKDIR /app
    
    # 1. KRİTİK ADIM: Puppeteer için gerekli sistem kütüphanelerini ve Chromium'u yükle
    # apt-get kullanarak Chromium'u kuruyoruz (Senin istediğin yöntem)
    RUN apt-get update && apt-get install -y \
        chromium \
        libnss3 \
        libatk-bridge2.0-0 \
        libcups2 \
        libxkbcommon-x11-0 \
        libxcomposite1 \
        libxdamage1 \
        libxrandr2 \
        libgbm1 \
        libasound2 \
        fonts-liberation \
        ca-certificates \
        --no-install-recommends \
        && rm -rf /var/lib/apt/lists/*
    
    # 2. Chromium yolunu sisteme tanıt
    # Debian'da apt-get ile kurulan chromium genellikle bu yoldadır:
    ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
        PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
    
    COPY package*.json ./
    RUN npm ci --only=production
    
    # Derlenmiş dosyaları kopyala
    COPY --from=builder /app/dist ./dist
    # (Varsa legal templates vb. buraya ekle)
    # COPY --from=builder /app/src/legal/templates ./dist/src/legal/templates
    
    EXPOSE 3000
    ENV NODE_ENV=production
    
    CMD ["node", "dist/src/main.js"]