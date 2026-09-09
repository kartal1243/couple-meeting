# 📱 Couple Meeting - Mobil Uygulama Yol Haritası

## 🎯 Mevcut Durum
- **Teknoloji:** Capacitor + React (WebView tabanlı)
- **Platform:** Android (iOS henüz yok)
- **Durum:** MVP aşamasında, temel UI tamamlandı

---

## 📋 AŞAMA 1: Temel Stabilite (1-2 hafta)
### Öncelik: YÜKSEK

- [ ] **Alt navigasyon düzeltmesi** - Sekmeler arası geçiş stabilitesi
- [ ] **Scroll sorunu** - Her sekmenin bağımsız scroll pozisyonu
- [ ] **Giriş/Kayıt** - Mobilde tam çalışan auth akışı
- [ ] **Bildirim izni** - Push notification izni isteme
- [ ] **Çıkış但onayı** - Mobilde çıkış için onay dialogu
- [ ] **Geri tuşu** - Android geri tuşu davranışı

---

## 📋 AŞAMA 2: Temel Özellikler (2-3 hafta)
### Öncelik: YÜKSEK

### 🔐 Auth & Profil
- [ ] **Giriş/Kayıt** - Email + şifre ile tam akış
- [ ] **Şifre sıfırlama** - Mobilde email ile şifre sıfırlama
- [ ] **Profil düzenleme** - Avatar, isim, bio düzenleme
- [ ] **Profil fotoğrafı** - Kameradan çekme / galeriden seçme
- [ ] **Çıkış** - Hesaptan çıkış + onay

### 🏠 Odalar
- [ ] **Oda oluşturma** - Mobilde oda oluşturma formu
- [ ] **Odaya katılma** - Şifreli/şifresiz oda katılma
- [ ] **Oda listesi** - Canlı oda listesi (artık animasyonlu)
- [ ] **Oda detayı** - Kullanıcı listesi, oda bilgileri
- [ ] **Odanı terk et** - Odayı terk etme butonu

### 💬 Sohbet
- [ ] **Genel sohbet** - Tüm kullanıcılar arası mesajlaşma
- [ ] **Mesaj gönderme** - Text mesajları
- [ ] **Mesaj geçmişi** - Eski mesajları yükleme
- [ ] **Yazıyor göstergesi** - "Yazıyor..." animasyonu
- [ ] **Emoji desteği** - Emoji picker

---

## 📋 AŞAMA 3: Sosyal Özellikler (2-3 hafta)
### Öncelik: ORTA

### 👥 Arkadaşlık Sistemi
- [ ] **Arkadaş ekleme** - Kullanıcı arama ve arkadaş ekleme
- [ ] **Arkadaşlık istekleri** - Gelen/giden istekler
- [ ] **Arkadaş listesi** - Online/offline durumu
- [ ] **DM (Doğrudan Mesaj)** - Arkadaşlarla özel sohbet
- [ ] **Engelleme** - Kullanıcı engelleme

### 📢 Bildirimler
- [ ] **Push notifications** - Yeni mesaj, arkadaşlık isteği
- [ ] **Bildirim merkezi** - Tüm bildirimleri listeleme
- [ ] **Okundu işareti** - Mesajların okundu durumu

---

## 📋 AŞAMA 4: Medya & Ses (3-4 hafta)
### Öncelik: ORTA

### 🎬 Video/Müzik
- [ ] **YouTube entegrasyonu** - Video paylaşma ve izleme
- [ ] **Müzik paylaşma** - YouTube müzik linkleri
- [ ] **Sesli sohbet** - WebRTC ile sesli görüşme
- [ ] **Ekran paylaşımı** - Mobilde ekran paylaşımı

### 📸 Medya
- [ ] **Fotoğraf paylaşımı** - Kameradan çekme / galeri
- [ ] **Dosya paylaşımı** - Belge, müzik, video
- [ ] **Medya önizleme** - Fotoğraf/video önizleme

---

## 📋 AŞAMA 5: İleri Özellikler (4-6 hafta)
### Öncelik: DÜŞÜK

### 🎨 UI/UX İyileştirmeleri
- [ ] **Karanlık/açık mod** - Tema seçimi
- [ ] **Dil desteği** - Türkçe/İngilizce
- [ ] **Erişilebilirlik** - Screen reader desteği
- [ ] **Animasyonlar** - Daha akıcı geçişler
- [ ] **Skeleton loading** - Yükleniyor animasyonları

### 🔧 Teknik İyileştirmeler
- [ ] **Offline mod** - İnternet yokken temel özellikler
- [ ] **Veri_OPTİMİZASYONU** - Daha az veri kullanımı
- [ ] **Performans** - Daha hızlı yükleme
- [ ] **Bellek yönetimi** - Daha az bellek kullanımı
- [ ] **Battery optimization** - Pil tüketimi azaltma

### 🛡️ Güvenlik
- [ ] **Biometric login** - Parmak izi / yüz tanıma
- [ ] **2FA** - İki faktörlü doğrulama
- [ ] **Oturum yönetimi** - Aktif oturumları görme
- [ ] **Güvenlik bildirimleri** - Şüpheli aktivite uyarıları

---

## 📋 AŞAMA 6: iOS & Yayınlama (2-3 hafta)
### Öncelik: DÜŞÜK

### 🍎 iOS
- [ ] **iOS projesi oluşturma** - Capacitor ile iOS desteği
- [ ] **iOS test** - TestFlight ile test
- [ ] **iOS optimizasyonu** - iOS'e özel iyileştirmeler

### 📦 Yayınlama
- [ ] **Google Play Store** - Uygulama mağazasına yükleme
- [ ] **App Store** - iOS mağazasına yükleme
- [ ] **ASO optimizasyonu** - Mağaza listeleme optimizasyonu
- [ ] **Uygulama ikonu** - Yüksek kaliteli ikon
- [ ] **Splash screen** - Açılış ekranı
- [ ] **Screenshot'lar** - Mağaza için ekran görüntüleri

---

## 📊 Öncelik Sıralaması

| Aşama | Süre | Öncelik | Durum |
|-------|------|---------|-------|
| 1. Temel Stabilite | 1-2 hafta | YÜKSEK | 🔄 Devam ediyor |
| 2. Temel Özellikler | 2-3 hafta | YÜKSEK | ⏳ Bekliyor |
| 3. Sosyal Özellikler | 2-3 hafta | ORTA | ⏳ Bekliyor |
| 4. Medya & Ses | 3-4 hafta | ORTA | ⏳ Bekliyor |
| 5. İleri Özellikler | 4-6 hafta | DÜŞÜK | ⏳ Bekliyor |
| 6. iOS & Yayınlama | 2-3 hafta | DÜŞÜK | ⏳ Bekliyor |

**Toplam Tahmini Süre:** 14-21 hafta (3.5 - 5 ay)

---

## 🚀 Hızlı Başlangıç Önerileri

### Bu Hafta Yapılacaklar:
1. ✅ **Alt navigasyon stabilize** - 5 sekme düzgün çalışsın
2. ✅ **Giriş/Kayıt akışı** - Mobilde tam çalışan auth
3. ✅ **Oda oluşturma/katılma** - Temel oda işlemleri
4. ✅ **Genel sohbet** - Temel mesajlaşma

### Gelecek Hafta:
1. 👥 **Arkadaşlık sistemi** - Ekleme, istek, liste
2. 🔔 **Bildirimler** - Push notification desteği
3. 📸 **Profil fotoğrafı** - Kameradan çekme

### 2 Hafta Sonra:
1. 🎬 **Video/Müzik** - YouTube entegrasyonu
2. 🎤 **Sesli sohbet** - WebRTC entegrasyonu
3. 📱 **iOS desteği** - İlk iOS deneme

---

## 🛠️ Teknik Notlar

### Capacitor Avantajları:
- ✅ Web teknolojileri ile Development
- ✅ Tek codebase ile iOS + Android
- ✅ Mevcut React kodunu yeniden kullanma
- ✅ Plugin ekosistemi (kamera, bildirim, vb.)

### Capacitor Dezavantajları:
- ❌ Native uygulamalara göre daha yavaş
- ❌ WebView tabanlı (performans sınırları)
- ❌ Derin native API erişimi zor
- ❌ Uygulama boyutu daha büyük

### Önerilen Teknoloji Stack:
- **Frontend:** React + Capacitor
- **Backend:** Express + Socket.IO (mevcut)
- **State:** React Context (mevcut) veya Zustand
- **Animasyonlar:** CSS Animations (mevcut) veya Framer Motion
- **Test:** Jest + Playwright
- **CI/CD:** GitHub Actions + Fastlane

---

## 📈 Milestone Takvimi

### Milestone 1 (Bu Ay Sonu):
- ✅ Temel UI tamamlandı
- 🔄 Alt navigasyon çalışıyor
- 🔄 Giriş/Kayıt çalışıyor
- 🔄 Odalar görüntülenebiliyor

### Milestone 2 (Gelecek Ay):
- ⏳ Arkadaşlık sistemi çalışıyor
- ⏳ Bildirimler çalışıyor
- ⏳ Temel sohbet çalışıyor

### Milestone 3 (2 Ay Sonra):
- ⏳ Video/Müzik çalışıyor
- ⏳ Sesli sohbet çalışıyor
- ⏳ iOS desteği eklendi

### Milestone 4 (3 Ay Sonra):
- ⏳ Google Play'de yayınlandı
- ⏳ App Store'da yayınlandı
- ⏳ Tüm temel özellikler çalışıyor

---

*Son güncelleme: 2026-01-09*
*Proje: Couple Meeting*
*Geliştirici: Ömer Yaman*
