// backend/src/middlewares/auth.middleware.js - Kimlik doğrulama ara katmanları
const crypto = require('crypto');
const { EFFECTIVE_ADMIN_PASS } = require('../config');
const db = require('../../utils/database');

// Zamanlama saldırılarına karşı güvenli karşılaştırma
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  try {
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

function adminAuth(req, res, next) {
  // GÜVENLİK: Şifre yalnızca header ile alınır (query string log'lara düşer).
  const pass = req.headers['x-admin-pass'];
  if (!EFFECTIVE_ADMIN_PASS || !pass || !safeCompare(String(pass), String(EFFECTIVE_ADMIN_PASS))) {
    return res.status(403).json({ ok: false, message: 'Yetkisiz' });
  }
  next();
}

function requireAuth(token) {
  if (!token) return null;
  return db.getUserByToken(token);
}

module.exports = {
  adminAuth,
  requireAuth,
  safeCompare
};