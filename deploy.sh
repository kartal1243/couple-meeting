#!/bin/bash
# GÜVENLİ DEPLOY - Verilere DOKUNMAZ
cd /root/couple-meeting
git fetch --all
git reset --hard origin/main
cd frontend
npm run build
# Sadece frontend dosyalarını güncelle, veritabanına dokunma
sudo rm -rf /var/www/couplemeeting/assets
sudo cp -r dist/* /var/www/couplemeeting/
cd /root/couple-meeting/backend
npm install --prefix /root/couple-meeting/backend
pm2 restart couple-meeting
echo "Deploy tamamlandı! Veritabanı korundu."
