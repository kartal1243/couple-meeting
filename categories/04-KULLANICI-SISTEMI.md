# 👤 KULLANICI SİSTEMİ — AI Çalışma Alanı

## Amaç
Üyelik, profil, arkadaşlık, mesajlaşma, kullanıcı ayarları ve kullanıcı verileri.

## Görev Sınırı
- Auth sistemi (kayıt/giriş/çıkış)
- Profil düzenleme (avatar, bio, durum)
- Arkadaşlık sistemi (takip/engelle)
- Mesajlaşma (DM, grup, global)
- Kullanıcı ayarları
- Takip sistemi + Feed
- Bildirim sistemi

## Dokunulabilir Dosyalar
```
frontend/src/Modals/AuthModal.jsx       — Kayıt/giriş modalı (285 satır)
frontend/src/Modals/SocialModal.jsx     — Sosyal modal (325 satır)
frontend/src/Modals/SettingsModal.jsx   — Ayarlar modalı (369 satır)
frontend/src/Modals/ProfileModal.jsx    — Profil modalı (212 satır)
frontend/src/components/social/*.jsx    — Sosyal tab componentleri (7 dosya)
frontend/src/components/layout/ProfileDropdown.jsx — Profil dropdown (130)
frontend/src/pages/AdminPage.jsx        — Admin kullanıcı yönetimi (509 satır)
frontend/src/hooks/useSocketEvents.js   — Socket event'ler (395 satır)
frontend/src/App.jsx                    — Kullanıcı state'leri (987 satır)
backend/index.js                        — Auth/socket handler'lar
backend/utils/database.js              — Kullanıcı tabloları
```

## Dokunulmaması Gerekenler
- `frontend/src/Room/*.jsx` — Oda bileşenleri
- `frontend/src/Home/*.jsx` — Landing page
- `frontend/src/pages/LandingPage.jsx`
- `frontend/src/pages/BlogPage.jsx`
- `frontend/src/pages/AdsPage.jsx`
- `marketing/`, `blog/`, `promos/`
- `backend/.env`

## Kategorilerle İlişkisi
| Kategori | İlişki |
|----------|--------|
| 🐛 BUG | Kullanıcı sistemi bug'larını sen düzelt |
| 🎨 TASARIM | Profil sayfası tasarımını koordine et |
| ⚙️ BACKEND | Auth mantığını backend ile sen yaz |
| 🔐 GÜVENLİK | Şifre hashleme, token güvenliği |
| 📈 SEO | Kullanıcı profili SEO metadata |

## Çalışma Kuralları
1. Auth token: JWT (süre: 7 gün)
2. Şifre hashleme: bcrypt (10 round)
3. Kullanıcı adı: 3-20 karakter, alphanumeric + underscore
4. Avatar: Emoji-based (AVATARS dizisinden seçim)
5. DM geçmişi: Object olarak saklanır `{ [username]: [...messages] }`
6. isHost karşılaştırması: `hostUserId === (authUser?.username || username)`

## Değişiklik Öncesi Kontrol
- [ ] Auth akışı bozuldu mu? (kayıt/giriş/çıkış)
- [ ] DM mesajları doğru mu kaydediliyor?
- [ ] Takip sistemi çalışıyor mu?
- [ ] Bildirimler doğru mu tetikleniyor?
- [ ] Admin yetkileri korundu mu?
