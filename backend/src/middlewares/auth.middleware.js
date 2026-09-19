// backend/src/middlewares/auth.middleware.js - Kimlik doğrulama ara katmanları
const { EFFECTIVE_ADMIN_PASS } = require('../config');
const db = require('../../utils/database');

function adminAuth(req, res, next) {
  const pass = req.headers['x-admin-pass'] || req.query.pass;
  if (!pass || pass !== EFFECTIVE_ADMIN_PASS) {
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
  requireAuth
};
