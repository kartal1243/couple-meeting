# 🔐 GÜVENLİK — AI Çalışma Alanı

## Amaç
Authentication, yetkilendirme, veri güvenliği, açıklar ve güvenlik kontrolleri.

## Görev Sınırı
- Auth token güvenliği
- Şifre hashleme/şifreleme
- Rate limiting
- Input validation/sanitization
- XSS/CSRF koruması
- SQL injection koruması
- CORS yapılandırması
- Güvenlik header'ları
- 2FA (iki faktörlü doğrulama)
- Email doğrulama
- IP ban/suspicious login detection

## Dokunulabilir Dosyalar
```
backend/index.js              — Auth handler'ları, rate limiting
backend/utils/database.js     — Kullanıcı tabloları, şifre hashleme
backend/redis-config.js       — Rate limiting, session management
backend/.env                  — JWT secret, API key'ler
backend/nginx-security.conf   — Güvenlik header'ları
frontend/src/Modals/AuthModal.jsx — Auth form validasyonu
frontend/src/Modals/SettingsModal.jsx — 2FA, şifre değiştirme
```

## Dokunulmaması Gerekenler
- `frontend/src/Room/*.jsx` — Oda bileşenleri
- `frontend/src/Home/*.jsx` — Landing page
- `frontend/src/pages/BlogPage.jsx`
- `frontend/src/pages/AdsPage.jsx`
- `marketing/`, `blog/`, `promos/`
- `frontend/src/components/mobile/*.jsx` — Mobil componentler

## Kategorilerle İlişkisi
| Kategori | İlişki |
|----------|--------|
| ⚙️ BACKEND | Güvenlik kontrollerini backend ile uygula |
| 👤 KULLANICI | Kullanıcı auth akışını güvenli hale getir |
| 🚀 YENİ ÖZELLİKLER | Yeni özelliklerde güvenlik kontrolü |
| 📱 MOBİL | Mobil auth güvenliğini kontrol et |
| 🌐 DEPLOY | SSL, HTTPS, security headers |

## Çalışma Kuralları
1. **JWT Secret:** `.env` dosyasında, asla kodda hardcode etme
2. **Şifre politikası:** Minimum 8 karakter, büyük/küçük harf + rakam
3. **Rate limiting:** 100 req/dakika (API), 30 msg/saniye (socket)
4. **Input validation:** Tüm user input'ları validate et
5. **SQL injection:** Parameterized query kullan (better-sqlite3)
6. **XSS:** React otomatik escape eder, ama dangerouslySetInnerHTML kullanma
7. **CORS:** Sadece `couplemeeting.comtr` origin'ine izin ver
8. **2FA:** Google Authenticator (TOTP)

## Değişiklik Öncesi Kontrol
- [ ] JWT secret `.env` dosyasında mı?
- [ ] Şifreler hashlenmiş mi? (bcrypt)
- [ ] Rate limiting aktif mi?
- [ ] Input validation eklendi mi?
- [ ] CORS yapılandırması doğru mu?
- [ ] Security header'lar eklendi mi?
