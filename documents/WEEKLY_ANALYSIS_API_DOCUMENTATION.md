# Haftalık Detaylı Analiz API Dokümantasyonu

## Genel Bakış

Bu API, premium kullanıcılar için haftalık detaylı performans analizi sağlar. Analiz, önceki hafta ile karşılaştırma yaparak kullanıcının çalışma performansını değerlendirir.

**ÖNEMLİ:** Bir kullanıcı haftada sadece **1 kez** analiz oluşturabilir. Bu, maliyet kontrolü için kritik bir kısıtlamadır.

**YENİ ÖZELLİK:** Analizler artık **kategorize edilmiş** format ile döndürülüyor. Mobil uygulama istediği kategoriyi tek tek kullanabilir veya tüm analizi alabilir.

---

## Plan Bazlı Analiz Yapısı

### Free Tier
- **Analiz yapılmaz**
- Bu endpoint'lere erişemez

### Pro Tier
- **Sadece GENEL analiz** yapılır
- `general` kategorisi dolu
- `questions`, `time`, `mockExams` kategorileri boş string

### Premium Tier
- **Tüm analizler** yapılır
- `general`, `questions`, `time`, `mockExams` kategorileri dolu

---

## Limitler

### Haftalık Limit
- Bir kullanıcı **haftada sadece 1 kez** analiz oluşturabilir
- Aynı hafta için ikinci istekte mevcut analiz döndürülür

### Aylık Limit
- Bir kullanıcı **ayda maksimum 4 analiz** oluşturabilir
- 4 analiz limitine ulaşıldığında, en son analiz döndürülür
- Limit her ayın başında sıfırlanır

---

## Response Yapısı

Analizler **4 ana kategori** formatında döndürülüyor (analiz sayfasındaki 4 sekmeye uygun):

```json
{
  "general": "GENEL analizi - Derin ve kapsamlı (500-700 kelime)",
  "questions": "SORULAR analizi - Bir paragraf (200-300 kelime)",
  "time": "ZAMAN analizi - Bir paragraf (200-300 kelime)",
  "mockExams": "DENEMELER analizi - Bir paragraf (200-300 kelime)"
}
```

**Özellikler:**
- **Kişiselleştirilmiş:** Kullanıcıya ismiyle hitap edilir (örn: "Ahmet, Matematik'te...")
- **Renkli Vurgular:** Önemli sayılar, ders adları, konu adları, zaman aralıkları mobil uygulama tarafından renklendirilebilir
- **Teşvik Edici:** Veri yoksa veya azsa, kullanıcıyı uygulamayı kullanmaya teşvik eder
- **Somut Hedefler:** Gerçekçi sayılar ve hedefler içerir (örn: "90 net hedefine yaklaşık 8 hafta içinde ulaşabilirsin")

---

## Endpoint'ler

### 1. Haftalık Analiz Oluştur (veya Mevcut Olanı Getir)

**Endpoint:** `POST /api/analytics/detailed-analysis`

**Authentication:** JWT Token gerekli

**Request:**
```http
POST /api/analytics/detailed-analysis
Authorization: Bearer {jwt_token}
```

**Response (Yeni Analiz Oluşturuldu - Premium Kullanıcı):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "weekStart": "2024-01-08",
    "weekEnd": "2024-01-14",
    "general": "Ahmet, bu hafta toplam 12 saat çalışma yapmışsın ve 156 soru çözmüşsün. Genel başarı oranın %72 ve önceki haftaya göre %15 artış göstermişsin. Matematik dersinde çok iyi performans gösteriyorsun, özellikle cebir konularında başarı oranın %85. Fizik dersinde biraz daha çalışma gerekiyor, mekanik konularında zorlanıyorsun. Çalışma alışkanlıkların düzenli, en aktif günlerin Pazartesi ve Çarşamba. Bu tempoyla devam edersen hedeflerine ulaşabilirsin...",
    "questions": "Soru kütüphaneni inceledim Ahmet. Toplam 156 soru çözmüşsün ve genel başarı oranın %72. Matematik dersinde çok başarılısın, özellikle cebir konularında %85 başarı oranına sahipsin. Ancak Fizik dersinde son 20 sorunun 8'inde benzer işlem hataları yapmışsın, özellikle mekanik konularında. Kimya'da da temel kavramlarda eksiklerin var gibi görünüyor. Dikkatini bu iki derse odaklamalısın.",
    "time": "Bu hafta sabah saatlerinde (08:00 - 11:00) odağın akşamdan %25 daha yüksek. Toplam 12 saat çalışma yapmışsın, bu günlük ortalama 1.7 saat demek. En aktif günlerin Pazartesi ve Çarşamba, bu günlerde 3'er saat çalışmışsın. En verimli olduğun ders ise Matematik. Akşam seanslarını biraz daha kısa tutup mola sayılarını artırmanı öneririm.",
    "mockExams": "Ahmet, Matematik'te 30 net barajını istikrarlı şekilde geçtin! Bu hafta 2 deneme sınavı çözmüşsün ve TYT'de 85 net, AYT'de 72 net yapmışsın. Ancak Fen Bilimleri'ndeki son düşüş genel ortalamanı etkiliyor. Bu tempoyla devam edersen 90 net hedefine yaklaşık 8 hafta içinde ulaşabilirsin.",
    "savedAt": "2024-01-15T10:30:00.000Z",
    "isExisting": false
  }
}
```

**Response (Yeni Analiz Oluşturuldu - Pro Kullanıcı):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "weekStart": "2024-01-08",
    "weekEnd": "2024-01-14",
    "general": "Ahmet, bu hafta toplam 12 saat çalışma yapmışsın ve 156 soru çözmüşsün. Genel başarı oranın %72 ve önceki haftaya göre %15 artış göstermişsin. Matematik dersinde çok iyi performans gösteriyorsun, özellikle cebir konularında başarı oranın %85. Fizik dersinde biraz daha çalışma gerekiyor, mekanik konularında zorlanıyorsun. Çalışma alışkanlıkların düzenli, en aktif günlerin Pazartesi ve Çarşamba. Bu tempoyla devam edersen hedeflerine ulaşabilirsin...",
    "savedAt": "2024-01-15T10:30:00.000Z",
    "isExisting": false
  }
}
```

**Not:** Pro kullanıcılar için sadece `general` kategorisi dolu, diğer kategoriler (`questions`, `time`, `mockExams`) response'da bulunmaz.

**Not:** Analizler kişiselleştirilmiş ve teşvik edicidir. Veri yoksa veya azsa, kullanıcıyı uygulamayı kullanmaya teşvik eder.

**Response (Mevcut Analiz Döndürüldü - Haftada 1 Kez Limit):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "weekStart": "2024-01-08",
    "weekEnd": "2024-01-14",
    "general": "Daha önce oluşturulmuş GENEL analiz...",
    "questions": "Daha önce oluşturulmuş SORULAR analizi...",
    "time": "Daha önce oluşturulmuş ZAMAN analizi...",
    "mockExams": "Daha önce oluşturulmuş DENEMELER analizi...",
    "savedAt": "2024-01-15T09:00:00.000Z",
    "isExisting": true,
    "message": "Analysis for this week already exists. Returning existing analysis."
  }
}
```

**Response (Son 7 Gün İçinde Analiz Var):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "weekStart": "2024-01-01",
    "weekEnd": "2024-01-07",
    "general": "En son oluşturulmuş GENEL analiz...",
    "questions": "En son oluşturulmuş SORULAR analizi...",
    "time": "En son oluşturulmuş ZAMAN analizi...",
    "mockExams": "En son oluşturulmuş DENEMELER analizi...",
    "savedAt": "2024-01-08T09:00:00.000Z",
    "isExisting": true,
    "message": "You have already generated an analysis this week. Returning your latest analysis."
  }
}
```

**Error Response (Free Tier):**
```json
{
  "statusCode": 403,
  "message": "This feature is only available for Pro and Premium users"
}
```

**Error Response (Aylık Limit Doldu):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "weekStart": "2024-01-01",
    "weekEnd": "2024-01-07",
    "general": "En son analiz...",
    "savedAt": "2024-01-08T09:00:00.000Z",
    "isExisting": true,
    "message": "Monthly analysis limit reached (4 analyses per month). Returning your latest analysis."
  }
}
```

---

### 2. Tüm Kaydedilmiş Analizleri Getir

**Endpoint:** `GET /api/analytics/detailed-analysis`

**Authentication:** JWT Token gerekli

**Request:**
```http
GET /api/analytics/detailed-analysis
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "weekStart": "2024-01-08",
      "weekEnd": "2024-01-14",
      "summary": "Özet analiz metni...",
      "categories": {
        "overview": "...",
        "time": "...",
        // ... diğer kategoriler
      },
      "r2Url": null,
      "createdAt": "2024-01-15T09:00:00.000Z"
    },
    {
      "id": "uuid-2",
      "weekStart": "2024-01-01",
      "weekEnd": "2024-01-07",
      "summary": "Önceki hafta özet analizi...",
      "categories": {
        // ... kategoriler
      },
      "r2Url": null,
      "createdAt": "2024-01-08T09:00:00.000Z"
    }
  ]
}
```

**Not:** Analizler en yeni tarihten eskiye doğru sıralanır.

---

### 3. Son Analizi Getir

**Endpoint:** `GET /api/analytics/detailed-analysis/latest`

**Authentication:** JWT Token gerekli

**Request:**
```http
GET /api/analytics/detailed-analysis/latest
Authorization: Bearer {jwt_token}
```

**Response (Analiz Var):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "weekStart": "2024-01-08",
    "weekEnd": "2024-01-14",
    "summary": "En son özet analiz metni...",
    "categories": {
      "overview": "...",
      "time": "...",
      // ... diğer kategoriler
    },
    "r2Url": null,
    "createdAt": "2024-01-15T09:00:00.000Z"
  }
}
```

**Response (Analiz Yok):**
```json
{
  "success": true,
  "data": null,
  "message": "No analysis found. Weekly analysis will be generated automatically."
}
```

---

## 4 Ana Kategori ve İçerikleri

### 1. `general` (GENEL Analizi)
- **Uzunluk:** 500-700 kelime
- **İçerik:** Derin ve kapsamlı analiz. Özet, genel bakış, çalışma süreleri, soru sayıları, başarı oranları, ders bazlı performans, konu bazlı detay, mastery seviyeleri, alışkanlıklar, önceki hafta karşılaştırması, güçlü yönler, gelişim alanları, öneriler. Tüm alanları içeren derin bir analiz.
- **Kullanım:** Analiz sayfasındaki "GENEL" sekmesi
- **Örnek:** "Ahmet, bu hafta toplam 12 saat çalışma yapmışsın ve 156 soru çözmüşsün. Genel başarı oranın %72 ve önceki haftaya göre %15 artış göstermişsin..."

### 2. `questions` (SORULAR Analizi)
- **Uzunluk:** 200-300 kelime (bir paragraf)
- **İçerik:** Soru çözme analizi (toplam soru sayısı, doğru/yanlış oranı, başarı trendi), ders bazlı performans (hangi derslerde iyi, hangilerinde gelişim gerekiyor), konu bazlı detay (en çok çalışılan konular, zorlanılan konular).
- **Kullanım:** Analiz sayfasındaki "SORULAR" sekmesi
- **Örnek:** "Soru kütüphaneni inceledim Ahmet. Toplam 156 soru çözmüşsün ve genel başarı oranın %72. Matematik dersinde çok başarılısın, özellikle cebir konularında %85 başarı oranına sahipsin..."

### 3. `time` (ZAMAN Analizi)
- **Uzunluk:** 200-300 kelime (bir paragraf)
- **İçerik:** Çalışma süreleri (toplam saat, günlük ortalama), haftalık dağılım (hangi günler aktif), en aktif saatler, çalışma trendi (artıyor mu azalıyor mu), tutarlılık analizi.
- **Kullanım:** Analiz sayfasındaki "ZAMAN" sekmesi
- **Örnek:** "Bu hafta sabah saatlerinde (08:00 - 11:00) odağın akşamdan %25 daha yüksek. Toplam 12 saat çalışma yapmışsın, bu günlük ortalama 1.7 saat demek..."

### 4. `mockExams` (DENEMELER Analizi)
- **Uzunluk:** 200-300 kelime (bir paragraf)
- **İçerik:** Deneme sınavı sayısı, net skorları, sınav bazlı performans (TYT, AYT, LGS vb.), trend analizi (gelişim var mı), rekor durumları, ders bazlı deneme performansı.
- **Kullanım:** Analiz sayfasındaki "DENEMELER" sekmesi
- **Örnek:** "Ahmet, Matematik'te 30 net barajını istikrarlı şekilde geçtin! Bu hafta 2 deneme sınavı çözmüşsün ve TYT'de 85 net, AYT'de 72 net yapmışsın..."

**Veri Yoksa veya Azsa:**
- Kullanıcıyı uygulamayı kullanmaya teşvik eder
- Örnek: "Henüz yeterli veri toplayamadık ama bu normal! İlk adımlarını atarak başlaman harika. Daha fazla soru çözdükçe analizlerin daha detaylı olacak."

---

## Mobil Uygulama Senaryoları

### Senaryo 1: Analiz Sayfası - 4 Sekme

```swift
// Analiz sayfasında 4 sekme var: GENEL, SORULAR, ZAMAN, DENEMELER

func showAnalysisPage() {
    // GENEL sekmesi
    displayText(analysis.data.general)
    
    // SORULAR sekmesi
    displayText(analysis.data.questions)
    
    // ZAMAN sekmesi
    displayText(analysis.data.time)
    
    // DENEMELER sekmesi
    displayText(analysis.data.mockExams)
}
```

### Senaryo 2: Sekme Bazlı Gösterim

```swift
func showAnalysisByTab(_ tab: AnalysisTab) {
    switch tab {
    case .general:
        displayText(analysis.data.general)
    case .questions:
        displayText(analysis.data.questions)
    case .time:
        displayText(analysis.data.time)
    case .mockExams:
        displayText(analysis.data.mockExams)
    }
}

enum AnalysisTab {
    case general
    case questions
    case time
    case mockExams
}
```

### Senaryo 3: Renkli Vurgular

```swift
// Analiz metnindeki önemli bilgileri renklendir
func highlightImportantInfo(_ text: String) {
    // Sayıları vurgula (örn: "30 net", "8 hafta")
    let numbers = extractNumbers(text)
    highlight(numbers, color: .cyan)
    
    // Ders adlarını vurgula (örn: "Matematik", "Fizik")
    let subjects = extractSubjects(text)
    highlight(subjects, color: .blue)
    
    // Konu adlarını vurgula (örn: "Trigonometri", "Cebir")
    let topics = extractTopics(text)
    highlight(topics, color: .purple)
    
    // Zaman aralıklarını vurgula (örn: "08:00 - 11:00")
    let timeRanges = extractTimeRanges(text)
    highlight(timeRanges, color: .purple)
}
```

### Senaryo 4: İlk Analiz İsteği

```swift
func requestWeeklyAnalysis() {
    let url = URL(string: "\(baseURL)/api/analytics/detailed-analysis")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
    
    URLSession.shared.dataTask(with: request) { data, response, error in
        if let data = data {
            let response = try? JSONDecoder().decode(AnalysisResponse.self, from: data)
            if let analysis = response?.data {
                // 4 sekmeye analizleri yükle
                loadAnalysisTabs(
                    general: analysis.general,
                    questions: analysis.questions,
                    time: analysis.time,
                    mockExams: analysis.mockExams
                )
                
                if analysis.isExisting == true {
                    showMessage(analysis.message ?? "Mevcut analiz gösteriliyor.")
                }
            }
        }
    }.resume()
}
```

---

## UI/UX Önerileri

### 1. Analiz Sayfası Tasarımı

**4 Sekme Yapısı:**
```
┌─────────────────────────────┐
│  Haftalık Analiz            │
│  8-14 Ocak 2024             │
├─────────────────────────────┤
│ [GENEL] [SORULAR] [ZAMAN]   │
│         [DENEMELER]         │
├─────────────────────────────┤
│                             │
│  [Seçili Sekme İçeriği]     │
│                             │
│  Ahmet, bu hafta toplam 12  │
│  saat çalışma yapmışsın...  │
│                             │
│  (Renkli vurgular: sayılar, │
│   ders adları, konular)     │
│                             │
└─────────────────────────────┘
```

### 2. Renkli Vurgular

**Önemli Bilgileri Renklendir:**
- **Sayılar:** Cyan/Mavi (örn: "30 net", "8 hafta", "%25")
- **Ders Adları:** Mavi (örn: "Matematik", "Fizik", "Kimya")
- **Konu Adları:** Mor (örn: "Trigonometri", "Cebir", "Mekanik")
- **Zaman Aralıkları:** Mor (örn: "08:00 - 11:00")

### 3. Sekme İçerikleri

**GENEL Sekmesi:**
- Derin analiz (500-700 kelime)
- Scroll edilebilir
- Tüm alanları içerir

**SORULAR Sekmesi:**
- Bir paragraf (200-300 kelime)
- Soru çözme, ders bazlı, konu bazlı analiz

**ZAMAN Sekmesi:**
- Bir paragraf (200-300 kelime)
- Çalışma süreleri, dağılım, trend

**DENEMELER Sekmesi:**
- Bir paragraf (200-300 kelime)
- Deneme sınavları analizi

### 4. Veri Yoksa Gösterim

- Teşvik edici mesajlar göster
- "Daha fazla soru çözdükçe analizlerin daha detaylı olacak" gibi mesajlar
- Uygulamayı kullanmaya yönlendir

---

## Limit Mantığı

### Haftalık Limit

1. **Hafta Tanımı:** Hafta Pazartesi 00:00 - Pazar 23:59 arasıdır.

2. **Analiz Haftası:** Analiz, **önceki hafta** (Pazartesi-Pazar) için oluşturulur.
   - Örnek: Bugün 15 Ocak 2024 (Pazartesi) ise
   - Analiz, 8-14 Ocak 2024 haftası için oluşturulur

3. **Haftalık Limit Kontrolü:**
   - Bir kullanıcı, **aynı hafta için** sadece **1 kez** analiz oluşturabilir
   - Eğer bu hafta için analiz varsa, yeni analiz oluşturulmaz
   - Mevcut analiz döndürülür

4. **Ekstra Güvenlik:**
   - Son 7 gün içinde analiz oluşturulmuşsa, yeni analiz oluşturulmaz
   - En son analiz döndürülür

### Aylık Limit

1. **Aylık Limit:** Bir kullanıcı **ayda maksimum 4 analiz** oluşturabilir

2. **Limit Kontrolü:**
   - Her ayın başında limit sıfırlanır
   - 4 analiz limitine ulaşıldığında, yeni analiz oluşturulmaz
   - En son analiz döndürülür

3. **Örnek:**
   - Ocak ayında 4 analiz oluşturuldu
   - 5. analiz isteği geldiğinde → En son analiz döndürülür
   - Şubat ayı başladığında → Limit sıfırlanır, yeni analiz oluşturulabilir

---

## Hata Yönetimi

### 403 Forbidden (Premium Değil)

```json
{
  "statusCode": 403,
  "message": "This feature is only available for premium users"
}
```

**Mobil Uygulama Aksiyonu:**
- Premium plan satın alma ekranına yönlendir
- "Bu özellik premium üyeler için" mesajı göster

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Mobil Uygulama Aksiyonu:**
- Kullanıcıyı login ekranına yönlendir
- Token'ı yenile

### 500 Internal Server Error

**Mobil Uygulama Aksiyonu:**
- "Bir hata oluştu. Lütfen tekrar deneyin." mesajı göster
- Retry butonu ekle

---

## Otomatik Analiz Oluşturma

**Backend'de otomatik olarak:**
- Her Pazartesi sabahı 09:00'da
- Tüm aktif premium kullanıcılar için
- Önceki hafta analizi otomatik oluşturulur

**Mobil Uygulama:**
- Kullanıcıya push notification gönderebilirsiniz
- "Yeni haftalık analiziniz hazır!" mesajı

---

## Test Senaryoları

### Test 1: İlk Analiz Oluşturma
1. Premium kullanıcı ile giriş yap
2. `POST /api/analytics/detailed-analysis` çağır
3. Yeni analiz oluşturulmalı (`isExisting: false`)
4. `summary` ve `categories` dolu olmalı

### Test 2: Aynı Hafta İkinci İstek
1. Aynı kullanıcı ile tekrar `POST /api/analytics/detailed-analysis` çağır
2. Mevcut analiz döndürülmeli (`isExisting: true`)

### Test 3: Kategori Erişimi
1. Analiz al
2. `data.categories.time` kontrol et
3. Kategori metni dolu olmalı veya null

### Test 4: Free Tier Kullanıcı
1. Free tier kullanıcı ile giriş yap
2. `POST /api/analytics/detailed-analysis` çağır
3. 403 Forbidden hatası alınmalı

---

## Önemli Notlar

1. **Plan Bazlı Analiz:**
   - **Free Tier:** Analiz yapılmaz
   - **Pro Tier:** Sadece GENEL analiz (`general` kategorisi)
   - **Premium Tier:** Tüm analizler (`general`, `questions`, `time`, `mockExams`)

2. **Haftalık Limit:** Bir kullanıcı haftada sadece 1 kez analiz oluşturabilir. Bu maliyet kontrolü için kritiktir.

3. **Aylık Limit:** Bir kullanıcı ayda maksimum 4 analiz oluşturabilir. Limit her ayın başında sıfırlanır.

4. **Analiz Formatı:** Analiz metni düz metindir, markdown içermez.

5. **Kategoriler:** Eğer bir kategori için yeterli veri yoksa, kullanıcıyı uygulamayı kullanmaya teşvik eden mesajlar içerir.

6. **Hafta Tanımı:** Hafta Pazartesi 00:00 - Pazar 23:59 arasıdır. Analiz önceki hafta için oluşturulur.

7. **Otomatik Oluşturma:** Backend her Pazartesi sabahı otomatik analiz oluşturur (Pro ve Premium kullanıcılar için).

8. **Genç Kullanıcılar:** Analizler kısa ve öz tutulmuştur. GENEL 500-700 kelime, diğer kategoriler 200-300 kelime.

---

## Örnek Response Modelleri

### Swift

```swift
struct AnalysisResponse: Codable {
    let success: Bool
    let data: AnalysisData
}

struct AnalysisData: Codable {
    let id: String
    let weekStart: String
    let weekEnd: String
    let general: String           // GENEL analizi (Pro ve Premium için)
    let questions: String?         // SORULAR analizi (Sadece Premium için)
    let time: String?              // ZAMAN analizi (Sadece Premium için)
    let mockExams: String?         // DENEMELER analizi (Sadece Premium için)
    let savedAt: String
    let isExisting: Bool?
    let message: String?
}

struct AnalysisHistoryResponse: Codable {
    let success: Bool
    let data: [AnalysisItem]
}

struct AnalysisItem: Codable {
    let id: String
    let weekStart: String
    let weekEnd: String
    let general: String
    let questions: String?         // Sadece Premium için
    let time: String?               // Sadece Premium için
    let mockExams: String?          // Sadece Premium için
    let r2Url: String?
    let createdAt: String
}
```

### Kotlin

```kotlin
data class AnalysisResponse(
    val success: Boolean,
    val data: AnalysisData
)

data class AnalysisData(
    val id: String,
    val weekStart: String,
    val weekEnd: String,
    val general: String,           // GENEL analizi (Pro ve Premium için)
    val questions: String? = null,  // SORULAR analizi (Sadece Premium için)
    val time: String? = null,       // ZAMAN analizi (Sadece Premium için)
    val mockExams: String? = null,  // DENEMELER analizi (Sadece Premium için)
    val savedAt: String,
    val isExisting: Boolean?,
    val message: String?
)

data class AnalysisHistoryResponse(
    val success: Boolean,
    val data: List<AnalysisItem>
)

data class AnalysisItem(
    val id: String,
    val weekStart: String,
    val weekEnd: String,
    val general: String,
    val questions: String? = null,  // Sadece Premium için
    val time: String? = null,        // Sadece Premium için
    val mockExams: String? = null,   // Sadece Premium için
    val r2Url: String?,
    val createdAt: String
)
```

---

## Kullanım Örnekleri

### Örnek 1: 4 Sekme Gösterimi

```swift
// Analiz sayfasında 4 sekme
let tabs = [
    ("GENEL", analysis.data.general),
    ("SORULAR", analysis.data.questions),
    ("ZAMAN", analysis.data.time),
    ("DENEMELER", analysis.data.mockExams)
]

displayTabs(tabs)
```

### Örnek 2: Belirli Sekmeyi Göster

```swift
// GENEL sekmesi
displayText(analysis.data.general)

// SORULAR sekmesi
displayText(analysis.data.questions)

// ZAMAN sekmesi
displayText(analysis.data.time)

// DENEMELER sekmesi
displayText(analysis.data.mockExams)
```

### Örnek 3: Renkli Vurgular

```swift
func highlightAnalysisText(_ text: String) {
    // Sayıları vurgula (Cyan)
    let numbers = extractNumbers(text) // "30", "8", "%25"
    highlight(numbers, color: .cyan)
    
    // Ders adlarını vurgula (Blue)
    let subjects = ["Matematik", "Fizik", "Kimya", "Biyoloji"]
    highlight(subjects, color: .blue)
    
    // Konu adlarını vurgula (Purple)
    let topics = extractTopics(text)
    highlight(topics, color: .purple)
    
    // Zaman aralıklarını vurgula (Purple)
    let timeRanges = extractTimeRanges(text) // "08:00 - 11:00"
    highlight(timeRanges, color: .purple)
}
```

### Örnek 4: Veri Yoksa Teşvik Mesajı

```swift
if analysis.data.questions.isEmpty || analysis.data.questions.contains("Henüz") {
    showEncouragementMessage("Daha fazla soru çözdükçe analizlerin daha detaylı olacak!")
}
```

---

## Sorular ve Cevaplar

**S: Kullanıcı haftada kaç kez analiz oluşturabilir?**
C: Sadece 1 kez. İkinci istekte mevcut analiz döndürülür.

**S: Analiz ne zaman otomatik oluşturulur?**
C: Her Pazartesi sabahı 09:00'da backend tarafından otomatik oluşturulur.

**S: Free tier kullanıcılar bu özelliği kullanabilir mi?**
C: Hayır, sadece Pro ve Premium kullanıcılar kullanabilir. Free tier kullanıcılar analiz alamaz.

**S: Pro ve Premium kullanıcılar arasındaki fark nedir?**
C: Pro kullanıcılar sadece GENEL analiz alır. Premium kullanıcılar tüm kategorileri (GENEL, SORULAR, ZAMAN, DENEMELER) alır.

**S: Aylık limit nedir?**
C: Bir kullanıcı ayda maksimum 4 analiz oluşturabilir. Limit her ayın başında sıfırlanır.

**S: Analiz metni hangi formatta gelir?**
C: Düz metin formatında gelir, markdown içermez.

**S: Hafta nasıl tanımlanır?**
C: Hafta Pazartesi 00:00 - Pazar 23:59 arasıdır. Analiz önceki hafta için oluşturulur.

**S: Analizler her zaman dolu mu?**
C: Hayır. Eğer bir kategori için yeterli veri yoksa, kullanıcıyı uygulamayı kullanmaya teşvik eden mesajlar içerir.

**S: Mobil uygulama nasıl kullanmalı?**
C: Analiz sayfasında 4 sekme var: GENEL, SORULAR, ZAMAN, DENEMELER. Her sekme için ilgili analizi gösterin.

**S: Analiz ne kadar uzun?**
C: GENEL 500-700 kelime (derin analiz), diğer kategoriler 200-300 kelime (bir paragraf). Genç kullanıcılar için optimize edilmiştir.

**S: Renkli vurgular nasıl çalışır?**
C: Mobil uygulama analiz metnindeki önemli bilgileri (sayılar, ders adları, konu adları, zaman aralıkları) renklendirebilir. Backend sadece metin döndürür, renklendirme mobil tarafında yapılır.

**S: Kullanıcı adı nasıl kullanılıyor?**
C: Backend kullanıcının firstName bilgisini AI'ya gönderir. AI analizlerde kullanıcıya ismiyle hitap eder (örn: "Ahmet, Matematik'te...").
