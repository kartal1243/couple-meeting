// backend/src/routes/profile.routes.js - Profil ve mesaj arama rotaları
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const logger = require('../../utils/logger');
const db = require('../../utils/database');
const { broadcastAdminActivity } = require('../services/state');

// Profil ziyareti kaydet
router.post('/api/profile/visit', (req, res) => {
  const { token, visited } = req.body;
  if (!token || !visited) return res.status(400).json({ ok: false });
  const visitor = db.getUserByToken(token);
  if (!visitor) return res.status(401).json({ ok: false });
  if (visitor.username === visited) return res.json({ ok: true });

  try {
    db.getDb().prepare('INSERT INTO profile_visitors (visitor, visited, timestamp) VALUES (?, ?, ?)').run(visitor.username, visited, Date.now());
    db.getDb().prepare('DELETE FROM profile_visitors WHERE id IN (SELECT id FROM profile_visitors WHERE visited = ? ORDER BY timestamp DESC LIMIT -1 OFFSET 50)').run(visited);
  } catch (e) {}
  res.json({ ok: true });
});

// Profil ziyaretçilerini listele
router.get('/api/profile/visitors', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(401).json({ ok: false });
  const user = db.getUserByToken(token);
  if (!user) return res.status(401).json({ ok: false });

  try {
    const visitors = db.getDb().prepare('SELECT DISTINCT visitor FROM profile_visitors WHERE visited = ? ORDER BY timestamp DESC LIMIT 20').all(user.username);
    const result = visitors.map(v => {
      const u = db.getUser(v.visitor);
      return u ? { username: u.username, avatar: u.avatar, isVip: u.isVip, vipLevel: u.vipLevel || 0 } : null;
    }).filter(Boolean);
    res.json({ ok: true, visitors: result });
  } catch (e) {
    res.json({ ok: true, visitors: [] });
  }
});

// Oda mesajlarında arama yap (VIP)
router.get('/api/search/messages', (req, res) => {
  const { token, q, roomId } = req.query;
  if (!token || !q) return res.status(400).json({ ok: false });
  const user = db.getUserByToken(token);
  if (!user) return res.status(401).json({ ok: false });
  if (!user.isVip) return res.status(403).json({ ok: false, message: 'VIP uyelik gerekiyor.' });

  try {
    const results = db.getDb().prepare('SELECT * FROM room_messages WHERE text LIKE ? AND room_id = ? ORDER BY created_at DESC LIMIT 50').all(`%${q}%`, roomId || '%');
    res.json({ ok: true, results });
  } catch (e) {
    res.json({ ok: true, results: [] });
  }
});

// Geri bildirim / Hata bildirimi
router.post('/api/feedback', (req, res) => {
  try {
    const { type, title, description, username, userAgent, url } = req.body;
    if (!type || !title || !description) return res.status(400).json({ ok: false, message: 'Eksik bilgi.' });
    const id = crypto.randomBytes(8).toString('hex');
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
    if (db.getDb()) {
      try {
        db.getDb().prepare('INSERT INTO feedback (id, type, title, description, username, ip, user_agent, url, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
          id, String(type).slice(0, 20), String(title).slice(0, 100), String(description).slice(0, 2000),
          String(username || '').slice(0, 24), ip, String(userAgent || '').slice(0, 300), String(url || '').slice(0, 500), 'open', Date.now()
        );
      } catch (e) {
        logger.error?.('Feedback kaydetme hatası: ' + e.message);
      }
    }
    try {
      broadcastAdminActivity('feedback', { type, title, message: `Yeni geri bildirim: ${title}` });
    } catch (e) {}
    res.json({ ok: true, message: 'Geri bildiriminiz alındı, teşekkürler!' });
  } catch (e) {
    res.status(500).json({ ok: false, message: 'Bir hata oluştu.' });
  }
});

module.exports = router;
