# Couple Meeting - Backend Yol Haritası
## 📊 Mevcut Durum

### Aktif Özellikler (40 Socket Handler)
| Kategori | Handler Sayısı | Durum |
|----------|---------------|-------|
| Auth (Giriş/Kayıt) | 4 | ✅ Çalışıyor |
| Profil & Sosyal | 2 | ✅ Çalışıyor |
| Arkadaşlık | 4 | ✅ Çalışıyor |
| Global Chat | 1 | ✅ Çalışıyor |
| DM (Özel Mesaj) | 4 | ⚠️ RAM'de (sunucu Reinicia silinir) |
| Grup Sohbeti | 5 | ⚠️ RAM'de (sunucu Reinicia silinir) |
| Müzik Arama | 1 | ✅ Çalışıyor |
| Oda Yönetimi | 3 | ✅ Çalışıyor |
| Playlist & Kategoriler | 4 | ✅ Çalışıyor |
| Medya Senkronizasyonu | 1 | ✅ Çalışiyor |
| Ekran Paylaşımı | 3 | ✅ Çalışıyor |
| Sesli Görüşme | 4 | ✅ Çalışıyor |
| Tombala | 4 | ✅ Çalışıyor |
| Bağlantı & Yaşam Döngüsü | 3 | ✅ Çalışıyor |
| Oda Senkronizasyonu | 1 | ✅ Çalışıyor |

---

## 🔴 KRİTİK - Hemen Yapılmalı

### 1. DM & Grup Mesajlarını Veritabanına Kaydet
**Durum:** ⚠️ RAM'de tutuluyor, sunucu restart'da siliniyor
**Çözüm:**
```sql
CREATE TABLE dm_messages (
  id TEXT PRIMARY KEY,
  from_username TEXT,
  to_username TEXT,
  text TEXT,
  time TEXT,
  created_at INTEGER,
  read INTEGER DEFAULT 0
);

CREATE TABLE group_messages (
  id TEXT PRIMARY KEY,
  group_id TEXT,
  from_username TEXT,
  text TEXT,
  time TEXT,
  created_at INTEGER
);
```

### 2. Email Doğrulama
**Durum:** ❌ Yok
**Çözüm:** Kayıt sonrası doğrulama emaili gönder (Nodemailer + Gmail SMTP)

### 3. Şifre Değiştirme (Giriş Yapmış Kullanıcı)
**Durum:** ❌ Sadece "şifremi unuttum" var
**Çözüm:** `change_password` handler (eski şifre + yeni şifre)

---

## 🟡 ÖNEMLİ - Yakın Zamanda

### 4. Mesaj Tepkileri (Emoji Reactions)
**Durum:** ❌ Yok
**Çözüm:** Her mesaja emoji tepkisi ekleme
```
message_reactions: { messageId: { emoji: [user1, user2] } }
```

### 5. Yazma İndikatörü (Typing Indicator)
**Durum:** ❌ Yok
**Çözüm:** `typing_start` / `typing_stop` eventleri

### 6. Okundu Bilgisi (Read Receipts)
**Durum:** �ənarvi DM'de var ama bildirim yok
**Çözüm:** Mesaj okunduğunda gönderene bildirim

### 7. Kullanıcı Engelleme
**Durum:** ❌ Yok
**Çözüm:** `block_user` / `unblock_user` + engelli liste

### 8. Mesaj Silme & Düzenleme
**Durum:** ❌ Yok
**Çözüm:** `delete_message` / `edit_message` handlerları

### 9. Oda Daveti
**Durum:** ❌ Oda ID'si bilinmeli
**Çözüm:** `invite_to_room` → kullanıcı adına davet gönder

### 10. Profil Fotoğrafı Yükleme
**Durum:** ❌ Sadece emoji avatar
**Çözüm:** Multer ile dosya yükleme, Sharp ile boyutlandırma

---

## 🟢 GELİŞTİRME - Orta Vade

### 11. Takip Sistemi
**Durum:** ❌ Sadece çift taraflı arkadaşlık var
**Çözüm:** Tek taraflı takip + takipçi listesi

### 12. Bildirim Sistemi
**Durum:** ❌ Yok
**Çözüm:** 
-_push notification (Web Push API)
- In-app bildirimler
- Bildirim tercihleri

### 13. Kullanıcı Raporlama
**Durum:** ❌ Yok
**Çözüm:** `report_user` → admin paneline düşsün

### 14. Admin Rol Sistemi
**Durum:** ❌ Paylaşımlı şifre
**Çözüm:** Roller: user, mod, admin, superadmin

### 15. İki Faktörlü Doğrulama (2FA)
**Durum:** ❌ Yok
**Çözüm:** TOTP (Google Authenticator)

---

## 🔵 VİZYON - Uzun Vade

### 16. Topluluklar (Communities)
**Durum:** ❌ Yok
**Çözüm:** İlgi alanlarına göre topluluk oluşturma

### 17. Gönderi & Feed Sistemi
**Durum:** ❌ Yok
**Çözüm:** Fotoğraf/video paylaşımı + yorum + beğeni

### 18. Etkinlik Takvimi
**Durum:** ❌ Yok
**Çözüm:** Etkinlik oluşturma + katılım + hatırlatma

### 19. Veri Dışa Aktarma (GDPR)
**Durum:** ❌ Yok
**Çözüm:** Kullanıcı verilerini indirme

### 20. Multi-Instance Destek (Redis)
**Durum:** ❌ Tek sunucu
**Çözüm:** Redis ile oturum paylaşımı

---

## 📋 ÖNCELİK SIRASI

### Hafta 1-2: Kritik Hatalar
- [ ] DM mesajlarını veritabanına kaydet
- [ ] Grup mesajlarını veritabanına kaydet
- [ ] Şifre değiştirme handlerı
- [ ] Email doğrulama (opsiyonel)

### Hafta 3-4: Temel Sosyal
- [ ] Mesaj tepkileri (emoji)
- [ ] Yazma indikatörü
- [ ] Okundu bilgisi (bildirim)
- [ ] Kullanıcı engelleme

### Hafta 5-6: Od İyileştirmeleri
- [ ] Oda daveti sistemi
- [ ] Profil fotoğrafı yükleme
- [ ] Mesaj silme/düzenleme
- [ ] Admin rol sistemi

### Hafta 7-8: İleri Özellikler
- [ ] Takip sistemi
- [ ] Bildirim sistemi
- [ ] Kullanıcı raporlama
- [ ] İki faktörlü doğrulama

---

## 🛠️ TEKNİK NOTLAR

### Mevcut Altyapı
- **Veritabanı:** SQLite (better-sqlite3)
- **Auth:** Token tabanlı (JWT değil)
- **Real-time:** Socket.IO
- **Güvenlik:** Helmet, rate-limit, scrypt password hashing
- **Deployment:** PM2 + Nginx + Cloudflare

### Önerilen İyileştirmeler
- Redis ekle (çoklu sunucu desteği)
- JWT + refresh token sistemi
- Web Push API (bildirimler)
- Multer + Sharp (dosya yükleme)
- Bull Queue (arka plan işleri)

---

## 💰 MONETİZASYON NOTLARI

### Mevcut VIP Sistemi
- Oda oluşturma
- Emerald teması
- 60fps video

### Ek VIP Özellikler
- Özel emojiler
- Profil rozetleri
- Öncelikli destek
- Reklamsız deneyim
- Özel sesli sohbet odaları

---

## 📞 İLETİŞİM

- **Sunucu:** 213.142.148.75
- **Admin:** https://couplemeeting.com.tr/admin
- **E-posta:** support@couplemeeting.comtr
- **GitHub:** github.com/kartal1243/couple-meeting
