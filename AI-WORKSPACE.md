# Couple Meeting — AI Çalışma Alanı Organizasyonu

> **Proje:** Couple Meeting — Real-time video/music sync SPA
> **Repolar:** `https://github.com/kartal1243/couple-meeting`
> **Sunucu:** `213.142.148.75` (SSH root, Nginx + PM2)
> **Domain:** `couplemeeting.com.tr`

---

## 📁 Proje Yapısı (330 Dosya, ~82K Satır)

```
couple meeting/
├── backend/                    ← Express + Socket.IO server
│   ├── index.js               (1940 satır) — Ana server + tüm socket handler'ları
│   ├── communities.js         (176) — Topluluk handler'ları
│   ├── events.js              (176) — Etkinlik handler'ları
│   ├── modules.js             (60) — Modular handler loading
│   ├── redis-config.js        (41) — Redis yapılandırması
│   ├── utils/
│   │   ├── database.js        (1100) — SQLite DB + tüm tablolar
│   │   └── logger.js          (28) — Winston logger
│   ├── .env                   — Environment variables
│   └── package.json
│
├── frontend/                   ← React 19 + Vite 8 SPA
│   ├── src/
│   │   ├── App.jsx            (987) — Ana bileşen, routing, state
│   │   ├── main.jsx           (15) — Entry point
│   │   ├── socket.js          (11) — Socket.IO client
│   │   ├── constants.js       (24) — Sabitler (BACKEND_URL, AVATARS, VIP)
│   │   ├── styles.js          (40) — Ortak stil objeleri
│   │   ├── index.css          (959) — Global CSS animasyonları
│   │   │
│   │   ├── components/
│   │   │   ├── admin/         — Admin paneli tab componentleri (10 dosya)
│   │   │   ├── layout/        — Navbar, Footer, ProfileDropdown
│   │   │   ├── mobile/        — Mobil componentler (16 dosya)
│   │   │   ├── social/        — Sosyal medya tab componentleri (7 dosya)
│   │   │   └── ErrorBoundary.jsx
│   │   │
│   │   ├── contexts/
│   │   │   └── AppContext.jsx  (6) — Boş context (kullanılmıyor)
│   │   │
│   │   ├── data/
│   │   │   └── blogPosts.js   (233) — Blog verileri
│   │   │
│   │   ├── hooks/
│   │   │   └── useSocketEvents.js (395) — Socket event handler'ları
│   │   │
│   │   ├── Home/              — Landing page componentleri
│   │   ├── Modals/            — Modal componentleri (7 dosya)
│   │   ├── pages/             — Sayfa componentleri (9 dosya)
│   │   ├── Room/              — Oda içi componentler (9 dosya)
│   │   ├── styles/            — CSS-in-JS dosyaları
│   │   └── utils/             — Yardımcı fonksiyonlar (4 dosya)
│   │
│   ├── public/                — Statik dosyalar (favicon, manifest, sitemap)
│   ├── index.html             — HTML template
│   └── vite.config.js
│
├── blog/                      — SEO blog yazıları (5 md dosyası)
├── marketing/                 — Pazarlama materyalleri (23 dosya)
├── promos/                    — Tanıtım materyalleri (10 dosya)
└── ytify/                     — YouTube embed kütüphanesi (ayrı proje)
```

---

## 🔑 Teknik Bilgiler

| Bileşen | Teknoloji |
|---------|-----------|
| Frontend | React 19, react-youtube, socket.io-client, react-router-dom, Vite 8.2.2 |
| Backend | Express.js, Socket.IO, better-sqlite3 |
| Database | SQLite (`data.db` — `/root/couple-meeting/backend/data.db`) |
| Server | PM2 (`couple-meeting` process), Nginx reverse proxy |
| SSL/CDN | Cloudflare (couplemeeting.comtr) |
| Mobile | Capacitor (Android app — `C:\cm-app`) |
| SEO | robots.txt, sitemap.xml, Schema.org, OG meta tags |

---

## 🚀 Deploy Komutu (GÜVENLİ)

```bash
cd ~/couple-meeting && git fetch --all && git reset --hard origin/main && \
cd frontend && npm run build && \
sudo rm -rf /var/www/couplemeeting/assets && sudo cp -r dist/* /var/www/couplemeeting/ && \
cd ~/couple-meeting/backend && npm install && pm2 restart couple-meeting
```

> ⚠️ **ASLA `rm -rf ~/couple-meeting` ÇALIŞTIRMAYIN** — database silinir!

---

## 🔧 Bilinen Sorunlar & Kısıtlamalar

| Sorun | Durum |
|-------|-------|
| SSH timeout (213.142.148.75) | Kullanıcı manuel deploy yapıyor |
| Android emulator crash (WHPX/Hyper-V) | Kullanıcı makinesinde çözümlenmedi |
| Google Play Console hesabı onay bekliyor | $25 ödeme bekleniyor |
| OG image SVG formatında | PNG'ye çevrilmesi gerekiyor |
| Google Analytics gerçek ID yok | `G-XXXXXXXXXX` kullanılıyor |

---

## 📋 AI Çalışma Alanı Kuralları

### Ortak Kurallar (Tüm Kategoriler İçin)

1. **Veritabanını ASLA değiştirme/silme** — `data.db` dokunulmaz
2. **API endpoint'lerini silme** — Geriye uyumluluk bozulur
3. **Mevcut özellikleri kaldırma** — Sadece ekleme/düzeltme
4. **Deploy öncesi build kontrolü** — `npm run build` her değişiklik sonrası
5. **Import'ları güncelleme** — Dosya taşıma/ekleme sonrası tüm import'ları düzelt
6. **Socket handler'larını bozma** — Backend-Frontend uyumu kritik
7. **Gizli bilgi yok** — `.env`, API key, şifre gibi dosyaları log'lama

### Değişiklik Sonrası Kontrol Listesi

- [ ] `npm run build` başarılı mı?
- [ ] Import zincirleri doğru mu?
- [ ] Socket event'leri backend ile uyumlu mu?
- [ ] UI'da görsel bozulma var mı?
- [ ] Mevcut testler geçiyor mu?

---

## 📊 Kategori Özeti

| # | Kategori | Dosya Sayısı | Satır | Öncelik |
|---|---------|-------------|-------|---------|
| 1 | 🐛 BUG / HATALAR | Değişken | Değişken | Yüksek |
| 2 | 🎨 TASARIM / UI | ~15 | ~4,500 | Orta |
| 3 | ⚙️ BACKEND / API | ~5 | ~3,500 | Yüksek |
| 4 | 👤 KULLANICI SİSTEMİ | ~12 | ~2,800 | Yüksek |
| 5 | 🚀 YENİ ÖZELLİKLER | Değişken | Değişken | Düşük |
| 6 | 📱 MOBİL / UYGULAMA | ~16 | ~800 | Orta |
| 7 | 🔐 GÜVENLİK | ~5 | ~1,500 | Yüksek |
| 8 | 📈 SEO / GOOGLE | ~12 | ~1,500 | Düşük |
| 9 | 🧪 TEST / KALİTE | ~3 | ~500 | Orta |
| 10 | 🌐 DEPLOY / PRODUCTION | ~5 | ~200 | Yüksek |

---

## 📖 Kategori Rehberleri

Her kategorinin detaylı rehberi için aşağıdaki dosyalara bakın:

- `categories/01-BUG-FIX.md`
- `categories/02-TASARIM-UI.md`
- `categories/03-BACKEND-API.md`
- `categories/04-KULLANICI-SISTEMI.md`
- `categories/05-YENI-ÖZELLIKLER.md`
- `categories/06-MOBIL-UYGULAMA.md`
- `categories/07-GUVENLIK.md`
- `categories/08-SEO-GOOGLE.md`
- `categories/09-TEST-KALITE.md`
- `categories/10-DEPLOY-PRODUCTION.md`
