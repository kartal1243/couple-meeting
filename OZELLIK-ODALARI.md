# 🚀 YENİ ÖZELLİK ODA ŞABLONLARI

> Yeni özellik geliştirme için OpenCode sohbet şablonları.

---

## ODA 1: Dosya Ekleme Sistemi

```
Sen Couple Meeting projesine yeni özellik geliştiriyorsun.
Proje: C:\Users\Ömer Yaman\Desktop\couple meeting
Tech: React + Socket.IO + SQLite

ÖZELLİK: Dosya Ekleme Sistemi
AÇIKLAMA: Kullanıcılar sohbete/odaya dosya ekleyebilmeli

İSTENENLER:
- Fotoğraf/video/dosya yükleme
- Dosya önizleme (thumbnail)
- Drag & drop desteği
- Maksimum dosya boyutu kontrolü
- Güvenli yükleme (validation)

DOSYALAR:
- Frontend: frontend/src/Room/Chat.jsx (mevcut chat'e ekle)
- Backend: backend/index.js (socket handler)
- Yeni: frontend/src/components/FileUpload.jsx (opsiyonel)

KURALLAR:
- Mevcut chat yapısını bozma
- Socket event'leri ile entegre et
- Güvenlik: Dosya tipi validation
- npm run build ile test et

Önce mevcut chat kodunu analiz et, sonra plan oluştur, sonra geliştir.
```

---

## ODA 2: Oda İçi Konuşma Sistemi

```
Sen Couple Meeting projesine yeni özellik geliştiriyorsun.
Proje: C:\Users\Ömer Yaman\Desktop\couple meeting
Tech: React + Socket.IO + SQLite

ÖZELLİK: Oda İçi Konuşma Sistemi (In-Room Chat)
AÇIKLAMA: Odadaki kullanıcılar arasında real-time sohbet

İSTENENLER:
- Real-time mesajlaşma
- Mesaj geçmişi (odada kaldığı süre)
- Typing indicator (yazıyor...)
- Okundu işareti
- Emoji desteği
- Mesaj silme/düzenleme

DOSYALAR:
- Frontend: frontend/src/Room/Chat.jsx (mevcut)
- Frontend: frontend/src/Room/VirtualizedChat.jsx (performans)
- Backend: backend/index.js (socket handler)

KURALLAR:
- Mevcut chat yapısını geliştir, silme
- Socket event'leri ile entegre et
- Performans: VirtualizedChat kullan
- npm run build ile test et

Önce mevcut chat kodunu analiz et, sonra plan oluştur, sonra geliştir.
```

---

## ODA 3: Dosya + Chat Entegrasyonu

```
Sen Couple Meeting projesine yeni özellik geliştiriyorsun.
Proje: C:\Users\Ömer Yaman\Desktop\couple meeting
Tech: React + Socket.IO + SQLite

ÖZELLİK: Dosya Ekleme + Oda İçi Chat Entegrasyonu
AÇIKLAMA: Hem dosya ekleme hem de gelişmiş chat sistemi

İSTENENLER:
1. Dosya ekleme sistemi
   - Fotoğraf/video/dosya yükleme
   - Thumbnail önizleme
   - Drag & drop
   - Güvenli yükleme

2. Oda içi chat sistemi
   - Real-time mesajlaşma
   - Typing indicator
   - Okundu işareti
   - Emoji desteği
   - Mesaj silme/düzenleme

3. Entegrasyon
   - Dosya mesajları chat'te görünsün
   - Dosya önizlemesi chat içinde
   - Dosya indirme linki

DOSYALAR:
- Frontend: frontend/src/Room/Chat.jsx
- Frontend: frontend/src/Room/VirtualizedChat.jsx
- Frontend: frontend/src/components/FileUpload.jsx (yeni)
- Backend: backend/index.js

KURALLAR:
- Mevcut sistemi geliştir, silme
- Socket event'leri ile entegre et
- Güvenlik: Dosya tipi validation
- Performans: VirtualizedChat kullan
- npm run build ile test et

Önce mevcut kodları analiz et, sonra plan oluştur, sonra geliştir.
```

---

## KULLANIM

1. OpenCode'da yeni sohbet aç
2. Yukarıdaki şablondan birini kopyala
3. Yapıştır
4. AI mevcut kodları analiz edip plan oluşturur
5. Onay verdikten sonra geliştirir
