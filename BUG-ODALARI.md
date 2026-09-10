# 🐛 BUG FIX ODA ŞABLONLARI

> OpenCode'da yeni sohbet aç, şablonu kopyala, [...] yazan yerleri doldur, yapıştır.

---

## ŞABLON 1: Herhangi Bir Hata

```
Sen Couple Meeting projesinde bug fix yapıyorsun.
Proje: C:\Users\Ömer Yaman\Desktop\couple meeting
Tech: React + Socket.IO + SQLite

HATA: [...hata neyse yaz...]

KURALLAR:
- SADECE bu hatayı düzelt
- Başka dosyalara dokunma
- npm run build ile test et
```

---

## ŞABLON 2: Backend Hatası

```
Sen Couple Meeting backend'inde bug fix yapıyorsun.
Proje: C:\Users\Ömer Yaman\Desktop\couple meeting
Tech: Express + Socket.IO + SQLite

HATA: [...]
DOSYA: backend/index.js (veya backend/utils/database.js)

KURALLAR:
- SADECE backend dosyalarında çalış
- database tablolarını SİLME
- npm run build ile test et
```

---

## ŞABLON 3: Frontend Hatası

```
Sen Couple Meeting frontend'inde bug fix yapıyorsun.
Proje: C:\Users\Ömer Yaman\Desktop\couple meeting
Tech: React 19 + Vite

HATA: [...]
DOSYA: frontend/src/[...].jsx

KURALLAR:
- SADECE belirtilen dosyada çalış
- Renk paletini koru (#111b21, #00a884)
- npm run build ile test et
```

---

## ŞABLON 4: Build Hatası

```
Couple Meeting build hatası alıyorum.
Proje: C:\Users\Ömer Yaman\Desktop\couple meeting\frontend

HATA MESAJI:
[yapıştır]

Build hatasını düzelt.
```

---

## ŞABLON 5: Socket Hatası

```
Couple Meeting socket hatası var.
Proje: C:\Users\Ömer Yaman\Desktop\couple meeting

HATA: [...]
Socket event ismi: [...]

Frontend: frontend/src/hooks/useSocketEvents.js
Backend: backend/index.js

Bu iki dosyadaki socket uyumsuzluğunu düzelt.
```

---

## KULLANIM

1. OpenCode'da "New Chat" aç
2. Yukarıdaki şablondan birini kopyala
3. `[...]` yerlerini doldur
4. Yapıştır
5. AI sadece o dosyalarda çalışır
