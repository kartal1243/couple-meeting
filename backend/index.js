require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const ytSearch = require('yt-search');
const crypto = require('crypto');
const { Readable } = require('stream');
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
  logger.warn('⚠️ Stripe tanımlı değil. Test modu.');
}

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
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { ok: false, message: 'Çok fazla istek.' } });
app.use('/api/', apiLimiter);

// --- ROUTES ---
app.get('/', (req, res) => res.status(200).send('🚀 Couple Meeting Backend Active!'));
app.get('/health', (req, res) => res.json({ ok: true, service: 'couple-meeting-backend', time: Date.now() }));

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

// --- YTIFY / INNERTUBE ENGINE ---
let Innertube, UniversalCache;
try {
  ({ Innertube, UniversalCache } = require('youtubei.js'));
  logger.info('✅ youtubei.js motoru hazır');
} catch (e) { logger.warn('⚠️ youtubei.js bulunamadı', { error: e.message }); }

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
      logger.warn('Innertube oturum hatası:', err.message);
    }
  }
  return innertube;
}

// Arama Rotası
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

  res.json({ results: [] });
});

// 🔥 DOĞRUDAN SUNUCU IP'Sİ ÜZERİNDEN SES AKITMA (PIPE STREAM) 🔥
app.get('/api/music/play/:videoId', async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) return res.status(400).send('videoId gerekli');

  try {
    const yt = await getInnertube();
    if (!yt) return res.status(500).send('YouTube motoru başlatılamadı');

    const info = await yt.getBasicInfo(videoId);
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });
    
    if (!format) {
      return res.status(404).send('Uygun ses formatı bulunamadı');
    }

    // Ses başlıklarını ayarla (Kilit ekranında arkaplanda çalmayı sağlar)
    res.setHeader('Content-Type', format.mime_type?.split(';')[0] || 'audio/webm');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Sunucumuz YouTube'dan sesi indirip anında kullanıcıya canlı aktarır (Pipe)
    const stream = await yt.download(videoId, {
      type: 'audio',
      quality: 'best'
    });

    Readable.fromWeb(stream).pipe(res);
    logger.info(`🎵 Canlı ses sunucu üzerinden akıtılıyor: ${videoId}`);
  } catch (err) {
    logger.error('Sunucu ses akıtma hatası:', { videoId, error: err.message });
    res.status(500).send('Ses akışı başlatılamadı');
  }
});

// Stream Bilgi Rotası
app.get('/api/music/stream/:videoId', (req, res) => {
  const { videoId } = req.params;
  if (!videoId) return res.status(400).json({ error: 'videoId gerekli' });
  // Doğrudan kendi sunucumuzdaki play linkini dön
  res.json({ url: `/api/music/play/${videoId}` });
});

// --- SERVER & SOCKET ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : '*', credentials: true }
});

const rooms = {};
const onlineUsers = {};

function sanitize(str, maxLen = 500) { return String(str || '').trim().slice(0, maxLen).replace(/[<>]/g, ''); }
function isValidUsername(u) { return /^[a-z0-9_]{3,20}$/.test(u); }
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

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

io.on('connection', (socket) => {
  socket.emit('public_rooms_update', getPublicRoomsList());
  socket.emit('global_chat_history', db.getGlobalMessages(100));

  socket.on('auth_register', ({ username, email, password, bio, avatar }) => {
    const cleanUsername = sanitize(username, 20).toLowerCase();
    const cleanEmail = sanitize(email, 100).toLowerCase();
    if (!cleanUsername || !cleanEmail || !password) return socket.emit('auth_result', { ok: false, message: 'Kullanıcı adı, e-posta ve şifre gerekli.' });
    if (!isValidUsername(cleanUsername)) return socket.emit('auth_result', { ok: false, message: 'Kullanıcı adı 3-20 karakter olmalı.' });
    if (!isValidEmail(cleanEmail)) return socket.emit('auth_result', { ok: false, message: 'Geçerli bir e-posta gir.' });
    if (typeof password !== 'string' || password.length < 6) return socket.emit('auth_result', { ok: false, message: 'Şifre en az 6 karakter olmalı.' });
    if (db.getUser(cleanUsername)) return socket.emit('auth_result', { ok: false, message: 'Bu kullanıcı adı zaten alınmış.' });
    if (db.getUserByEmail(cleanEmail)) return socket.emit('auth_result', { ok: false, message: 'Bu e-posta zaten kayıtlı.' });

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    db.createUser(cleanUsername, cleanEmail, `${salt}:${hash}`, sanitize(avatar, 10) || '🐱', sanitize(bio, 120));
    const token = db.createToken(cleanUsername);
    socket.socialUsername = cleanUsername;
    setOnline(cleanUsername, socket.id);
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

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Sunucu ${PORT} portunda YTIFY motoru ile aktif!`);
});