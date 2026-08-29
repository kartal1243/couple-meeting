const Database = require('better-sqlite3');
const path = require('path');
const logger = require('./logger');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
    logger.info('📦 SQLite veritabanı bağlandı: ' + DB_PATH);
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT DEFAULT '🐱',
      bio TEXT DEFAULT '',
      status TEXT DEFAULT '',
      is_vip INTEGER DEFAULT 0,
      vip_expiry INTEGER DEFAULT 0,
      vip_plan TEXT DEFAULT '',
      vip_activated_at INTEGER DEFAULT 0,
      stripe_customer_id TEXT DEFAULT '',
      stripe_subscription_id TEXT DEFAULT '',
      created_at INTEGER NOT NULL,
      last_seen INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tokens (
      token TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS friend_requests (
      id TEXT PRIMARY KEY,
      from_username TEXT NOT NULL,
      from_avatar TEXT DEFAULT '🐱',
      to_username TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS friendships (
      user1 TEXT NOT NULL,
      user2 TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (user1, user2)
    );

    CREATE TABLE IF NOT EXISTS global_messages (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      avatar TEXT DEFAULT '🐱',
      text TEXT NOT NULL,
      time TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tokens_username ON tokens(username);
    CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests(to_username, status);
    CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON friendships(user1);
    CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON friendships(user2);
    CREATE INDEX IF NOT EXISTS idx_global_messages_time ON global_messages(created_at);
  `);
}

// --- USER OPERATIONS ---
function getUser(username) {
  const row = getDb().prepare('SELECT * FROM users WHERE username = ?').get(username);
  return row ? formatUser(row) : null;
}

function getUserByEmail(email) {
  const row = getDb().prepare('SELECT * FROM users WHERE email = ?').get(email);
  return row ? formatUser(row) : null;
}

function getUserByToken(token) {
  const row = getDb().prepare(`
    SELECT u.* FROM users u
    JOIN tokens t ON u.username = t.username
    WHERE t.token = ?
  `).get(token);
  return row ? formatUser(row) : null;
}

function createUser(username, email, passwordHash, avatar, bio) {
  const now = Date.now();
  getDb().prepare(`
    INSERT INTO users (username, email, password_hash, avatar, bio, created_at, last_seen)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(username, email, passwordHash, avatar || '🐱', bio || '', now, now);
}

function updateUser(username, fields) {
  const sets = [];
  const vals = [];
  for (const [key, val] of Object.entries(fields)) {
    sets.push(`${key} = ?`);
    vals.push(val);
  }
  vals.push(username);
  getDb().prepare(`UPDATE users SET ${sets.join(', ')} WHERE username = ?`).run(...vals);
}

function updateLastSeen(username) {
  getDb().prepare('UPDATE users SET last_seen = ? WHERE username = ?').run(Date.now(), username);
}

// --- TOKEN OPERATIONS ---
function createToken(username) {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  getDb().prepare('DELETE FROM tokens WHERE username = ?').run(username);
  getDb().prepare('INSERT INTO tokens (token, username, created_at) VALUES (?, ?, ?)').run(token, username, Date.now());
  return token;
}

function cleanOldTokens(maxAge) {
  const result = getDb().prepare('DELETE FROM tokens WHERE created_at < ?').run(Date.now() - maxAge);
  return result.changes;
}

// --- FRIEND OPERATIONS ---
function sendFriendRequest(fromUsername, fromAvatar, toUsername) {
  const crypto = require('crypto');
  const id = crypto.randomBytes(10).toString('hex');
  getDb().prepare(`
    INSERT INTO friend_requests (id, from_username, from_avatar, to_username, status, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `).run(id, fromUsername, fromAvatar, toUsername, Date.now());
  return id;
}

function getPendingFriendRequests(username) {
  return getDb().prepare(`
    SELECT * FROM friend_requests WHERE to_username = ? AND status = 'pending'
  `).all(username);
}

function getFriendRequest(requestId) {
  return getDb().prepare('SELECT * FROM friend_requests WHERE id = ?').get(requestId);
}

function updateFriendRequest(requestId, status) {
  getDb().prepare('UPDATE friend_requests SET status = ? WHERE id = ?').run(status, requestId);
}

function areFriends(user1, user2) {
  return !!getDb().prepare(`
    SELECT 1 FROM friendships WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)
  `).get(user1, user2, user2, user1);
}

function addFriendship(user1, user2) {
  const now = Date.now();
  getDb().prepare('INSERT OR IGNORE INTO friendships (user1, user2, created_at) VALUES (?, ?, ?)').run(user1, user2, now);
  getDb().prepare('INSERT OR IGNORE INTO friendships (user1, user2, created_at) VALUES (?, ?, ?)').run(user2, user1, now);
}

function removeFriendship(user1, user2) {
  getDb().prepare('DELETE FROM friendships WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)').run(user1, user2, user2, user1);
}

function getFriends(username) {
  const rows = getDb().prepare(`
    SELECT u.* FROM users u
    JOIN friendships f ON (f.user2 = u.username AND f.user1 = ?)
  `).all(username);
  return rows.map(formatUser);
}

function hasPendingRequest(from, to) {
  return !!getDb().prepare(`
    SELECT 1 FROM friend_requests WHERE from_username = ? AND to_username = ? AND status = 'pending'
  `).get(from, to);
}

// --- GLOBAL MESSAGES ---
function addGlobalMessage(msg) {
  getDb().prepare(`
    INSERT INTO global_messages (id, username, avatar, text, time, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(msg.id, msg.username, msg.avatar, msg.text, msg.time, msg.createdAt);
  // Son 100 mesajı tut
  getDb().prepare(`
    DELETE FROM global_messages WHERE id NOT IN (
      SELECT id FROM global_messages ORDER BY created_at DESC LIMIT 100
    )
  `).run();
}

function getGlobalMessages(limit = 100) {
  return getDb().prepare('SELECT * FROM global_messages ORDER BY created_at DESC LIMIT ?').all(limit).reverse();
}

function formatUser(row) {
  return {
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    avatar: row.avatar,
    bio: row.bio,
    status: row.status,
    isVip: !!row.is_vip,
    vipExpiry: row.vip_expiry,
    vipPlan: row.vip_plan,
    vipActivatedAt: row.vip_activated_at,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    createdAt: row.created_at,
    lastSeen: row.last_seen
  };
}

function closeDb() {
  if (db) { db.close(); db = null; }
}

module.exports = {
  getDb, getUser, getUserByEmail, getUserByToken, createUser, updateUser, updateLastSeen,
  createToken, cleanOldTokens, sendFriendRequest, getPendingFriendRequests, getFriendRequest,
  updateFriendRequest, areFriends, addFriendship, removeFriendship, getFriends, hasPendingRequest,
  addGlobalMessage, getGlobalMessages, closeDb
};
