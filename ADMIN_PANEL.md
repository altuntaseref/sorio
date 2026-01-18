# Admin Panel (Next.js)

Bu admin panel, `admin/` klasöründeki Next.js uygulamasıdır.

## Kurulum

```bash
cd admin
npm install
```

## Çalıştırma

Backend ayağa kalktıktan sonra:

```bash
cd admin
set NEXT_PUBLIC_API_URL=http://localhost:3000/api
npm run dev
```

## Giriş
- Admin panel, `x-admin-token` header ile korunur.
- Giriş ekranına `ADMIN_API_TOKEN` değerini yazın.

## Backend ayarı
`backend` ortamında `.env` içine ekleyin:

```
ADMIN_API_TOKEN=YOUR_SECURE_TOKEN
```

## Sayfalar
- `/login` → token girişi
- `/dashboard` → özet istatistik
- `/pricing` → plan/feature/limit yönetimi
- `/users` → kullanıcı listesi
- `/users/:id` → kullanıcı detay + plan atama + usage
