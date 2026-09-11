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

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, message: { ok: false, message: 'Çok fazla istek.' }, validate: { xForwardedForHeader: false } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { ok: false, message: 'Çok fazla deneme.' }, validate: { xForwardedForHeader: false } });
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

const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { ok: false, message: 'Çok fazla dosya yükleme.' }, validate: { xForwardedForHeader: false } });

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
    const user = token ? db.getUserByToken(token) : null;
    const uploader = user ? user.username : 'Misafir';
    const videoUrl = `/uploads/${req.file.filename}`;
    res.json({ ok: true, url: videoUrl, filename: req.file.originalname, size: req.file.size, uploader });
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

  if (process.env.VIP_MAINTENANCE === '1' || !stripe) {
    return res.json({ ok: false, message: 'VIP sistemi su an bakimda. Lutfen daha sonra tekrar deneyin.' });
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
  if (process.env.VIP_MAINTENANCE === '1') return res.status(503).json({ ok: false, message: 'VIP sistemi su an bakimda.' });
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
if (!ADMIN_PASSWORD) {
  logger.warn('ADMIN_PASS ayarlanmadi! Güvenlik riski! Varsayilan kullaniliyor.');
}
const EFFECTIVE_ADMIN_PASS = ADMIN_PASSWORD || (isProd ? null : 'admin123');
if (!EFFECTIVE_ADMIN_PASS) {
  logger.error('PRODUCTION modda ADMIN_PASS tanimli degil! Admin paneli calismaz.');
}

function adminAuth(req, res, next) {
  const pass = req.headers['x-admin-pass'] || req.query.pass;
  if (!pass || pass !== EFFECTIVE_ADMIN_PASS) return res.status(403).json({ ok: false, message: 'Yetkisiz' });
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
  try { db.deleteRoom(roomId); } catch (e) {}
  broadcastRooms();
  try { broadcastAdminActivity('room_close', { roomId, message: `Oda kapatıldı: ${roomId}` }); } catch (e) {}
  logger.info(`[ADMIN] Oda kapatildi: ${roomId}`);
  res.json({ ok: true, message: 'Oda kapatildi' });
});

app.get('/api/admin/logs', adminAuth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 200, 1000);
  const roomId = req.query.room || null;
  const logs = db.getConnectionLogs(limit, roomId);
  res.json({ ok: true, logs });
});

app.get('/api/admin/online', adminAuth, (req, res) => {
  const onlineUsers = [];
  for (const [socketId, s] of io.sockets.sockets) {
    if (s.currentRoom) {
      const room = rooms[s.currentRoom];
      const userInRoom = room?.users.find(u => u.socketId === socketId);
      onlineUsers.push({
        socketId,
        userId: s.userId || '-',
        username: s.socialUsername || s.userId || 'Misafir',
        ip: s.handshake?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || s.handshake?.address || '-',
        room: s.currentRoom,
        roomName: room?.name || s.currentRoom,
        avatar: userInRoom?.avatar || null,
        isGuest: !s.socialUsername
      });
    }
  }
  res.json({ ok: true, users: onlineUsers, count: onlineUsers.length });
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
  db.updateUser(uname, { is_vip: !!isVip, vip_plan: isVip ? (vipPlan || 'yearly') : null, vip_expiry: expiry });
  logger.info(`[ADMIN] VIP degistirildi: ${uname} -> ${isVip}`);
  res.json({ ok: true });
});

// Admin: Ban/unban user
app.post('/api/admin/users/ban', adminAuth, (req, res) => {
  const { username, isBanned } = req.body;
  const uname = sanitize(username, 30);
  if (!uname) return res.status(400).json({ ok: false, message: 'Gecersiz kullanici' });
  db.updateUser(uname, { is_banned: !!isBanned });
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

// Admin: Feedback listesi
app.get('/api/admin/feedback', adminAuth, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status || '';
    let rows;
    if (status) {
      rows = db.getDb().prepare('SELECT * FROM feedback WHERE status = ? ORDER BY created_at DESC LIMIT ?').all(status, limit);
    } else {
      rows = db.getDb().prepare('SELECT * FROM feedback ORDER BY created_at DESC LIMIT ?').all(limit);
    }
    res.json({ ok: true, feedback: rows });
  } catch (e) { res.json({ ok: true, feedback: [] }); }
});

// Admin: Feedback durumu güncelle
app.post('/api/admin/feedback/:id', adminAuth, (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['open', 'in_progress', 'resolved', 'dismissed'];
    if (!valid.includes(status)) return res.status(400).json({ ok: false });
    db.getDb().prepare('UPDATE feedback SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false }); }
});

// ═══════════════════════════════════════════════════════════
// ADMIN: DETAYLI KULLANICI PROFİLİ
// ═══════════════════════════════════════════════════════════
app.get('/api/admin/users/:username/detail', adminAuth, (req, res) => {
  try {
    const uname = sanitize(req.params.username, 30);
    const user = db.getUser(uname);
    if (!user) return res.status(404).json({ ok: false, message: 'Kullanıcı bulunamadı' });

    const friendCount = db.getDb().prepare('SELECT COUNT(*) as c FROM friendships WHERE user1 = ? OR user2 = ?').get(uname, uname)?.c || 0;
    const messageCount = db.getDb().prepare('SELECT COUNT(*) as c FROM dm_messages WHERE from_username = ? OR to_username = ?').get(uname, uname)?.c || 0;
    const roomCount = db.getDb().prepare('SELECT COUNT(*) as c FROM rooms WHERE host_user_id = ?').get(uname)?.c || 0;
    const logCount = db.getDb().prepare('SELECT COUNT(*) as c FROM connection_logs WHERE username = ?').get(uname)?.c || 0;
    const lastLogs = db.getDb().prepare('SELECT * FROM connection_logs WHERE username = ? ORDER BY created_at DESC LIMIT 10').all(uname);
    const reportCount = db.getDb().prepare('SELECT COUNT(*) as c FROM user_reports WHERE reporter = ? OR reported = ?').get(uname, uname)?.c || 0;
    const followCount = db.getDb().prepare('SELECT COUNT(*) as c FROM follows WHERE follower = ?').get(uname)?.c || 0;
    const followerCount = db.getDb().prepare('SELECT COUNT(*) as c FROM follows WHERE following = ?').get(uname)?.c || 0;

    res.json({
      ok: true,
      user: { ...db.formatUser(user), created_at: user.created_at, last_seen: user.last_seen },
      stats: { friendCount, messageCount, roomCount, logCount, reportCount, followCount, followerCount },
      recentLogs: lastLogs.map(l => ({ ip: l.ip, room_id: l.room_id, action: l.action, created_at: l.created_at }))
    });
  } catch (e) { res.status(500).json({ ok: false }); }
});

// ═══════════════════════════════════════════════════════════
// ADMIN: HESAP YÖNETİMİ
// ═══════════════════════════════════════════════════════════
app.post('/api/admin/users/reset-password', adminAuth, async (req, res) => {
  try {
    const { username } = req.body;
    const uname = sanitize(username, 30);
    const user = db.getUser(uname);
    if (!user) return res.status(404).json({ ok: false, message: 'Kullanıcı bulunamadı' });
    const crypto = require('crypto');
    const newPass = crypto.randomBytes(8).toString('hex');
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(newPass, 10);
    db.updateUser(uname, { password_hash: hash });
    res.json({ ok: true, newPassword: newPass });
  } catch (e) { res.status(500).json({ ok: false }); }
});

app.post('/api/admin/users/change-email', adminAuth, (req, res) => {
  try {
    const { username, newEmail } = req.body;
    const uname = sanitize(username, 30);
    const email = sanitize(newEmail, 100);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ ok: false, message: 'Geçersiz e-posta' });
    const existing = db.getUserByEmail(email);
    if (existing && existing.username !== uname) return res.status(400).json({ ok: false, message: 'Bu e-posta zaten kayıtlı' });
    db.updateUser(uname, { email });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false }); }
});

app.post('/api/admin/users/freeze', adminAuth, (req, res) => {
  try {
    const { username, frozen } = req.body;
    const uname = sanitize(username, 30);
    db.updateUser(uname, { frozen: frozen ? 1 : 0 });
    logger.info(`[ADMIN] Hesap donduruldu: ${uname} -> ${frozen}`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false }); }
});

// ═══════════════════════════════════════════════════════════
// ADMIN: GELİŞMİŞ ANALİTİK
// ═══════════════════════════════════════════════════════════
app.get('/api/admin/analytics', adminAuth, (req, res) => {
  try {
    const now = Date.now();
    const day = 86400000;
    const usersToday = db.getDb().prepare('SELECT COUNT(*) as c FROM users WHERE created_at > ?').get(now - day)?.c || 0;
    const usersWeek = db.getDb().prepare('SELECT COUNT(*) as c FROM users WHERE created_at > ?').get(now - 7 * day)?.c || 0;
    const usersMonth = db.getDb().prepare('SELECT COUNT(*) as c FROM users WHERE created_at > ?').get(now - 30 * day)?.c || 0;
    const activeToday = db.getDb().prepare('SELECT COUNT(DISTINCT username) as c FROM connection_logs WHERE created_at > ?').get(now - day)?.c || 0;
    const activeWeek = db.getDb().prepare('SELECT COUNT(DISTINCT username) as c FROM connection_logs WHERE created_at > ?').get(now - 7 * day)?.c || 0;
    const roomsCreatedToday = db.getDb().prepare('SELECT COUNT(*) as c FROM rooms WHERE created_at > ?').get(now - day)?.c || 0;
    const roomsCreatedWeek = db.getDb().prepare('SELECT COUNT(*) as c FROM rooms WHERE created_at > ?').get(now - 7 * day)?.c || 0;
    const messagesToday = db.getDb().prepare('SELECT COUNT(*) as c FROM dm_messages WHERE created_at > ?').get(now - day)?.c || 0;
    const messagesWeek = db.getDb().prepare('SELECT COUNT(*) as c FROM dm_messages WHERE created_at > ?').get(now - 7 * day)?.c || 0;
    const topRooms = db.getDb().prepare('SELECT room_id, COUNT(*) as visits FROM connection_logs WHERE created_at > ? GROUP BY room_id ORDER BY visits DESC LIMIT 10').all(now - day);
    const dailySignups = db.getDb().prepare("SELECT date(created_at/1000, 'unixepoch') as day, COUNT(*) as count FROM users WHERE created_at > ? GROUP BY day ORDER BY day DESC LIMIT 30").all(now - 30 * day);

    res.json({
      ok: true,
      analytics: {
        users: { today: usersToday, week: usersWeek, month: usersMonth },
        active: { today: activeToday, week: activeWeek },
        rooms: { today: roomsCreatedToday, week: roomsCreatedWeek },
        messages: { today: messagesToday, week: messagesWeek },
        topRooms,
        dailySignups
      }
    });
  } catch (e) { res.status(500).json({ ok: false }); }
});

// ═══════════════════════════════════════════════════════════
// ADMIN: CANLI SOHBET TEMİZLEME
// ═══════════════════════════════════════════════════════════
app.delete('/api/admin/clear-global-chat', adminAuth, (req, res) => {
  try {
    db.clearGlobalMessages();
    logger.info('[ADMIN] Canlı sohbet mesajları temizlendi');
    io.emit('global_chat_cleared', { by: req.admin?.username || 'admin' });
    res.json({ ok: true, message: 'Canlı sohbet temizlendi' });
  } catch (err) {
    logger.error('[ADMIN] Canlı sohbet temizleme hatası:', err.message);
    res.status(500).json({ ok: false, message: 'Temizleme hatası' });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN: TOPLU İLETİŞİM
// ═══════════════════════════════════════════════════════════
app.post('/api/admin/bulk-message', adminAuth, (req, res) => {
  try {
    const { target, message, type } = req.body;
    const msg = sanitize(message, 1000);
    if (!msg) return res.status(400).json({ ok: false, message: 'Mesaj boş olamaz' });

    if (type === 'all') {
      const users = db.getDb().prepare('SELECT username FROM users').all();
      let count = 0;
      for (const u of users) {
        try {
          db.createNotification(u.username, 'admin_broadcast', 'admin', 'Admin Duyurusu', msg, {});
          count++;
        } catch {}
      }
      logger.info(`[ADMIN] Toplu mesaj gönderildi: ${count} kullanıcıya`);
      res.json({ ok: true, sentCount: count });
    } else if (type === 'vip') {
      const users = db.getDb().prepare('SELECT username FROM users WHERE is_vip = 1').all();
      let count = 0;
      for (const u of users) {
        try {
          db.createNotification(u.username, 'admin_broadcast', 'admin', 'VIP Duyurusu', msg, {});
          count++;
        } catch {}
      }
      res.json({ ok: true, sentCount: count });
    } else if (type === 'single' && target) {
      const uname = sanitize(target, 30);
      db.createNotification(uname, 'admin_broadcast', 'admin', 'Admin Mesajı', msg, {});
      res.json({ ok: true, sentCount: 1 });
    } else {
      res.status(400).json({ ok: false, message: 'Geçersiz hedef' });
    }
  } catch (e) { res.status(500).json({ ok: false }); }
});

app.post('/api/admin/send-email', adminAuth, async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    if (!nodemailer) return res.status(500).json({ ok: false, message: 'E-posta servisi mevcut değil' });
    const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.gmail.com', port: 587, secure: false, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    if (to === 'all') {
      const users = db.getDb().prepare('SELECT email FROM users WHERE email IS NOT NULL AND email != ""').all();
      const emails = users.map(u => u.email);
      if (emails.length === 0) return res.json({ ok: true, sentCount: 0 });
      await transporter.sendMail({ from: process.env.SMTP_USER || 'noreply@couplemeeting.com.tr', to: emails.join(','), subject: sanitize(subject, 200), html: sanitize(body, 5000) });
      res.json({ ok: true, sentCount: emails.length });
    } else {
      await transporter.sendMail({ from: process.env.SMTP_USER || 'noreply@couplemeeting.com.tr', to: sanitize(to, 100), subject: sanitize(subject, 200), html: sanitize(body, 5000) });
      res.json({ ok: true, sentCount: 1 });
    }
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// FEEDBACK / HATA BILDIRIMI
// ═══════════════════════════════════════════════════════════
app.post('/api/feedback', (req, res) => {
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
      } catch (e) { logger.error?.('Feedback kaydetme hatası: ' + e.message); }
    }
    try { broadcastAdminActivity('feedback', { type, title, message: `Yeni geri bildirim: ${title}` }); } catch (e) {}
    res.json({ ok: true, message: 'Geri bildiriminiz alındı, teşekkürler!' });
  } catch (e) {
    res.status(500).json({ ok: false, message: 'Bir hata oluştu.' });
  }
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

// DB'den odalari yukle
function loadRoomsFromDb() {
  try {
    const savedRooms = db.getAllRooms();
    for (const r of savedRooms) {
      rooms[r.id] = {
        id: r.id,
        name: r.name,
        hostUserId: r.host_user_id,
        password: r.password || '',
        isVip: !!r.is_vip,
        maxUsers: r.max_users || 10,
        theme: r.theme || 'default',
        createdAt: r.created_at,
        lastActivityAt: r.last_activity_at,
        users: [],
        currentMedia: null,
        playlist: db.getRoomPlaylist(r.id).map(v => ({ id: v.video_id, title: v.title, thumbnail: v.thumbnail, addedBy: v.added_by })),
        messages: db.getRoomMessages(r.id, 200).map(m => ({
          id: m.id, username: m.username, avatar: m.avatar, text: m.text, time: m.time, createdAt: m.created_at
        })),
        voiceUsers: [],
        kickedUsers: []
      };
    }
    if (savedRooms.length > 0) logger.info(`[DB] ${savedRooms.length} oda yüklendi.`);
  } catch (e) {
    logger.error?.('Oda yükleme hatası: ' + e.message);
  }
}
loadRoomsFromDb();

// Grup sohbeti tanimlarini DB'den yukle
function loadGroupChatsFromDb() {
  try {
    const groups = db.getAllGroupChatDefs();
    for (const g of groups) {
      globalChatGroups[g.id] = { id: g.id, name: g.name, createdBy: g.created_by, members: g.members, createdAt: g.created_at, messages: [] };
    }
    if (groups.length > 0) logger.info(`[DB] ${groups.length} grup sohbeti yüklendi.`);
  } catch (e) {
    logger.error?.('Grup yükleme hatası: ' + e.message);
  }
}
loadGroupChatsFromDb();

// --- Yardimci Fonksiyonlar ---

function publicUser(u) {
  if (!u) return null;
  return {
    username: u.username, avatar: u.avatar || '🐱',
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

function broadcastRooms() {
  io.emit('public_rooms_update', getPublicRoomsList());
  try { broadcastAdminDashboard(); } catch (e) { /* admin broadcast hatasi onemsiz */ }
}

// Admin real-time dashboard broadcast
let adminDashboardInterval = null;
function broadcastAdminDashboard() {
  if (adminSocketIds.size === 0) return;
  const onlineCount = Object.keys(onlineUsers).length;
  const roomList = Object.entries(rooms).map(([id, r]) => ({
    id, name: r.name, userCount: r.users.length, maxUsers: r.maxUsers,
    hasPassword: !!r.password, password: r.password || '', isVip: !!r.isVip, hostUserId: r.hostUserId,
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
    if (adminSocketIds.size > 0) {
      try { broadcastAdminDashboard(); } catch (e) { /* ignore */ }
    }
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

const ROOM_CLEANUP_INTERVAL = 60 * 1000; // Her dakika kontrol et
const ROOM_EMPTY_TIMEOUT = 5 * 60 * 1000; // 5 dakika
setInterval(() => {
  const now = Date.now(); let cleaned = 0;
  for (const [id, room] of Object.entries(rooms)) {
    // VIP odalar asla silinmesin
    if (room.isVip) continue;
    // Boş oda 5 dakika geçmişse sil
    if (room.users.length === 0 && room.emptySince && (now - room.emptySince) > ROOM_EMPTY_TIMEOUT) {
      try { db.deleteRoom(id); } catch (e) {}
      delete rooms[id]; delete tombalaGames[id]; cleaned++;
    }
  }
  if (cleaned > 0) { logger.info(`${cleaned} bos oda silindi (5dk kurali).`); broadcastRooms(); }
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
  const socketRateLimit = { chat: 0, join: 0, action: 0, auth: 0, search: 0, lastReset: Date.now() };
  const resetRateLimits = () => {
    const now = Date.now();
    if (now - socketRateLimit.lastReset > 10000) {
      socketRateLimit.chat = 0;
      socketRateLimit.join = 0;
      socketRateLimit.action = 0;
      socketRateLimit.auth = 0;
      socketRateLimit.search = 0;
      socketRateLimit.lastReset = now;
    }
  };
  const checkRate = (type, max) => { resetRateLimits(); socketRateLimit[type]++; return socketRateLimit[type] > max; };

  // ──────────────────────────────────────────────────────
  // 7.0 ADMIN REAL-TIME DASHBOARD
  // ──────────────────────────────────────────────────────
  socket.on('admin_connect', ({ pass } = {}) => {
    if (pass !== EFFECTIVE_ADMIN_PASS) return;
    adminSocketIds.add(socket.id);
    startAdminUpdates();
    try { broadcastAdminDashboard(); } catch (e) {}
    try { broadcastAdminActivity('admin_login', { message: 'Admin panele bağlandı' }); } catch (e) {}
  });

  socket.on('admin_disconnect', () => {
    adminSocketIds.delete(socket.id);
  });

  // ──────────────────────────────────────────────────────
  // 7.1 KIMLIK DOGRULAMA
  // ──────────────────────────────────────────────────────

  socket.on('auth_register', ({ username, email, password, bio, avatar } = {}) => {
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
    try {
      db.createUser(cleanUsername, cleanEmail, `${salt}:${hash}`, sanitize(avatar, 10) || '🐱', sanitize(bio, 120));
    } catch (e) {
      logger.error(`[KAYIT] DB hatasi: ${cleanUsername} - ${e.message}`);
      return socket.emit('auth_result', { ok: false, message: 'Bu kullanici adi veya e-posta zaten kayitli.' });
    }
    const token = db.createToken(cleanUsername);
    socket.socialUsername = cleanUsername;
    setOnline(cleanUsername, socket.id);
    const clientIp = socket.handshake?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || socket.handshake?.address || 'bilinmiyor';
    const userAgent = socket.handshake?.headers?.['user-agent'] || 'bilinmiyor';
    const timestamp = new Date().toISOString();
    logger.info(`[KAYIT] ${cleanUsername} | IP: ${clientIp} | Tarayıcı: ${userAgent} | Zaman: ${timestamp}`);
    db.addConnectionLog(cleanUsername, socket.id, clientIp, '', 'register', userAgent);
    socket.emit('auth_result', { ok: true, user: publicUser(db.getUser(cleanUsername)), token });
    try { broadcastAdminActivity('user_register', { username: cleanUsername, message: `${cleanUsername} kayıt oldu`, ip: clientIp, time: timestamp }); } catch (e) {}
    try { broadcastAdminDashboard(); } catch (e) {}
  });

  socket.on('auth_login', ({ email, password } = {}) => {
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
    const clientIp = socket.handshake?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || socket.handshake?.address || 'bilinmiyor';
    const userAgent = socket.handshake?.headers?.['user-agent'] || 'bilinmiyor';
    const timestamp = new Date().toISOString();
    logger.info(`[GIRIS] ${user.username} | IP: ${clientIp} | Tarayıcı: ${userAgent} | Zaman: ${timestamp}`);
    db.addConnectionLog(user.username, socket.id, clientIp, '', 'login', userAgent);
    socket.emit('auth_result', { ok: true, user: publicUser(user), token });
    try { broadcastAdminActivity('user_login', { username: user.username, message: `${user.username} giriş yaptı`, ip: clientIp, time: timestamp }); } catch (e) {}
    try { broadcastAdminDashboard(); } catch (e) {}
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
    logger.info?.(`[SIFRE SIFIRLAMA] ${cleanEmail} → token: ${resetToken} | IP: ${socket.handshake?.address || 'bilinmiyor'}`);
    socket.emit('forgot_result', { ok: true, message: 'Şifre sıfırlama kodu e-postana gönderildi.', resetToken });
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

  // HESAP SILME
  socket.on('delete_account', ({ token, password }) => {
    const user = db.getUserByToken(token);
    if (!user) return socket.emit('delete_account_result', { ok: false, message: 'Kullanıcı bulunamadı.' });
    try {
      const [salt, hash] = user.passwordHash.split(':');
      const check = crypto.scryptSync(password || '', salt, 64).toString('hex');
      if (!crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'))) {
        return socket.emit('delete_account_result', { ok: false, message: 'Şifre hatalı.' });
      }
      const username = user.username;
      // Tüm token'ları sil
      db.getDb().prepare('DELETE FROM tokens WHERE username = ?').run(username);
      // Arkadaşlıkları sil
      db.getDb().prepare('DELETE FROM friendships WHERE user1 = ? OR user2 = ?').run(username, username);
      db.getDb().prepare('DELETE FROM friend_requests WHERE from_username = ? OR to_username = ?').run(username, username);
      // DM'leri sil
      db.getDb().prepare('DELETE FROM dm_messages WHERE from_username = ? OR to_username = ?').run(username, username);
      // Bildirimleri sil
      db.getDb().prepare('DELETE FROM notifications WHERE username = ?').run(username);
      // Raporları sil
      db.getDb().prepare('DELETE FROM user_reports WHERE reporter = ? OR reported = ?').run(username, username);
      // Takipleri sil
      db.getDb().prepare('DELETE FROM follows WHERE follower = ? OR following = ?').run(username, username);
      // Roller sil
      db.getDb().prepare('DELETE FROM user_roles WHERE username = ?').run(username);
      // Blokları sil
      db.getDb().prepare('DELETE FROM blocked_users WHERE blocker = ? OR blocked = ?').run(username, username);
      // Reaksiyonları sil
      db.getDb().prepare('DELETE FROM message_reactions WHERE username = ?').run(username);
      // Feed sil
      db.getDb().prepare('DELETE FROM feed_items WHERE username = ?').run(username);
      // Push subscription sil
      db.getDb().prepare('DELETE FROM push_subscriptions WHERE username = ?').run(username);
      // Kullanıcıyı sil
      db.getDb().prepare('DELETE FROM users WHERE username = ?').run(username);
      logger.info(`[HESAP SILINDI] ${username}`);
      socket.emit('delete_account_result', { ok: true, message: 'Hesabın başarıyla silindi.' });
    } catch (e) {
      logger.error?.('Hesap silme hatası: ' + e.message);
      socket.emit('delete_account_result', { ok: false, message: 'Bir hata oluştu.' });
    }
  });

  // ──────────────────────────────────────────────────────
  // 7.2 PROFIL & SOSYAL
  // ──────────────────────────────────────────────────────

  socket.on('social_sync', ({ token } = {}) => {
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
    const oldName = user.username;
    db.updateUser(oldName, updates);
    if (updates.username && updates.username !== oldName) {
      try { db.getDb().prepare('UPDATE tokens SET username = ? WHERE username = ?').run(updates.username, oldName); } catch (e) {}
    }
    const updated = db.getUser(updates.username || user.username);
    socket.emit('social_profile', publicUser(updated));
  });

  // ── ŞİFRE DEĞİŞTİRME ──
  socket.on('change_password', ({ token, currentPassword, newPassword }) => {
    const user = db.getUserByToken(token);
    if (!user) return socket.emit('change_password_result', { success: false, message: 'Kullanıcı bulunamadı.' });
    const [salt, hash] = user.passwordHash.split(':');
    const newHash = crypto.scryptSync(currentPassword, salt, 64).toString('hex');
    const match = crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(newHash, 'hex'));
    if (!match) return socket.emit('change_password_result', { success: false, message: 'Mevcut şifre hatalı.' });
    if (!newPassword || newPassword.length < 6) return socket.emit('change_password_result', { success: false, message: 'Yeni şifre en az 6 karakter olmalı.' });
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHashFull = crypto.scryptSync(newPassword, newSalt, 64).toString('hex');
    db.updateUser(user.username, { password_hash: `${newSalt}:${newHashFull}` });
    socket.emit('change_password_result', { success: true, message: 'Şifre başarıyla değiştirildi.' });
  });

  // ── YAZMA İNDİKATÖRÜ ──
  socket.on('typing_start', ({ to, token } = {}) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    emitToUser(sanitize(to, 24), 'typing_indicator', { from: user.username, typing: true });
  });
  socket.on('typing_stop', ({ to, token } = {}) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    emitToUser(sanitize(to, 24), 'typing_indicator', { from: user.username, typing: false });
  });

  // ── ODA İÇİ YAZMA İNDİKATÖRÜ ──
  socket.on('room_typing_start', ({ roomId } = {}) => {
    const cleanRoomId = sanitize(roomId, 50);
    if (!rooms[cleanRoomId]) return;
    const username = socket.userId || 'Biri';
    socket.to(cleanRoomId).emit('room_typing_indicator', { username, typing: true });
  });

  socket.on('room_typing_stop', ({ roomId } = {}) => {
    const cleanRoomId = sanitize(roomId, 50);
    if (!rooms[cleanRoomId]) return;
    const username = socket.userId || 'Biri';
    socket.to(cleanRoomId).emit('room_typing_indicator', { username, typing: false });
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

  socket.on('feed_create', ({ token, text }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const cleanText = sanitize(text, 500);
    if (!cleanText) return;
    const id = db.addFeedItem(user.username, 'post', { text: cleanText });
    const item = { id, username: user.username, avatar: user.avatar, type: 'post', data: JSON.stringify({ text: cleanText }), created_at: Date.now(), liked_by: [], like_count: 0, comment_count: 0 };
    user.followers && user.followers.forEach(f => emitToUser(f, 'new_feed_item', { item }));
  });

  socket.on('feed_like', ({ token, feedId }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const result = db.likeFeedItem(feedId, user.username);
    if (result !== null) {
      const likes = db.getFeedLikes(feedId);
      const item = db.prepare ? db.prepare('SELECT * FROM feed_items WHERE id = ?').get(feedId) : null;
      if (item) {
        const feedUser = item.username;
        if (result === true && feedUser !== user.username) {
          emitToUser(feedUser, 'notification', { type: 'feed_like', from: user.username, title: 'Gönderini beğendi', body: cleanText ? cleanText.slice(0, 50) : '' });
        }
      }
      socket.emit('feed_like_result', { feedId, liked: result === true, likeCount: likes.length, likedBy: likes });
    }
  });

  socket.on('feed_comment', ({ token, feedId, text }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const cleanText = sanitize(text, 300);
    if (!cleanText) return;
    const comment = db.addFeedComment(feedId, user.username, cleanText);
    if (comment) {
      comment.avatar = user.avatar;
      socket.emit('feed_comment_result', { feedId, comment });
      const item = db.prepare ? db.prepare('SELECT username FROM feed_items WHERE id = ?').get(feedId) : null;
      if (item && item.username !== user.username) {
        emitToUser(item.username, 'notification', { type: 'feed_comment', from: user.username, title: 'Gönderine yorum yaptı', body: cleanText.slice(0, 50) });
      }
    }
  });

  socket.on('feed_delete', ({ token, feedId }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    db.deleteFeedItem(feedId, user.username);
    socket.emit('feed_deleted', { feedId });
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

  // ── EMAIL DOGRULAMA (pasif) ──
  socket.on('send_verification_email', () => {
    socket.emit('verify_result', { success: true, message: 'Email doğrulama şu an pasif.' });
  });

  socket.on('verify_email_code', () => {
    socket.emit('verify_result', { success: true, message: 'Email doğrulama şu an pasif.' });
  });

  // ── IKI FAKTORLU DOGRULAMA (pasif) ──
  socket.on('setup_2fa', () => {
    socket.emit('two_factor_setup', { success: false, message: '2FA şu an kullanılamıyor.' });
  });

  socket.on('verify_2fa_setup', () => {
    socket.emit('two_factor_result', { success: false, message: '2FA şu an kullanılamıyor.' });
  });

  socket.on('disable_2fa', () => {
    socket.emit('two_factor_result', { success: false, message: '2FA şu an kullanılamıyor.' });
  });

  socket.on('get_2fa_status', () => {
    socket.emit('two_factor_status', { enabled: false });
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

  socket.on('global_chat_message', ({ text, token } = {}) => {
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

  socket.on('dm_send', ({ to, text, token, msgId, replyTo } = {}) => {
    if (checkRate('chat', 30)) return;
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
      id: msgId || crypto.randomBytes(8).toString('hex'),
      from: from.username, fromAvatar: from.avatar,
      to: toUser.username, toAvatar: toUser.avatar,
      text: cleanText,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      replyTo: replyTo ? { sender: sanitize(replyTo.sender, 24), text: sanitize(replyTo.text, 200) } : undefined
    };
    db.saveDmMessage(msg);
    const key = [from.username, toUser.username].sort().join(':');
    if (!dmMessages[key]) dmMessages[key] = [];
    dmMessages[key].push(msg);
    if (dmMessages[key].length > 200) dmMessages[key] = dmMessages[key].slice(-200);
    emitToUser(toUser.username, 'dm_received', msg);
    socket.emit('dm_sent', { ...msg, localMsgId: msgId });
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
    try { db.saveGroupChatDef({ id, name: cleanName, createdBy: from.username, members: memberList, createdAt: Date.now() }); } catch (e) {}
    memberList.forEach(username => emitToUser(username, 'group_created', { id, name: cleanName, members: memberList, createdBy: from.username }));
  });

  socket.on('group_list', ({ token }) => {
    const from = db.getUserByToken(token);
    if (!from) return;
    const groups = Object.values(chatGroups).filter(g => g.members.includes(from.username));
    socket.emit('group_list', { groups: groups.map(g => ({
      id: g.id, name: g.name, members: g.members, createdBy: g.createdBy,
      lastMessage: (g.messages && g.messages.length > 0) ? g.messages[g.messages.length - 1] : null,
      memberStatus: g.members.map(m => ({ username: m, isOnline: !!onlineUsers[m], lastSeen: onlineUsers[m]?.lastSeen || null }))
    })) });
  });

  socket.on('group_send', ({ groupId, text, token, replyTo }) => {
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
      createdAt: Date.now(),
      replyTo: replyTo ? { sender: sanitize(replyTo.sender, 24), text: sanitize(replyTo.text, 200) } : undefined
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
    const dbMessages = (db.getGroupHistory(group.id, 50) || []).map(m => ({
      id: m.id, from: m.from_username, fromAvatar: m.from_avatar || '🐱', text: m.text, time: m.time, createdAt: m.created_at
    }));
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
    try { db.saveGroupChatDef({ id: group.id, name: group.name, createdBy: group.createdBy, members: group.members, createdAt: group.createdAt || Date.now() }); } catch (e) {}
    emitToUser(target, 'group_created', { id: group.id, name: group.name, members: group.members, createdBy: group.createdBy });
    group.members.forEach(u => emitToUser(u, 'group_updated', { id: group.id, members: group.members }));
  });

  // ──────────────────────────────────────────────────────
  // 7.5 MÜZIK ARAMA
  // ──────────────────────────────────────────────────────

  socket.on('search_music', async ({ query, token }) => {
    if (checkRate('search', 10)) return socket.emit('search_results', []);
    try {
      const q = sanitize(query, 200);
      if (!q || q.length < 2) { socket.emit('search_results', []); return; }

      const yt = await getInnertube().catch(() => null);
      if (!yt) { socket.emit('search_results', []); return; }

      // YouTube video ara (müzik + video hepsi)
      try {
        const sr = await yt.search(q, { type: 'video' });
        const results = (sr.videos || []).slice(0, 10).map(v => ({
          id: v.id, title: v.title?.text || v.title?.toString() || '',
          artist: v.author?.name || '', duration: v.duration?.text || '',
          thumbnail: v.thumbnails?.[v.thumbnails.length - 1]?.url || `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
          src: v.id
        })).filter(s => s.id && s.title);
        if (results.length > 0) { socket.emit('search_results', results); return; }
      } catch {}

      // Fallback: müzik araması
      try {
        const sr = await yt.music.search(q, { type: 'song' });
        const results = (sr.songs?.contents || []).map(s => ({
          id: s.id, title: s.title?.text || s.title?.toString() || '',
          artist: s.artists?.[0]?.name || '', duration: s.duration?.text || '',
          thumbnail: s.thumbnails?.[s.thumbnails.length - 1]?.url || `https://img.youtube.com/vi/${s.id}/hqdefault.jpg`,
          src: s.id
        })).filter(s => s.id && s.title).slice(0, 10);
        socket.emit('search_results', results);
        return;
      } catch {}

      socket.emit('search_results', []);
    } catch (err) { logger.error('Arama hatasi', { error: err.message }); socket.emit('search_results', []); }
  });

  // ──────────────────────────────────────────────────────
  // 7.6 ODA YÖNETIMI
  // ──────────────────────────────────────────────────────

  socket.on('join_room', ({ roomId, password, maxUsers, token, userCity, clientUserId } = {}) => {
    const user = token ? requireAuth(token) : null;
    const cleanRoomId = sanitize(roomId, 50);
    const userId = user ? user.username : (clientUserId && typeof clientUserId === 'string' ? sanitize(clientUserId, 50) : 'misafir-' + Math.floor(1000 + Math.random() * 9000));
    const username = user ? user.username : userId;
    const avatar = user ? (user.avatar || '🐱') : '🐱';
    const isVip = user ? !!user.isVip : false;
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
      try { db.saveRoom({ id: cleanRoomId, name: cleanRoomId, hostUserId: userId, password: room.password, isVip: room.isVip, maxUsers: room.maxUsers, theme: room.theme, createdAt: room.createdAt, lastActivityAt: room.lastActivityAt }); } catch (e) {}
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
    const joinClientIp = socket.handshake?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || socket.handshake?.address || '';
    db.addConnectionLog(username, socket.id, joinClientIp, cleanRoomId, 'join', socket.handshake?.headers?.['user-agent'] || '');

    let calcTime = room.currentMedia?.time || 0;
    if (room.currentMedia?.isPlaying) calcTime += (Date.now() - (room.currentMedia.lastUpdated || Date.now())) / 1000;

    socket.emit('room_joined', {
      roomId: cleanRoomId, roomName: room.name, hostUserId: room.hostUserId, theme: room.theme,
      userCount: room.users.length, maxUsers: room.maxUsers, socketId: socket.id,
      users: room.users, playlist: room.playlist, categories: room.categories,
      playMode: room.playMode, messages: (room.messages || []).slice(-100),
      isVip: !!room.isVip,
      currentMedia: { ...room.currentMedia, time: calcTime }
    });
    updateRoomUsers(cleanRoomId); broadcastRooms();
    try { broadcastAdminActivity('room_join', { username, roomId: cleanRoomId, roomName: room.name, message: `${username} odaya katıldı: ${room.name}` }); } catch (e) {}
    try {
      const feedId = db.addFeedItem(username, 'room_join', { roomId: cleanRoomId, roomName: room.name });
      if (feedId) {
        const user = db.getUser(username);
        const followers = db.prepare ? db.prepare('SELECT following FROM follows WHERE follower = ?').all(username) : [];
        followers.forEach(f => emitToUser(f.following, 'new_feed_item', { item: { id: feedId, username, avatar: user?.avatar || '🐱', type: 'room_join', data: JSON.stringify({ roomId: cleanRoomId, roomName: room.name }), created_at: Date.now(), liked_by: [], like_count: 0, comment_count: 0 } }));
      }
    } catch (e) {}
  });

  socket.on('update_room_settings', ({ roomId, newName, newTheme, newHostUserId, newMaxUsers, newPassword } = {}) => {
    const room = rooms[sanitize(roomId, 50)];
    if (!room) return;
    const isHost = room.hostUserId === socket.userId || room.hostUserId === socket.socialUsername;
    if (!isHost) return;
    if (newName && newName.trim()) room.name = sanitize(newName, 50);
    if (newTheme) room.theme = newTheme;
    if (newHostUserId && room.users.find(u => u.userId === newHostUserId)) room.hostUserId = newHostUserId;
    if (newMaxUsers) room.maxUsers = Math.min(Math.max(parseInt(newMaxUsers) || 2, 2), 8);
    if (typeof newPassword === 'string') room.password = newPassword;
    try { db.saveRoom({ id: sanitize(roomId, 50), name: room.name, hostUserId: room.hostUserId, password: room.password, isVip: room.isVip, maxUsers: room.maxUsers, theme: room.theme, createdAt: room.createdAt, lastActivityAt: room.lastActivityAt }); } catch (e) {}
    io.to(sanitize(roomId, 50)).emit('room_settings_updated', { roomName: room.name, theme: room.theme, hostUserId: room.hostUserId, maxUsers: room.maxUsers, hasPassword: !!room.password });
    broadcastRooms();
  });

  socket.on('kick_user', ({ roomId, targetUserId, token } = {}) => {
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
    const user = token ? requireAuth(token) : null;
    const addedBy = user ? user.username : (socket.userId || 'Misafir');
    const room = rooms[sanitize(roomId, 50)];
    if (room && item && typeof item === 'object') {
      const safeItem = { id: item.id || crypto.randomBytes(8).toString('hex'), title: sanitize(item.title, 200) || 'Video', type: sanitize(item.type, 20) || 'youtube', src: sanitize(item.src, 500) || '', addedBy: sanitize(addedBy, 24) };
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

  socket.on('room_action', ({ roomId, type, payload } = {}) => {
    if (type === 'CHAT_MESSAGE' && checkRate('chat', 30)) return;
    if (type !== 'CHAT_MESSAGE' && checkRate('action', 20)) return;
    const cleanRoomId = sanitize(roomId, 50);
    const room = rooms[cleanRoomId];
    if (room) {
      if (type === 'ROOM_CLOSED') {
        // Sadece host odayı kapatabilir
        if (room.hostUserId !== socket.socialUsername && room.hostUserId !== socket.userId) return;
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
        const isFileMsg = payload.text && payload.text.startsWith('[Dosya:');
        const msg = {
          id: payload.id || crypto.randomBytes(8).toString('hex'),
          senderId: payload.senderId, text: isFileMsg ? payload.text : sanitize(payload.text, 500), sender: sanitize(payload.sender, 24),
          avatar: sanitize(payload.avatar, 10), time: payload.time,
          replyTo: payload.replyTo || null, replyToText: sanitize(payload.replyToText, 500), replyToSender: sanitize(payload.replyToSender, 24),
          createdAt: Date.now()
        };
        if (!room.messages) room.messages = [];
        room.messages.push(msg);
        try { db.saveRoomMessage({ id: msg.id, roomId: cleanRoomId, username: msg.sender, avatar: msg.avatar, text: msg.text, time: msg.time, createdAt: msg.createdAt }); } catch (e) {}
        try { db.updateRoomActivity(cleanRoomId); } catch (e) {}
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
    const user = token ? requireAuth(token) : null;
    const userId = user ? user.username : socket.userId;
    if (!userId || !roomId || !rooms[roomId] || !rooms[roomId].users.find(u => u.userId === userId)) return;
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
    const user = token ? requireAuth(token) : null;
    const userId = user ? user.username : socket.userId;
    const username = user ? user.username : userId;
    const cleanRoomId = sanitize(roomId, 50);
    if (!rooms[cleanRoomId]) return;
    if (!rooms[cleanRoomId].users.find(u => u.userId === userId)) return;
    if (!rooms[cleanRoomId].voiceUsers) rooms[cleanRoomId].voiceUsers = {};
    rooms[cleanRoomId].voiceUsers[socket.id] = { username, isMuted: false };
    socket.to(cleanRoomId).emit('voice_join', { socketId: socket.id });
    const vu = Object.entries(rooms[cleanRoomId].voiceUsers).map(([sid, u]) => ({ socketId: sid, username: u.username, isMuted: u.isMuted }));
    socket.emit('voice_users', { users: vu });
    socket.to(cleanRoomId).emit('voice_users', { users: vu });
  });

  socket.on('voice_leave', ({ roomId, token }) => {
    const user = token ? requireAuth(token) : null;
    const userId = user ? user.username : socket.userId;
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

  socket.on('request_room_sync', ({ roomId } = {}) => {
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
    tombalaGames[sanitize(roomId, 50)] = game;
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
      // Host transfer: kullanıcıyı silmeden önce username'i kaydet
      const leftUser = rooms[rId].users.find(u => u.socketId === socket.id);
      const leftUsername = leftUser?.username;
      rooms[rId].users = rooms[rId].users.filter(u => u.socketId !== socket.id);
      rooms[rId].lastActivityAt = Date.now();
      socket.leave(rId); socket.currentRoom = null;

      if (rooms[rId].users.length === 0) {
        if (!rooms[rId].isVip) {
          rooms[rId].emptySince = Date.now();
          logger.info(`Oda boşaldı (5 dk sonra silinecek): ${rId}`);
        }
        updateRoomUsers(rId);
      } else {
        // Host ayrıldıysa transfer et
        if (rooms[rId].hostUserId === leftUsername) {
          const newHost = rooms[rId].users[0];
          rooms[rId].hostUserId = newHost.username;
          io.to(rId).emit('room_host_changed', { hostUserId: newHost.username, message: `${newHost.username} artık oda sahibi!` });
          try { db.saveRoom({ id: rId, name: rooms[rId].name, hostUserId: newHost.username, password: rooms[rId].password, isVip: rooms[rId].isVip, maxUsers: rooms[rId].maxUsers, theme: rooms[rId].theme, createdAt: rooms[rId].createdAt, lastActivityAt: rooms[rId].lastActivityAt }); } catch (e) {}
        }
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
        // Host transfer: kullanıcıyı silmeden önce username'i kaydet
        const leftUser = rooms[rId].users.find(u => u.socketId === sid);
        const leftUsername = leftUser?.username;
        rooms[rId].users = rooms[rId].users.filter(u => u.socketId !== sid);
        if (rooms[rId].voiceUsers) delete rooms[rId].voiceUsers[sid];
        rooms[rId].lastActivityAt = Date.now();

        if (rooms[rId].users.length === 0) {
          // VIP olmayan boş oda 5 dakika sonra silinecek
          if (!rooms[rId].isVip) {
            rooms[rId].emptySince = Date.now();
            logger.info(`Oda boşaldı (5 dk sonra silinecek): ${rId}`);
          } else {
            logger.info(`VIP oda boş ama korunuyor: ${rId}`);
          }
          updateRoomUsers(rId);
        } else {
          // Host ayrıldıysa sıradaki kullanıcıya host ver
          if (rooms[rId].hostUserId === leftUsername && rooms[rId].users.length > 0) {
            const newHost = rooms[rId].users[0];
            rooms[rId].hostUserId = newHost.username;
            io.to(rId).emit('room_host_changed', { hostUserId: newHost.username, message: `${newHost.username} artık oda sahibi!` });
            logger.info(`Host transferi: ${rId} → ${newHost.username}`);
            try { db.saveRoom({ id: rId, name: rooms[rId].name, hostUserId: newHost.username, password: rooms[rId].password, isVip: rooms[rId].isVip, maxUsers: rooms[rId].maxUsers, theme: rooms[rId].theme, createdAt: rooms[rId].createdAt, lastActivityAt: rooms[rId].lastActivityAt }); } catch (e) {}
          }
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
  try { broadcastAdminDashboard(); } catch (e) {}
}, 15000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`Sunucu ${PORT} portunda aktif! (${isProd ? 'PRODUCTION' : 'DEVELOPMENT'})`);
  startAdminUpdates();
});
