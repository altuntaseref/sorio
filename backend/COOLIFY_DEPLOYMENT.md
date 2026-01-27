# Coolify Deployment Guide

Bu doküman, Sorio backend uygulamasını Coolify üzerinden deploy etmek için gerekli adımları açıklar.

## Ön Gereksinimler

1. Coolify kurulumu ve yapılandırması
2. PostgreSQL veritabanı (Coolify'da veya harici)
3. R2/Cloudflare Storage erişimi (opsiyonel, upload için)

## Environment Variables

Coolify'da aşağıdaki environment variable'ları ayarlayın:

### Zorunlu
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT token için secret key
- `PORT` - Uygulama portu (genellikle 3000)

### Opsiyonel
- `RUN_MIGRATIONS=true` - Uygulama başlarken migration'ları otomatik çalıştır (production için önerilir)
- `NODE_ENV=production` - Production modu
- `R2_ACCOUNT_ID` - Cloudflare R2 Account ID (upload için)
- `R2_ACCESS_KEY_ID` - Cloudflare R2 Access Key
- `R2_SECRET_ACCESS_KEY` - Cloudflare R2 Secret Key
- `R2_BUCKET_NAME` - Cloudflare R2 Bucket adı
- `R2_PUBLIC_URL` - Cloudflare R2 Public URL
- `ADMIN_TOKEN` - Admin panel için token
- `RESEND_API_KEY` - Email gönderimi için (opsiyonel)

## Deployment Adımları

### 1. Repository'yi Coolify'a Bağla

1. Coolify dashboard'a git
2. Yeni bir application oluştur
3. Git repository'yi bağla
4. Build pack olarak "Dockerfile" seç

### 2. Dockerfile Yapılandırması

Backend klasöründe `Dockerfile` mevcut. Coolify otomatik olarak bunu kullanacak.

### 3. Build Settings

- **Build Command**: `npm run build` (Dockerfile içinde zaten var)
- **Start Command**: `npm run start:prod` (Dockerfile içinde zaten var)
- **Working Directory**: `backend`

### 4. Migration'ları Çalıştır

İki seçenek var:

**Seçenek 1: Otomatik (Önerilen)**
- `RUN_MIGRATIONS=true` environment variable'ını ekle
- Uygulama her başladığında migration'lar otomatik çalışacak

**Seçenek 2: Manuel**
- Coolify'ın "Execute Command" özelliğini kullan
- Container içinde: `npm run migration:run`

### 5. İlk Deployment Sonrası

1. Migration'ların çalıştığını kontrol et (logs'da göreceksiniz)
2. Health check endpoint'ini test et: `GET /api/health` (eğer varsa)
3. Admin panel'e giriş yap ve avatar'ları ekle

## Önemli Notlar

1. **Migration'lar**: İlk deployment'ta mutlaka migration'ları çalıştırın. `RUN_MIGRATIONS=true` ile otomatik çalışır.

2. **Database Connection**: `DATABASE_URL` formatı:
   ```
   postgresql://user:password@host:port/database
   ```

3. **Port**: Coolify genellikle otomatik port atar, `PORT` environment variable'ını kontrol edin.

4. **Logs**: Coolify dashboard'dan container logs'larını izleyebilirsiniz.

5. **Health Checks**: Uygulama başladıktan sonra endpoint'leri test edin.

## Troubleshooting

### Migration Hataları
- Logs'da migration hatalarını kontrol edin
- Manuel olarak migration çalıştırmayı deneyin: `npm run migration:run`

### Database Connection Hataları
- `DATABASE_URL` formatını kontrol edin
- Database'in erişilebilir olduğundan emin olun
- Firewall ayarlarını kontrol edin

### Build Hataları
- Node.js versiyonunu kontrol edin (20.x önerilir)
- Dependencies'lerin yüklendiğinden emin olun

## Post-Deployment Checklist

- [ ] Migration'lar başarıyla çalıştı
- [ ] Database bağlantısı başarılı
- [ ] API endpoint'leri çalışıyor
- [ ] Admin panel erişilebilir
- [ ] Avatar sistemi çalışıyor
- [ ] Environment variable'lar doğru ayarlanmış
