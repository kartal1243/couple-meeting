# 🔒 GELİŞTİRME KURALLARI — Bu dosyayı okumadan kod yazma!

> Bu dosya, bu projedeki tüm AI çalışmalarının temel kurallarını içerir.
> Her sohbet başlangıcında bu dosyayı oku.

---

## 1. ANA KURAL
**Mevcut çalışan sistemi koru.**
- Yeni özellik istediğinde mevcut sistemi baştan yazma.
- Hata bildirdiğinde önce hatanın gerçek kaynağını bul, sonra sadece gerekli kısmı düzelt.
- Rastgele dosya değiştirme.
- Tahmin ederek kod değiştirme.

## 2. HATA ÇÖZME SİSTEMİ
**Hata verildiğinde hemen kod yazma.**
1. Hatanın mesajını analiz et
2. Hangi özellik ile ilgili olduğunu belirle
3. Projede bu özelliğin hangi dosya/dosyalarda bulunduğunu ara
4. Hatanın gerçek kaynağını tespit et
5. İlgili kodu incele
6. Başka dosyaları etkileyip etkilemediğini kontrol et
7. Sonra çözüm uygula

## 3. YENİ ÖZELLİK EKLERKEN
- Önce mevcut sistemi incele
- Yeni özellik mevcut hangi dosyalarla ilişkili bunu bul
- Mümkünse mevcut kodu kullan
- Gereksiz yeni dosya oluşturma
- Mevcut çalışan özellikleri değiştirme
- Yeni özellik eski özellikleri bozuyorsa bunu bildir ve güvenli çözüm uygula

## 4. GERİ ALMA / SİLME KURALI
**"Bunu sil" denildiğinde:**
- SADECE sonradan eklenen veya kaldırılması istenen değişikliği geri al
- Eski çalışan sistemi silme
- İlgisiz dosyalara dokunma
- Bir özelliği kaldırırken o özelliğin kullandığı kodları tespit et
- Başka özelliklerin kullandığı ortak kodları silme
- Kullanım yerlerini kontrol et

## 5. DOSYA DEĞİŞTİRME KURALI
- Bir dosyayı değiştirmeden o dosyanın projedeki görevini anla
- Sadece hata o dosyadaysa veya değişiklik gerçekten o dosyayı gerektiriyorsa dokun
- "Belki buradadır" mantığıyla dosya değiştirme
- Bir değişiklik birden fazla dosya gerektiriyorsa sadece gerekli dosyalara dokun

## 6. TASARIM KURALI
**Özellikle tasarım değişikliği istenmedikçe:**
- Renkleri değiştirme
- Fontları değiştirme
- Sayfa düzenini değiştirme
- Responsive yapıyı bozma
- Animasyonları kaldırma
- Header/sidebar/navbar yapısını değiştirme
- Mevcut tasarımı yeniden tasarlama

## 7. BACKEND KURALI
**Özellikle istenmedikçe:**
- Database yapısını değiştirme
- API endpointlerini değiştirme
- Authentication sistemini değiştirme
- Environment değişkenlerini değiştirme
- Backend mimarisini yeniden yazma

## 8. DEĞİŞİKLİK ÖNCESİ KONTROL
Her önemli değişiklikten önce:
- Bu kod nerede kullanılıyor?
- Bu değişiklik başka bir özelliği etkiler mi?
- Bu dosyanın başka bağımlılıkları var mı?
- Mevcut API ile uyumlu mu?
- Mevcut database ile uyumlu mu?
- Mevcut authentication ile uyumlu mu?

## 9. DEĞİŞİKLİK SONRASI KONTROL
Değişiklik yaptıktan sonra:
- Build hatalarını kontrol et
- İlgili özelliği kontrol et
- Değişiklikten etkilenebilecek mevcut özellikleri kontrol et
- Bir hata oluşursa yeni değişiklikler yaparak hatayı büyütme
- Önce yaptığın son değişikliği analiz et
- Gerekirse son değişikliği geri al

## 10. DOĞRU ANLAMA
- Kısa hata mesajları verilebilir ("Mesaj gönderilmiyor", "Profil açılmıyor")
- Bu durumda benden dosya yollarını istemeden projeyi kendin araştır
- Hatanın doğru yerini bul
- Kod bilinmeyebilir, hangi dosyaya bakılması gerektiğini bekleme

## 11. GEREKSİZ DEĞİŞİKLİK YAPMA
- 1 dosya yeterliyse 10 dosya değiştirme
- Kodun çalışan kısımlarını yeniden yazma
- "Temizlemek", "modernleştirmek" bahanesiyle istenmeyen değişiklik yapma

## 12. PROJE HAFIZASI
- Bu sohbet boyunca yapılan değişiklikleri dikkate al
- Önceki eklenen bir özellik kaldırılacaksa son yapılan değişiklikleri tespit ederek geri al
- Yeni özellik eklemeden önce mevcut projede o özelliğin daha önce yapılıp yapılmadığını kontrol et
- Aynı sistemi ikinci kez oluşturma

## 13. ÇOK ÖNEMLİ
- "Hata var" → ÖNCE ARAŞTIR → KAYNAĞI BUL → ETKİ ALANINI KONTROL ET → SONRA DÜZELT
- "Şunu ekle" → ÖNCE MEVCUT SİSTEMİ İNCELE → NEREYE EKLENECEĞİNİ BUL → SONRA EKLE
- "Şunu sil" → ÖNCE BU KODUN NEDEN EKLENDİĞİNİ VE NERELERDE KULLANILDIĞINI BUL → SADECE İLGİLİ DEĞİŞİKLİĞİ GERİ AL

---

## SON KURAL
**PROJEYİ SÜREKLİ DEĞİŞTİRMEK DEĞİL, PROJEYİ BOZMADAN GELİŞTİRMEK.**

Öncelik sırası:
1. Mevcut sistemi koru
2. Sorunun gerçek kaynağını bul
3. En küçük gerekli değişikliği yap
4. Değişiklik sonrası kontrol et
5. Başka çalışan özellikleri bozma
