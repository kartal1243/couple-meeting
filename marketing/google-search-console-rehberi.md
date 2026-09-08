# Google Search Console — Adım Adım URL Submit Rehberi

## 🎯 AMAÇ

Sitenizi Google'a hızlıca tanıtmak ve index almasını sağlamak.

---

## 📋 ADIM 1: Google Search Console'a Kayıt Ol

1. https://search.google.com/search-console adresine gidin
2. Google hesabınızla giriş yapın
3. "URL Prefix" seçeneğini seçin
4. https://couplemeeting.com.tr yazın
5. "Devam" butonuna tıklayın

---

## 📋 ADIM 2: Site Sahipliğini Doğrulama

### Yöntem 1: HTML Tag (Önerilen)

1. "HTML etiketi" seçeneğini seçin
2. Verilen meta tag'ı kopyalın:
```html
<meta name="google-site-verification" content="VERIFICATION_CODE" />
```
3. Bu kodu `index.html` dosyasının `<head>` bölümüne ekleyin
4. Deploy edin
5. "Doğrula" butonuna tıklayın

### Yöntem 2: HTML Dosyası

1. "HTML dosyası" seçeneğini seçin
2. Verilen HTML dosyasını indirin
3. Dosyayı web sitenizin kök dizinine yükleyin
4. "Doğrula" butonuna tıklayın

### Yöntem 3: DNS Kaydı

1. "DNS kaydı" seçeneğini seçin
2. Verilen TXT kaydını kopyalın
3. DNS yönetim panelinizde TXT kaydı ekleyin
4. "Doğrula" butonuna tıklayın

---

## 📋 ADIM 3: Sitemap Gönder

1. Sol menüden "Sitemap" seçeneğine tıklayın
2. URL bölümüne yazın:
```
https://couplemeeting.com.tr/sitemap.xml
```
3. "Gönder" butonuna tıklayın

---

## 📋 ADIM 4: URL Submit (Hızlı Index)

### Yöntem 1: Manuel URL Submit

1. Sol menüden "URL Inspection" seçeneğine tıklayın
2. URL bölümüne sayfa adresini yazın:
```
https://couplemeating.com.tr
```
3. "İstek" butonuna tıklayın
4. "Dizine Ekle" butonuna tıklayın

### Yöntem 2: Toplu URL Submit

1. Her sayfa için yukarıdaki işlemi tekrarlayın

**Submit edilecek sayfalar:**
```
https://couplemeeting.com.tr/
https://couplemeeting.com.tr/landing
https://couplemeeting.com.tr/communities
https://couplemeeting.com.tr/events
```

---

## 📋 ADIM 5: Bing Webmaster Tools

1. https://www.bing.com/webmasters adresine gidin
2. Google hesabınızla giriş yapın
3. Site adresinizi ekleyin
4. Doğrulama yapın (HTML tag ile)
5. Sitemap gönderin: https://couplemeeting.com.tr/sitemap.xml

---

## 📋 ADIM 6: Yandex Webmaster Tools

1. https://webmaster.yandex.com.tr adresine gidin
2. Yandex hesabınızla giriş yapın
3. Site adresinizi ekleyin
4. Doğrulama yapın
5. Sitemap gönderin

---

## 📋 ADIM 7: Dizin Kayıtları

### Google My Business

1. https://business.google.com adresine gidin
2. İşletme adı ekleyin: "Couple Meeting"
3. Adres: Gerekli değil (çevrimiçi işletme)
4. Kategori: "Yazılım Şirketi" veya "Uygulama Geliştirici"
5. Web sitesi: https://couplemeeting.com.tr

### Apple Maps

1. https://mapsconnect.apple.com adresine gidin
2. İşletme bilgilerinizi girin
3. Doğrulama yapın

---

## 📋 ADIM 8: Index Hızlandırma İpuçları

### Sitemap Optimizasyonu

- Tüm sayfaları kapsayın
- Son değişiklik tarihlerini ekleyin
- Öncelik sırası verin

### İçerik Kalitesi

- Benzersiz ve değerli içerik yazın
- Anahtar kelimeleri doğal kullanın
- Başlık ve açıklamaları optimize edin

### Teknik SEO

- Hızlı yükleme sağlayın
- Mobil uyumlu olun
- SSL sertifikası kullanın

### Backlink

- Kaliteli sitelerden backlink alın
- Sosyal medyada paylaşın
- Forumlarda tanıtım yapın

---

## 📋 ADIM 9: Takip ve Analiz

### Haftalık Kontrol

- Google Search Console'da tıklama/gösterim sayısını kontrol edin
- Hata varsa düzeltin
- Yeni sayfaları submit edin

### Aylık Analiz

- Sıralama değişikliklerini izleyin
- En çok tıklanan sayfaları analiz edin
- Yeni anahtar kelimeler keşfedin

---

## 🚨 SIKÇA YAPILAN HATALAR

1. **Doğrulama kodunu deploy etmemek**: Kodu ekledikten sonra deploy etmeyi unutmayın
2. **Sitemap göndermemek**: Her sayfa için sitemap gerekli
3. **URL submit etmemek**: Manuel submit index hızlandırır
4. **Mobil uyumsuzluk**: Google mobil uyumluluğa önem verir
5. **Yavaş yükleme**: Sayfa hızı sıralamayı etkiler

---

## ✅ KONTROL LİSTESİ

- [ ] Google Search Console'a kayıt olundu
- [ ] Site sahipliği doğrulandı
- [ ] Sitemap gönderildi
- [ ] Ana sayfa submit edildi
- [ ] Tüm sayfalar submit edildi
- [ ] Bing Webmaster Tools'a kayıt olundu
- [ ] Yandex Webmaster Tools'a kayıt olundu
- [ ] Google My Business eklendi
- [ ] Backlink çalışması başlatıldı
- [ ] Blog yazıları eklendi
