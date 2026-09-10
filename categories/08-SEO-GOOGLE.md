# 📈 SEO / GOOGLE — AI Çalışma Alanı

## Amaç
SEO, Google Search, Google Ads, sitemap, robots.txt, metadata, favicon, logo ve indeksleme.

## Görev Sınırı
- Meta tag optimizasyonu
- Sitemap/robots.txt yönetimi
- Schema.org markup
- Open Graph meta tags
- Google Search Console entegrasyonu
- Google Ads kampanya yönetimi
- Blog SEO optimizasyonu
- Anahtar kelime araştırması
- Backlink stratejisi

## Dokunulabilir Dosyalar
```
frontend/index.html               — Ana meta tag'ler
frontend/public/robots.txt        — Robots.txt
frontend/public/sitemap.xml       — Sitemap
frontend/public/manifest.json     — PWA manifest
frontend/public/favicon.svg       — Favicon
frontend/public/icon.svg          — İkon
frontend/public/og-image.svg      — OG görseli
frontend/public/og-image.html     — OG görsel HTML
frontend/src/pages/LandingPage.jsx — Landing page SEO
frontend/src/pages/BlogPage.jsx   — Blog SEO
frontend/src/pages/AdsPage.jsx    — Google Ads sayfası
frontend/src/data/blogPosts.js    — Blog içeriği SEO
blog/*.md                         — Blog yazıları (5 dosya)
marketing/seo-stratejisi.md       — SEO stratejisi
marketing/anahtar-kelime-listesi.md — Anahtar kelime listesi
marketing/google-ads-*.md         — Google Ads materyalleri
marketing/google-search-console-rehberi.md — Search Console rehberi
```

## Dokunulmaması Gerekenler
- `backend/` — Backend dosyaları
- `frontend/src/App.jsx` — Ana bileşen
- `frontend/src/Room/*.jsx` — Oda bileşenleri
- `frontend/src/hooks/useSocketEvents.js`
- `frontend/src/components/admin/*.jsx`
- `frontend/src/components/social/*.jsx`
- `promos/` — Tanıtım materyalleri (onay gerekli)

## Kategorilerle İlişkisi
| Kategori | İlişki |
|----------|--------|
| 🎨 TASARIM | OG görsel tasarımını Tasarım ile koordine et |
| 🚀 YENİ ÖZELLİKLER | Yeni sayfalara SEO meta ekle |
| 🌐 DEPLOY | Sitemap/robots.txt deploy sonrası güncelle |

## Çalışma Kuralları
1. **Title:** 50-60 karakter arası
2. **Description:** 150-160 karakter arası
3. **OG Image:** 1200x630px (PNG formatı tercih edilir)
4. **Canonical URL:** Her sayfada canonical tag
5. **Schema.org:** FAQPage, Organization, WebSite
6. **Sitemap:** Deploy sonrası güncelle
7. **Google Ads ID:** `AW-18437444247`

## Değişiklik Öncesi Kontrol
- [ ] Title 50-60 karakter mi?
- [ ] Description 150-160 karakter mi?
- [ ] OG Image doğru boyutta mı?
- [ ] Canonical URL doğru mu?
- [ ] Schema.org markup doğru mu?
- [ ] Sitemap güncellendi mi?
