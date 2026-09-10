# 🐛 BUG / HATALAR — AI Çalışma Alanı

## Amaç
Mevcut hataları bulma, analiz etme ve düzeltme. Yeni özellik ekleme YOK.

## Görev Sınırı
- Sadece hata düzeltme (fix)
- Regression test
- Hata analizi ve log inceleme
- Hotfix uygulama

## Dokunulabilir Dosyalar
```
backend/index.js              — Socket handler hataları
backend/communities.js        — Topluluk handler hataları
backend/events.js             — Etkinlik handler hataları
backend/utils/database.js     — DB query hataları
backend/utils/logger.js       — Log hataları
frontend/src/App.jsx          — State/prop hataları
frontend/src/hooks/useSocketEvents.js — Socket event hataları
frontend/src/Room/*.jsx       — Oda bileşen hataları
frontend/src/Modals/*.jsx     — Modal hataları
frontend/src/pages/*.jsx      — Sayfa hataları
frontend/src/components/**/*.jsx — Component hataları
frontend/src/index.css        — CSS hataları
```

## Dokunulmaması Gerekenler
- `backend/.env` — Environment değişikliği
- `backend/utils/database.js` tabloları — Yeni tablo ekleme/silme
- `frontend/public/manifest.json` — Uygulama yapılandırması
- `frontend/vite.config.js` — Build yapılandırması
- `marketing/` — Pazarlama materyalleri
- `blog/` — Blog içerikleri

## Kategorilerle İlişkisi
| Kategori | İlişki |
|----------|--------|
| 🎨 TASARIM | CSS bug'ları için tasarımı bilgilendir |
| ⚙️ BACKEND | Backend bug'ları için handler değişikliği gerekebilir |
| 👤 KULLANICI | Kullanıcı sistemi bug'ları için auth kontrolü |
| 🔐 GÜVENLİK | Güvenlik açığı tespit edilirse Security kategorisine bildir |

## Çalışma Kuralları
1. Önce hata raporunu/Issue'yu oku
2. Hatanın kaynağını bul (log, console, reproducing steps)
3. Fix uygula — minimum değişiklik prensibi
4. `npm run build` ile test et
5. Başka bir hata yaratmadığından emin ol
6. Commit mesajı formatı: `fix: [hata açıklaması]`

## Değişiklik Öncesi Kontrol
- [ ] Hata reproducing edildi mi?
- [ ] Kök neden (root cause) bulundu mu?
- [ ] Fix sadece hata涌esini etkiliyor mu?
- [ ] Başka dosyalarda yan etki var mı?
- [ ] Build başarılı mı?

## Bilinen Bug'lar
- SSH timeout (deploy sorunu, kod hatası değil)
- Android emulator crash (WHPX/Hyper-V conflict)
