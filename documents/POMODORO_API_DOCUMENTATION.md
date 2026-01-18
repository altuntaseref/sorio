# Pomodoro API - Request & Response Örnekleri

## 1. Preset Yönetimi

### GET /api/pomodoro/presets
Kullanıcının kayıtlı preset'lerini getirir.

**Request:**
```
GET /api/pomodoro/presets
Headers:
  Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "presets": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "userId": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Matematik Kampı",
        "workDuration": 25,
        "breakDuration": 5,
        "longBreakDuration": 15,
        "setsUntilLongBreak": 4,
        "backgroundImageId": "660e8400-e29b-41d4-a716-446655440001",
        "soundId": "770e8400-e29b-41d4-a716-446655440002",
        "isDefault": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "userId": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Deep Work",
        "workDuration": 50,
        "breakDuration": 10,
        "longBreakDuration": 20,
        "setsUntilLongBreak": 4,
        "backgroundImageId": null,
        "soundId": null,
        "isDefault": false,
        "createdAt": "2024-01-14T08:20:00.000Z",
        "updatedAt": "2024-01-14T08:20:00.000Z"
      }
    ]
  }
}
```

---

### POST /api/pomodoro/presets
Yeni bir preset oluşturur.

**Request:**
```
POST /api/pomodoro/presets
Headers:
  Authorization: Bearer {jwt_token}
  Content-Type: application/json

Body:
{
  "name": "Gece Modu",
  "workDuration": 30,
  "breakDuration": 5,
  "longBreakDuration": 15,
  "setsUntilLongBreak": 4,
  "backgroundImageId": "660e8400-e29b-41d4-a716-446655440001",
  "soundId": "770e8400-e29b-41d4-a716-446655440002",
  "isDefault": false
}
```

**Request Örnekleri:**

**Minimal (sadece name):**
```json
{
  "name": "Standart Pomodoro"
}
```

**Tam Örnek:**
```json
{
  "name": "Matematik Kampı",
  "workDuration": 25,
  "breakDuration": 5,
  "longBreakDuration": 15,
  "setsUntilLongBreak": 4,
  "backgroundImageId": "660e8400-e29b-41d4-a716-446655440001",
  "soundId": "770e8400-e29b-41d4-a716-446655440002",
  "isDefault": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Pomodoro preset created successfully",
  "data": {
    "preset": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Gece Modu",
      "workDuration": 30,
      "breakDuration": 5,
      "longBreakDuration": 15,
      "setsUntilLongBreak": 4,
      "backgroundImageId": "660e8400-e29b-41d4-a716-446655440001",
      "soundId": "770e8400-e29b-41d4-a716-446655440002",
      "isDefault": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Background image asset must be of type IMAGE",
  "error": {
    "code": "BAD_REQUEST",
    "details": null
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Background image asset not found",
  "error": {
    "code": "NOT_FOUND",
    "details": null
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 2. Asset Yönetimi

### GET /api/pomodoro/assets
Asset'leri listeler (sistem default + kullanıcı asset'leri).

**Request:**
```
GET /api/pomodoro/assets?type=IMAGE
Headers:
  Authorization: Bearer {jwt_token}
```

**Query Parameters:**
- `type` (optional): `IMAGE` veya `SOUND` - Filtreleme için

**Request Örnekleri:**

**Tüm asset'leri getir:**
```
GET /api/pomodoro/assets
```

**Sadece görselleri getir:**
```
GET /api/pomodoro/assets?type=IMAGE
```

**Sadece sesleri getir:**
```
GET /api/pomodoro/assets?type=SOUND
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "assets": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "type": "IMAGE",
        "url": "https://img.bddtechnology.com/pomodoro-assets/system/rainy-night.jpg",
        "name": "Yağmurlu Gece",
        "isSystemDefault": true,
        "createdAt": "2024-01-10T08:00:00.000Z"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440002",
        "type": "IMAGE",
        "url": "https://img.bddtechnology.com/pomodoro-assets/user-123/1705312345678-my-photo.jpg",
        "name": "Benim Fotoğrafım",
        "isSystemDefault": false,
        "createdAt": "2024-01-15T10:20:00.000Z"
      },
      {
        "id": "770e8400-e29b-41d4-a716-446655440001",
        "type": "SOUND",
        "url": "https://img.bddtechnology.com/pomodoro-assets/system/rain-sound.mp3",
        "name": "Yağmur Sesi",
        "isSystemDefault": true,
        "createdAt": "2024-01-10T08:00:00.000Z"
      }
    ]
  }
}
```

---

### POST /api/pomodoro/assets
Yeni asset oluşturur (dosya R2'ye yüklendikten sonra).

**Request:**
```
POST /api/pomodoro/assets
Headers:
  Authorization: Bearer {jwt_token}
  Content-Type: application/json

Body:
{
  "name": "Benim Özel Görselim",
  "url": "https://img.bddtechnology.com/pomodoro-assets/user-123/1705312345678-my-photo.jpg",
  "r2Key": "pomodoro-assets/user-123/1705312345678-my-photo.jpg",
  "type": "IMAGE"
}
```

**Request Örnekleri:**

**Görsel Asset:**
```json
{
  "name": "Benim Özel Görselim",
  "url": "https://img.bddtechnology.com/pomodoro-assets/user-123/1705312345678-my-photo.jpg",
  "r2Key": "pomodoro-assets/user-123/1705312345678-my-photo.jpg",
  "type": "IMAGE"
}
```

**Ses Asset:**
```json
{
  "name": "Rahatlatıcı Müzik",
  "url": "https://img.bddtechnology.com/pomodoro-assets/user-123/1705312345678-relaxing-music.mp3",
  "r2Key": "pomodoro-assets/user-123/1705312345678-relaxing-music.mp3",
  "type": "SOUND"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Asset created successfully",
  "data": {
    "asset": {
      "id": "660e8400-e29b-41d4-a716-446655440002",
      "type": "IMAGE",
      "url": "https://img.bddtechnology.com/pomodoro-assets/user-123/1705312345678-my-photo.jpg",
      "isSystemDefault": false,
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Benim Özel Görselim",
      "r2Key": "pomodoro-assets/user-123/1705312345678-my-photo.jpg",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "type must be one of the following values: IMAGE, SOUND",
  "error": {
    "code": "BAD_REQUEST",
    "details": {
      "property": "type",
      "constraints": {
        "isIn": "type must be one of the following values: IMAGE, SOUND"
      }
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### DELETE /api/pomodoro/assets/:id
Asset siler (sadece kullanıcı kendi asset'ini silebilir).

**Request:**
```
DELETE /api/pomodoro/assets/660e8400-e29b-41d4-a716-446655440002
Headers:
  Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Asset deleted successfully"
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "Cannot delete system default assets",
  "error": {
    "code": "FORBIDDEN",
    "details": null
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Asset not found",
  "error": {
    "code": "NOT_FOUND",
    "details": null
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 3. Study Session Loglama

### POST /api/pomodoro/log
Bir study session'ı loglar.

**Request:**
```
POST /api/pomodoro/log
Headers:
  Authorization: Bearer {jwt_token}
  Content-Type: application/json

Body:
{
  "duration": 25,
  "subjectId": "880e8400-e29b-41d4-a716-446655440001",
  "startedAt": "2024-01-15T10:00:00.000Z",
  "endedAt": "2024-01-15T10:25:00.000Z",
  "status": "COMPLETED"
}
```

**Request Örnekleri:**

**Tamamlanmış Session:**
```json
{
  "duration": 25,
  "subjectId": "880e8400-e29b-41d4-a716-446655440001",
  "startedAt": "2024-01-15T10:00:00.000Z",
  "endedAt": "2024-01-15T10:25:00.000Z",
  "status": "COMPLETED"
}
```

**Yarıda Kesilmiş Session:**
```json
{
  "duration": 15,
  "subjectId": "880e8400-e29b-41d4-a716-446655440001",
  "startedAt": "2024-01-15T10:00:00.000Z",
  "endedAt": "2024-01-15T10:15:00.000Z",
  "status": "ABORTED"
}
```

**Subject Olmadan:**
```json
{
  "duration": 25,
  "startedAt": "2024-01-15T10:00:00.000Z",
  "endedAt": "2024-01-15T10:25:00.000Z",
  "status": "COMPLETED"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Study session logged successfully",
  "data": {
    "session": {
      "id": "990e8400-e29b-41d4-a716-446655440001",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "subjectId": "880e8400-e29b-41d4-a716-446655440001",
      "duration": 25,
      "startedAt": "2024-01-15T10:00:00.000Z",
      "endedAt": "2024-01-15T10:25:00.000Z",
      "status": "COMPLETED",
      "createdAt": "2024-01-15T10:25:00.000Z"
    }
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Duration does not match the time difference between startedAt and endedAt",
  "error": {
    "code": "BAD_REQUEST",
    "details": null
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "You do not have access to this subject",
  "error": {
    "code": "FORBIDDEN",
    "details": null
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 4. Asset Yükleme (Presigned URL)

### GET /api/upload/presigned-url
Asset yükleme için presigned URL alır.

**Request:**
```
GET /api/upload/presigned-url?fileName=my-photo.jpg&fileType=pomodoro-asset&contentType=image/jpeg
Headers:
  Authorization: Bearer {jwt_token}
```

**Query Parameters:**
- `fileName` (required): Dosya adı (örn: "my-photo.jpg")
- `fileType` (required): `pomodoro-asset`
- `contentType` (optional): MIME type (örn: "image/jpeg")

**Request Örnekleri:**

**Görsel Yükleme:**
```
GET /api/upload/presigned-url?fileName=my-background.jpg&fileType=pomodoro-asset&contentType=image/jpeg
```

**Ses Yükleme:**
```
GET /api/upload/presigned-url?fileName=relaxing-sound.mp3&fileType=pomodoro-asset&contentType=audio/mpeg
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://r2-storage.com/presigned-upload-url?signature=...",
    "publicUrl": "https://img.bddtechnology.com/pomodoro-assets/user-123/1705312345678-my-photo.jpg",
    "key": "pomodoro-assets/user-123/1705312345678-my-photo.jpg",
    "expiresIn": 900
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid or missing file extension. Only JPG, JPEG, PNG, and WEBP are allowed.",
  "error": {
    "code": "BAD_REQUEST",
    "details": null
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Tam Kullanım Senaryosu

### Senaryo: Kullanıcı Yeni Bir Preset Oluşturuyor

**1. Adım: Asset'leri Listele**
```
GET /api/pomodoro/assets?type=IMAGE
```
Kullanıcı mevcut görselleri görür (sistem + kendi yükledikleri).

**2. Adım (Opsiyonel): Yeni Görsel Yükle**
```
GET /api/upload/presigned-url?fileName=my-custom-bg.jpg&fileType=pomodoro-asset
```
Presigned URL alınır.

**3. Adım: Dosyayı R2'ye Yükle**
```
PUT {uploadUrl}
Body: [binary file data]
Headers:
  Content-Type: image/jpeg
```
Dosya direkt R2'ye yüklenir.

**4. Adım: Asset'i Kaydet**
```
POST /api/pomodoro/assets
Body:
{
  "name": "Benim Özel Arka Planım",
  "url": "https://img.bddtechnology.com/pomodoro-assets/user-123/1705312345678-my-custom-bg.jpg",
  "r2Key": "pomodoro-assets/user-123/1705312345678-my-custom-bg.jpg",
  "type": "IMAGE"
}
```
Asset veritabanına kaydedilir.

**5. Adım: Preset Oluştur**
```
POST /api/pomodoro/presets
Body:
{
  "name": "Özel Çalışma Modu",
  "workDuration": 30,
  "breakDuration": 5,
  "longBreakDuration": 15,
  "setsUntilLongBreak": 4,
  "backgroundImageId": "660e8400-e29b-41d4-a716-446655440002",
  "soundId": "770e8400-e29b-41d4-a716-446655440001",
  "isDefault": true
}
```
Preset oluşturulur ve asset ID'leri ile ilişkilendirilir.

---

## Standart Pomodoro Algoritmaları

### Standart (Klasik) - Varsayılan
```json
{
  "name": "Standart Pomodoro",
  "workDuration": 25,
  "breakDuration": 5,
  "longBreakDuration": 15,
  "setsUntilLongBreak": 4
}
```
**Kim için?** Dikkati çabuk dağılanlar veya zor konu çalışanlar.

### Deep Work (Derin Odak)
```json
{
  "name": "Deep Work",
  "workDuration": 50,
  "breakDuration": 10,
  "longBreakDuration": 20,
  "setsUntilLongBreak": 4
}
```
**Kim için?** Deneme çözenler veya üniversiteliler.

---

## Validasyon Kuralları

### CreatePomodoroPresetDto
- `name`: 1-100 karakter, zorunlu
- `workDuration`: 1-120 dakika, opsiyonel (default: 25)
- `breakDuration`: 1-60 dakika, opsiyonel (default: 5)
- `longBreakDuration`: 1-120 dakika, opsiyonel (default: 15)
- `setsUntilLongBreak`: 1-20, opsiyonel (default: 4)
- `backgroundImageId`: UUID formatında, opsiyonel
- `soundId`: UUID formatında, opsiyonel
- `isDefault`: boolean, opsiyonel (default: false)

### CreateAssetDto
- `name`: 1-200 karakter, zorunlu
- `url`: string, zorunlu (R2 public URL)
- `r2Key`: string, opsiyonel (silme için)
- `type`: `IMAGE` veya `SOUND`, zorunlu

### LogStudySessionDto
- `duration`: 1-480 dakika, zorunlu
- `subjectId`: UUID, opsiyonel
- `startedAt`: ISO 8601 tarih formatı, zorunlu
- `endedAt`: ISO 8601 tarih formatı, zorunlu
- `status`: `COMPLETED` veya `ABORTED`, opsiyonel (default: COMPLETED)

---

## Notlar

1. **Asset Yükleme**: Dosyalar önce presigned URL ile R2'ye yüklenir, sonra asset kaydı oluşturulur.
2. **Preset Oluşturma**: Asset ID'leri geçerli olmalı ve kullanıcının erişim yetkisi olmalıdır.
3. **Asset Silme**: Asset silindiğinde, bu asset'i kullanan preset'lerdeki referanslar otomatik olarak NULL yapılır.
4. **Sistem Asset'leri**: Sistem default asset'ler silinemez ve tüm kullanıcılar tarafından kullanılabilir.
5. **Study Session**: Duration, startedAt ve endedAt arasındaki farkla uyumlu olmalıdır (%10 tolerans).


