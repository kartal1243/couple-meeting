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

    CREATE TABLE IF NOT EXISTS connection_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT DEFAULT '',
      socket_id TEXT DEFAULT '',
      ip TEXT DEFAULT '',
      room_id TEXT DEFAULT '',
      action TEXT DEFAULT 'connect',
      user_agent TEXT DEFAULT '',
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_conn_logs_time ON connection_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_conn_logs_room ON connection_logs(room_id);

    CREATE TABLE IF NOT EXISTS dm_messages (
      id TEXT PRIMARY KEY,
      from_username TEXT NOT NULL,
      to_username TEXT NOT NULL,
      text TEXT NOT NULL,
      time TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      read INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_dm_from ON dm_messages(from_username);
    CREATE INDEX IF NOT EXISTS idx_dm_to ON dm_messages(to_username);
    CREATE INDEX IF NOT EXISTS idx_dm_conv ON dm_messages(from_username, to_username);

    CREATE TABLE IF NOT EXISTS group_messages (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      from_username TEXT NOT NULL,
      text TEXT NOT NULL,
      time TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_group_msg ON group_messages(group_id);

    CREATE TABLE IF NOT EXISTS blocked_users (
      blocker TEXT NOT NULL,
      blocked TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (blocker, blocked)
    );

    CREATE TABLE IF NOT EXISTS message_reactions (
      message_id TEXT NOT NULL,
      message_type TEXT NOT NULL DEFAULT 'dm',
      username TEXT NOT NULL,
      emoji TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (message_id, message_type, username, emoji)
    );
    CREATE INDEX IF NOT EXISTS idx_reactions_msg ON message_reactions(message_id, message_type);

    CREATE TABLE IF NOT EXISTS follows (
      follower TEXT NOT NULL,
      following TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (follower, following)
    );
    CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower);
    CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following);

    CREATE TABLE IF NOT EXISTS feed_items (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_feed_user ON feed_items(username, created_at DESC);

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      type TEXT NOT NULL,
      from_user TEXT DEFAULT '',
      title TEXT NOT NULL,
      body TEXT DEFAULT '',
      data TEXT DEFAULT '{}',
      read INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(username, read, created_at DESC);

    CREATE TABLE IF NOT EXISTS user_reports (
      id TEXT PRIMARY KEY,
      reporter TEXT NOT NULL,
      reported TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_report_status ON user_reports(status, created_at DESC);

    CREATE TABLE IF NOT EXISTS user_roles (
      username TEXT PRIMARY KEY,
      role TEXT DEFAULT 'user',
      granted_by TEXT DEFAULT '',
      granted_at INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      endpoint TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(username);

    CREATE TABLE IF NOT EXISTS email_verifications (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      verified INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_verify_user ON email_verifications(username, verified);

    CREATE TABLE IF NOT EXISTS two_factor (
      username TEXT PRIMARY KEY,
      secret TEXT NOT NULL,
      enabled INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS communities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon TEXT DEFAULT '👥',
      created_by TEXT NOT NULL,
      member_count INTEGER DEFAULT 1,
      created_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_communities_name ON communities(name);
    CREATE INDEX IF NOT EXISTS idx_communities_creator ON communities(created_by);

    CREATE TABLE IF NOT EXISTS community_members (
      community_id TEXT NOT NULL,
      username TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at INTEGER,
      PRIMARY KEY (community_id, username)
    );
    CREATE INDEX IF NOT EXISTS idx_comm_members_user ON community_members(username);

    CREATE TABLE IF NOT EXISTS community_posts (
      id TEXT PRIMARY KEY,
      community_id TEXT NOT NULL,
      username TEXT NOT NULL,
      text TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      likes INTEGER DEFAULT 0,
      created_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_comm_posts_community ON community_posts(community_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS community_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      username TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_comm_comments_post ON community_comments(post_id);

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      date TEXT NOT NULL,
      time TEXT DEFAULT '',
      location TEXT DEFAULT '',
      created_by TEXT NOT NULL,
      community_id TEXT,
      max_attendees INTEGER DEFAULT 0,
      created_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_events_community ON events(community_id);
    CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
    CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

    CREATE TABLE IF NOT EXISTS event_attendees (
      event_id TEXT NOT NULL,
      username TEXT NOT NULL,
      status TEXT DEFAULT 'going',
      joined_at INTEGER,
      PRIMARY KEY (event_id, username)
    );
    CREATE INDEX IF NOT EXISTS idx_event_attendees_user ON event_attendees(username);
  `);

  // Migration: reset_token ve reset_expiry sütunları
  try { db.exec(`ALTER TABLE users ADD COLUMN reset_token TEXT DEFAULT ''`); } catch {}
  try { db.exec(`ALTER TABLE users ADD COLUMN reset_expiry INTEGER DEFAULT 0`); } catch {}
  try { db.exec(`ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0`); } catch {}
}

// ═══════════════════════════════════════════════════════════
// USER FONKSIYONLARI
// ═══════════════════════════════════════════════════════════
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

function getUserByResetToken(resetToken) {
  if (getDb()) {
    const row = db.prepare('SELECT * FROM users WHERE reset_token = ? AND reset_expiry > ?').get(resetToken, Date.now());
    return row ? formatUser(row) : null;
  }
  return Object.values(jsonFallback.users).find(u => u.resetToken === resetToken && (u.resetExpiry || 0) > Date.now()) || null;
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

const ALLOWED_USER_FIELDS = new Set(['bio', 'status', 'avatar', 'username', 'email', 'password_hash', 'reset_token', 'reset_expiry', 'email_verified', 'is_vip', 'vip_expiry', 'vip_plan', 'vip_activated_at', 'stripe_customer_id', 'stripe_subscription_id', 'last_seen', 'totp_secret', 'two_factor_enabled', 'is_banned', 'role']);

function updateUser(username, fields) {
  const safeFields = {};
  for (const [key, val] of Object.entries(fields)) {
    if (ALLOWED_USER_FIELDS.has(key)) safeFields[key] = val;
  }
  if (Object.keys(safeFields).length === 0) return;
  if (getDb()) {
    const sets = []; const vals = [];
    for (const [key, val] of Object.entries(safeFields)) { sets.push(`${key} = ?`); vals.push(val); }
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

// ═══════════════════════════════════════════════════════════
// TOKEN FONKSIYONLARI
// ═══════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════
// ARKADASLIK FONKSIYONLARI
// ═══════════════════════════════════════════════════════════
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
    return db.prepare('SELECT * FROM users WHERE LOWER(username) LIKE LOWER(?) AND username != ? LIMIT 20').all(`%${query}%`, exclude || '').map(formatUser);
  }
  return Object.values(jsonFallback.users).filter(u => u.username.toLowerCase().includes(query.toLowerCase()) && u.username !== exclude).slice(0, 20);
}

// ═══════════════════════════════════════════════════════════
// GLOBAL MESAJLAR
// ═══════════════════════════════════════════════════════════
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
    resetToken: row.reset_token || row.resetToken || '',
    resetExpiry: row.reset_expiry || row.resetExpiry || 0,
    createdAt: row.created_at || row.createdAt, lastSeen: row.last_seen || row.lastSeen
  };
}

function closeDb() {
  if (db) { try { db.close(); } catch {} db = null; }
}

function addConnectionLog(username, socketId, ip, roomId, action, userAgent) {
  if (getDb()) {
    try {
      db.prepare('INSERT INTO connection_logs (username, socket_id, ip, room_id, action, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(username || '', socketId || '', ip || '', roomId || '', action || 'connect', userAgent || '', Date.now());
    } catch {}
  }
}

function getConnectionLogs(limit = 200, roomId = null) {
  if (getDb()) {
    if (roomId) {
      return db.prepare('SELECT * FROM connection_logs WHERE room_id = ? ORDER BY created_at DESC LIMIT ?').all(roomId, limit);
    }
    return db.prepare('SELECT * FROM connection_logs ORDER BY created_at DESC LIMIT ?').all(limit);
  }
  return [];
}

function getLogStats() {
  if (getDb()) {
    const totalLogs = db.prepare('SELECT COUNT(*) as count FROM connection_logs').get();
    const todayLogs = db.prepare('SELECT COUNT(*) as count FROM connection_logs WHERE created_at > ?').get(Date.now() - 86400000);
    const uniqueIps = db.prepare('SELECT COUNT(DISTINCT ip) as count FROM connection_logs WHERE created_at > ?').get(Date.now() - 86400000);
    return { totalLogs: totalLogs?.count || 0, todayLogs: todayLogs?.count || 0, uniqueIps: uniqueIps?.count || 0 };
  }
  return { totalLogs: 0, todayLogs: 0, uniqueIps: 0 };
}

// ═══════════════════════════════════════════════════════════
// DM MESAJLARI
// ═══════════════════════════════════════════════════════════

function saveDmMessage(msg) {
  if (getDb()) {
    try {
      db.prepare('INSERT INTO dm_messages (id, from_username, to_username, text, time, created_at, read) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(msg.id, msg.from, msg.to, msg.text, msg.time, msg.createdAt, msg.read ? 1 : 0);
    } catch {}
  }
}

function getDmHistory(user1, user2, limit = 100) {
  if (getDb()) {
    return db.prepare(`
      SELECT id, from_username as "from", from_username, to_username as "to", to_username, text, time, created_at as "createdAt", read
      FROM dm_messages 
      WHERE (from_username = ? AND to_username = ?) OR (from_username = ? AND to_username = ?) 
      ORDER BY created_at ASC LIMIT ?
    `).all(user1, user2, user2, user1, limit);
  }
  return [];
}

function markDmRead(from, to) {
  if (getDb()) {
    try {
      db.prepare('UPDATE dm_messages SET read = 1 WHERE from_username = ? AND to_username = ? AND read = 0').run(from, to);
    } catch {}
  }
}

function getUnreadDmCount(username) {
  if (getDb()) {
    const result = db.prepare('SELECT COUNT(*) as count FROM dm_messages WHERE to_username = ? AND read = 0').get(username);
    return result?.count || 0;
  }
  return 0;
}

function getDmConversations(username) {
  if (getDb()) {
    const rows = db.prepare(`
      SELECT 
        CASE WHEN from_username = ? THEN to_username ELSE from_username END as other_user,
        text, time, created_at, read, from_username
      FROM dm_messages 
      WHERE from_username = ? OR to_username = ?
      ORDER BY created_at DESC
    `).all(username, username, username);
    
    const convMap = {};
    for (const r of rows) {
      if (!convMap[r.other_user]) {
        const otherUser = db.prepare('SELECT * FROM users WHERE username = ?').get(r.other_user);
        convMap[r.other_user] = {
          username: r.other_user,
          avatar: otherUser?.avatar || '🐱',
          lastMessage: r.text,
          lastTime: r.time,
          lastCreatedAt: r.created_at || 0,
          lastSeen: otherUser?.last_seen || 0,
          unread: 0
        };
      }
      if (r.from_username !== username && !r.read) {
        convMap[r.other_user].unread++;
      }
    }
    return Object.values(convMap);
  }
  return [];
}

// ═══════════════════════════════════════════════════════════
// GRUP MESAJLARI
// ═══════════════════════════════════════════════════════════

function saveGroupMessage(msg) {
  if (getDb()) {
    try {
      db.prepare('INSERT INTO group_messages (id, group_id, from_username, text, time, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(msg.id, msg.groupId, msg.from, msg.text, msg.time, msg.createdAt);
    } catch {}
  }
}

function getGroupHistory(groupId, limit = 100) {
  if (getDb()) {
    return db.prepare('SELECT * FROM group_messages WHERE group_id = ? ORDER BY created_at DESC LIMIT ?').all(groupId, limit).reverse();
  }
  return [];
}

// ═══════════════════════════════════════════════════════════
// ENGELLEME
// ═══════════════════════════════════════════════════════════

function blockUser(blocker, blocked) {
  if (getDb()) {
    try {
      db.prepare('INSERT OR IGNORE INTO blocked_users (blocker, blocked, created_at) VALUES (?, ?, ?)').run(blocker, blocked, Date.now());
    } catch {}
  }
}

function unblockUser(blocker, blocked) {
  if (getDb()) {
    try {
      db.prepare('DELETE FROM blocked_users WHERE blocker = ? AND blocked = ?').run(blocker, blocked);
    } catch {}
  }
}

function isBlocked(blocker, blocked) {
  if (getDb()) {
    const row = db.prepare('SELECT 1 FROM blocked_users WHERE blocker = ? AND blocked = ?').get(blocker, blocked);
    return !!row;
  }
  return false;
}

function getBlockedUsers(username) {
  if (getDb()) {
    return db.prepare('SELECT blocked FROM blocked_users WHERE blocker = ?').all(username).map(r => r.blocked);
  }
  return [];
}

function isBlockedBy(blocked, blocker) {
  if (getDb()) {
    const row = db.prepare('SELECT 1 FROM blocked_users WHERE blocker = ? AND blocked = ?').get(blocker, blocked);
    return !!row;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════
// MESAJ TEPKİLERİ
// ═══════════════════════════════════════════════════════════

function addReaction(messageId, messageType, username, emoji) {
  if (getDb()) {
    try {
      db.prepare('INSERT OR IGNORE INTO message_reactions (message_id, message_type, username, emoji, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(messageId, messageType, username, emoji, Date.now());
    } catch {}
  }
}

function removeReaction(messageId, messageType, username, emoji) {
  if (getDb()) {
    try {
      db.prepare('DELETE FROM message_reactions WHERE message_id = ? AND message_type = ? AND username = ? AND emoji = ?')
        .run(messageId, messageType, username, emoji);
    } catch {}
  }
}

function getReactions(messageId, messageType) {
  if (getDb()) {
    const rows = db.prepare('SELECT username, emoji FROM message_reactions WHERE message_id = ? AND message_type = ?').all(messageId, messageType);
    const reactions = {};
    for (const r of rows) {
      if (!reactions[r.emoji]) reactions[r.emoji] = [];
      reactions[r.emoji].push(r.username);
    }
    return reactions;
  }
  return {};
}

function followUser(follower, following) {
  if (getDb()) {
    if (follower === following) return false;
    const existing = db.prepare('SELECT 1 FROM follows WHERE follower = ? AND following = ?').get(follower, following);
    if (existing) return false;
    db.prepare('INSERT INTO follows (follower, following, created_at) VALUES (?, ?, ?)').run(follower, following, Date.now());
    return true;
  }
  return false;
}

function unfollowUser(follower, following) {
  if (getDb()) {
    db.prepare('DELETE FROM follows WHERE follower = ? AND following = ?').run(follower, following);
    return true;
  }
  return false;
}

function isFollowing(follower, following) {
  if (getDb()) {
    return !!db.prepare('SELECT 1 FROM follows WHERE follower = ? AND following = ?').get(follower, following);
  }
  return false;
}

function getFollowers(username) {
  if (getDb()) {
    return db.prepare(`
      SELECT u.username, u.avatar, u.bio, u.is_vip, f.created_at as followed_at
      FROM follows f JOIN users u ON f.follower = u.username
      WHERE f.following = ? ORDER BY f.created_at DESC
    `).all(username);
  }
  return [];
}

function getFollowing(username) {
  if (getDb()) {
    return db.prepare(`
      SELECT u.username, u.avatar, u.bio, u.is_vip, f.created_at as followed_at
      FROM follows f JOIN users u ON f.following = u.username
      WHERE f.follower = ? ORDER BY f.created_at DESC
    `).all(username);
  }
  return [];
}

function getFollowCounts(username) {
  if (getDb()) {
    const followers = db.prepare('SELECT COUNT(*) as c FROM follows WHERE following = ?').get(username)?.c || 0;
    const following = db.prepare('SELECT COUNT(*) as c FROM follows WHERE follower = ?').get(username)?.c || 0;
    return { followers, following };
  }
  return { followers: 0, following: 0 };
}

function addFeedItem(username, type, data) {
  if (getDb()) {
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO feed_items (id, username, type, data, created_at) VALUES (?, ?, ?, ?, ?)').run(id, username, type, JSON.stringify(data), Date.now());
    return id;
  }
  return null;
}

function getFeedForUser(username) {
  if (getDb()) {
    return db.prepare(`
      SELECT f.*, u.avatar FROM feed_items f
      JOIN users u ON f.username = u.username
      WHERE f.username IN (SELECT following FROM follows WHERE follower = ?)
      ORDER BY f.created_at DESC LIMIT 50
    `).all(username);
  }
  return [];
}

function getMutualFollowers(username1, username2) {
  if (getDb()) {
    return db.prepare(`
      SELECT u.username, u.avatar FROM follows f1
      JOIN follows f2 ON f1.following = f2.following
      JOIN users u ON f1.following = u.username
      WHERE f1.follower = ? AND f2.follower = ? AND f1.following != ? AND f1.following != ?
    `).all(username1, username2, username1, username2);
  }
  return [];
}

function getSuggestedFollows(username, limit = 10) {
  if (getDb()) {
    return db.prepare(`
      SELECT u.username, u.avatar, u.bio, u.is_vip, COUNT(f.follower) as follower_count
      FROM users u
      LEFT JOIN follows f ON u.username = f.following
      WHERE u.username != ? AND u.username NOT IN (SELECT following FROM follows WHERE follower = ?)
      GROUP BY u.username
      ORDER BY follower_count DESC
      LIMIT ?
    `).all(username, username, limit);
  }
  return [];
}

function createNotification(username, type, fromUser, title, body, data) {
  if (getDb()) {
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO notifications (id, username, type, from_user, title, body, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(id, username, type, fromUser || '', title, body || '', JSON.stringify(data || {}), Date.now());
    return id;
  }
  return null;
}

function getNotifications(username, unreadOnly = false) {
  if (getDb()) {
    const where = unreadOnly ? 'WHERE username = ? AND read = 0' : 'WHERE username = ?';
    return db.prepare(`SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT 50`).all(username);
  }
  return [];
}

function getUnreadNotifCount(username) {
  if (getDb()) {
    return db.prepare('SELECT COUNT(*) as c FROM notifications WHERE username = ? AND read = 0').get(username)?.c || 0;
  }
  return 0;
}

function markNotifsRead(username) {
  if (getDb()) {
    db.prepare('UPDATE notifications SET read = 1 WHERE username = ? AND read = 0').run(username);
    return true;
  }
  return false;
}

function createReport(reporter, reported, reason, details) {
  if (getDb()) {
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO user_reports (id, reporter, reported, reason, details, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(id, reporter, reported, reason, details || '', Date.now());
    return id;
  }
  return null;
}

function getReports(status = 'pending') {
  if (getDb()) {
    return db.prepare('SELECT * FROM user_reports WHERE status = ? ORDER BY created_at DESC').all(status);
  }
  return [];
}

function updateReportStatus(id, status) {
  if (getDb()) {
    db.prepare('UPDATE user_reports SET status = ? WHERE id = ?').run(status, id);
    return true;
  }
  return false;
}

function getUserRole(username) {
  if (getDb()) {
    const row = db.prepare('SELECT role FROM user_roles WHERE username = ?').get(username);
    return row?.role || 'user';
  }
  return 'user';
}

function setUserRole(username, role, grantedBy) {
  if (getDb()) {
    db.prepare('INSERT OR REPLACE INTO user_roles (username, role, granted_by, granted_at) VALUES (?, ?, ?, ?)').run(username, role, grantedBy || '', Date.now());
    return true;
  }
  return false;
}

function getAllRoles() {
  if (getDb()) {
    return db.prepare('SELECT * FROM user_roles').all();
  }
  return [];
}

function savePushSubscription(username, endpoint, p256dh, auth) {
  if (getDb()) {
    db.prepare('INSERT OR REPLACE INTO push_subscriptions (endpoint, username, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?)').run(endpoint, username, p256dh, auth, Date.now());
    return true;
  }
  return false;
}

function getPushSubscriptions(username) {
  if (getDb()) {
    return db.prepare('SELECT * FROM push_subscriptions WHERE username = ?').all(username);
  }
  return [];
}

function removePushSubscription(endpoint) {
  if (getDb()) {
    db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
    return true;
  }
  return false;
}

function hasPermission(username, permission) {
  const role = getUserRole(username);
  const perms = {
    user: ['chat', 'dm', 'follow'],
    mod: ['chat', 'dm', 'follow', 'kick', 'mute', 'report_view'],
    admin: ['chat', 'dm', 'follow', 'kick', 'mute', 'report_view', 'ban', 'role_manage', 'settings'],
    superadmin: ['chat', 'dm', 'follow', 'kick', 'mute', 'report_view', 'ban', 'role_manage', 'settings', 'admin_manage']
  };
  return (perms[role] || perms.user).includes(permission);
}

function createEmailVerification(username, email, code) {
  if (getDb()) {
    const id = crypto.randomUUID();
    const expiresAt = Date.now() + 15 * 60 * 1000;
    db.prepare('DELETE FROM email_verifications WHERE username = ? AND verified = 0').run(username);
    db.prepare('INSERT INTO email_verifications (id, username, email, code, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(id, username, email, code, expiresAt, Date.now());
    return id;
  }
  return null;
}

function verifyEmailCode(username, code) {
  if (getDb()) {
    const row = db.prepare('SELECT * FROM email_verifications WHERE username = ? AND code = ? AND verified = 0 AND expires_at > ?').get(username, code, Date.now());
    if (row) {
      db.prepare('UPDATE email_verifications SET verified = 1 WHERE id = ?').run(row.id);
      db.prepare('UPDATE users SET email_verified = 1 WHERE username = ?').run(username);
      return true;
    }
    return false;
  }
  return false;
}

function isEmailVerified(username) {
  if (getDb()) {
    const user = db.prepare('SELECT email_verified FROM users WHERE username = ?').get(username);
    return user?.email_verified === 1;
  }
  return false;
}

function setupTwoFactor(username, secret) {
  if (getDb()) {
    db.prepare('INSERT OR REPLACE INTO two_factor (username, secret, enabled, created_at) VALUES (?, ?, 0, ?)').run(username, secret, Date.now());
    return true;
  }
  return false;
}

function enableTwoFactor(username) {
  if (getDb()) {
    db.prepare('UPDATE two_factor SET enabled = 1 WHERE username = ?').run(username);
    return true;
  }
  return false;
}

function disableTwoFactor(username) {
  if (getDb()) {
    db.prepare('DELETE FROM two_factor WHERE username = ?').run(username);
    return true;
  }
  return false;
}

function getTwoFactor(username) {
  if (getDb()) {
    return db.prepare('SELECT * FROM two_factor WHERE username = ?').get(username) || null;
  }
  return null;
}

function isTwoFactorEnabled(username) {
  if (getDb()) {
    const row = db.prepare('SELECT enabled FROM two_factor WHERE username = ?').get(username);
    return row?.enabled === 1;
  }
  return false;
}

loadJson();

module.exports = {
  getDb, getUser, getUserByEmail, getUserByToken, getUserByResetToken, createUser, updateUser, updateLastSeen,
  createToken, cleanOldTokens, sendFriendRequest, getPendingFriendRequests, getFriendRequest,
  updateFriendRequest, areFriends, addFriendship, removeFriendship, getFriends, hasPendingRequest,
  searchUsers, addGlobalMessage, getGlobalMessages, getAllUsers, closeDb,
  addConnectionLog, getConnectionLogs, getLogStats,
  saveDmMessage, getDmHistory, markDmRead, getUnreadDmCount, getDmConversations,
  saveGroupMessage, getGroupHistory,
  blockUser, unblockUser, isBlocked, getBlockedUsers, isBlockedBy,
  addReaction, removeReaction, getReactions,
  followUser, unfollowUser, isFollowing, getFollowers, getFollowing, getFollowCounts,
  addFeedItem, getFeedForUser, getMutualFollowers, getSuggestedFollows,
  createNotification, getNotifications, getUnreadNotifCount, markNotifsRead,
  createReport, getReports, updateReportStatus,
  getUserRole, setUserRole, getAllRoles, hasPermission,
  savePushSubscription, getPushSubscriptions, removePushSubscription,
  createEmailVerification, verifyEmailCode, isEmailVerified,
  setupTwoFactor, enableTwoFactor, disableTwoFactor, getTwoFactor, isTwoFactorEnabled
};
