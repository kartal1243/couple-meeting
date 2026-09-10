# 🌐 DEPLOY / PRODUCTION — AI Çalışma Alanı

## Amaç
Domain, hosting, environment variables, deployment, production ayarları ve yayınlama.

## Görev Sınırı
- Deploy süreci (git push → build → restart)
- Environment variables yönetimi
- Nginx yapılandırması
- PM2 süreç yönetimi
- SSL/sertifika yönetimi
- Cloudflare ayarları
- Domain DNS yönetimi
- Monitoring/logs
- Backup stratejisi

## Dokunulabilir Dosyalar
```
deploy.sh                        — Deploy scripti
nginx-site                        — Nginx yapılandırması
backend/.env                      — Environment variables
backend/package.json              — Bağımlılıklar
frontend/vite.config.js           — Build yapılandırması
frontend/public/manifest.json     — PWA manifest
.gitignore                        — Git ignored dosyalar
```

## Dokunulmaması Gerekenler
- `frontend/src/` — Kaynak kodları (deploy sadece build output'u deploy eder)
- `backend/index.js` — Backend kodu (sadece restart)
- `backend/utils/database.js` — Database
- `marketing/`, `blog/`, `promos/`

## Kategorilerle İlişkisi
| Kategori | İlişki |
|----------|--------|
| 🐛 BUG | Hotfix deploy'u |
| ⚙️ BACKEND | Backend restart |
| 📱 MOBİL | Capacitor build + Play Store deploy |
| 📈 SEO | Sitemap/robots.txt deploy sonrası güncelle |
| 🔐 GÜVENLİK | SSL, security headers |

## Çalışma Kuralları
1. **Deploy komutu (GÜVENLİ):**
   ```bash
   cd ~/couple-meeting && git fetch --all && git reset --hard origin/main && \
   cd frontend && npm run build && \
   sudo rm -rf /var/www/couplemeeting/assets && sudo cp -r dist/* /var/www/couplemeeting/ && \
   cd ~/couple-meeting/backend && npm install && pm2 restart couple-meeting
   ```
2. **ASLA çalıştırılmayacak:** `rm -rf ~/couple-meeting` (database silinir!)
3. **Database yedekleme:** Günlük otomatik yedekleme
4. **PM2 logs:** `pm2 logs couple-meeting`
5. **Nginx restart:** `sudo systemctl restart nginx`
6. **SSL:** Cloudflare Automatic SSL

## Değişiklik Öncesi Kontrol
- [ ] Git status temiz mi?
- [ ] Build başarılı mı? (`npm run build`)
- [ ] `.env` doğru mu?
- [ ] PM2 çalışıyor mu?
- [ ] Nginx çalışıyor mu?
- [ ] SSL aktif mi?
- [ ] Site erişilebilir mi?

## Production Bilgileri
| Bileşen | Değer |
|---------|-------|
| Server IP | `213.142.148.75` |
| SSH | `ssh root@213.142.148.75` |
| Domain | `couplemeeting.comtr` |
| PM2 Process | `couple-meeting` |
| Nginx Config | `/etc/nginx/sites-available/couplemeeting` |
| Build Output | `/var/www/couplemeeting/` |
| Backend Dir | `/root/couple-meeting/backend/` |
| Database | `/root/couple-meeting/backend/data.db` |
