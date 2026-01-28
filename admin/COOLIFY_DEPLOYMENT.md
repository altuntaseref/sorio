# Admin Panel Deployment Guide (Coolify)

Bu doküman, Sorio Admin Panel'ini Coolify üzerinden deploy etmek için gerekli adımları açıklar.

## Ön Gereksinimler

1. Backend API'nin çalışıyor olması
2. Backend API URL'i

## Environment Variables

Coolify'da aşağıdaki environment variable'ları ayarlayın:

### Zorunlu
- `NEXT_PUBLIC_API_URL` - Backend API URL'i (örn: `https://api.sorio.com/api` veya `http://backend:3000/api`)
  - **ÖNEMLİ**: Eğer backend ve admin panel aynı Coolify sunucusunda farklı servisler olarak çalışıyorsa, internal network kullanabilirsiniz
  - Public URL için: `https://api.sorio.com/api`
  - Internal network için: `http://backend-service-name:3000/api` (Coolify service name)

### Opsiyonel
- `PORT` - Admin panel portu (varsayılan: 3001)
- `NODE_ENV=production` - Production modu

## Deployment Adımları

### 1. Repository'yi Coolify'a Bağla

1. Coolify dashboard'a git
2. Yeni bir application oluştur (veya mevcut projeye ekle)
3. Git repository'yi bağla
4. Build pack olarak "Dockerfile" seç

### 2. Dockerfile Yapılandırması

Admin klasöründe `Dockerfile` mevcut. Coolify otomatik olarak bunu kullanacak.

### 3. Build Settings

- **Build Pack**: Dockerfile
- **Base Directory**: `admin`
- **Build Command**: (BOŞ BIRAKIN - Dockerfile build yapıyor)
- **Install Command**: (BOŞ BIRAKIN - Dockerfile npm ci yapıyor)
- **Start Command**: (BOŞ BIRAKIN - Dockerfile CMD kullanılır)
- **Publish Directory**: (BOŞ BIRAKIN)

### 4. Port Ayarları

- **Port**: 3001 (veya istediğiniz port)
- Coolify otomatik olarak port mapping yapacak

### 5. Environment Variables Örneği

```env
NEXT_PUBLIC_API_URL=https://api.sorio.com/api
PORT=3001
NODE_ENV=production
```

**Internal Network Kullanımı (Aynı Coolify sunucusunda):**

Eğer backend ve admin panel aynı Coolify sunucusunda farklı servisler olarak çalışıyorsa:

```env
NEXT_PUBLIC_API_URL=http://backend-service-name:3000/api
PORT=3001
NODE_ENV=production
```

**Not**: `backend-service-name` yerine Coolify'da backend servisinizin gerçek service name'ini yazın.

## Önemli Notlar

1. **API URL**: `NEXT_PUBLIC_API_URL` mutlaka ayarlanmalı. Bu değer Next.js build zamanında kullanılır.

2. **CORS**: Backend API'nizde CORS ayarlarının admin panel domain'ini içerdiğinden emin olun.

3. **Port**: Admin panel varsayılan olarak 3001 portunda çalışır. Backend 3000'de çalışıyor olmalı.

4. **Build Time vs Runtime**: `NEXT_PUBLIC_*` prefix'li environment variable'lar build zamanında kullanılır. Değişiklik yaptıktan sonra rebuild gerekir.

## Troubleshooting

### Admin Panel API'ye Bağlanamıyor

1. `NEXT_PUBLIC_API_URL` değerini kontrol edin
2. Backend API'nin çalıştığından emin olun
3. Network connectivity'yi kontrol edin (aynı sunucudaysa internal network kullanın)
4. CORS ayarlarını kontrol edin

### Build Hataları

1. Node.js versiyonunu kontrol edin (20.x önerilir)
2. Dependencies'lerin yüklendiğinden emin olun
3. Build logs'u kontrol edin

### Port Çakışması

1. Admin panel için farklı bir port kullanın (örn: 3001)
2. Backend 3000'de çalışmalı
3. Coolify'da port mapping'i kontrol edin

## Post-Deployment Checklist

- [ ] Admin panel erişilebilir
- [ ] Backend API'ye bağlanabiliyor
- [ ] Login sayfası çalışıyor
- [ ] Admin token ile giriş yapılabiliyor
- [ ] Tüm sayfalar (Dashboard, Users, Pricing, Templates, Avatars) çalışıyor
- [ ] Environment variable'lar doğru ayarlanmış

## Domain ve Reverse Proxy

Coolify genellikle otomatik olarak domain ve reverse proxy ayarlarını yapar. Eğer manuel yapıyorsanız:

- Admin panel için: `admin.sorio.com`
- Backend API için: `api.sorio.com`

Her ikisi de aynı domain altında farklı path'lerde de çalışabilir:
- `https://sorio.com/admin` (admin panel)
- `https://sorio.com/api` (backend API)
