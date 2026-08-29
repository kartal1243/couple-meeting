require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const ytSearch = require('yt-search');
const crypto = require('crypto');
const logger = require('./utils/logger');
const db = require('./utils/database');

const app = express();

// --- SECURITY ---
app.use(helmet({ contentSecurityPolicy: false }));

const ALLOWED_ORIGINS = [
  ...(process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),
  'https://couple-meeting-flax.vercel.app',
  'https://www.couplemeeting.com.tr',
  'https://couplemeeting.com.tr',
  'http://localhost:5173',
  'http://localhost:3000'
];
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.length === 0) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(null, false);
  },
  credentials: true
}));

// --- STRIPE ---
let stripe = null;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (STRIPE_KEY && STRIPE_KEY !== 'sk_test_BURAYA_STRIPE_ANAHTARINI_YAZ') {
  stripe = require('stripe')(STRIPE_KEY);
  logger.info('💳 Stripe entegrasyonu aktif.');
} else {
  logger.warn('⚠️  Stripe tanımlı değil. Test modu.');
}

// Stripe webhook - express.json() ÖNCE
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(200).send('Stripe pasif');
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret === 'whsec_BURAYA_WEBHOOK_SECRET_YAZ') return res.status(200).send('Webhook secret yok');

  let event;
  try { event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret); }
  catch (err) { logger.error('Webhook imza hatası', { error: err.message }); return res.status(400).send(`Webhook Error: ${err.message}`); }

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
      logger.info(`👑 [STRIPE] VIP aktif: ${username} (${VIP_PLANS[plan].label})`);
      emitToUser(username, 'vip_activated', { isVip: true, vipExpiry: startFrom + VIP_PLANS[plan].duration, plan });
    }
  }
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const allUsers = db.getDb().prepare('SELECT username FROM users WHERE stripe_subscription_id = ?').all(sub.id);
    for (const u of allUsers) {
      db.updateUser(u.username, { is_vip: 0, vip_expiry: Date.now() });
      logger.info(`❌ [STRIPE] VIP iptal: ${u.username}`);
      emitToUser(u.username, 'vip_activated', { isVip: false, vipExpiry: Date.now(), plan: null });
    }
  }
  res.status(200).json({ received: true });
});

app.use(express.json({ limit: '1mb' }));

// --- RATE LIMITING ---
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 120, message: { ok: false, message: 'Çok fazla istek.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, message: { ok: false, message: 'Çok fazla deneme.' } });
app.use('/api/', apiLimiter);
app.use('/api/vip/create-checkout', authLimiter);
app.use('/api/vip/admin-grant', authLimiter);

// --- INPUT VALIDATION ---
function sanitize(str, maxLen = 500) { return String(str || '').trim().slice(0, maxLen).replace(/[<>]/g, ''); }
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function isValidUsername(u) { return /^[a-z0-9_]{3,20}$/.test(u); }

// --- ROUTES ---
app.get('/', (req, res) => res.status(200).send('🚀 Couple Meeting Backend Active!'));
app.get('/health', (req, res) => res.json({ ok: true, service: 'couple-meeting-backend', time: Date.now(), db: 'sqlite' }));

// --- VIP ---
const VIP_PLANS = {
  monthly: { price: 29.90, duration: 30 * 24 * 60 * 60 * 1000, label: 'Aylık VIP' },
  yearly: { price: 199.90, duration: 365 * 24 * 60 * 60 * 1000, label: 'Yıllık VIP' }
};

app.post('/api/vip/create-checkout', async (req, res) => {
  const { token, plan } = req.body;
  if (!token || !plan || !VIP_PLANS[plan]) return res.json({ ok: false, message: 'Geçersiz plan.' });
  const user = db.getUserByToken(token);
  if (!user) return res.json({ ok: false, message: 'Giriş yapmalısın.' });

  if (!stripe) {
    const now = Date.now();
    const startFrom = (user.vipExpiry || 0) > now ? user.vipExpiry : now;
    const newExpiry = startFrom + VIP_PLANS[plan].duration;
    db.updateUser(user.username, { is_vip: 1, vip_expiry: newExpiry, vip_plan: plan, vip_activated_at: now });
    emitToUser(user.username, 'vip_activated', { isVip: true, vipExpiry: newExpiry, plan });
    logger.info(`👑 VIP test aktif: ${user.username} (${VIP_PLANS[plan].label})`);
    return res.json({ ok: true, testMode: true, message: 'Test modunda aktifleştirildi.', vipExpiry: newExpiry, plan });
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
    logger.error('Stripe checkout hatası', { error: err.message });
    res.json({ ok: false, message: 'Ödeme başlatılamadı.' });
  }
});

app.get('/api/vip/plans', (req, res) => res.json({ plans: VIP_PLANS }));

// --- MUSIC STREAMING ---
let Innertube, UniversalCache;
try {
  ({ Innertube, UniversalCache } = require('youtubei.js'));
  logger.info('✅ youtubei.js yüklendi');
} catch (e) { logger.warn('⚠️ youtubei.js yüklenemedi', { error: e.message }); }

let innertube = null;
async function getInnertube() {
  if (!innertube && Innertube) {
    try {
      innertube = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true,
        retrieve_player: true,
        fetch: fetch.bind(globalThis)
      });
    } catch (err) {
      logger.warn('Innertube create hatası:', err.message);
    }
  }
  return innertube;
}

let mk = null;
try {
  const { MusicKit } = require('musicstream-sdk');
  mk = new MusicKit({ logLevel: 'warn' });
  logger.info('✅ musicstream-sdk yüklendi');
} catch (e) { logger.warn('⚠️ musicstream-sdk yüklenemedi', { error: e.message }); }

app.get('/api/music/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ results: [] });

  try {
    const searchRes = await ytSearch(q);
    const videos = (searchRes.videos || []).slice(0, 10).map(v => ({
      id: v.videoId,
      title: v.title,
      artist: v.author?.name || '',
      duration: v.timestamp || '',
      thumbnail: v.thumbnail || `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`,
      src: v.videoId
    }));
    if (videos.length > 0) return res.json({ results: videos });
  } catch (e) { logger.warn('ytSearch arama hatası', { error: e.message }); }

  const yt = await getInnertube().catch(() => null);
  if (yt) {
    try {
      const results = await yt.music.search(q, { type: 'song' });
      const songs = (results.songs?.contents || [])
        .map(s => {
          const id = s.id;
          const title = s.title?.text || s.title?.toString() || '';
          const artist = s.artists?.[0]?.name || s.artist?.name || '';
          const duration = s.duration?.text || '';
          const thumb = s.thumbnails?.[s.thumbnails.length - 1]?.url || `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
          return { id, title, artist, duration, thumbnail: thumb, src: id };
        })
        .filter(s => s.id && s.title);
      if (songs.length > 0) return res.json({ results: songs.slice(0, 10) });
    } catch (e) { logger.warn('yt.music.search hatası', { error: e.message }); }
  }

  if (mk) {
    try {
      const songs = await mk.search(q, { filter: 'songs', limit: 10 });
      return res.json({ results: songs.map(s => ({
        id: s.videoId, title: s.title, artist: s.artist || '',
        duration: s.duration || 0,
        thumbnail: s.thumbnails?.[s.thumbnails.length - 1]?.url || `https://img.youtube.com/vi/${s.videoId}/hqdefault.jpg`,
        src: s.videoId
      }))});
    } catch (e) { logger.warn('musicstream-sdk arama hatası', { error: e.message }); }
  }

  try {
    const r = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=10`);
    const data = await r.json();
    res.json({ results: (data.data || []).map(t => ({
      id: t.id, title: t.title, artist: t.artist?.name || '', album: t.album?.title || '',
      duration: t.duration, thumbnail: t.album?.cover_medium || '',
      youtubeQuery: `${t.artist?.name || ''} ${t.title}`.trim(), src: ''
    }))});
  } catch (e) { res.json({ results: [], error: e.message }); }
});

// Güncel ve Canlı Stream Sunucuları
const PIPED_INSTANCES = [
  'https://pipedapi.leptons.xyz',
  'https://piped-api.hosthatch.com',
  'https://api.piped.yt',
  'https://pipedapi.frontendfriendly.xyz'
];

const INVIDIOUS_INSTANCES = [
  'https://invidious.nerdvpn.de',
  'https://inv.tux.pizza',
  'https://invidious.protokolla.fi',
  'https://iv.ggtyler.dev',
  'https://invidious.no-logs.com',
  'https://yt.drgnz.club'
];

app.get('/api/music/stream/:videoId', async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) return res.status(400).json({ error: 'videoId gerekli' });

  // 1. Invidious Doğrudan Audio Formatları
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const r = await fetch(`${instance}/api/v1/videos/${videoId}`, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(3500)
      });
      if (!r.ok) continue;
      const data = await r.json();
      if (!data?.adaptiveFormats) continue;
      const audio = data.adaptiveFormats
        .filter(f => (f.type && f.type.startsWith('audio/')) || f.container === 'm4a' || f.container === 'webm')
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
      if (audio?.url) {
        logger.info(`Stream bulundu (Invidious): ${videoId} via ${instance}`);
        return res.json({ url: audio.url, title: data.title, thumbnail: data.thumbnailUrl });
      }
    } catch (e) {}
  }

  // 2. Piped Stream API
  for (const instance of PIPED_INSTANCES) {
    try {
      const r = await fetch(`${instance}/streams/${videoId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(3500)
      });
      if (!r.ok) continue;
      const data = await r.json();
      const audio = (data.audioStreams || []).sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
      if (audio?.url) {
        logger.info(`Stream bulundu (Piped): ${videoId} via ${instance}`);
        return res.json({ url: audio.url, title: data.title });
      }
    } catch (e) {}
  }

  // 3. Invidious Latest Version Doğrudan Audio Bağlantısı (Fallback)
  for (const instance of INVIDIOUS_INSTANCES.slice(0, 3)) {
    try {
      const directAudioUrl = `${instance}/latest_version?id=${videoId}&itag=140`;
      const testRes = await fetch(directAudioUrl, { method: 'HEAD', signal: AbortSignal.timeout(2500) });
      if (testRes.ok || testRes.status === 302 || testRes.status === 206) {
        logger.info(`Stream bulundu (Direct Invidious Audio): ${videoId}`);
        return res.json({ url: directAudioUrl });
      }
    } catch (e) {}
  }

  // 4. youtubei.js Ses Akışı
  try {
    const yt = await getInnertube();
    if (yt) {
      const info = await yt.getBasicInfo(videoId);
      const format = info.chooseFormat({ type: 'audio', quality: 'best' });
      if (format) {
        const decipheredUrl = format.decipher(yt.session.player);
        if (decipheredUrl) {
          logger.info(`Stream bulundu (youtubei.js): ${videoId}`);
          return res.json({ url: decipheredUrl, title: info.basic_info.title });
        }
      }
    }
  } catch (e) { logger.warn('youtubei.js stream hatası', { videoId, error: e.message }); }

  // 5. MusicKit Yedek
  if (mk) {
    try {
      const stream = await Promise.race([
        mk.getStream(videoId),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))
      ]);
      if (stream?.url) return res.json({ url: stream.url });
    } catch {}
  }

  // Hiçbiri bulunamazsa sunucuyu 502 ile çökertmeden güvenli JSON döndür
  res.status(404).json({ error: 'Stream bulunamadı' });
});

const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
if (!ADMIN_SECRET) logger.warn('⚠️ ADMIN_SECRET tanımlı değil. Admin VIP özellikleri pasif olacak.');

app.post('/api/vip/admin-grant', (req, res) => {
  const { secret, username, plan } = req.body;
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) return res.status(403).json({ ok: false, message: 'Yetkisiz erişim.' });
  if (!username || !isValidUsername(username) || !VIP_PLANS[plan || 'yearly']) return res.json({ ok: false, message: 'Geçersiz parametre.' });
  const user = db.getUser(username);
  if (!user) return res.json({ ok: false, message: 'Kullanıcı bulunamadı.' });

  const now = Date.now();
  const startFrom = (user.vipExpiry || 0) > now ? user.vipExpiry : now;
  const newExpiry = startFrom + VIP_PLANS[plan || 'yearly'].duration;
  db.updateUser(username, { is_vip: 1, vip_expiry: newExpiry, vip_plan: plan || 'yearly', vip_activated_at: now });
  logger.info(`👑 [ADMIN] VIP verildi: ${username} (${VIP_PLANS[plan || 'yearly'].label})`);
  emitToUser(username, 'vip_activated', { isVip: true, vipExpiry: newExpiry, plan: plan || 'yearly' });
  res.json({ ok: true, message: `${username} VIP aktif!`, vipExpiry: newExpiry });
});

// --- SERVER ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : '*', credentials: true }
});

const rooms = {};
const onlineUsers = {};

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
    }
  }
}

function broadcastOnlineStatus(username) {
  for (const friendName of (db.getDb().prepare('SELECT user2 as f FROM friendships WHERE user1 = ?').all(username).map(r => r.f))) {
    emitToUser(friendName, 'friend_online_status', { username, isOnline: !!onlineUsers[username], lastSeen: onlineUsers[username]?.lastSeen || Date.now() });
  }
}

// Token cleanup
const TOKEN_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
setInterval(() => {
  const cleaned = db.cleanOldTokens(TOKEN_MAX_AGE);
  if (cleaned > 0) logger.info(`🧹 ${cleaned} eski token temizlendi.`);
}, TOKEN_CLEANUP_INTERVAL);

// Room cleanup
const ROOM_CLEANUP_INTERVAL = 30 * 60 * 1000;
const ROOM_EMPTY_TIMEOUT = 2 * 60 * 60 * 1000;
setInterval(() => {
  const now = Date.now(); let cleaned = 0;
  for (const [id, room] of Object.entries(rooms)) {
    if (room.users.length === 0 && !room.password && !room.isVip && (now - room.lastActivityAt) > ROOM_EMPTY_TIMEOUT) {
      delete rooms[id]; cleaned++;
    }
  }
  if (cleaned > 0) { logger.info(`🧹 ${cleaned} boş oda temizlendi.`); broadcastRooms(); }
}, ROOM_CLEANUP_INTERVAL);

function getPublicRoomsList() {
  return Object.entries(rooms).map(([id, room]) => ({
    id, name: room.name || id, userCount: room.users.length,
    maxUsers: room.maxUsers, hasPassword: !!room.password, isVip: !!room.isVip
  }));
}
function broadcastRooms() { io.emit('public_rooms_update', getPublicRoomsList()); }
function updateRoomUsers(roomId) {
  if (rooms[roomId]) {
    io.to(roomId).emit('room_user_count_update', {
      userCount: rooms[roomId].users.length, maxUsers: rooms[roomId].maxUsers,
      users: rooms[roomId].users, hostUserId: rooms[roomId].hostUserId,
      roomName: rooms[roomId].name, theme: rooms[roomId].theme || 'default'
    });
  }
}

// --- SOCKET.IO ---
io.on('connection', (socket) => {
  socket.emit('public_rooms_update', getPublicRoomsList());
  socket.emit('global_chat_history', db.getGlobalMessages(100));

  // AUTH
  socket.on('auth_register', ({ username, email, password, bio, avatar }) => {
    const cleanUsername = sanitize(username, 20).toLowerCase();
    const cleanEmail = sanitize(email, 100).toLowerCase();
    if (!cleanUsername || !cleanEmail || !password) return socket.emit('auth_result', { ok: false, message: 'Kullanıcı adı, e-posta ve şifre gerekli.' });
    if (!isValidUsername(cleanUsername)) return socket.emit('auth_result', { ok: false, message: 'Kullanıcı adı 3-20 karakter olmalı; sadece harf, sayı ve _ kullan.' });
    if (!isValidEmail(cleanEmail)) return socket.emit('auth_result', { ok: false, message: 'Geçerli bir e-posta gir.' });
    if (typeof password !== 'string' || password.length < 6) return socket.emit('auth_result', { ok: false, message: 'Şifre en az 6 karakter olmalı.' });
    if (password.length > 128) return socket.emit('auth_result', { ok: false, message: 'Şifre çok uzun.' });
    if (db.getUser(cleanUsername)) return socket.emit('auth_result', { ok: false, message: 'Bu kullanıcı adı zaten alınmış.' });
    if (db.getUserByEmail(cleanEmail)) return socket.emit('auth_result', { ok: false, message: 'Bu e-posta zaten kayıtlı.' });

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    db.createUser(cleanUsername, cleanEmail, `${salt}:${hash}`, sanitize(avatar, 10) || '🐱', sanitize(bio, 120));
    const token = db.createToken(cleanUsername);
    socket.socialUsername = cleanUsername;
    setOnline(cleanUsername, socket.id);
    logger.info(`✅ Yeni kayıt: ${cleanUsername}`);
    socket.emit('auth_result', { ok: true, user: publicUser(db.getUser(cleanUsername)), token });
  });

  socket.on('auth_login', ({ email, password }) => {
    const cleanEmail = sanitize(email, 100).toLowerCase();
    const user = db.getUserByEmail(cleanEmail);
    if (!user) return socket.emit('auth_result', { ok: false, message: 'E-posta veya şifre hatalı.' });
    try {
      const [salt, storedHash] = user.passwordHash.split(':');
      const check = crypto.scryptSync(password || '', salt, 64).toString('hex');
      if (!crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(check, 'hex'))) {
        return socket.emit('auth_result', { ok: false, message: 'E-posta veya şifre hatalı.' });
      }
    } catch { return socket.emit('auth_result', { ok: false, message: 'E-posta veya şifre hatalı.' }); }

    const token = db.createToken(user.username);
    socket.socialUsername = user.username;
    setOnline(user.username, socket.id);
    broadcastOnlineStatus(user.username);
    logger.info(`🔑 Giriş: ${user.username}`);
    socket.emit('auth_result', { ok: true, user: publicUser(user), token });
    socket.emit('friends_update', {
      friends: db.getFriends(user.username).map(publicUser).filter(Boolean),
      requests: db.getPendingFriendRequests(user.username)
    });
  });

  socket.on('social_sync', ({ token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    socket.socialUsername = user.username;
    setOnline(user.username, socket.id);
    broadcastOnlineStatus(user.username);
    socket.emit('social_profile', publicUser(user));
    socket.emit('friends_update', {
      friends: db.getFriends(user.username).map(publicUser).filter(Boolean),
      requests: db.getPendingFriendRequests(user.username)
    });
  });

  socket.on('update_profile', ({ token, bio, status, avatar }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    db.updateUser(user.username, { bio: sanitize(bio, 120), status: sanitize(status, 80), avatar: sanitize(avatar, 10) || user.avatar || '🐱' });
    socket.emit('social_profile', publicUser(db.getUser(user.username)));
  });

  // ARKADAŞLIK
  socket.on('friend_search', ({ q, token }) => {
    const term = sanitize(q, 20).toLowerCase();
    const current = db.getUserByToken(token)?.username;
    if (!term || term.length < 1) return socket.emit('friend_search_results', []);
    const results = db.searchUsers(term, current);
    socket.emit('friend_search_results', results);
  });

  socket.on('friend_request', ({ targetUsername, token }) => {
    const from = db.getUserByToken(token);
    const target = db.getUser(sanitize(targetUsername, 20).toLowerCase());
    if (!from) return socket.emit('friend_request_status', { message: 'Giriş yapmalısın.' });
    if (!target) return socket.emit('friend_request_status', { message: 'Kullanıcı bulunamadı.' });
    if (target.username === from.username) return socket.emit('friend_request_status', { message: 'Kendine istek gönderemezsin.' });
    if (db.areFriends(from.username, target.username)) return socket.emit('friend_request_status', { message: 'Zaten arkadaşsınız.' });
    if (db.hasPendingRequest(from.username, target.username)) return socket.emit('friend_request_status', { message: 'İstek zaten gönderilmiş.' });
    if (db.hasPendingRequest(target.username, from.username)) return socket.emit('friend_request_status', { message: 'Bu kullanıcı sana zaten istek göndermiş.' });

    const id = db.sendFriendRequest(from.username, from.avatar, target.username);
    socket.emit('friend_request_status', { message: 'Arkadaşlık isteği gönderildi ✅' });
    sendFriendsUpdate(target.username);
    emitToUser(target.username, 'friend_request_received', { id, fromUsername: from.username, avatar: from.avatar });
  });

  socket.on('friend_request_response', ({ requestId, action, token }) => {
    const me = db.getUserByToken(token);
    const req = db.getFriendRequest(requestId);
    if (!me || !req || req.to_username !== me.username || req.status !== 'pending') return;
    db.updateFriendRequest(requestId, action === 'accept' ? 'accepted' : 'rejected');
    if (action === 'accept') {
      db.addFriendship(me.username, req.from_username);
    }
    sendFriendsUpdate(me.username);
    sendFriendsUpdate(req.from_username);
    socket.emit('friend_request_status', { message: action === 'accept' ? 'Arkadaşlık kabul edildi ✅' : 'İstek silindi.' });
  });

  socket.on('unfriend', ({ targetUsername, token }) => {
    const me = db.getUserByToken(token);
    if (!me) return;
    db.removeFriendship(me.username, targetUsername);
    sendFriendsUpdate(me.username);
    sendFriendsUpdate(targetUsername);
    socket.emit('friend_request_status', { message: 'Arkadaşlık silindi.' });
  });

  // GLOBAL CHAT
  socket.on('global_chat_message', ({ text, username, avatar, token }) => {
    const cleanText = sanitize(text, 500);
    if (!cleanText) return;
    const accountUser = db.getUserByToken(token);
    const msg = {
      id: crypto.randomBytes(8).toString('hex'),
      username: accountUser?.username || sanitize(username, 24) || 'Misafir',
      avatar: accountUser?.avatar || sanitize(avatar, 10) || '🐱',
      text: cleanText,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now()
    };
    db.addGlobalMessage(msg);
    io.emit('global_chat_message', msg);
  });

  // ARAMA
  socket.on('search_music', async ({ query }) => {
    try {
      const q = sanitize(query, 200);
      if (!q || q.length < 2) { socket.emit('search_results', []); return; }
      let results = [];
      try {
        const searchRes = await ytSearch(q);
        results = (searchRes.videos || []).slice(0, 8).map(v => ({
          id: v.videoId, title: v.title, artist: v.author?.name || '',
          duration: v.timestamp || '', thumbnail: v.thumbnail || `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`,
          src: v.videoId
        }));
      } catch {}

      if (results.length === 0 && mk) {
        try {
          const songs = await mk.search(q, { filter: 'songs', limit: 8 });
          results = songs.map(s => ({
            id: s.videoId, title: s.title, artist: s.artist || '',
            duration: s.duration || 0,
            thumbnail: s.thumbnails?.[s.thumbnails.length - 1]?.url || `https://img.youtube.com/vi/${s.videoId}/hqdefault.jpg`,
            src: s.videoId
          }));
        } catch {}
      }
      if (results.length === 0) {
        try {
          const r = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=8`);
          const data = await r.json();
          results = (data.data || []).map(t => ({
            id: t.id, title: t.title, artist: t.artist?.name || '',
            duration: t.duration, thumbnail: t.album?.cover_medium || '',
            youtubeQuery: `${t.artist?.name || ''} ${t.title}`.trim(), src: ''
          }));
        } catch {}
      }
      socket.emit('search_results', results);
    } catch (err) { logger.error('Arama hatası', { error: err.message }); socket.emit('search_results', []); }
  });

  // ODA
  socket.on('join_room', ({ roomId, password, maxUsers, userId, userCity, username, avatar, isVip, roomType }) => {
    const cleanRoomId = sanitize(roomId, 50);
    const cleanRoomType = roomType === 'music' ? 'music' : 'video';
    let room = rooms[cleanRoomId];
    if (!room) {
      rooms[cleanRoomId] = {
        name: cleanRoomId, password: typeof password === 'string' ? password : '',
        maxUsers: Math.min(Math.max(parseInt(maxUsers) || 2, 2), 8),
        hostUserId: userId, theme: 'default', users: [],
        roomType: cleanRoomType,
        playlist: [], categories: ['Genel'], playMode: 'sequence',
        currentMedia: { type: 'none', src: '', time: 0, isPlaying: false, lastUpdated: Date.now() },
        messages: [], createdAt: Date.now(), lastActivityAt: Date.now(), isVip: !!isVip
      };
      room = rooms[cleanRoomId];
    } else {
      if (room.password && room.password !== (password || '')) { socket.emit('room_error', '🔒 Hatalı Oda Şifresi!'); return; }
      if (!room.users.find(u => u.userId === userId) && room.users.length >= room.maxUsers) { socket.emit('room_error', `⚠️ Oda Dolu! (${room.users.length}/${room.maxUsers})`); return; }
      if (!room.messages) room.messages = [];
    }
    const existingIndex = room.users.findIndex(u => u.userId === userId);
    const userInfo = { socketId: socket.id, userId, username: sanitize(username, 24) || 'İzleyici', avatar: sanitize(avatar, 10) || '🐱', userCity };
    if (existingIndex !== -1) room.users[existingIndex] = userInfo; else room.users.push(userInfo);
    room.lastActivityAt = Date.now();
    socket.currentRoom = cleanRoomId; socket.userId = userId; socket.join(cleanRoomId);

    let calcTime = room.currentMedia.time;
    if (room.currentMedia.isPlaying) calcTime += (Date.now() - room.currentMedia.lastUpdated) / 1000;
    socket.emit('room_joined', {
      roomId: cleanRoomId, roomName: room.name, hostUserId: room.hostUserId, theme: room.theme,
      roomType: room.roomType || 'video',
      userCount: room.users.length, maxUsers: room.maxUsers, socketId: socket.id,
      users: room.users, playlist: room.playlist, categories: room.categories,
      playMode: room.playMode, messages: (room.messages || []).slice(-100),
      isVip: !!room.isVip,
      currentMedia: { ...room.currentMedia, time: calcTime }
    });
    updateRoomUsers(cleanRoomId); broadcastRooms();
  });

  socket.on('update_room_settings', ({ roomId, newName, newTheme, newHostUserId }) => {
    const room = rooms[sanitize(roomId, 50)];
    if (room && room.hostUserId === socket.userId) {
      if (newName && newName.trim()) room.name = sanitize(newName, 50);
      if (newTheme) room.theme = newTheme;
      if (newHostUserId) room.hostUserId = newHostUserId;
      io.to(sanitize(roomId, 50)).emit('room_settings_updated', { roomName: room.name, theme: room.theme, hostUserId: room.hostUserId });
      broadcastRooms();
    }
  });

  socket.on('kick_user', ({ roomId, targetUserId }) => {
    const room = rooms[sanitize(roomId, 50)];
    if (room && room.hostUserId === socket.userId && targetUserId !== socket.userId) {
      const target = room.users.find(u => u.userId === targetUserId);
      if (target) {
        io.to(target.socketId).emit('kicked_from_room', '⚠️ Odadan çıkarıldınız.');
        const targetSocket = io.sockets.sockets.get(target.socketId);
        if (targetSocket) targetSocket.leave(sanitize(roomId, 50));
        room.users = room.users.filter(u => u.userId !== targetUserId);
        updateRoomUsers(sanitize(roomId, 50)); broadcastRooms();
      }
    }
  });

  socket.on('create_category', ({ roomId, categoryName }) => {
    const room = rooms[sanitize(roomId, 50)];
    const name = sanitize(categoryName, 50);
    if (room && name && !room.categories.includes(name)) { room.categories.push(name); io.to(sanitize(roomId, 50)).emit('categories_updated', room.categories); }
  });

  socket.on('add_to_playlist', ({ roomId, item }) => {
    const room = rooms[sanitize(roomId, 50)];
    if (room && item) { room.playlist.push(item); io.to(sanitize(roomId, 50)).emit('playlist_updated', { playlist: room.playlist, playMode: room.playMode }); }
  });

  socket.on('remove_from_playlist', ({ roomId, itemId }) => {
    const room = rooms[sanitize(roomId, 50)];
    if (room) { room.playlist = room.playlist.filter(i => i.id !== itemId); io.to(sanitize(roomId, 50)).emit('playlist_updated', { playlist: room.playlist, playMode: room.playMode }); }
  });

  socket.on('change_play_mode', ({ roomId, mode }) => {
    const room = rooms[sanitize(roomId, 50)];
    if (room) { room.playMode = mode; io.to(sanitize(roomId, 50)).emit('play_mode_changed', mode); }
  });

  socket.on('room_action', ({ roomId, type, payload }) => {
    const cleanRoomId = sanitize(roomId, 50);
    const room = rooms[cleanRoomId];
    if (room) {
      if (type === 'CHANGE_MEDIA') {
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
      }
      room.lastActivityAt = Date.now();
    }
    socket.to(cleanRoomId).emit('room_action', { type, payload });
    if (type === 'CHANGE_MEDIA') {
      io.to(cleanRoomId).emit('media_source_changed', { type: payload.type, src: payload.src, source: payload.source || payload.type, title: sanitize(payload.title, 200) || '' });
    }
  });

  socket.on('leave_room', () => {
    if (socket.currentRoom && rooms[socket.currentRoom]) {
      const rId = socket.currentRoom;
      rooms[rId].users = rooms[rId].users.filter(u => u.socketId !== socket.id);
      rooms[rId].lastActivityAt = Date.now();
      socket.leave(rId); updateRoomUsers(rId); socket.currentRoom = null; broadcastRooms();
    }
  });

  socket.on('disconnect', () => {
    if (socket.currentRoom && rooms[socket.currentRoom]) {
      const rId = socket.currentRoom; const sid = socket.id;
      setTimeout(() => {
        if (rooms[rId]) { rooms[rId].users = rooms[rId].users.filter(u => u.socketId !== sid); rooms[rId].lastActivityAt = Date.now(); updateRoomUsers(rId); broadcastRooms(); }
      }, 3000);
    }
    if (socket.socialUsername) { setOffline(socket.socialUsername, socket.id); broadcastOnlineStatus(socket.socialUsername); }
  });
});

// --- GRACEFUL SHUTDOWN ---
process.on('SIGTERM', () => { logger.info('SIGTERM alındı, kapatılıyor...'); db.closeDb(); process.exit(0); });
process.on('SIGINT', () => { logger.info('SIGINT alındı, kapatılıyor...'); db.closeDb(); process.exit(0); });

// --- START ---
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Sunucu ${PORT} portunda aktif! (${isProd ? 'PRODUCTION' : 'DEVELOPMENT'})`);
});