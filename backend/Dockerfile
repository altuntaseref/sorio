# --- Build Stage ---
    FROM node:20-alpine AS builder

    WORKDIR /app
    
    # Paket dosyalarını kopyala
    COPY package*.json ./
    COPY tsconfig*.json ./
    COPY nest-cli.json ./
    
    # Puppeteer'ın kendi Chrome'unu indirmesini engelle
    ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
    
    # Bağımlılıkları yükle
    RUN npm ci
    
    # Kaynak kodları kopyala ve build al
    COPY . .
    RUN npm run build
    
    # --- Production Stage ---
    FROM node:20-alpine AS production
    
    WORKDIR /app
    
    # Alpine için Chromium ve gerekli kütüphaneleri yükle
    # Alpine'da chromium'un çalışması için bu paketler şarttır
    RUN echo "http://dl-cdn.alpinelinux.org/alpine/v3.19/main" > /etc/apk/repositories && \
        echo "http://dl-cdn.alpinelinux.org/alpine/v3.19/community" >> /etc/apk/repositories && \
        apk update && \
        apk add --no-cache \
        chromium \
        nss \
        freetype \
        harfbuzz \
        ca-certificates \
        ttf-freefont \
        libstdc++ \
        udev
    
    # Puppeteer Ayarları (Alpine'da path: /usr/bin/chromium-browser)
    ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
        PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
    
    # Sadece production paketlerini yükle
    COPY package*.json ./
    RUN npm ci --only=production
    
    # Build aşamasından dosyaları al
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/src/legal/templates ./dist/src/legal/templates 
    # (Eğer typeorm config vb. gerekiyorsa onları da ekle)
    
    EXPOSE 3000
    
    ENV NODE_ENV=production
    
    CMD ["node", "dist/src/main.js"]