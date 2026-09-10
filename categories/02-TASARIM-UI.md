# 🎨 TASARIM / UI — AI Çalışma Alanı

## Amaç
Görünüm, responsive yapı, animasyonlar, renkler, component tasarımı ve kullanıcı deneyimi.

## Görev Sınırı
- CSS/stil değişiklikleri
- Responsive tasarım
- Animasyon ekleme/düzeltme
- Component tasarımı (görsel)
- Renk/typography düzenlemeleri
- UX iyileştirmeleri

## Dokunulabilir Dosyalar
```
frontend/src/index.css              — Global CSS animasyonları
frontend/src/styles.js              — Ortak stil objeleri
frontend/src/styles/globalCss.js    — GLOBAL_CSS objesi
frontend/src/styles/homeCss.js      — HOME_CSS objesi
frontend/src/components/layout/*.jsx — Navbar, Footer, ProfileDropdown
frontend/src/components/mobile/*.jsx — Mobil componentler
frontend/src/Home/*.jsx             — Landing page componentleri
frontend/src/Modals/AuthModal.jsx   — Auth modal tasarımı
frontend/src/Modals/SocialModal.jsx — Social modal tasarımı
frontend/src/Modals/VipModal.jsx    — VIP modal tasarımı
frontend/src/Modals/SettingsModal.jsx — Settings tasarımı
frontend/src/Modals/ProfileModal.jsx — Profil modal tasarımı
frontend/src/Room/Header.jsx        — Oda başlığı tasarımı
frontend/src/Room/Controls.jsx      — Oda kontrolleri tasarımı
frontend/src/Room/Player.jsx        — Video player tasarımı
frontend/src/Room/Chat.jsx          — Chat tasarımı
frontend/src/Room/SearchBar.jsx     — Arama barı tasarımı
frontend/src/pages/LandingPage.jsx  — Landing page tasarımı
frontend/src/pages/BlogPage.jsx     — Blog sayfası tasarımı
frontend/public/favicon.svg         — Favicon
frontend/public/icon.svg            — İkon
frontend/public/og-image.svg        — OG görseli
```

## Dokunulmaması Gerekenler
- `backend/` — Hiçbir dosya
- `frontend/src/App.jsx` — State yönetimi (sadece prop passing)
- `frontend/src/hooks/useSocketEvents.js` — Socket mantığı
- `frontend/src/contexts/` — Context yapıları
- `frontend/src/data/blogPosts.js` — Blog içeriği
- `frontend/src/utils/*.js` — Yardımcı fonksiyonlar
- `frontend/vite.config.js` — Build yapılandırması

## Kategorilerle İlişkisi
| Kategori | İlişki |
|----------|--------|
| 🐛 BUG | CSS bug'larını sen düzelt |
| 👤 KULLANICI | Profil sayfası tasarımını sen yaparsın |
| 📱 MOBİL | Mobil responsive tasarımı sen koordine edersin |
| 🔐 GÜVENLİK | Form validasyon görselleri |

## Çalışma Kuralları
1. Mevcut tasarım dilini koru (koyu tema, turuncu/yesil aksan)
2. `#111b21` arka plan, `#1f2c34` card, `#00a884` primary rengi
3. Responsive breakpoint'ler: 480px, 768px, 1024px
4. Animasyon süreleri: 0.2s-0.4s arası
5. Font: Sistem font'u (Inter fallback)
6. `npm run build` ile test et

## Değişiklik Öncesi Kontrol
- [ ] Mevcut renk paleti korundu mu?
- [ ] Responsive çalışıyor mu? (mobil/tablet/desktop)
- [ ] Animasyon çok hızlı/yavaş mı?
- [ ] Dark theme tutarlı mı?
- [ ] Erişilebilirlik (contrast, font size) tamam mı?
