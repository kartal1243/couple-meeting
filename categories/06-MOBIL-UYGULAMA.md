# 📱 MOBİL / UYGULAMA — AI Çalışma Alanı

## Amaç
Web sitesini mobil uygulamaya dönüştürme, Android, iOS, Play Store ve mobil uyumluluk.

## Görev Sınırı
- Capacitor entegrasyonu
- Android/iOS build süreçleri
- Play Store/App Store hazırlığı
- Mobil responsive tasarım (web)
- Mobil component'ler
- Touch/gesture optimizasyonu
- Push notification

## Dokunulabilir Dosyalar
```
frontend/src/components/mobile/*.jsx     — Mobil componentler (16 dosya)
frontend/src/components/layout/*.jsx     — Responsive layout
frontend/src/index.css                   — Mobil CSS
frontend/src/styles/homeCss.js           — Mobil home stilleri
frontend/src/pages/*.jsx                 — Responsive sayfalar
frontend/src/Modals/*.jsx                — Responsive modallar
C:\cm-app\                               — Capacitor projesi (Android)
```

## Dokunulmaması Gerekenler
- `backend/` — Backend dosyaları
- `frontend/src/hooks/useSocketEvents.js` — Socket mantığı
- `frontend/src/data/` — Veri dosyaları
- `frontend/vite.config.js` — Build yapılandırması (onay gerekli)
- `marketing/`, `blog/`, `promos/`

## Kategorilerle İlişkisi
| Kategori | İlişki |
|----------|--------|
| 🎨 TASARIM | Mobil responsive tasarımı koordine et |
| 🔐 GÜVENLİK | Mobil auth akışını kontrol et |
| 🌐 DEPLOY | Capacitor build ve deploy süreçleri |

## Çalışma Kuralları
1. **Android SDK yolu:** `C:\Users\Ömer Yaman\AppData\Local\Android\Sdk`
2. **Capacitor projesi:** `C:\cm-app` (Desktop değil, non-ASCII path sorunu)
3. **Min SDK:** API 24 (Android 7.0)
4. **Target SDK:** API 34 (Android 14)
5. **Touch hedefleri:** Minimum 44x44px
6. **Safe area:** `env(safe-area-inset-top)` kullanımı
7. **Pull-to-refresh:** Mobilde destekleniyor

## Değişiklik Öncesi Kontrol
- [ ] Web responsive çalışıyor mu?
- [ ] Capacitor config doğru mu?
- [ ] Android build başarılı mı?
- [ ] Touch hedefleri yeterli mi?
- [ ] Safe area korundu mu?
