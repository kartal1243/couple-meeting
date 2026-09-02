# Couple Meeting - GÜNCEL Yol Haritası (v2)
## 📊 Durum: 18/20 Özellik Tamamlandı (%90)

---

## ✅ TAMAMLANAN ÖZELLİKLER

### 🔴 KRİTİK (3/3 Tamamlandı)
- [x] DM Mesajlarını Veritabanına Kaydet → `dm_messages` tablosu
- [x] Grup Mesajlarını Veritabanına Kaydet → `group_messages` tablosu
- [x] Şifre Değiştirme → `change_password` handler

### 🟡 ÖNEMLİ (7/7 Tamamlandı)
- [x] Mesaj Tepkileri → `add_reaction` / `remove_reaction`
- [x] Yazma İndikatörü → `typing_start` / `typing_stop`
- [x] Okundu Bilgisi → `dm_read_receipt` event
- [x] Kullanıcı Engelleme → `block_user` / `unblock_user`
- [x] Mesaj Silme/Düzenleme → `dm_delete` / `dm_edit`
- [x] Oda Daveti → `invite_to_room`
- [x] Profil Fotoğrafı Yükleme → `/api/upload-avatar`

### 🔧 BUG FIX (3 Bug Düzeltildi)
- [x] DM Sol-Sağ Karışması → `getDmHistory` field alias düzeltildi
- [x] Real-Time Mesaj Gitmiyor → `authTokenRef` closure bug fix
- [x] Sohbetle Yanıtlama → Chat reply ID + mobil touch handler

---

## ⏳ BEKLEYEN ÖZELLİKLER

### 🟢 GELİŞTİRME (4/6 Tamamlandı)
- [x] 🔔 **Bildirim Sistemi** — In-app bildirimler + bell ikonu + unread badge
- [x] 👆 **Takip Sistemi** — Tek taraflı takip + takipçi + feed akışı
- [x] 👮 **Admin Rol Sistemi** — user → mod → admin → superadmin + yetki bazlı kontrol
- [x] 🚨 **Kullanıcı Raporlama** — Şikayet → admin paneli + bildirim
- [x] 📧 **Email Doğrulama** — 6 haneli kod + nodemailer SMTP + profilde durum
- [x] 🔐 **İki Faktörlü Doğrulama** — TOTP + QR kod + Google Authenticator

### 🔵 VİZYON (0/4)
- [ ] 🏘️ **Topluluklar** — İlgi alanına göre topluluk
- [ ] 📝 **Gönderi & Feed** — Fotoğraf/video paylaşımı
- [ ] 📅 **Etkinlik Takvimi** — Etkinlik oluşturma + hatırlatma
- [ ] 📊 **Redis Multi-Instance** — Çoklu sunucu desteği

---

## 📋 TEKNİK DETAYLAR

### Yeni Veritabanı Tabloları
```sql
dm_messages        — DM mesajları (kalıcı)
group_messages     — Grup mesajları (kalıcı)
blocked_users      — Engellenen kullanıcılar
message_reactions  — Mesaj tepkileri (emoji)
```

### Yeni Backend Handler'ları (10 adet)
| Handler | Açıklama |
|---------|----------|
| `change_password` | Şifre değiştirme (eski şifre + yeni şifre) |
| `typing_start` | Yazma indikatörü başlat |
| `typing_stop` | Yazma indikatörü durdur |
| `block_user` | Kullanıcı engelleme |
| `unblock_user` | Engelleme kaldırma |
| `get_blocked_users` | Engellenenleri listele |
| `dm_delete` | DM mesajı silme |
| `dm_edit` | DM mesajı düzenleme |
| `add_reaction` / `remove_reaction` | Mesaj tepkileri |
| `invite_to_room` | Oda daveti gönderme |

### Yeni API Endpoint'leri
| Endpoint | Yöntem | Açıklama |
|----------|--------|----------|
| `/api/upload-avatar` | POST | Profil fotoğrafı yükleme (multer) |
| `/uploads/:filename` | GET | Yüklenen dosyaları sunma |

### Yeni Frontend Fonksiyonları
```javascript
sendDmTyping(to)      // Yazıyor bildirimi
sendDmStopTyping(to)  // Yazmayı durdur
deleteDm(id, user)    // Mesaj sil
editDm(id, user, txt) // Mesaj düzenle
addReaction(id, emoji) // Tepki ekle
removeReaction(id, emoji) // Tepki kaldır
blockUser(username)    // Engelle
unblockUser(username)  // Engeli kaldır
inviteToRoom(user, room) // Oda daveti
changePassword(cur, new) // Şifre değiştir
```

---

## 🎯 SONRAKI ADIMLAR

### Öncelik 1: Bildirim Sistemi (5-7 gün)
- [ ] Web Push API kurulumu
- [ ] Service Worker ekleme
- [ ] Bildirim tercihleri
- [ ] Backend bildirim kaydetme

### Öncelik 2: Takip Sistemi (4-5 gün)
- [ ] `follows` tablosu
- [ ] Takip et/takipten çık handler'ları
- [ ] Takipçi listesi
- [ ] Feed akışı

### Öncelik 3: Admin Rolü (3-4 gün)
- [ ] `user_roles` tablosu
- [ ] Rol bazlı yetkilendirme
- [ ] Admin paneli iyileştirmesi

### Öncelik 4: Email Doğrulama (2-3 gün)
- [ ] Nodemailer SMTP kurulumu
- [ ] Doğrulama emaili gönderme
- [ ] Email token doğrulama

### Öncelik 5: 2FA (3-4 gün)
- [ ] TOTP entegrasyonu
- [ ] QR kod oluşturma
- [ ] Yedek kodlar

---

## 📈 PROJE İSTATİSTİKLERİ

| Metrik | Değer |
|--------|-------|
| Toplam Handler | 80+ |
| Veritabanı Tablosu | 14 |
| Frontend Bileşeni | 20+ |
| API Endpoint | 15 |
| Tamamlanan | %90 |
| Kalan | %10 |

---

## 🛠️ MEVCUT ALTYAPI

- **Backend:** Express + Socket.IO + SQLite
- **Frontend:** React 19 + Vite
- **Deploy:** PM2 + Nginx + Cloudflare
- **Güvenlik:** Helmet, rate-limit, scrypt, engelleme
- **Gerçek Zamanlı:** Socket.IO + heartbeat + online/offline broadcast

---

## 📞 İLETİŞİM

- **Sunucu:** 213.142.148.75
- **Admin:** https://couplemeeting.comtr/admin
- **E-posta:** support@couplemeeting.comtr
- **GitHub:** github.com/kartal1243/couple-meeting
