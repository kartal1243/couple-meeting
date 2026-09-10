# ⚙️ BACKEND / API — AI Çalışma Alanı

## Amaç
API, server işlemleri, database bağlantıları, authentication ve backend mantığı.

## Görev Sınırı
- Socket.IO handler yazma/değiştirme
- REST API endpoint'leri
- Database schema değişiklikleri (DİKKATLİ!)
- Authentication mantığı
- Rate limiting
- Server yapılandırması
- Redis/PM2/Nginx ayarları

## Dokunulabilir Dosyalar
```
backend/index.js              — Ana server + socket handler'lar (1940 satır)
backend/communities.js        — Topluluk handler'ları
backend/events.js             — Etkinlik handler'ları
backend/modules.js            — Modüler handler loading
backend/redis-config.js       — Redis yapılandırması
backend/utils/database.js     — SQLite DB + tablolar (1100 satır)
backend/utils/logger.js       — Winston logger
backend/.env                  — Environment variables
backend/package.json          — Bağımlılıklar
backend/Dockerfile            — Docker yapılandırması
backend/nginx-security.conf   — Nginx güvenlik kuralları
```

## Dokunulmaması Gerekenler
- `frontend/` — Hiçbir dosya
- `data.db` — Mevcut tabloları SİLME
- `blog/`, `marketing/`, `promos/` — İçerik dosyaları

## Kategorilerle İlişkisi
| Kategori | İlişki |
|----------|--------|
| 🐛 BUG | Backend bug'larını sen düzeltirsin |
| 👤 KULLANICI | Kullanıcı sistemi backend mantığını sen yönetirsin |
| 🔐 GÜVENLİK | Güvenlik kontrollerini sen uygularsın |
| 🚀 YENİ ÖZELLİKLER | Yeni socket event'lerini sen eklersin |
| 🌐 DEPLOY | Server yapılandırmasını sen yaparsın |

## Çalışma Kuralları
1. **Database değişikliği ONAY GEREKTİRİR** — Yeni tablo/sütun ekleme öncesi kullanıcıya sor
2. Mevcut API endpoint'lerini silme (geriye uyumluluk)
3. Socket event isimlendirme: `camelCase` (ör: `send_message`, `join_room`)
4. Rate limiting: 100 req/dakika (API), 30 msg/saniye (socket)
5. Error handling: Her handler'da try-catch
6. Log: Winston logger kullan (`backend/utils/logger.js`)
7. PM2 restart: `pm2 restart couple-meeting`

## Değişiklik Öncesi Kontrol
- [ ] Database değişikliği var mı? → Onay al
- [ ] Mevcut socket event'lerini bozuyor mu?
- [ ] Frontend ile uyumlu mu? (event isimleri, data formatı)
- [ ] Rate limiting korundu mu?
- [ ] Error handling eklendi mi?
- [ ] `.env` değişikliği var mı? → Deploy sonrası güncelle
