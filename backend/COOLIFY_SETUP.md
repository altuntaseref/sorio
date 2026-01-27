# Coolify Setup - Her İki Durum İçin

## Durum 1: Dockerfile Kullanıyorsanız (Önerilen)

Eğer Coolify'da "Build Pack" olarak "Dockerfile" seçiliyse veya otomatik algılandıysa:

### Build Ayarları:
- **Base Directory**: `backend`
- **Build Command**: (BOŞ BIRAKIN - Dockerfile build yapıyor)
- **Install Command**: (BOŞ BIRAKIN - Dockerfile npm ci yapıyor)
- **Start Command**: `node dist/main.js` (veya BOŞ BIRAKIN)
- **Publish Directory**: (BOŞ BIRAKIN)

### Environment Variables:
```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key
PORT=3000
RUN_MIGRATIONS=true
NODE_ENV=production
```

---

## Durum 2: Nixpacks Kullanıyorsanız

Eğer Coolify'da "Build Pack" olarak "Nixpacks" seçiliyse:

### Build Ayarları:
- **Base Directory**: `backend`
- **Build Command**: `npm run build`
- **Install Command**: (BOŞ BIRAKIN - Nixpacks otomatik yapar)
- **Start Command**: `node dist/main.js`
- **Publish Directory**: `dist` (veya BOŞ BIRAKIN)

### Environment Variables:
```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key
PORT=3000
RUN_MIGRATIONS=true
NODE_ENV=production
```

---

## Hangi Durumda Olduğunuzu Nasıl Anlarsınız?

1. **Coolify Dashboard'a gidin**
2. **Application Settings** → **Build** sekmesine bakın
3. Eğer "Dockerfile detected" veya "Using Dockerfile" yazıyorsa → **Durum 1**
4. Eğer "Nixpacks" veya "Auto-detected" yazıyorsa → **Durum 2**

### Veya Build Logs'a Bakın:
- Build loglarında `FROM node:20-alpine` görüyorsanız → **Dockerfile kullanılıyor**
- Build loglarında `nixpacks` veya `detected framework` görüyorsanız → **Nixpacks kullanılıyor**

---

## Öneri

**Dockerfile kullanmanızı öneriyoruz** çünkü:
- ✅ Daha kontrollü build süreci
- ✅ Multi-stage build ile optimize edilmiş image
- ✅ Migration'lar otomatik çalışıyor
- ✅ Production dependencies ayrı yükleniyor

Eğer şu anda Nixpacks kullanıyorsanız, Coolify'da "Build Pack" seçeneğini "Dockerfile" olarak değiştirebilirsiniz.

---

## Hata Alırsanız

Eğer `/bin/bash: -c: option requires an argument` hatası alırsanız:

1. **Start Command** alanını kontrol edin
2. Eğer doluysa, şu şekilde yazın: `node dist/main.js`
3. Veya tamamen boş bırakın (Dockerfile'daki CMD kullanılır)
