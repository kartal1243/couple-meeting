# 🧪 TEST / KALİTE — AI Çalışma Alanı

## Amaç
Testler, performans, hata kontrolü ve production öncesi kontroller.

## Görev Sınırı
- Unit test yazma
- Integration test
- E2E test
- Performans testi
- Lighthouse optimizasyonu
- Bundle analizi
- Accessibility kontrolü
- Cross-browser test
- Code review

## Dokunulabilir Dosyalar
```
frontend/ — Tüm dosyalar (test amaçlı okuma)
backend/ — Tüm dosyalar (test amaçlı okuma)
```

## Dokunulmaması Gerekenler (Değişiklik YAPILMAYACAK)
- Tüm kaynak dosyalar — Sadece OKUMA
- Test dosyaları oluşturabilirsiniz
- `.gitignore` — Mevcut yapıyı koru

## Kategorilerle İlişkisi
| Kategori | İlişki |
|----------|--------|
| 🐛 BUG | Bug'lardan sonra regression test |
| 🎨 TASARIM | UI test'leri (visual regression) |
| ⚙️ BACKEND | API test'leri |
| 👤 KULLANICI | Kullanıcı akış test'leri |
| 🚀 YENİ ÖZELLİKLER | Yeni özellikler için test yaz |
| 🔐 GÜVENLİK | Güvenlik test'leri (penetration test) |
| 📱 MOBİL | Mobil test'ler |
| 🌐 DEPLOY | Deploy sonrası smoke test |

## Çalışma Kuralları
1. **Test dosyası isimlendiresi:** `*.test.js`, `*.spec.js`
2. **Test klasörü:** `frontend/src/__tests__/`, `backend/__tests__/`
3. **Coverage hedefi:** Minimum %60
4. **Performans:** Lighthouse skoru > 80
5. **Bundle boyutu:** JS bundle < 200KB (gzipped)
6. **Accessibility:** WCAG 2.1 AA

## Değişiklik Öncesi Kontrol
- [ ] Tüm testler çalışıyor mu?
- [ ] Yeni testler eklendi mi?
- [ ] Coverage oranı düştü mü?
- [ ] Performans metric'leri korundu mu?
