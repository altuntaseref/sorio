# Production'da Seed Çalıştırma

Sunucuda (`/app` klasörü içinde) seed script'ini çalıştırmak için aşağıdaki adımları izleyin.

## Önkoşullar

1. Dockerfile güncellenmiş olmalı (`.data` klasörü kopyalanmış olmalı)
2. Container içinde `/app` klasöründe olmalısınız
3. `DATABASE_URL` environment variable'ı set edilmiş olmalı

## Seed Çalıştırma

### Yöntem 1: Container içinde direkt çalıştırma (Önerilen)

```bash
# Container'a bağlan
docker exec -it <container_name> sh

# /app klasörüne git
cd /app

# Production seed script'ini çalıştır
npm run seed:prod
```

### Yöntem 2: Docker exec ile tek komut

```bash
docker exec -it <container_name> npm run seed:prod
```

### Yöntem 3: Coolify veya benzeri platformlarda

1. Container'ın "Execute Command" veya "Shell" özelliğini kullanın
2. Şu komutu çalıştırın:
   ```bash
   npm run seed:prod
   ```

## Ne Yapıyor?

Seed script'i şunları yapar:
- `.data/dersler.json` dosyasından sınav verilerini okur
- `exams` tablosuna sınavları ekler/günceller
- `exam_sections` tablosuna bölümleri ekler/günceller
- `subjects` tablosuna system subjects ekler/günceller (`isSystem: true`)
- `motivation_quotes` tablosuna motivasyon sözlerini ekler

## Kontrol

Seed işlemi başarılı olduysa, şu komutla kontrol edebilirsiniz:

```bash
# API'den subjects kontrolü
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/subjects?examCode=AYT_SAY
```

Veya veritabanında direkt kontrol:

```sql
SELECT * FROM subjects WHERE "exam_code" = 'AYT_SAY' AND "is_system" = true;
```

## Sorun Giderme

### Hata: "Cannot find module"
- Build edilmiş dosyaların olduğundan emin olun: `ls -la /app/dist/src/database/`
- `.data` klasörünün kopyalandığını kontrol edin: `ls -la /app/.data/`

### Hata: "DATABASE_URL is not defined"
- Environment variable'ları kontrol edin
- Container'ın environment variable'larına erişimi olduğundan emin olun

### Hata: "Cannot find .data/dersler.json"
- Dockerfile'da `.data` klasörünün kopyalandığını kontrol edin
- Dosya yolunu kontrol edin: `cat /app/.data/dersler.json`
