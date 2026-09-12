const db = require('./utils/database');
db.init();
const crypto = require('crypto');
const hash = crypto.createHash('sha256').update('Test1234!').digest('hex');
try {
  db.db.prepare("INSERT OR IGNORE INTO users (username, email, password, avatar, bio, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run('testreviewer', 'test@couplemeeting.com', hash, '🐱', 'Test hesabi - Google Play inceleme icin', 'online', Date.now());
  console.log('Test hesabi olusturuldu!');
  console.log('Email: test@couplemeeting.com');
  console.log('Sifre: Test1234!');
} catch(e) { console.log('Hata veya mevcut:', e.message); }
process.exit(0);
