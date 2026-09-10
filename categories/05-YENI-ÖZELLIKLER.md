# 🚀 YENİ ÖZELLİKLER — AI Çalışma Alanı

## Amaç
Siteye eklenecek yeni özelliklerin geliştirilmesi.

## Görev Sınırı
- Yeni sayfa/component oluşturma
- Yeni socket event'leri ekleme
- Yeni database tabloları ekleme (ONAY GEREKTİRİR!)
- Yeni API endpoint'leri ekleme
- Mevcut özelliklere iyileştirme

## Dokunulabilir Dosyalar
```
Tüm frontend/src/ dosyaları — Yeni component/sayfa ekleme
Tüm backend/ dosyaları — Yeni handler/endpoint ekleme
frontend/src/data/*.js — Yeni veri dosyaları
```

## Dokunulmaması Gerekenler
- Mevcut özellikleri KALDIRMA
- `data.db` — Mevcut tabloları silme
- `backend/.env` — Environment değişikliği (onay gerekli)
- `marketing/`, `blog/` — İçerik dosyaları

## Kategorilerle İlişkisi
| Kategori | İlişki |
|----------|--------|
| 🐛 BUG | Yeni özelliklerde bug oluşursa Bug kategorisine aktar |
| 🎨 TASARIM | Yeni component tasarımını Tasarım ile koordine et |
| ⚙️ BACKEND | Yeni backend handler'larını Backend ile yaz |
| 👤 KULLANICI | Kullanıcı sistemine etki ediyorsa Koordinasyon kategorisini bilgilendir |
| 🔐 GÜVENLİK | Yeni özellikte güvenlik açığı var mı kontrol et |
| 📈 SEO | Yeni sayfalar için SEO meta ekle |
| 📱 MOBİL | Yeni özellik mobilde çalışıyor mu kontrol et |

## Çalışma Kuralları
1. **Önce taslak/plan oluştur** — Ne eklenecek, nasıl çalışacak?
2. **Mevcut yapıyı takip et** — Dosya isimlendirme, klasör yapısı
3. **Küçük başla** — MVP (Minimum Viable Product) yaklaşımı
4. **Test et** — Her aşama sonrası build + manuel test
5. **Dokümantasyon** — Yeni özellik için README/CHANGELOG ekle

## Değişiklik Öncesi Kontrol
- [ ] Yeni dosya ismi mevcut ile çakışıyor mu?
- [ ] Import zincirleri doğru mu?
- [ ] Socket event'leri backend ile uyumlu mu?
- [ ] Yeni database tablosu gerekiyor mu? → Onay al
- [ ] Mobilde çalışıyor mu?
