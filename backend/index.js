require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
let nodemailer;
try { nodemailer = require('nodemailer'); } catch { nodemailer = null; }
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const logger = require('./utils/logger');
const db = require('./utils/database');

// ═══════════════════════════════════════════════════════════
// EXPRESS APP
// ═══════════════════════════════════════════════════════════

const app = express();
const isProd = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);

// ═══════════════════════════════════════════════════════════
// 1. GÜVENLİK & MIDDLEWARE
// ═══════════════════════════════════════════════════════════

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

const ALLOWED_ORIGINS = [
  ...(process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),
  'https://www.couplemeeting.com.tr',
  'https://couplemeeting.com.tr',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(null, false);
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, message: { ok: false, message: 'Çok fazla istek.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { ok: false, message: 'Çok fazla deneme.' } });
app.use('/api/', apiLimiter);
app.use('/api/vip/create-checkout', authLimiter);
app.use('/api/vip/admin-grant', authLimiter);

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `avatar_${Date.now()}_${Math.random().toString(36).slice(2,8)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
  if (allowed.test(path.extname(file.originalname)) && file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Sadece resim dosyaları yüklenebilir.'));
}});

app.use('/uploads', express.static(uploadsDir));

const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { ok: false, message: 'Çok fazla dosya yükleme.' } });

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `video_${Date.now()}_${Math.random().toString(36).slice(2,8)}${ext}`);
  }
});
const videoUpload = multer({ storage: videoStorage, limits: { fileSize: 100 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  const allowed = /\.(mp4|webm|ogg|mov)$/i;
  if (allowed.test(path.extname(file.originalname)) && (file.mimetype.startsWith('video/') || file.mimetype === 'application/octet-stream')) cb(null, true);
  else cb(new Error('Sadece video dosyaları yüklenebilir (mp4, webm, ogg, mov).'));
}});

app.post('/api/upload-avatar', uploadLimiter, (req, res) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) return res.status(400).json({ ok: false, message: err.message });
    if (!req.file) return res.status(400).json({ ok: false, message: 'Dosya bulunamadı.' });
    const token = req.body.token;
    if (!token) return res.status(401).json({ ok: false, message: 'Token gerekli.' });
    const user = db.getUserByToken(token);
    if (!user) return res.status(401).json({ ok: false, message: 'Geçersiz token.' });
    const avatarUrl = `/uploads/${req.file.filename}`;
    db.updateUser(user.username, { avatar: avatarUrl });
    res.json({ ok: true, avatar: avatarUrl });
  });
});

app.post('/api/upload-video', uploadLimiter, (req, res) => {
  videoUpload.single('video')(req, res, (err) => {
    if (err) return res.status(400).json({ ok: false, message: err.message });
    if (!req.file) return res.status(400).json({ ok: false, message: 'Dosya bulunamadı.' });
    const token = req.body.token;
    if (!token) return res.status(401).json({ ok: false, message: 'Token gerekli.' });
    const user = db.getUserByToken(token);
    if (!user) return res.status(401).json({ ok: false, message: 'Geçersiz token.' });
    const videoUrl = `/uploads/${req.file.filename}`;
    res.json({ ok: true, url: videoUrl, filename: req.file.originalname, size: req.file.size });
  });
});

// ═══════════════════════════════════════════════════════════
// 2. YARDIMCI FONKSİYONLAR
// ═══════════════════════════════════════════════════════════

function sanitize(str, maxLen = 500) { return String(str || '').trim().slice(0, maxLen).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' }[c] || '')); }
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function isValidUsername(u) { return /^[a-z0-9_]{3,20}$/.test(u); }

// ═══════════════════════════════════════════════════════════
// 3. SAĞLIK & ANA SAYFA
// ═══════════════════════════════════════════════════════════

app.get('/', (req, res) => res.status(200).send('Couple Meeting Backend Active!'));
app.get('/health', (req, res) => res.json({ ok: true, service: 'couple-meeting-backend', time: Date.now(), db: 'sqlite' }));

// ═══════════════════════════════════════════════════════════
// 4. STRIPE ÖDEME SİSTEMİ
// ═══════════════════════════════════════════════════════════

let stripe = null;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (STRIPE_KEY && STRIPE_KEY !== 'sk_test_BURAYA_STRIPE_ANAHTARINI_YAZ') {
  stripe = require('stripe')(STRIPE_KEY);
  logger.info('Stripe entegrasyonu aktif.');
} else {
  logger.warn('Stripe tanimli degil. Test modu.');
}

const VIP_PLANS = {
  monthly: { price: 29.90, duration: 30 * 24 * 60 * 60 * 1000, label: 'Aylik VIP' },
  yearly: { price: 199.90, duration: 365 * 24 * 60 * 60 * 1000, label: 'Yillik VIP' }
};

app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(200).send('Stripe pasif');
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret === 'whsec_BURAYA_WEBHOOK_SECRET_YAZ') return res.status(200).send('Webhook secret yok');

  let event;
  try { event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret); }
  catch (err) { logger.error('Webhook imza hatasi', { error: err.message }); return res.status(400).send(`Webhook Error: ${err.message}`); }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { username, plan } = session.metadata;
    const user = db.getUser(username);
    if (user && VIP_PLANS[plan]) {
      const now = Date.now();
      const startFrom = (user.vipExpiry || 0) > now ? user.vipExpiry : now;
      db.updateUser(username, {
        is_vip: 1, vip_expiry: startFrom + VIP_PLANS[plan].duration,
        vip_plan: plan, vip_activated_at: now,
        stripe_customer_id: session.customer || '', stripe_subscription_id: session.subscription || ''
      });
      logger.info(`[STRIPE] VIP aktif: ${username} (${VIP_PLANS[plan].label})`);
      emitToUser(username, 'vip_activated', { isVip: true, vipExpiry: startFrom + VIP_PLANS[plan].duration, plan });
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const allUsers = db.getDb().prepare('SELECT username FROM users WHERE stripe_subscription_id = ?').all(sub.id);
    for (const u of allUsers) {
      db.updateUser(u.username, { is_vip: 0, vip_expiry: Date.now() });
      logger.info(`[STRIPE] VIP iptal: ${u.username}`);
      emitToUser(u.username, 'vip_activated', { isVip: false, vipExpiry: Date.now(), plan: null });
    }
  }

  res.status(200).json({ received: true });
});

app.post('/api/vip/create-checkout', async (req, res) => {
  const { token, plan } = req.body;
  if (!token || !plan || !VIP_PLANS[plan]) return res.json({ ok: false, message: 'Gecersiz plan.' });
  const user = db.getUserByToken(token);
  if (!user) return res.json({ ok: false, message: 'Giris yapmalisin.' });

  if (!stripe) {
    const now = Date.now();
    const startFrom = (user.vipExpiry || 0) > now ? user.vipExpiry : now;
    const newExpiry = startFrom + VIP_PLANS[plan].duration;
    db.updateUser(user.username, { is_vip: 1, vip_expiry: newExpiry, vip_plan: plan, vip_activated_at: now });
    emitToUser(user.username, 'vip_activated', { isVip: true, vipExpiry: newExpiry, plan });
    logger.info(`VIP test aktif: ${user.username} (${VIP_PLANS[plan].label})`);
    return res.json({ ok: true, testMode: true, message: 'Test modunda aktifles tirildi.', vipExpiry: newExpiry, plan });
  }

  try {
    const priceId = plan === 'monthly' ? process.env.STRIPE_PRICE_MONTHLY : process.env.STRIPE_PRICE_YEARLY;
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', payment_method_types: ['card'], customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin || 'https://couple-meeting-flax.vercel.app'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://couple-meeting-flax.vercel.app'}/payment-cancel`,
      metadata: { username: user.username, plan }
    });
    res.json({ ok: true, sessionId: session.id, url: session.url });
  } catch (err) {
    logger.error('Stripe checkout hatasi', { error: err.message });
    res.json({ ok: false, message: 'Odeme baslatilamadi.' });
  }
});

const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
if (!ADMIN_SECRET) logger.warn('ADMIN_SECRET tanimli degil. Admin VIP ozellikleri pasif olacak.');

app.post('/api/vip/admin-grant', (req, res) => {
  const { secret, username, plan } = req.body;
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) return res.status(403).json({ ok: false, message: 'Yetkisiz erisim.' });
  if (!username || !isValidUsername(username) || !VIP_PLANS[plan || 'yearly']) return res.json({ ok: false, message: 'Gecersiz parametre.' });
  const user = db.getUser(username);
  if (!user) return res.json({ ok: false, message: 'Kullanici bulunamadi.' });

  const now = Date.now();
  const startFrom = (user.vipExpiry || 0) > now ? user.vipExpiry : now;
  const newExpiry = startFrom + VIP_PLANS[plan || 'yearly'].duration;
  db.updateUser(username, { is_vip: 1, vip_expiry: newExpiry, vip_plan: plan || 'yearly', vip_activated_at: now });
  logger.info(`[ADMIN] VIP verildi: ${username} (${VIP_PLANS[plan || 'yearly'].label})`);
  emitToUser(username, 'vip_activated', { isVip: true, vipExpiry: newExpiry, plan: plan || 'yearly' });
  res.json({ ok: true, message: `${username} VIP aktif!`, vipExpiry: newExpiry });
});

// ═══════════════════════════════════════════════════════════
// 5. YOUTUBE ARAMA (youtubei.js)
// ═══════════════════════════════════════════════════════════

let Innertube, UniversalCache;
try {
  ({ Innertube, UniversalCache } = require('youtubei.js'));
  logger.info('youtubei.js yuklendi');
} catch (e) { logger.warn('youtubei.js yuklenemedi', { error: e.message }); }

let innertube = null;
async function getInnertube() {
  if (!innertube && Innertube) {
    innertube = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
      retrieve_player: true,
      fetch: fetch.bind(globalThis)
    });
  }
  return innertube;
}

// ═══════════════════════════════════════════════════════════
// 6. MP3 STREAMING ENDPOINT (yt-dlp python)
// ═══════════════════════════════════════════════════════════
// 6.5 ADMIN PANEL
// ═══════════════════════════════════════════════════════════

const ADMIN_PASSWORD = process.env.ADMIN_PASS;
if (!ADMIN_PASSWORD && isProd) { logger.error('ADMIN_PASS env degiskeni zorunludur!'); process.exit(1); }
if (!ADMIN_PASSWORD) logger.warn('ADMIN_PASS ayarlanmadi, varsayilan kullaniliyor (GELISTIRME)');

function adminAuth(req, res, next) {
  const pass = req.headers['x-admin-pass'];
  if (!pass || pass !== ADMIN_PASSWORD) return res.status(403).json({ ok: false, message: 'Yetkisiz' });
  next();
}

app.get('/api/admin/stats', adminAuth, (req, res) => {
  const roomList = Object.entries(rooms).map(([id, r]) => ({
    id, name: r.name, userCount: r.users.length, maxUsers: r.maxUsers,
    hasPassword: !!r.password, isVip: !!r.isVip,
    users: r.users.map(u => ({ username: u.username, userId: u.userId, avatar: u.avatar })),
    currentMedia: r.currentMedia, createdAt: r.createdAt, lastActivityAt: r.lastActivityAt
  }));
  const totalUsers = Object.keys(onlineUsers).length;
  const logStats = db.getLogStats();
  res.json({
    ok: true,
    rooms: roomList,
    totalRooms: roomList.length,
    totalOnlineUsers: totalUsers,
    onlineUsers: Object.entries(onlineUsers).map(([name, data]) => ({
      username: name, socketCount: data.socketIds.size, lastSeen: data.lastSeen
    })),
    logStats
  });
});

app.get('/api/admin/rooms', adminAuth, (req, res) => {
  const roomList = Object.entries(rooms).map(([id, r]) => ({
    id, name: r.name, userCount: r.users.length, maxUsers: r.maxUsers,
    hasPassword: !!r.password, isVip: !!r.isVip, hostUserId: r.hostUserId,
    users: r.users.map(u => ({ username: u.username, userId: u.userId, avatar: u.avatar, socketId: u.socketId })),
    currentMedia: r.currentMedia, createdAt: r.createdAt
  }));
  res.json({ ok: true, rooms: roomList });
});

app.delete('/api/admin/rooms/:roomId', adminAuth, (req, res) => {
  const roomId = sanitize(req.params.roomId, 50);
  const room = rooms[roomId];
  if (!room) return res.status(404).json({ ok: false, message: 'Oda bulunamadi' });
  io.to(roomId).emit('room_action', { type: 'ROOM_CLOSED', payload: { message: 'Oda yönetici tarafından kapatıldı.' } });
  io.to(roomId).emit('kicked_from_room', 'Oda kapatıldı.');
  for (const u of room.users) {
    io.sockets.sockets.get(u.socketId)?.leave(roomId);
  }
  delete rooms[roomId];
  delete tombalaGames[roomId];
  broadcastRooms();
  broadcastAdminActivity('room_close', { roomId, message: `Oda kapatıldı: ${roomId}` });
  logger.info(`[ADMIN] Oda kapatildi: ${roomId}`);
  res.json({ ok: true, message: 'Oda kapatildi' });
});

app.get('/api/admin/logs', adminAuth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 200, 1000);
  const roomId = req.query.room || null;
  const logs = db.getConnectionLogs(limit, roomId);
  res.json({ ok: true, logs });
});

app.get('/api/admin/users', adminAuth, (req, res) => {
  const users = db.getAllUsers().map(u => ({
    username: u.username, email: u.email, avatar: u.avatar,
    isVip: u.isVip, vipExpiry: u.vipExpiry, vipPlan: u.vipPlan,
    createdAt: u.createdAt, lastSeen: u.lastSeen
  }));
  res.json({ ok: true, users });
});

// Admin: Search users
app.get('/api/admin/users/search', adminAuth, (req, res) => {
  const q = sanitize(req.query.q || '', 50).toLowerCase();
  const users = db.getAllUsers().filter(u => 
    u.username.toLowerCase().includes(q) || (u.email && u.email.toLowerCase().includes(q))
  ).map(u => ({
    username: u.username, email: u.email, avatar: u.avatar,
    isVip: u.isVip, vipExpiry: u.vipExpiry, vipPlan: u.vipPlan,
    role: u.role || 'user', isBanned: u.isBanned || false,
    createdAt: u.createdAt, lastSeen: u.lastSeen
  }));
  res.json({ ok: true, users });
});

// Admin: Set VIP for user
app.post('/api/admin/users/vip', adminAuth, (req, res) => {
  const { username, isVip, vipPlan, vipDays } = req.body;
  const uname = sanitize(username, 30);
  if (!uname) return res.status(400).json({ ok: false, message: 'Gecersiz kullanici' });
  const expiry = isVip ? Date.now() + (parseInt(vipDays) || 30) * 86400000 : null;
  db.updateUser(uname, { isVip: !!isVip, vipPlan: isVip ? (vipPlan || 'yearly') : null, vipExpiry: expiry });
  logger.info(`[ADMIN] VIP degistirildi: ${uname} -> ${isVip}`);
  res.json({ ok: true });
});

// Admin: Ban/unban user
app.post('/api/admin/users/ban', adminAuth, (req, res) => {
  const { username, isBanned } = req.body;
  const uname = sanitize(username, 30);
  if (!uname) return res.status(400).json({ ok: false, message: 'Gecersiz kullanici' });
  db.updateUser(uname, { isBanned: !!isBanned });
  logger.info(`[ADMIN] Ban degistirildi: ${uname} -> ${isBanned}`);
  res.json({ ok: true });
});

// Admin: Delete user
app.delete('/api/admin/users/:username', adminAuth, (req, res) => {
  const uname = sanitize(req.params.username, 30);
  if (!uname) return res.status(400).json({ ok: false, message: 'Gecersiz kullanici' });
  try {
    db.getDb().prepare('DELETE FROM users WHERE username = ?').run(uname);
    logger.info(`[ADMIN] Kullanici silindi: ${uname}`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// Admin: System health
app.get('/api/admin/system', adminAuth, (req, res) => {
  const uptime = process.uptime();
  const mem = process.memoryUsage();
  res.json({
    ok: true,
    uptime: Math.floor(uptime),
    memory: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024)
    },
    nodeVersion: process.version,
    platform: process.platform,
    pid: process.pid,
    activeRooms: Object.keys(rooms).length,
    totalSockets: io.engine ? io.engine.clientsCount : 0
  });
});

// Admin: Get reports
app.get('/api/admin/reports', adminAuth, (req, res) => {
  try {
    const reports = db.getDb().prepare('SELECT * FROM user_reports ORDER BY created_at DESC LIMIT 100').all();
    res.json({ ok: true, reports });
  } catch (e) {
    res.json({ ok: true, reports: [] });
  }
});

// Admin: Broadcast message
app.post('/api/admin/broadcast', adminAuth, (req, res) => {
  const { message } = req.body;
  const msg = sanitize(message, 500);
  if (!msg) return res.status(400).json({ ok: false, message: 'Mesaj bos olamaz' });
  io.emit('global_chat_message', {
    id: 'admin_' + Date.now(),
    sender: 'Admin',
    senderId: 'admin',
    avatar: '🛡️',
    text: msg,
    time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    isAdmin: true
  });
  logger.info(`[ADMIN] Broadcast: ${msg}`);
  res.json({ ok: true });
});

// Admin: Maintenance mode
let maintenanceMode = false;
app.post('/api/admin/maintenance', adminAuth, (req, res) => {
  maintenanceMode = !!req.body.enabled;
  io.emit('system_maintenance', { enabled: maintenanceMode });
  res.json({ ok: true, maintenanceMode });
});
app.get('/api/admin/maintenance', adminAuth, (req, res) => {
  res.json({ ok: true, maintenanceMode });
});


// ═══════════════════════════════════════════════════════════
// 7. SOCKET.IO SERVER
// ═══════════════════════════════════════════════════════════

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : '*', credentials: true },
  pingTimeout: 15000,
  pingInterval: 8000,
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 1e6
});

const rooms = {};
const globalDmMessages = {};
const globalChatGroups = {};
const tombalaGames = {};
const onlineUsers = {};
const adminSocketIds = new Set();

// --- Yardimci Fonksiyonlar ---

function publicUser(u) {
  if (!u) return null;
  return {
    username: u.username, email: u.email, avatar: u.avatar || '🐱',
    bio: u.bio || '', status: u.status || '', createdAt: u.createdAt,
    isOnline: !!onlineUsers[u.username],
    lastSeen: onlineUsers[u.username]?.lastSeen || u.lastSeen || null,
    isVip: u.isVip && u.vipExpiry && u.vipExpiry > Date.now(),
    vipExpiry: u.vipExpiry || null
  };
}

function emitToUser(username, event, data) {
  for (const [, s] of io.sockets.sockets) {
    if (s.socialUsername === username) s.emit(event, data);
  }
}

function sendFriendsUpdate(targetUsername) {
  emitToUser(targetUsername, 'friends_update', {
    friends: db.getFriends(targetUsername).map(publicUser).filter(Boolean),
    requests: db.getPendingFriendRequests(targetUsername)
  });
}

function setOnline(username, socketId) {
  if (!onlineUsers[username]) onlineUsers[username] = { lastSeen: Date.now(), socketIds: new Set() };
  onlineUsers[username].socketIds.add(socketId);
  onlineUsers[username].lastSeen = Date.now();
}

function setOffline(username, socketId) {
  if (onlineUsers[username]) {
    onlineUsers[username].socketIds.delete(socketId);
    if (onlineUsers[username].socketIds.size === 0) {
      onlineUsers[username].lastSeen = Date.now();
      db.updateLastSeen(username);
      delete onlineUsers[username];
    }
  }
}

function broadcastOnlineStatus(username) {
  const isOnline = !!onlineUsers[username];
  const lastSeen = onlineUsers[username]?.lastSeen || Date.now();
  const payload = { username, isOnline, lastSeen };

  for (const friendName of db.getDb().prepare('SELECT user2 as f FROM friendships WHERE user1 = ?').all(username).map(r => r.f)) {
    emitToUser(friendName, 'friend_online_status', payload);
  }
  for (const friendName of db.getDb().prepare('SELECT user1 as f FROM friendships WHERE user2 = ?').all(username).map(r => r.f)) {
    emitToUser(friendName, 'friend_online_status', payload);
  }

  for (const [groupId, group] of Object.entries(globalChatGroups)) {
    if (group.members && group.members.includes(username)) {
      for (const member of group.members) {
        if (member !== username) emitToUser(member, 'user_online_status', payload);
      }
    }
  }

  io.emit('global_online_update', { username, isOnline, lastSeen });
}

function getPublicRoomsList() {
  return Object.entries(rooms).map(([id, room]) => ({
    id, name: room.name || id, userCount: room.users.length,
    maxUsers: room.maxUsers, hasPassword: !!room.password, isVip: !!room.isVip,
    users: room.users.map(u => ({ username: u.username, avatar: u.avatar })).slice(0, 5)
  }));
}

function broadcastRooms() { io.emit('public_rooms_update', getPublicRoomsList()); broadcastAdminDashboard(); }

// Admin real-time dashboard broadcast
let adminDashboardInterval = null;
function broadcastAdminDashboard() {
  if (adminSocketIds.size === 0) return;
  const onlineCount = Object.keys(onlineUsers).length;
  const roomList = Object.entries(rooms).map(([id, r]) => ({
    id, name: r.name, userCount: r.users.length, maxUsers: r.maxUsers,
    hasPassword: !!r.password, isVip: !!r.isVip, hostUserId: r.hostUserId,
    users: r.users.map(u => ({ username: u.username, userId: u.userId, avatar: u.avatar })),
    currentMedia: r.currentMedia, createdAt: r.createdAt, lastActivityAt: r.lastActivityAt
  }));
  const onlineList = Object.entries(onlineUsers).map(([name, data]) => ({
    username: name, socketCount: data.socketIds.size, lastSeen: data.lastSeen
  }));
  const logStats = db.getLogStats();
  const payload = {
    totalRooms: roomList.length,
    totalOnlineUsers: onlineCount,
    rooms: roomList,
    onlineUsers: onlineList,
    logStats,
    timestamp: Date.now()
  };
  adminSocketIds.forEach(sid => {
    io.to(sid).emit('admin_dashboard_update', payload);
  });
}

// Admin real-time activity feed
function broadcastAdminActivity(type, data) {
  if (adminSocketIds.size === 0) return;
  const activity = { type, ...data, timestamp: Date.now() };
  adminSocketIds.forEach(sid => { io.to(sid).emit('admin_activity', activity); });
}

// Start periodic admin updates
function startAdminUpdates() {
  if (adminDashboardInterval) return;
  adminDashboardInterval = setInterval(() => {
    if (adminSocketIds.size > 0) broadcastAdminDashboard();
  }, 5000);
}

function updateRoomUsers(roomId) {
  if (rooms[roomId]) {
    io.to(roomId).emit('room_user_count_update', {
      userCount: rooms[roomId].users.length, maxUsers: rooms[roomId].maxUsers,
      users: rooms[roomId].users, hostUserId: rooms[roomId].hostUserId,
      roomName: rooms[roomId].name, theme: rooms[roomId].theme || 'default'
    });
  }
}

// --- Periyodik Temizlik ---

const TOKEN_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
setInterval(() => {
  const cleaned = db.cleanOldTokens(TOKEN_MAX_AGE);
  if (cleaned > 0) logger.info(`${cleaned} eski token temizlendi.`);
}, TOKEN_CLEANUP_INTERVAL);

const ROOM_CLEANUP_INTERVAL = 30 * 60 * 1000;
const ROOM_EMPTY_TIMEOUT = 2 * 60 * 60 * 1000;
setInterval(() => {
  const now = Date.now(); let cleaned = 0;
  for (const [id, room] of Object.entries(rooms)) {
    if (room.users.length === 0 && !room.password && !room.isVip && (now - room.lastActivityAt) > ROOM_EMPTY_TIMEOUT) {
      delete rooms[id]; delete tombalaGames[id]; cleaned++;
    }
  }
  if (cleaned > 0) { logger.info(`${cleaned} bos oda temizlendi.`); broadcastRooms(); }
}, ROOM_CLEANUP_INTERVAL);

// ═══════════════════════════════════════════════════════════
// 7. SOCKET EVENT HANDLER'LARI
// ═══════════════════════════════════════════════════════════

io.on('connection', (socket) => {
  socket.emit('public_rooms_update', getPublicRoomsList());
  socket.emit('global_chat_history', db.getGlobalMessages(100));

  const requireAuth = (token) => {
    if (!token) return null;
    return db.getUserByToken(token);
  };

  // Socket.IO rate limiting
  const socketRateLimit = { chat: 0, join: 0, action: 0, lastReset: Date.now() };
  const resetRateLimits = () => {
    const now = Date.now();
    if (now - socketRateLimit.lastReset > 10000) {
      socketRateLimit.chat = 0;
      socketRateLimit.join = 0;
      socketRateLimit.action = 0;
      socketRateLimit.lastReset = now;
    }
  };
  const checkRate = (type, max) => { resetRateLimits(); socketRateLimit[type]++; return socketRateLimit[type] > max; };

  // ──────────────────────────────────────────────────────
  // 7.0 ADMIN REAL-TIME DASHBOARD
  // ──────────────────────────────────────────────────────
  socket.on('admin_connect', ({ pass }) => {
    if (pass !== (process.env.ADMIN_PASS || 'admin123')) return;
    adminSocketIds.add(socket.id);
    startAdminUpdates();
    broadcastAdminDashboard();
    broadcastAdminActivity('admin_login', { message: 'Admin panele bağlandı' });
  });

  socket.on('admin_disconnect', () => {
    adminSocketIds.delete(socket.id);
  });

  // ──────────────────────────────────────────────────────
  // 7.1 KIMLIK DOGRULAMA
  // ──────────────────────────────────────────────────────

  socket.on('auth_register', ({ username, email, password, bio, avatar }) => {
    if (checkRate('auth', 5)) return socket.emit('auth_result', { ok: false, message: 'Çok fazla deneme. Biraz bekle.' });
    const cleanUsername = sanitize(username, 20).toLowerCase();
    const cleanEmail = sanitize(email, 100).toLowerCase();
    if (!cleanUsername || !cleanEmail || !password) return socket.emit('auth_result', { ok: false, message: 'Kullanici adi, e-posta ve sifre gerekli.' });
    if (!isValidUsername(cleanUsername)) return socket.emit('auth_result', { ok: false, message: 'Kullanici adi 3-20 karakter olmali; sadece harf, sayi ve _ kullan.' });
    if (!isValidEmail(cleanEmail)) return socket.emit('auth_result', { ok: false, message: 'Gecerli bir e-posta gir.' });
    if (typeof password !== 'string' || password.length < 6) return socket.emit('auth_result', { ok: false, message: 'Sifre en az 6 karakter olmali.' });
    if (password.length > 128) return socket.emit('auth_result', { ok: false, message: 'Sifre cok uzun.' });
    if (db.getUser(cleanUsername)) return socket.emit('auth_result', { ok: false, message: 'Bu kullanici adi zaten alinmis.' });
    if (db.getUserByEmail(cleanEmail)) return socket.emit('auth_result', { ok: false, message: 'Bu e-posta zaten kayitli.' });

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    db.createUser(cleanUsername, cleanEmail, `${salt}:${hash}`, sanitize(avatar, 10) || '🐱', sanitize(bio, 120));
    const token = db.createToken(cleanUsername);
    socket.socialUsername = cleanUsername;
    setOnline(cleanUsername, socket.id);
    logger.info(`Yeni kayit: ${cleanUsername}`);
    socket.emit('auth_result', { ok: true, user: publicUser(db.getUser(cleanUsername)), token });
    broadcastAdminActivity('user_register', { username: cleanUsername, message: `${cleanUsername} kayıt oldu` });
  });

  socket.on('auth_login', ({ email, password }) => {
    if (checkRate('auth', 5)) return socket.emit('auth_result', { ok: false, message: 'Çok fazla deneme. Biraz bekle.' });
    const cleanEmail = sanitize(email, 100).toLowerCase();
    const user = db.getUserByEmail(cleanEmail);
    if (!user) return socket.emit('auth_result', { ok: false, message: 'E-posta veya sifre hatali.' });
    try {
      const [salt, storedHash] = user.passwordHash.split(':');
      const check = crypto.scryptSync(password || '', salt, 64).toString('hex');
      if (!crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(check, 'hex'))) {
        return socket.emit('auth_result', { ok: false, message: 'E-posta veya sifre hatali.' });
      }
    } catch { return socket.emit('auth_result', { ok: false, message: 'E-posta veya sifre hatali.' }); }

    const token = db.createToken(user.username);
    socket.socialUsername = user.username;
    setOnline(user.username, socket.id);
    broadcastOnlineStatus(user.username);
    logger.info(`Giris: ${user.username}`);
    socket.emit('auth_result', { ok: true, user: publicUser(user), token });
    broadcastAdminActivity('user_login', { username: user.username, message: `${user.username} giriş yaptı` });
    socket.emit('friends_update', {
      friends: db.getFriends(user.username).map(publicUser).filter(Boolean),
      requests: db.getPendingFriendRequests(user.username)
    });
  });

  socket.on('auth_forgot_password', ({ email }) => {
    if (checkRate('auth', 5)) return socket.emit('forgot_result', { ok: false, message: 'Çok fazla deneme. Biraz bekle.' });
    const cleanEmail = sanitize(email, 100).toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return socket.emit('forgot_result', { ok: false, message: 'Geçerli bir e-posta girin.' });
    const user = db.getUserByEmail(cleanEmail);
    if (!user) return socket.emit('forgot_result', { ok: true, message: 'E-posta bulunamadı, ama endişelenme!' });
    const resetToken = crypto.randomBytes(16).toString('hex');
    const expiry = Date.now() + 3600000;
    db.updateUser(user.username, { reset_token: resetToken, reset_expiry: expiry });
    logger.info?.(`Şifre sıfırlama isteği: ${cleanEmail} → token: ${resetToken}`);
    socket.emit('forgot_result', { ok: true, message: 'Şifre sıfırlama bağlantısı e-postana gönderildi.', ...(isProd ? {} : { resetToken, dev: true }) });
  });

  socket.on('auth_reset_password', ({ resetToken, newPassword }) => {
    const cleanToken = sanitize(resetToken, 64);
    const cleanPass = newPassword;
    if (!cleanToken || !cleanPass || cleanPass.length < 6) return socket.emit('reset_result', { ok: false, message: 'Token ve en az 6 karakterlik şifre gerekli.' });
    const user = db.getUserByResetToken(cleanToken);
    if (!user) return socket.emit('reset_result', { ok: false, message: 'Token geçersiz veya süresi dolmuş.' });
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(cleanPass, salt, 64).toString('hex');
    db.updateUser(user.username, { password_hash: `${salt}:${hash}`, reset_token: '', reset_expiry: 0 });
    logger.info?.(`Şifre sıfırlandı: ${user.username}`);
    socket.emit('reset_result', { ok: true, message: 'Şifren başarıyla sıfırlandı! Giriş yapabilirsin.' });
  });

  // ──────────────────────────────────────────────────────
  // 7.2 PROFIL & SOSYAL
  // ──────────────────────────────────────────────────────

  socket.on('social_sync', ({ token }) => {
    const user = db.getUserByToken(token);
    if (!user) {
      socket.emit('social_profile', null);
      return;
    }
    socket.socialUsername = user.username;
    setOnline(user.username, socket.id);
    broadcastOnlineStatus(user.username);
    socket.emit('social_profile', publicUser(user));
    socket.emit('friends_update', {
      friends: db.getFriends(user.username).map(publicUser).filter(Boolean),
      requests: db.getPendingFriendRequests(user.username)
    });
  });

  socket.on('update_profile', ({ token, bio, status, avatar, username }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const updates = { bio: sanitize(bio, 150), status: sanitize(status, 80), avatar: sanitize(avatar, 10) || user.avatar || '🐱' };
    if (username && username !== user.username) {
      const cleanName = sanitize(username, 20).toLowerCase();
      if (/^[a-z0-9_]{3,20}$/.test(cleanName) && !db.getUser(cleanName)) {
        updates.username = cleanName;
      }
    }
    db.updateUser(user.username, updates);
    const updated = db.getUser(updates.username || user.username);
    socket.emit('social_profile', publicUser(updated));
  });

  // ── ŞİFRE DEĞİŞTİRME ──
  socket.on('change_password', ({ token, currentPassword, newPassword }) => {
    const user = db.getUserByToken(token);
    if (!user) return socket.emit('change_password_result', { success: false, message: 'Kullanıcı bulunamadı.' });
    const [salt, hash] = user.passwordHash.split(':');
    const newHash = crypto.scryptSync(currentPassword, salt, 64).toString('hex');
    if (hash !== newHash) return socket.emit('change_password_result', { success: false, message: 'Mevcut şifre hatalı.' });
    if (!newPassword || newPassword.length < 6) return socket.emit('change_password_result', { success: false, message: 'Yeni şifre en az 6 karakter olmalı.' });
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHashFull = crypto.scryptSync(newPassword, newSalt, 64).toString('hex');
    db.updateUser(user.username, { passwordHash: `${newSalt}:${newHashFull}` });
    socket.emit('change_password_result', { success: true, message: 'Şifre başarıyla değiştirildi.' });
  });

  // ── YAZMA İNDİKATÖRÜ ──
  socket.on('typing_start', ({ to, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    emitToUser(sanitize(to, 24), 'typing_indicator', { from: user.username, typing: true });
  });
  socket.on('typing_stop', ({ to, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    emitToUser(sanitize(to, 24), 'typing_indicator', { from: user.username, typing: false });
  });

  // ── KULLANICI ENGELLEME ──
  socket.on('block_user', ({ targetUsername, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const target = sanitize(targetUsername, 20);
    if (target === user.username) return;
    const targetUser = db.getUser(target);
    if (!targetUser) return socket.emit('block_result', { success: false, message: 'Kullanıcı bulunamadı.' });
    db.blockUser(user.username, target);
    socket.emit('block_result', { success: true, blocked: target });
    sendFriendsUpdate(user.username);
  });
  socket.on('unblock_user', ({ targetUsername, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    db.unblockUser(user.username, sanitize(targetUsername, 20));
    socket.emit('unblock_result', { success: true, unblocked: sanitize(targetUsername, 20) });
    sendFriendsUpdate(user.username);
  });
  socket.on('get_blocked_users', ({ token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    socket.emit('blocked_users_list', { blocked: db.getBlockedUsers(user.username) });
  });

  // ── MESAJ SİLME / DÜZENLEME ──
  socket.on('dm_delete', ({ messageId, withUser, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const key = [user.username, sanitize(withUser, 24)].sort().join(':');
    let deleted = false;
    if (dmMessages[key]) {
      const msg = dmMessages[key].find(m => m.id === messageId);
      if (msg && msg.from === user.username) {
        dmMessages[key] = dmMessages[key].filter(m => m.id !== messageId);
        deleted = true;
      }
    }
    if (deleted) {
      emitToUser(sanitize(withUser, 24), 'dm_deleted', { messageId, from: user.username });
      socket.emit('dm_deleted', { messageId, from: user.username });
    }
  });
  socket.on('dm_edit', ({ messageId, withUser, newText, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const cleanText = sanitize(newText, 500);
    if (!cleanText) return;
    const key = [user.username, sanitize(withUser, 24)].sort().join(':');
    if (dmMessages[key]) {
      const msg = dmMessages[key].find(m => m.id === messageId && m.from === user.username);
      if (msg) { msg.text = cleanText; msg.edited = true; }
    }
    emitToUser(sanitize(withUser, 24), 'dm_edited', { messageId, text: cleanText, from: user.username });
    socket.emit('dm_edited', { messageId, text: cleanText, from: user.username });
  });

  // ── MESAJ TEPKİLERİ ──
  socket.on('add_reaction', ({ messageId, messageType, emoji, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const cleanEmoji = sanitize(emoji, 8);
    if (!cleanEmoji) return;
    db.addReaction(messageId, messageType || 'dm', user.username, cleanEmoji);
    const reactions = db.getReactions(messageId, messageType || 'dm');
    socket.broadcast.emit('reactions_update', { messageId, messageType: messageType || 'dm', reactions });
  });
  socket.on('remove_reaction', ({ messageId, messageType, emoji, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const cleanEmoji = sanitize(emoji, 8);
    if (!cleanEmoji) return;
    db.removeReaction(messageId, messageType || 'dm', user.username, cleanEmoji);
    const reactions = db.getReactions(messageId, messageType || 'dm');
    socket.broadcast.emit('reactions_update', { messageId, messageType: messageType || 'dm', reactions });
  });

  // ── ODA DAVETİ ──
  socket.on('invite_to_room', ({ targetUsername, roomId, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const target = sanitize(targetUsername, 20);
    const room = rooms[roomId];
    if (!room) return socket.emit('room_invite_result', { success: false, message: 'Oda bulunamadı.' });
    if (!room.users.find(u => u.userId === user.username)) return socket.emit('room_invite_result', { success: false, message: 'Bu odada değilsiniz.' });
    emitToUser(target, 'room_invite', { from: user.username, fromAvatar: user.avatar, roomId, roomName: room.name || roomId });
    socket.emit('room_invite_result', { success: true, message: `${target} kullanıcısına davet gönderildi.` });
  });

  // ── TAKİP SİSTEMİ ──
  socket.on('follow_user', ({ targetUsername, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const target = sanitize(targetUsername, 20);
    if (target === user.username) return socket.emit('follow_result', { success: false, message: 'Kendini takip edemezsin.' });
    const targetUser = db.getUser(target);
    if (!targetUser) return socket.emit('follow_result', { success: false, message: 'Kullanıcı bulunamadı.' });
    if (db.isBlocked(target, user.username)) return socket.emit('follow_result', { success: false, message: 'Bu kullanıcı sizi engelledi.' });
    if (db.isBlocked(user.username, target)) return socket.emit('follow_result', { success: false, message: 'Bu kullanıcıyı engellediniz.' });
    const ok = db.followUser(user.username, target);
    if (ok) {
      db.addFeedItem(user.username, 'follow', { following: target });
      emitToUser(target, 'followed_you', { username: user.username, avatar: user.avatar });
      db.createNotification(target, 'follow', user.username, 'Yeni Takipçi', `${user.username} seni takip etti!`, { follower: user.username });
    }
    const counts = db.getFollowCounts(target);
    socket.emit('follow_result', { success: ok, following: ok, target, ...counts });
    emitToUser(target, 'follow_counts_update', counts);
  });

  socket.on('unfollow_user', ({ targetUsername, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const target = sanitize(targetUsername, 20);
    db.unfollowUser(user.username, target);
    const counts = db.getFollowCounts(target);
    socket.emit('follow_result', { success: true, following: false, target, ...counts });
    emitToUser(target, 'follow_counts_update', counts);
  });

  socket.on('get_follow_counts', ({ username, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const target = sanitize(username, 20);
    const counts = db.getFollowCounts(target);
    const isFollowing = db.isFollowing(user.username, target);
    socket.emit('follow_counts', { username: target, ...counts, isFollowing });
  });

  socket.on('get_followers', ({ username, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const target = sanitize(username, 20);
    const followers = db.getFollowers(target);
    socket.emit('followers_list', { username: target, followers });
  });

  socket.on('get_following', ({ username, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const target = sanitize(username, 20);
    const following = db.getFollowing(target);
    socket.emit('following_list', { username: target, following });
  });

  socket.on('get_feed', ({ token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const feed = db.getFeedForUser(user.username);
    socket.emit('feed', { items: feed });
  });

  socket.on('get_suggested_follows', ({ token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const suggestions = db.getSuggestedFollows(user.username, 10);
    socket.emit('suggested_follows', { suggestions });
  });

  // ── BILDIRIM SISTEMI ──
  socket.on('get_notifications', ({ token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const notifs = db.getNotifications(user.username);
    const unread = db.getUnreadNotifCount(user.username);
    socket.emit('notifications', { notifications: notifs, unread });
  });

  socket.on('mark_notifications_read', ({ token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    db.markNotifsRead(user.username);
    socket.emit('notifications', { notifications: db.getNotifications(user.username), unread: 0 });
  });

  // ── KULLANICI RAPORLAMA ──
  socket.on('report_user', ({ targetUsername, reason, details, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    if (targetUsername === user.username) return socket.emit('report_result', { success: false, message: 'Kendini raporlayamazsın.' });
    const target = db.getUser(sanitize(targetUsername, 20));
    if (!target) return socket.emit('report_result', { success: false, message: 'Kullanıcı bulunamadı.' });
    db.createReport(user.username, target.username, sanitize(reason, 50), sanitize(details, 500));
    socket.emit('report_result', { success: true, message: 'Raporun alındı. Teşekkürler!' });
    const adminRole = db.getUserRole('admin');
    if (adminRole === 'admin' || adminRole === 'superadmin') {
      db.createNotification('admin', 'report', user.username, 'Yeni Rapor', `${user.username} → ${target.username}: ${reason}`, { reported: target.username });
    }
  });

  socket.on('get_reports', ({ token }) => {
    const user = db.getUserByToken(token);
    if (!user || !db.hasPermission(user.username, 'report_view')) return;
    const reports = db.getReports('pending');
    socket.emit('reports_list', { reports });
  });

  socket.on('resolve_report', ({ reportId, action, token }) => {
    const user = db.getUserByToken(token);
    if (!user || !db.hasPermission(user.username, 'ban')) return;
    db.updateReportStatus(reportId, action === 'dismiss' ? 'dismissed' : 'resolved');
    socket.emit('report_result', { success: true, message: 'Rapor güncellendi.' });
  });

  // ── ADMIN ROL SISTEMI ──
  socket.on('set_role', ({ targetUsername, role, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    if (!db.hasPermission(user.username, 'role_manage')) return socket.emit('role_result', { success: false, message: 'Yetkin yok.' });
    const validRoles = ['user', 'mod', 'admin'];
    if (!validRoles.includes(role)) return socket.emit('role_result', { success: false, message: 'Geçersiz rol.' });
    if (role === 'admin' && !db.hasPermission(user.username, 'admin_manage')) return socket.emit('role_result', { success: false, message: 'Admin atama yetkin yok.' });
    const target = db.getUser(sanitize(targetUsername, 20));
    if (!target) return socket.emit('role_result', { success: false, message: 'Kullanıcı bulunamadı.' });
    db.setUserRole(target.username, role, user.username);
    db.createNotification(target.username, 'role', user.username, 'Rol Değişikliği', `Rolün ${role} olarak değiştirildi.`, { role });
    socket.emit('role_result', { success: true, message: `${target.username} → ${role}` });
  });

  socket.on('get_all_roles', ({ token }) => {
    const user = db.getUserByToken(token);
    if (!user || !db.hasPermission(user.username, 'role_manage')) return;
    socket.emit('roles_list', { roles: db.getAllRoles() });
  });

  // ── PUSH BILDIRIM KAYDI ──
  socket.on('save_push_subscription', ({ token, endpoint, p256dh, auth }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    db.savePushSubscription(user.username, endpoint, p256dh, auth);
  });

  socket.on('remove_push_subscription', ({ endpoint }) => {
    db.removePushSubscription(endpoint);
  });

  // ── EMAIL DOGRULAMA ──
  socket.on('send_verification_email', ({ token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    if (db.isEmailVerified(user.username)) return socket.emit('verify_result', { success: false, message: 'Email zaten doğrulanmış.' });
    const code = String(crypto.randomInt(100000, 999999));
    db.createEmailVerification(user.username, user.email, code);
    const transporter = nodemailer?.createTransport({ host: process.env.SMTP_HOST || 'smtp.gmail.com', port: parseInt(process.env.SMTP_PORT) || 587, secure: false, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    if (transporter && process.env.SMTP_USER) {
      transporter.sendMail({ from: process.env.SMTP_FROM || 'noreply@couplemeeting.com', to: user.email, subject: 'Couple Meeting - Email Doğrulama', text: `Doğrulama kodun: ${code}`, html: `<div style="font-family:sans-serif;text-align:center;padding:40px"><h2 style="color:#00a884">Couple Meeting</h2><p>Email doğrulama kodun:</p><h1 style="font-size:32px;letter-spacing:8px;color:#00a884">${code}</h1><p style="color:#666">Bu kod 15 dakika geçerlidir.</p></div>` }).catch(e => logger.warn?.('Email gönderilemedi: ' + e.message));
      socket.emit('verify_result', { success: true, message: 'Doğrulama emaili gönderildi.' });
    } else {
      socket.emit('verify_result', { success: true, message: `Doğrulama kodun: ${code}` });
    }
  });

  socket.on('verify_email_code', ({ code, token }) => {
    if (checkRate('auth', 5)) return socket.emit('verify_result', { success: false, message: 'Çok fazla deneme. Biraz bekle.' });
    const user = db.getUserByToken(token);
    if (!user) return;
    const ok = db.verifyEmailCode(user.username, code);
    socket.emit('verify_result', { success: ok, message: ok ? 'Email doğrulandı!' : 'Geçersiz veya süresi dolmuş kod.' });
    if (ok) {
      const updated = { ...user, email_verified: 1 };
      socket.emit('social_profile', updated);
    }
  });

  // ── IKI FAKTORLU DOGRULAMA (2FA) ──
  socket.on('setup_2fa', ({ token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const existing = db.getTwoFactor(user.username);
    if (existing?.enabled) return socket.emit('two_factor_setup', { success: false, message: '2FA zaten aktif. Önce devre dışı bırak.' });
    const OTPAuth = require('otpauth');
    const totp = new OTPAuth.TOTP({ issuer: 'CoupleMeeting', label: user.username, algorithm: 'SHA1', digits: 6, period: 30, secret: OTPAuth.Secret.generate(20) });
    db.setupTwoFactor(user.username, totp.secret.base32);
    const QRCode = require('qrcode');
    QRCode.toDataURL(totp.toString(), (err, url) => {
      socket.emit('two_factor_setup', { success: true, secret: totp.secret.base32, qrCode: url || null });
    });
  });

  socket.on('verify_2fa_setup', ({ code, token }) => {
    if (checkRate('auth', 5)) return socket.emit('two_factor_result', { success: false, message: 'Çok fazla deneme. Biraz bekle.' });
    const user = db.getUserByToken(token);
    if (!user) return;
    const tf = db.getTwoFactor(user.username);
    if (!tf) return socket.emit('two_factor_result', { success: false, message: '2FA kurulumu bulunamadı.' });
    const OTPAuth = require('otpauth');
    const totp = new OTPAuth.TOTP({ issuer: 'CoupleMeeting', label: user.username, algorithm: 'SHA1', digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(tf.secret) });
    const delta = totp.validate({ token: code, window: 2 });
    if (delta !== null) {
      db.enableTwoFactor(user.username);
      socket.emit('two_factor_result', { success: true, message: '2FA başarıyla aktif edildi!' });
    } else {
      socket.emit('two_factor_result', { success: false, message: 'Geçersiz kod. Tekrar dene.' });
    }
  });

  socket.on('disable_2fa', ({ code, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const tf = db.getTwoFactor(user.username);
    if (!tf?.enabled) return socket.emit('two_factor_result', { success: false, message: '2FA zaten devre dışı.' });
    const OTPAuth = require('otpauth');
    const totp = new OTPAuth.TOTP({ issuer: 'CoupleMeeting', label: user.username, algorithm: 'SHA1', digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(tf.secret) });
    const delta = totp.validate({ token: code, window: 2 });
    if (delta !== null) {
      db.disableTwoFactor(user.username);
      socket.emit('two_factor_result', { success: true, message: '2FA devre dışı bırakıldı.' });
    } else {
      socket.emit('two_factor_result', { success: false, message: 'Geçersiz kod.' });
    }
  });

  socket.on('get_2fa_status', ({ token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const tf = db.getTwoFactor(user.username);
    socket.emit('two_factor_status', { enabled: tf?.enabled === 1 });
  });

  // ──────────────────────────────────────────────────────
  // 7.3 ARKADASLIK SISTEMI
  // ──────────────────────────────────────────────────────

  socket.on('friend_search', ({ q, token }) => {
    const term = sanitize(q, 20);
    const current = db.getUserByToken(token)?.username;
    if (!term || term.length < 1) return socket.emit('friend_search_results', []);
    const results = db.searchUsers(term, current).map(u => ({
      username: u.username, avatar: u.avatar || '🐱',
      isOnline: !!onlineUsers[u.username],
      lastSeen: onlineUsers[u.username]?.lastSeen || u.lastSeen || null
    }));
    socket.emit('friend_search_results', results);
  });

  socket.on('friend_request', ({ targetUsername, token }) => {
    const from = db.getUserByToken(token);
    const cleanTarget = sanitize(targetUsername, 20);
    const target = db.getUser(cleanTarget) || db.getUser(cleanTarget.toLowerCase()) || db.getUser(cleanTarget.toUpperCase());
    if (!from) return socket.emit('friend_request_status', { message: 'Giris yapmalisin.' });
    if (!target) return socket.emit('friend_request_status', { message: 'Kullanici bulunamadi.' });
    if (target.username === from.username) return socket.emit('friend_request_status', { message: 'Kendine istek gonderemezsin.' });
    if (db.areFriends(from.username, target.username)) return socket.emit('friend_request_status', { message: 'Zaten arkadassiniz.' });
    if (db.hasPendingRequest(from.username, target.username)) return socket.emit('friend_request_status', { message: 'Istek zaten gonderilmis.' });
    if (db.hasPendingRequest(target.username, from.username)) return socket.emit('friend_request_status', { message: 'Bu kullanici sana zaten istek gondermis.' });

    const id = db.sendFriendRequest(from.username, from.avatar, target.username);
    socket.emit('friend_request_status', { message: 'Arkadaslik istegi gonderildi' });
    sendFriendsUpdate(target.username);
    emitToUser(target.username, 'friend_request_received', { id, fromUsername: from.username, avatar: from.avatar });
  });

  socket.on('friend_request_response', ({ requestId, action, token }) => {
    const me = db.getUserByToken(token);
    const req = db.getFriendRequest(requestId);
    if (!me || !req || req.to_username !== me.username || req.status !== 'pending') return;
    db.updateFriendRequest(requestId, action === 'accept' ? 'accepted' : 'rejected');
    if (action === 'accept') db.addFriendship(me.username, req.from_username);
    sendFriendsUpdate(me.username);
    sendFriendsUpdate(req.from_username);
    socket.emit('friend_request_status', { message: action === 'accept' ? 'Arkadaslik kabul edildi' : 'Istek silindi.' });
  });

  socket.on('unfriend', ({ targetUsername, token }) => {
    const me = db.getUserByToken(token);
    if (!me) return;
    db.removeFriendship(me.username, targetUsername);
    sendFriendsUpdate(me.username);
    sendFriendsUpdate(targetUsername);
    socket.emit('friend_request_status', { message: 'Arkadaslik silindi.' });
  });

  // ──────────────────────────────────────────────────────
  // 7.4 GLOBAL SOHBET
  // ──────────────────────────────────────────────────────

  socket.on('global_chat_message', ({ text, token }) => {
    const user = requireAuth(token);
    if (!user) return;
    const cleanText = sanitize(text, 500);
    if (!cleanText) return;
    if (checkRate('chat', 30)) return;
    const msg = {
      id: crypto.randomBytes(8).toString('hex'),
      username: user.username,
      avatar: user.avatar || '🐱',
      text: cleanText,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now()
    };
    db.addGlobalMessage(msg);
    io.emit('global_chat_message', msg);
  });

  // ──────────────────────────────────────────────────────
  // 6.5 ÖZEL MESAJ (DM) & GRUP SOHBETİ
  // ──────────────────────────────────────────────────────
  const dmMessages = globalDmMessages;
  const chatGroups = globalChatGroups;

  socket.on('dm_send', ({ to, text, token }) => {
    if (checkRate('chat', 20)) return;
    const from = db.getUserByToken(token);
    if (!from) return;
    const cleanText = sanitize(text, 500);
    if (!cleanText) return;
    const toUser = db.getUser(sanitize(to, 24)) || db.getUser(sanitize(to, 24).toLowerCase()) || db.getUser(sanitize(to, 24).toUpperCase());
    if (!toUser) return;
    if (!db.areFriends(from.username, toUser.username)) return socket.emit('dm_status', { message: 'Sadece arkadaşlarınızla mesajlaşabilirsiniz.' });
    if (db.isBlocked(toUser.username, from.username)) return socket.emit('dm_status', { message: 'Bu kullanıcı sizi engelledi.' });
    if (db.isBlocked(from.username, toUser.username)) return socket.emit('dm_status', { message: 'Bu kullanıcıyı engellediniz. Engellemek için kaldırın.' });
    const msg = {
      id: crypto.randomBytes(8).toString('hex'),
      from: from.username, fromAvatar: from.avatar,
      to: toUser.username, toAvatar: toUser.avatar,
      text: cleanText,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now()
    };
    db.saveDmMessage(msg);
    const key = [from.username, toUser.username].sort().join(':');
    if (!dmMessages[key]) dmMessages[key] = [];
    dmMessages[key].push(msg);
    if (dmMessages[key].length > 200) dmMessages[key] = dmMessages[key].slice(-200);
    emitToUser(toUser.username, 'dm_received', msg);
    db.createNotification(toUser.username, 'dm', from.username, 'Yeni Mesaj', `${from.username}: ${cleanText.slice(0, 80)}`, { from: from.username });
    socket.emit('dm_sent', msg);
  });

  socket.on('dm_history', ({ withUser, token }) => {
    const from = db.getUserByToken(token);
    if (!from) return;
    const other = sanitize(withUser, 24);
    const dbMessages = db.getDmHistory(from.username, other, 50);
    const key = [from.username, other].sort().join(':');
    const memMessages = dmMessages[key] || [];
    const allMessages = [...dbMessages, ...memMessages.filter(m => !dbMessages.find(d => d.id === m.id))];
    allMessages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    socket.emit('dm_history', { messages: allMessages.slice(-50), withUser: other });
  });

  socket.on('dm_list', ({ token }) => {
    const from = db.getUserByToken(token);
    if (!from) return;
    const conversations = {};

    const dbConvs = db.getDmConversations(from.username);
    for (const conv of dbConvs) {
      conversations[conv.username] = {
        username: conv.username, avatar: conv.avatar || '🐱',
        lastMessage: conv.lastMessage, lastTime: conv.lastTime, lastCreatedAt: conv.lastCreatedAt || 0,
        unread: conv.unread, isOnline: !!onlineUsers[conv.username],
        lastSeen: onlineUsers[conv.username]?.lastSeen || conv.lastSeen || null
      };
    }

    for (const [key, msgs] of Object.entries(dmMessages)) {
      if (key.includes(from.username) && msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        const other = last.from === from.username ? last.to : last.from;
        const otherUser = db.getUser(other);
        const existing = conversations[other];
        const memCreatedAt = last.createdAt || 0;
        if (!existing || memCreatedAt > (existing.lastCreatedAt || 0)) {
          conversations[other] = {
            username: other, avatar: otherUser?.avatar || '🐱',
            lastMessage: last.text, lastTime: last.time, lastCreatedAt: memCreatedAt,
            unread: msgs.filter(m => m.to === from.username && !m.read).length,
            isOnline: !!onlineUsers[other],
            lastSeen: onlineUsers[other]?.lastSeen || otherUser?.lastSeen || null
          };
        }
      }
    }
    socket.emit('dm_list', { conversations: Object.values(conversations).sort((a, b) => (b.lastCreatedAt || 0) - (a.lastCreatedAt || 0)) });
  });

  socket.on('dm_read', ({ withUser, token }) => {
    const from = db.getUserByToken(token);
    if (!from) return;
    const other = sanitize(withUser, 24);
    const key = [from.username, other].sort().join(':');
    if (dmMessages[key]) { dmMessages[key].forEach(m => { if (m.to === from.username) m.read = true; }); }
    db.markDmRead(other, from.username);
    emitToUser(other, 'dm_read_receipt', { from: from.username, readBy: from.username, time: Date.now() });
  });

  // Grup sohbeti
  socket.on('group_create', ({ name, members, token }) => {
    const from = db.getUserByToken(token);
    if (!from) return;
    const cleanName = sanitize(name, 30);
    if (!cleanName) return;
    const id = crypto.randomBytes(8).toString('hex');
    const memberList = [from.username, ...(members || []).map(m => sanitize(m, 24)).filter(m => m && m !== from.username)].slice(0, 20);
    chatGroups[id] = { id, name: cleanName, createdBy: from.username, members: memberList, messages: [], createdAt: Date.now() };
    memberList.forEach(username => emitToUser(username, 'group_created', { id, name: cleanName, members: memberList, createdBy: from.username }));
  });

  socket.on('group_list', ({ token }) => {
    const from = db.getUserByToken(token);
    if (!from) return;
    const groups = Object.values(chatGroups).filter(g => g.members.includes(from.username));
    socket.emit('group_list', { groups: groups.map(g => ({
      id: g.id, name: g.name, members: g.members, createdBy: g.createdBy,
      lastMessage: g.messages[g.messages.length - 1] || null,
      memberStatus: g.members.map(m => ({ username: m, isOnline: !!onlineUsers[m], lastSeen: onlineUsers[m]?.lastSeen || null }))
    })) });
  });

  socket.on('group_send', ({ groupId, text, token }) => {
    const from = db.getUserByToken(token);
    if (!from) return;
    const group = chatGroups[sanitize(groupId, 20)];
    if (!group || !group.members.includes(from.username)) return;
    const cleanText = sanitize(text, 500);
    if (!cleanText) return;
    const msg = {
      id: crypto.randomBytes(8).toString('hex'),
      from: from.username, fromAvatar: from.avatar,
      text: cleanText,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now()
    };
    db.saveGroupMessage({ ...msg, groupId: group.id });
    group.messages.push(msg);
    if (group.messages.length > 200) group.messages = group.messages.slice(-200);
    group.members.forEach(username => emitToUser(username, 'group_message', { groupId: group.id, msg }));
  });

  socket.on('group_history', ({ groupId, token }) => {
    const from = db.getUserByToken(token);
    if (!from) return;
    const group = chatGroups[sanitize(groupId, 20)];
    if (!group || !group.members.includes(from.username)) return;
    const dbMessages = db.getGroupHistory(group.id, 50);
    const memMessages = group.messages || [];
    const allMessages = [...dbMessages, ...memMessages.filter(m => !dbMessages.find(d => d.id === m.id))];
    allMessages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    socket.emit('group_history', { groupId: group.id, messages: allMessages.slice(-50) });
  });

  socket.on('group_invite', ({ groupId, username, token }) => {
    const from = db.getUserByToken(token);
    if (!from) return;
    const group = chatGroups[sanitize(groupId, 20)];
    if (!group || group.createdBy !== from.username) return;
    const target = sanitize(username, 24);
    if (!target || group.members.includes(target)) return;
    group.members.push(target);
    emitToUser(target, 'group_created', { id: group.id, name: group.name, members: group.members, createdBy: group.createdBy });
    group.members.forEach(u => emitToUser(u, 'group_updated', { id: group.id, members: group.members }));
  });

  // ──────────────────────────────────────────────────────
  // 7.5 MÜZIK ARAMA
  // ──────────────────────────────────────────────────────

  socket.on('search_music', async ({ query, token }) => {
    const user = requireAuth(token);
    if (!user) return socket.emit('search_results', []);
    if (checkRate('search', 10)) return socket.emit('search_results', []);
    try {
      const q = sanitize(query, 200);
      if (!q || q.length < 2) { socket.emit('search_results', []); return; }

      const yt = await getInnertube().catch(() => null);
      if (!yt) { socket.emit('search_results', []); return; }

      // Once music search dene
      try {
        const sr = await yt.music.search(q, { type: 'song' });
        const results = (sr.songs?.contents || []).map(s => ({
          id: s.id, title: s.title?.text || s.title?.toString() || '',
          artist: s.artists?.[0]?.name || '', duration: s.duration?.text || '',
          thumbnail: s.thumbnails?.[s.thumbnails.length - 1]?.url || `https://img.youtube.com/vi/${s.id}/hqdefault.jpg`,
          src: s.id
        })).filter(s => s.id && s.title).slice(0, 8);
        if (results.length > 0) { socket.emit('search_results', results); return; }
      } catch {}

      // Fallback: video search
      try {
        const sr = await yt.search(q, { type: 'video' });
        const results = (sr.videos || []).slice(0, 8).map(v => ({
          id: v.id, title: v.title?.text || v.title?.toString() || '',
          artist: v.author?.name || '', duration: v.duration?.text || '',
          thumbnail: v.thumbnails?.[v.thumbnails.length - 1]?.url || `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
          src: v.id
        })).filter(s => s.id && s.title);
        socket.emit('search_results', results);
        return;
      } catch {}

      socket.emit('search_results', []);
    } catch (err) { logger.error('Arama hatasi', { error: err.message }); socket.emit('search_results', []); }
  });

  // ──────────────────────────────────────────────────────
  // 7.6 ODA YÖNETIMI
  // ──────────────────────────────────────────────────────

  socket.on('join_room', ({ roomId, password, maxUsers, token, userCity }) => {
    const user = requireAuth(token);
    if (!user) return socket.emit('room_error', 'Kimlik doğrulama gerekli.');
    const cleanRoomId = sanitize(roomId, 50);
    const userId = user.username;
    const username = user.username;
    const avatar = user.avatar || '🐱';
    const isVip = !!user.isVip;
    let room = rooms[cleanRoomId];

    if (!room) {
      rooms[cleanRoomId] = {
        name: cleanRoomId, password: typeof password === 'string' ? password : '',
        maxUsers: Math.min(Math.max(parseInt(maxUsers) || 2, 2), 8),
        hostUserId: userId, theme: 'default', users: [],
        kickedUsers: [],
        playlist: [], categories: ['Genel'], playMode: 'sequence',
        currentMedia: { type: 'none', src: '', time: 0, isPlaying: false, lastUpdated: Date.now() },
        messages: [], createdAt: Date.now(), lastActivityAt: Date.now(), isVip: !!isVip
      };
      room = rooms[cleanRoomId];
    } else {
      if (room.password && room.password !== (password || '')) { socket.emit('room_error', 'Şifre hatalı!'); return; }
      if (room.kickedUsers && room.kickedUsers.includes(userId)) { socket.emit('room_error', 'Bu odadan atıldınız, tekrar giremezsiniz!'); return; }
      if (!room.users.find(u => u.userId === userId) && room.users.length >= room.maxUsers) { socket.emit('room_error', `Oda Dolu! (${room.users.length}/${room.maxUsers})`); return; }
      if (!room.messages) room.messages = [];
    }

    const existingIndex = room.users.findIndex(u => u.userId === userId);
    const userInfo = { socketId: socket.id, userId, username: sanitize(username, 24) || 'Izleyici', avatar: sanitize(avatar, 10) || '🐱', userCity };
    if (existingIndex !== -1) room.users[existingIndex] = userInfo; else room.users.push(userInfo);
    room.lastActivityAt = Date.now();
    socket.currentRoom = cleanRoomId; socket.userId = userId; socket.join(cleanRoomId);
    db.addConnectionLog(username, socket.id, socket.handshake?.address || '', cleanRoomId, 'join', socket.handshake?.headers?.['user-agent'] || '');

    let calcTime = room.currentMedia.time;
    if (room.currentMedia.isPlaying) calcTime += (Date.now() - room.currentMedia.lastUpdated) / 1000;

    socket.emit('room_joined', {
      roomId: cleanRoomId, roomName: room.name, hostUserId: room.hostUserId, theme: room.theme,
      userCount: room.users.length, maxUsers: room.maxUsers, socketId: socket.id,
      users: room.users, playlist: room.playlist, categories: room.categories,
      playMode: room.playMode, messages: (room.messages || []).slice(-100),
      isVip: !!room.isVip,
      currentMedia: { ...room.currentMedia, time: calcTime }
    });
    updateRoomUsers(cleanRoomId); broadcastRooms();
    broadcastAdminActivity('room_join', { username: user.username, roomId: cleanRoomId, roomName: room.name, message: `${user.username} odaya katıldı: ${room.name}` });
  });

  socket.on('update_room_settings', ({ roomId, newName, newTheme, newHostUserId, newMaxUsers, newPassword }) => {
    const room = rooms[sanitize(roomId, 50)];
    if (room && room.hostUserId === socket.userId) {
      if (newName && newName.trim()) room.name = sanitize(newName, 50);
      if (newTheme) room.theme = newTheme;
      if (newHostUserId && room.users.find(u => u.userId === newHostUserId)) room.hostUserId = newHostUserId;
      if (newMaxUsers) room.maxUsers = Math.min(Math.max(parseInt(newMaxUsers) || 2, 2), 8);
      if (typeof newPassword === 'string') room.password = newPassword;
      io.to(sanitize(roomId, 50)).emit('room_settings_updated', { roomName: room.name, theme: room.theme, hostUserId: room.hostUserId, maxUsers: room.maxUsers });
      broadcastRooms();
    }
  });

  socket.on('kick_user', ({ roomId, targetUserId, token }) => {
    const user = requireAuth(token);
    if (!user) return;
    const room = rooms[sanitize(roomId, 50)];
    if (room && room.hostUserId === user.username && targetUserId !== user.username) {
      const target = room.users.find(u => u.userId === targetUserId);
      if (target) {
        io.to(target.socketId).emit('kicked_from_room', 'Odadan atıldınız, tekrar giremezsiniz!');
        const targetSocket = io.sockets.sockets.get(target.socketId);
        if (targetSocket) targetSocket.leave(sanitize(roomId, 50));
        room.users = room.users.filter(u => u.userId !== targetUserId);
        if (!room.kickedUsers) room.kickedUsers = [];
        room.kickedUsers.push(targetUserId);
        updateRoomUsers(sanitize(roomId, 50)); broadcastRooms();
      }
    }
  });

  // ──────────────────────────────────────────────────────
  // 7.7 PLAYLIST & KATEGORI
  // ──────────────────────────────────────────────────────

  socket.on('create_category', ({ roomId, categoryName, token }) => {
    const user = requireAuth(token);
    if (!user) return;
    const room = rooms[sanitize(roomId, 50)];
    const name = sanitize(categoryName, 50);
    if (room && name && !room.categories.includes(name)) {
      room.categories.push(name);
      io.to(sanitize(roomId, 50)).emit('categories_updated', room.categories);
    }
  });

  socket.on('add_to_playlist', ({ roomId, item, token }) => {
    const user = requireAuth(token);
    if (!user) return;
    const room = rooms[sanitize(roomId, 50)];
    if (room && item && typeof item === 'object') {
      const safeItem = { id: item.id || crypto.randomBytes(8).toString('hex'), title: sanitize(item.title, 200) || 'Video', type: sanitize(item.type, 20) || 'youtube', src: sanitize(item.src, 500) || '', addedBy: user.username };
      room.playlist.push(safeItem);
      io.to(sanitize(roomId, 50)).emit('playlist_updated', { playlist: room.playlist, playMode: room.playMode });
    }
  });

  socket.on('remove_from_playlist', ({ roomId, itemId, token }) => {
    const user = requireAuth(token);
    if (!user) return;
    const room = rooms[sanitize(roomId, 50)];
    if (room) {
      room.playlist = room.playlist.filter(i => i.id !== itemId);
      io.to(sanitize(roomId, 50)).emit('playlist_updated', { playlist: room.playlist, playMode: room.playMode });
    }
  });

  socket.on('change_play_mode', ({ roomId, mode }) => {
    const room = rooms[sanitize(roomId, 50)];
    if (room) {
      room.playMode = mode;
      io.to(sanitize(roomId, 50)).emit('play_mode_changed', mode);
    }
  });

  // ──────────────────────────────────────────────────────
  // 7.8 ODA AKSIYONLARI (MEDYA & SOHBET)
  // ──────────────────────────────────────────────────────

  socket.on('room_action', ({ roomId, type, payload }) => {
    if (type === 'CHAT_MESSAGE' && checkRate('chat', 30)) return;
    if (type !== 'CHAT_MESSAGE' && checkRate('action', 20)) return;
    const cleanRoomId = sanitize(roomId, 50);
    const room = rooms[cleanRoomId];
    if (room) {
      if (type === 'ROOM_CLOSED') {
        io.to(cleanRoomId).emit('room_action', { type: 'ROOM_CLOSED', payload: { message: 'Oda yönetici tarafından kapatıldı.' } });
        for (const u of room.users) {
          io.sockets.sockets.get(u.socketId)?.leave(cleanRoomId);
        }
        delete rooms[cleanRoomId];
        delete tombalaGames[cleanRoomId];
        broadcastRooms();
        logger.info(`Oda kapatildi (yönetici): ${cleanRoomId}`);
        return;
      } else if (type === 'CHANGE_MEDIA') {
        room.currentMedia = { type: payload.type, src: payload.src, title: sanitize(payload.title, 200) || '', source: payload.source || payload.type, time: 0, isPlaying: true, lastUpdated: Date.now() };
      } else if (type === 'PLAY') {
        room.currentMedia.isPlaying = true; room.currentMedia.time = payload.time || 0; room.currentMedia.lastUpdated = Date.now();
      } else if (type === 'PAUSE') {
        room.currentMedia.isPlaying = false; room.currentMedia.time = payload.time || 0; room.currentMedia.lastUpdated = Date.now();
      } else if (type === 'CHAT_MESSAGE') {
        const msg = {
          id: payload.id || crypto.randomBytes(8).toString('hex'),
          senderId: payload.senderId, text: sanitize(payload.text, 500), sender: sanitize(payload.sender, 24),
          avatar: sanitize(payload.avatar, 10), time: payload.time,
          replyTo: payload.replyTo || null, replyToText: sanitize(payload.replyToText, 500), replyToSender: sanitize(payload.replyToSender, 24),
          createdAt: Date.now()
        };
        if (!room.messages) room.messages = [];
        room.messages.push(msg);
        room.messages = room.messages.slice(-200);
        room.lastActivityAt = Date.now();
        socket.to(cleanRoomId).emit('room_action', { type, payload: msg });
        return;
      } else if (type === 'UPDATE_MAX_USERS') {
        room.maxUsers = Math.min(Math.max(parseInt(payload.maxUsers) || 2, 2), 8);
        broadcastRooms();
        io.to(cleanRoomId).emit('room_user_count_update', { userCount: room.users.length, maxUsers: room.maxUsers });
      } else if (type === 'ROOM_NAME_UPDATE') {
        room.name = sanitize(payload.name, 50) || room.name;
        broadcastRooms();
      } else if (type === 'ROOM_THEME_UPDATE') {
        room.theme = sanitize(payload.theme, 30) || room.theme;
        broadcastRooms();
      }
      room.lastActivityAt = Date.now();
    }
    socket.to(cleanRoomId).emit('room_action', { type, payload });
  });

  // ──────────────────────────────────────────────────────
  // 7.9 AYRILMA & BAGLANTI KESIMI
  // ──────────────────────────────────────────────────────

  socket.on('screen_share_start', ({ roomId, token }) => {
    const user = requireAuth(token);
    if (!user || !roomId || !rooms[roomId] || !rooms[roomId].users.find(u => u.userId === user.username)) return;
    socket.to(roomId).emit('screen_share_started', { socketId: socket.id });
  });

  socket.on('screen_share_frame', ({ roomId, frame }) => {
    if (!roomId || !rooms[roomId]) return;
    if (typeof frame !== 'string' || frame.length > 500000) return;
    socket.to(roomId).emit('screen_share_frame', { frame, socketId: socket.id });
  });

  socket.on('screen_share_stop', ({ roomId }) => {
    if (!roomId || !rooms[roomId]) return;
    socket.to(roomId).emit('screen_share_stopped', { socketId: socket.id });
  });

  // Voice chat
  socket.on('voice_join', ({ roomId, token }) => {
    const user = requireAuth(token);
    if (!user) return;
    const cleanRoomId = sanitize(roomId, 50);
    if (!rooms[cleanRoomId]) return;
    if (!rooms[cleanRoomId].users.find(u => u.userId === user.username)) return;
    if (!rooms[cleanRoomId].voiceUsers) rooms[cleanRoomId].voiceUsers = {};
    rooms[cleanRoomId].voiceUsers[socket.id] = { username: user.username, isMuted: false };
    socket.to(cleanRoomId).emit('voice_join', { socketId: socket.id });
    const vu = Object.entries(rooms[cleanRoomId].voiceUsers).map(([sid, u]) => ({ socketId: sid, username: u.username, isMuted: u.isMuted }));
    socket.emit('voice_users', { users: vu });
    socket.to(cleanRoomId).emit('voice_users', { users: vu });
  });

  socket.on('voice_leave', ({ roomId, token }) => {
    const user = requireAuth(token);
    if (!user) return;
    const cleanRoomId = sanitize(roomId, 50);
    if (!rooms[cleanRoomId]) return;
    if (rooms[cleanRoomId].voiceUsers) delete rooms[cleanRoomId].voiceUsers[socket.id];
    socket.to(cleanRoomId).emit('voice_leave', { socketId: socket.id });
    const vu = rooms[cleanRoomId].voiceUsers ? Object.entries(rooms[cleanRoomId].voiceUsers).map(([sid, u]) => ({ socketId: sid, username: u.username, isMuted: u.isMuted })) : [];
    socket.emit('voice_users', { users: vu });
    socket.to(cleanRoomId).emit('voice_users', { users: vu });
  });

  socket.on('voice_mute', ({ roomId, isMuted }) => {
    const cleanRoomId = sanitize(roomId, 50);
    if (!rooms[cleanRoomId]?.voiceUsers?.[socket.id]) return;
    rooms[cleanRoomId].voiceUsers[socket.id].isMuted = isMuted;
    const vu = Object.entries(rooms[cleanRoomId].voiceUsers).map(([sid, u]) => ({ socketId: sid, username: u.username, isMuted: u.isMuted }));
    socket.to(cleanRoomId).emit('voice_users', { users: vu });
  });

  socket.on('voice_signal', ({ targetId, signal }) => {
    const targetSocket = io.sockets.sockets.get(targetId);
    if (targetSocket) targetSocket.emit('voice_signal', { fromId: socket.id, signal });
  });

  socket.on('request_room_sync', ({ roomId }) => {
    const cleanRoomId = sanitize(roomId, 50);
    const room = rooms[cleanRoomId];
    if (room) {
      socket.emit('room_sync_data', {
        currentMedia: room.currentMedia,
        users: room.users.map(u => ({ username: u.username, avatar: u.avatar, userId: u.userId, isHost: u.userId === room.hostUserId })),
        hostUserId: room.hostUserId,
        roomName: room.name,
        roomTheme: room.theme,
        maxUsers: room.maxUsers
      });
    }
  });

  // ── TOMBALA ──

  // ──────────────────────────────────────────────────────
  // 7.10 TOPLULUKLAR (COMMUNITIES)
  // ──────────────────────────────────────────────────────
  const registerCommunityHandlers = require('./communities');
  registerCommunityHandlers(io, socket, db, sanitize, emitToUser, crypto);

  // ── ETKINLIKLER (EVENTS) ──
  const registerEventHandlers = require('./events');
  registerEventHandlers(io, socket, db, sanitize, crypto);

  function generateTombalaCard() {
    const card = [];
    const cols = [[1,10],[11,20],[21,30],[31,40],[41,50]];
    for (let c = 0; c < 5; c++) {
      const colNums = [];
      while (colNums.length < 5) { const n = Math.floor(Math.random() * (cols[c][1] - cols[c][0] + 1)) + cols[c][0]; if (!colNums.includes(n)) colNums.push(n); }
      colNums.sort((a, b) => a - b);
      card.push(...colNums);
    }
    return card;
  }

  socket.on('tombala_start', ({ roomId, token }) => {
    const user = requireAuth(token);
    if (!user) return;
    const room = rooms[sanitize(roomId, 50)];
    if (!room || room.hostUserId !== user.username) return;
    const game = { active: true, calledNumbers: [], currentNumber: null, players: {}, winner: null };
    room.users.forEach(u => { game.players[u.socketId] = { userId: u.userId, username: u.username, card: generateTombalaCard(), lineDone: false }; });
    tombalaGames[roomId] = game;
    io.to(roomId).emit('tombala_game_state', { active: true, calledNumbers: [], currentNumber: null, players: Object.values(game.players).map(p => ({ userId: p.userId, username: p.username })) });
    Object.entries(game.players).forEach(([sid, p]) => { io.to(sid).emit('tombala_your_card', { card: p.card }); });
  });

  socket.on('tombala_call', ({ roomId, token }) => {
    const user = requireAuth(token);
    if (!user) return;
    const game = tombalaGames[sanitize(roomId, 50)];
    if (!game || !game.active) return;
    const room = rooms[sanitize(roomId, 50)];
    if (!room || room.hostUserId !== user.username) return;
    const available = [];
    for (let i = 1; i <= 50; i++) { if (!game.calledNumbers.includes(i)) available.push(i); }
    if (available.length === 0) return;
    const num = available[Math.floor(Math.random() * available.length)];
    game.calledNumbers.push(num);
    game.currentNumber = num;
    io.to(roomId).emit('tombala_number', { number: num, calledNumbers: game.calledNumbers });
  });

  socket.on('tombala_claim', ({ roomId, type, token }) => {
    const user = requireAuth(token);
    if (!user) return;
    const game = tombalaGames[sanitize(roomId, 50)];
    if (!game || !game.active) return;
    const player = game.players[socket.id];
    if (!player || game.winner) return;
    if (type === 'line' && player.lineDone) return;
    const hasLine = (() => {
      const rows = [[0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24]];
      return rows.some(row => row.every(i => game.calledNumbers.includes(player.card[i])));
    })();
    const hasFull = player.card.every(n => game.calledNumbers.includes(n));
    if (type === 'line' && hasLine) {
      player.lineDone = true;
      io.to(roomId).emit('tombala_line', { username: player.username, socketId: socket.id });
    }
    if (type === 'full' && hasFull) {
      game.winner = player.username;
      io.to(roomId).emit('tombala_winner', { username: player.username, type: 'full' });
    }
  });

  socket.on('tombala_end', ({ roomId, token }) => {
    const user = requireAuth(token);
    if (!user) return;
    const room = rooms[sanitize(roomId, 50)];
    if (!room || room.hostUserId !== user.username) return;
    delete tombalaGames[roomId];
    io.to(roomId).emit('tombala_end');
  });

  socket.on('leave_room', () => {
    if (socket.currentRoom && rooms[socket.currentRoom]) {
      const rId = socket.currentRoom;
      rooms[rId].users = rooms[rId].users.filter(u => u.socketId !== socket.id);
      rooms[rId].lastActivityAt = Date.now();
      socket.leave(rId); socket.currentRoom = null;

      if (rooms[rId].users.length === 0) {
        delete rooms[rId];
        delete tombalaGames[rId];
        logger.info(`Oda silindi (bos): ${rId}`);
      } else {
        updateRoomUsers(rId);
      }
      broadcastRooms();
    }
  });

  socket.on('heartbeat', () => {
    if (socket.socialUsername && onlineUsers[socket.socialUsername]) {
      onlineUsers[socket.socialUsername].lastSeen = Date.now();
    }
  });

  socket.on('disconnect', () => {
    adminSocketIds.delete(socket.id);
    if (socket.currentRoom && rooms[socket.currentRoom]) {
      const rId = socket.currentRoom; const sid = socket.id;
      if (rooms[rId]) {
        rooms[rId].users = rooms[rId].users.filter(u => u.socketId !== sid);
        if (rooms[rId].voiceUsers) delete rooms[rId].voiceUsers[sid];
        rooms[rId].lastActivityAt = Date.now();

        if (rooms[rId].users.length === 0) {
          delete rooms[rId];
          delete tombalaGames[rId];
          logger.info(`Oda silindi (disconnect, bos): ${rId}`);
        } else {
          updateRoomUsers(rId);
        }
        broadcastRooms();
      }
    }
    if (socket.socialUsername) { setOffline(socket.socialUsername, socket.id); broadcastOnlineStatus(socket.socialUsername); }
  });
});

// ═══════════════════════════════════════════════════════════
// 8. SUNUCU BAŞLAMA
// ═══════════════════════════════════════════════════════════

process.on('SIGTERM', () => { logger.info('SIGTERM alindi, kapatiliyor...'); db.closeDb(); process.exit(0); });
process.on('SIGINT', () => { logger.info('SIGINT alindi, kapatiliyor...'); db.closeDb(); process.exit(0); });

const HEARTBEAT_TIMEOUT = 30000;
setInterval(() => {
  const now = Date.now();
  for (const [username, data] of Object.entries(onlineUsers)) {
    if (now - data.lastSeen > HEARTBEAT_TIMEOUT) {
      delete onlineUsers[username];
      db.updateLastSeen(username);
      for (const friendName of db.getDb().prepare('SELECT user2 as f FROM friendships WHERE user1 = ?').all(username).map(r => r.f)) {
        emitToUser(friendName, 'friend_online_status', { username, isOnline: false, lastSeen: data.lastSeen });
      }
      for (const friendName of db.getDb().prepare('SELECT user1 as f FROM friendships WHERE user2 = ?').all(username).map(r => r.f)) {
        emitToUser(friendName, 'friend_online_status', { username, isOnline: false, lastSeen: data.lastSeen });
      }
    }
  }
}, 15000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`Sunucu ${PORT} portunda aktif! (${isProd ? 'PRODUCTION' : 'DEVELOPMENT'})`);
});
