# 🐛 BUG TRACKING — AI Çalışma Odaları

> Her oda ayrı bir hata/düzeltme çalışması yürütür.
> Oda adı = AI sohbetine yapıştırılacak başlık.

---

## 📋 Aktif Odalar

| Oda | Durum | Hata | Dosya | Notlar |
|-----|-------|------|-------|--------|
| _(boş)_ | — | — | — | — |

---

## 🚀 Hazır Oda Şablonları

`BUG-TEMPLATES.md` dosyasında hazır şablonlar var. Kullanım:

1. OpenCode'da yeni sohbet aç
2. `BUG-TEMPLATES.md`'den uygun şablonu kopyala
3. `[...]` yerlerini doldur
4. Sohbet yapıştır
5. Bu dosyaya kayıt ekle

### Şablon Kategorileri
| Seri | Kategori | Dosya |
|------|----------|-------|
| ODA-00X | Backend | index.js, database.js, socket |
| ODA-01X | Frontend | Component, CSS, Modal |
| ODA-02X | Kullanıcı | Auth, DM, Takip |
| ODA-03X | Özellikler | Oda, Topluluk, Etkinlik |
| ODA-04X | Güvenlik | Auth açığı, XSS, CSRF |
| ODA-05X | Mobil | Responsive, Touch |
| ODA-06X | Deploy | Build, Nginx, PM2 |
| ODA-07X | Test | Build test, Socket test |

---

## 📊 Durum Kodları

| Kod | Anlam |
|-----|-------|
| 🔴 Açık | Henüz başlanmadı |
| 🟡 Devam Ediyor | Düzeltme yapılıyor |
| 🟢 Tamamlandı | Hata düzeltildi |
| ⚪ Askıya Alındı | Başka bir şeye bağımlı |

---

## 🔒 Oda Kuralları

1. Her oda SADECE belirtilen hatayı düzeltir
2. Başka dosyalara dokunmaz (ilgili dosyalar hariç)
3. Değişiklik sonrası `npm run build` çalıştırır
4. Tamamlanınca bu dosyayı günceller

---

## 📝 Tamamlanan Odalar (Arşiv)

_(Henüz yok)_
