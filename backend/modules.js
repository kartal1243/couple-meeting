// modules.js - Reusable backend utilities

const crypto = require('crypto');

// 1. Input sanitization
function sanitize(str, maxLen = 500) {
  return String(str || '').trim().slice(0, maxLen).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' }[c] || ''));
}

// 2. Email validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 3. Username validation
function isValidUsername(username) {
  return /^[a-z0-9_]{3,20}$/.test(username);
}

// 4. Rate limiter factory
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

// 5. Room helper
function createRoom(cleanRoomId, password, maxUsers, userId, isVip) {
  return {
    name: cleanRoomId, password: typeof password === 'string' ? password : '',
    maxUsers: Math.min(Math.max(parseInt(maxUsers) || 2, 2), 8),
    hostUserId: userId, theme: 'default', users: [],
    kickedUsers: [],
    playlist: [], categories: ['Genel'], playMode: 'sequence',
    currentMedia: { type: 'none', src: '', time: 0, isPlaying: false, lastUpdated: Date.now() },
    messages: [], createdAt: Date.now(), lastActivityAt: Date.now(), isVip: !!isVip
  };
}

// 6. Generate random ID
function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

// 7. Playlist item sanitizer
function sanitizePlaylistItem(item, username) {
  return {
    id: item.id || generateId(),
    title: sanitize(item.title, 200) || 'Video',
    type: sanitize(item.type, 20) || 'youtube',
    src: sanitize(item.src, 500) || '',
    addedBy: username
  };
}

// 8. Sanitize emoji
function sanitizeEmoji(emoji) {
  return sanitize(emoji, 8);
}

module.exports = {
  sanitize, isValidEmail, isValidUsername, createRateLimiter,
  createRoom, generateId, sanitizePlaylistItem, sanitizeEmoji
};
