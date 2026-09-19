// backend/src/utils/helpers.js - Ortak yardımcı fonksiyonlar
const crypto = require('crypto');

function sanitize(str, maxLen = 500) {
  return String(str || '')
    .trim()
    .slice(0, maxLen)
    .replace(/[<>&"']/g, (c) => ({
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#x27;'
    }[c] || ''));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username) {
  return /^[a-z0-9_]{3,20}$/.test(username);
}

function createRateLimiter() {
  const limits = {};
  return function checkRate(type, max, windowMs = 10000) {
    const now = Date.now();
    if (!limits[type] || now - limits[type].start > windowMs) {
      limits[type] = { start: now, count: 0 };
    }
    limits[type].count++;
    return limits[type].count > max;
  };
}

function generateId(bytes = 8) {
  return crypto.randomBytes(bytes).toString('hex');
}

function getVipLevel(vipActivatedAt) {
  if (!vipActivatedAt) return 0;
  const monthsActive = (Date.now() - vipActivatedAt) / (30 * 24 * 60 * 60 * 1000);
  if (monthsActive >= 12) return 4;
  if (monthsActive >= 6) return 3;
  if (monthsActive >= 3) return 2;
  return 1;
}

function sanitizePlaylistItem(item, username) {
  return {
    id: item.id || generateId(8),
    title: sanitize(item.title, 200) || 'Video',
    type: sanitize(item.type, 20) || 'youtube',
    src: sanitize(item.src, 500) || '',
    thumbnail: sanitize(item.thumbnail, 500) || '',
    addedBy: username
  };
}

function sanitizeEmoji(emoji) {
  return sanitize(emoji, 8);
}

module.exports = {
  sanitize,
  isValidEmail,
  isValidUsername,
  createRateLimiter,
  generateId,
  getVipLevel,
  sanitizePlaylistItem,
  sanitizeEmoji
};
