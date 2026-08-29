const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
let logger;
try { logger = require('./logger'); } catch { logger = console; }

let Database;
let dbAvailable = false;

try {
  Database = require('better-sqlite3');
  dbAvailable = true;
} catch (e) {
  logger.warn?.('⚠️ better-sqlite3 yüklenemedi, JSON fallback kullanılıyor.') || console.warn('⚠️ better-sqlite3 yüklenemedi, JSON fallback kullanılıyor.');
}

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data.db');
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, '..', 'data.json');

let db;
const jsonFallback = {
  users: {}, emailToUsername: {}, tokens: {}, friendRequests: {}, friendships: {}, globalMessages: []
};

function loadJson() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      Object.assign(jsonFallback, saved);
      jsonFallback.globalMessages = Array.isArray(jsonFallback.globalMessages) ? jsonFallback.globalMessages.slice(-100) : [];
    }
  } catch {}
}
function saveJson() {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(jsonFallback, null, 2), 'utf8'); } catch {}
}

function getDb() {
  if (!db && dbAvailable) {
    try {
      db = new Database(DB_PATH);
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      initTables();
      logger.info?.('📦 SQLite veritabanı bağlandı: ' + DB_PATH) || console.log('📦 SQLite bağlandı');
    } catch (e) {
      logger.warn?.('SQLite bağlantı hatası, JSON fallback: ' + e.message) || console.warn('SQLite hatası:', e.message);
      dbAvailable = false;
    }
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
      avatar TEXT DEFAULT '🐱', bio TEXT DEFAULT '', status TEXT DEFAULT '',
      is_vip INTEGER DEFAULT 0, vip_expiry INTEGER DEFAULT 0, vip_plan TEXT DEFAULT '',
      vip_activated_at INTEGER DEFAULT 0, stripe_customer_id TEXT DEFAULT '',
      stripe_subscription_id TEXT DEFAULT '', created_at INTEGER NOT NULL, last_seen INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS tokens (
      token TEXT PRIMARY KEY, username TEXT NOT NULL, created_at INTEGER NOT NULL,
      FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS friend_requests (
      id TEXT PRIMARY KEY, from_username TEXT NOT NULL, from_avatar TEXT DEFAULT '🐱',
      to_username TEXT NOT NULL, status TEXT DEFAULT 'pending', created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS friendships (
      user1 TEXT NOT NULL, user2 TEXT NOT NULL, created_at INTEGER NOT NULL,
      PRIMARY KEY (user1, user2)
    );
    CREATE TABLE IF NOT EXISTS global_messages (
      id TEXT PRIMARY KEY, username TEXT NOT NULL, avatar TEXT DEFAULT '🐱',
      text TEXT NOT NULL, time TEXT NOT NULL, created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tokens_username ON tokens(username);
    CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests(to_username, status);
    CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON friendships(user1);
    CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON friendships(user2);
    CREATE INDEX IF NOT EXISTS idx_global_messages_time ON global_messages(created_at);
  `);
}

// --- USER ---
function getUser(username) {
  if (getDb()) {
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    return row ? formatUser(row) : null;
  }
  return jsonFallback.users[username] || null;
}

function getUserByEmail(email) {
  if (getDb()) {
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    return row ? formatUser(row) : null;
  }
  const uname = jsonFallback.emailToUsername[email];
  return uname ? jsonFallback.users[uname] : null;
}

function getUserByToken(token) {
  if (getDb()) {
    const row = db.prepare('SELECT u.* FROM users u JOIN tokens t ON u.username = t.username WHERE t.token = ?').get(token);
    return row ? formatUser(row) : null;
  }
  const uname = jsonFallback.tokens[token];
  return uname ? jsonFallback.users[uname] : null;
}

function createUser(username, email, passwordHash, avatar, bio) {
  const now = Date.now();
  if (getDb()) {
    db.prepare('INSERT INTO users (username, email, password_hash, avatar, bio, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?)').run(username, email, passwordHash, avatar || '🐱', bio || '', now, now);
  } else {
    jsonFallback.users[username] = { username, email, passwordHash, avatar: avatar || '🐱', bio: bio || '', status: '', createdAt: now, lastSeen: now };
    jsonFallback.emailToUsername[email] = username;
    saveJson();
  }
}

function updateUser(username, fields) {
  if (getDb()) {
    const sets = []; const vals = [];
    for (const [key, val] of Object.entries(fields)) { sets.push(`${key} = ?`); vals.push(val); }
    vals.push(username);
    db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE username = ?`).run(...vals);
  } else {
    const user = jsonFallback.users[username];
    if (user) {
      for (const [key, val] of Object.entries(fields)) {
        const jsKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        user[jsKey] = val;
      }
      saveJson();
    }
  }
}

function updateLastSeen(username) {
  if (getDb()) {
    db.prepare('UPDATE users SET last_seen = ? WHERE username = ?').run(Date.now(), username);
  } else if (jsonFallback.users[username]) {
    jsonFallback.users[username].lastSeen = Date.now();
    saveJson();
  }
}

// --- TOKEN ---
function createToken(username) {
  const token = crypto.randomBytes(32).toString('hex');
  if (getDb()) {
    db.prepare('DELETE FROM tokens WHERE username = ?').run(username);
    db.prepare('INSERT INTO tokens (token, username, created_at) VALUES (?, ?, ?)').run(token, username, Date.now());
  } else {
    for (const [t, u] of Object.entries(jsonFallback.tokens)) { if (u === username) delete jsonFallback.tokens[t]; }
    jsonFallback.tokens[token] = username;
    saveJson();
  }
  return token;
}

function cleanOldTokens(maxAge) {
  if (getDb()) {
    return db.prepare('DELETE FROM tokens WHERE created_at < ?').run(Date.now() - maxAge).changes;
  }
  let cleaned = 0;
  for (const [t, u] of Object.entries(jsonFallback.tokens)) {
    const user = jsonFallback.users[u];
    if (!user || (Date.now() - (user.createdAt || 0)) > maxAge) { delete jsonFallback.tokens[t]; cleaned++; }
  }
  if (cleaned > 0) saveJson();
  return cleaned;
}

// --- FRIENDS ---
function sendFriendRequest(fromUsername, fromAvatar, toUsername) {
  const id = crypto.randomBytes(10).toString('hex');
  if (getDb()) {
    db.prepare('INSERT INTO friend_requests (id, from_username, from_avatar, to_username, status, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(id, fromUsername, fromAvatar, toUsername, 'pending', Date.now());
  } else {
    jsonFallback.friendRequests[id] = { id, fromUsername, fromAvatar, toUsername, status: 'pending', createdAt: Date.now() };
    saveJson();
  }
  return id;
}

function getPendingFriendRequests(username) {
  if (getDb()) {
    return db.prepare('SELECT * FROM friend_requests WHERE to_username = ? AND status = ?').all(username, 'pending');
  }
  return Object.values(jsonFallback.friendRequests).filter(r => r.toUsername === username && r.status === 'pending');
}

function getFriendRequest(requestId) {
  if (getDb()) return db.prepare('SELECT * FROM friend_requests WHERE id = ?').get(requestId);
  return jsonFallback.friendRequests[requestId] || null;
}

function updateFriendRequest(requestId, status) {
  if (getDb()) {
    db.prepare('UPDATE friend_requests SET status = ? WHERE id = ?').run(status, requestId);
  } else if (jsonFallback.friendRequests[requestId]) {
    jsonFallback.friendRequests[requestId].status = status;
    saveJson();
  }
}

function areFriends(user1, user2) {
  if (getDb()) {
    return !!db.prepare('SELECT 1 FROM friendships WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)').get(user1, user2, user2, user1);
  }
  const f1 = jsonFallback.friendships[user1] || [];
  const f2 = jsonFallback.friendships[user2] || [];
  return f1.includes(user2) || f2.includes(user1);
}

function addFriendship(user1, user2) {
  const now = Date.now();
  if (getDb()) {
    db.prepare('INSERT OR IGNORE INTO friendships (user1, user2, created_at) VALUES (?, ?, ?)').run(user1, user2, now);
    db.prepare('INSERT OR IGNORE INTO friendships (user1, user2, created_at) VALUES (?, ?, ?)').run(user2, user1, now);
  } else {
    if (!jsonFallback.friendships[user1]) jsonFallback.friendships[user1] = [];
    if (!jsonFallback.friendships[user2]) jsonFallback.friendships[user2] = [];
    if (!jsonFallback.friendships[user1].includes(user2)) jsonFallback.friendships[user1].push(user2);
    if (!jsonFallback.friendships[user2].includes(user1)) jsonFallback.friendships[user2].push(user1);
    saveJson();
  }
}

function removeFriendship(user1, user2) {
  if (getDb()) {
    db.prepare('DELETE FROM friendships WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)').run(user1, user2, user2, user1);
  } else {
    jsonFallback.friendships[user1] = (jsonFallback.friendships[user1] || []).filter(u => u !== user2);
    jsonFallback.friendships[user2] = (jsonFallback.friendships[user2] || []).filter(u => u !== user1);
    saveJson();
  }
}

function getFriends(username) {
  if (getDb()) {
    return db.prepare('SELECT u.* FROM users u JOIN friendships f ON f.user2 = u.username WHERE f.user1 = ?').all(username).map(formatUser);
  }
  return (jsonFallback.friendships[username] || []).map(n => jsonFallback.users[n]).filter(Boolean);
}

function hasPendingRequest(from, to) {
  if (getDb()) {
    return !!db.prepare('SELECT 1 FROM friend_requests WHERE from_username = ? AND to_username = ? AND status = ?').get(from, to, 'pending');
  }
  return Object.values(jsonFallback.friendRequests).some(r => r.fromUsername === from && r.toUsername === to && r.status === 'pending');
}

function searchUsers(query, exclude) {
  if (getDb()) {
    return db.prepare('SELECT * FROM users WHERE username LIKE ? AND username != ? LIMIT 20').all(`%${query}%`, exclude || '').map(formatUser);
  }
  return Object.values(jsonFallback.users).filter(u => u.username.includes(query) && u.username !== exclude).slice(0, 20);
}

// --- GLOBAL MESSAGES ---
function addGlobalMessage(msg) {
  if (getDb()) {
    db.prepare('INSERT INTO global_messages (id, username, avatar, text, time, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(msg.id, msg.username, msg.avatar, msg.text, msg.time, msg.createdAt);
    db.prepare('DELETE FROM global_messages WHERE id NOT IN (SELECT id FROM global_messages ORDER BY created_at DESC LIMIT 100)').run();
  } else {
    jsonFallback.globalMessages.push(msg);
    jsonFallback.globalMessages = jsonFallback.globalMessages.slice(-100);
    saveJson();
  }
}

function getGlobalMessages(limit = 100) {
  if (getDb()) {
    return db.prepare('SELECT * FROM global_messages ORDER BY created_at DESC LIMIT ?').all(limit).reverse();
  }
  return jsonFallback.globalMessages.slice(-limit);
}

function getAllUsers() {
  if (getDb()) return db.prepare('SELECT * FROM users').all().map(formatUser);
  return Object.values(jsonFallback.users);
}

function formatUser(row) {
  if (!row) return null;
  return {
    username: row.username, email: row.email, passwordHash: row.password_hash || row.passwordHash,
    avatar: row.avatar, bio: row.bio, status: row.status,
    isVip: !!(row.is_vip || row.isVip), vipExpiry: row.vip_expiry || row.vipExpiry,
    vipPlan: row.vip_plan || row.vipPlan, vipActivatedAt: row.vip_activated_at || row.vipActivatedAt,
    stripeCustomerId: row.stripe_customer_id || row.stripeCustomerId || '',
    stripeSubscriptionId: row.stripe_subscription_id || row.stripeSubscriptionId || '',
    createdAt: row.created_at || row.createdAt, lastSeen: row.last_seen || row.lastSeen
  };
}

function closeDb() {
  if (db) { try { db.close(); } catch {} db = null; }
}

loadJson();

module.exports = {
  getDb, getUser, getUserByEmail, getUserByToken, createUser, updateUser, updateLastSeen,
  createToken, cleanOldTokens, sendFriendRequest, getPendingFriendRequests, getFriendRequest,
  updateFriendRequest, areFriends, addFriendship, removeFriendship, getFriends, hasPendingRequest,
  searchUsers, addGlobalMessage, getGlobalMessages, getAllUsers, closeDb
};
