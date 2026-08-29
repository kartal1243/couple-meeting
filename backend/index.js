require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const ytSearch = require('yt-search');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();

// --- SECURITY ---
app.use(helmet({ contentSecurityPolicy: false }));

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.length === 0) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(null, false);
  },
  credentials: true
}));

// Stripe webhook - express.json() DAN ÖNCE olmalı (raw body gerekli)
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
let stripe = null;
if (STRIPE_KEY && STRIPE_KEY !== 'sk_test_BURAYA_STRIPE_ANAHTARINI_YAZ') {
  stripe = require('stripe')(STRIPE_KEY);
  console.log('💳 Stripe entegrasyonu aktif.');
} else {
  console.log('⚠️  Stripe tanımlı değil. Ödeme sistemi pasif (test modu).');
}

app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(200).send('Stripe pasif');
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret === 'whsec_BURAYA_WEBHOOK_SECRET_YAZ') {
    return res.status(200).send('Webhook secret yok');
  }
  let event;
  try { event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret); }
  catch (err) { console.error('Webhook imza hatası:', err.message); return res.status(400).send(`Webhook Error: ${err.message}`); }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { username, plan } = session.metadata;
    const user = socialData.users[username];
    if (user && VIP_PLANS[plan]) {
      const now = Date.now();
      const currentExpiry = user.vipExpiry || 0;
      const startFrom = currentExpiry > now ? currentExpiry : now;
      user.isVip = true;
      user.vipExpiry = startFrom + VIP_PLANS[plan].duration;
      user.vipPlan = plan;
      user.vipActivatedAt = now;
      user.stripeCustomerId = session.customer;
      user.stripeSubscriptionId = session.subscription;
      saveSocialData();
      console.log(`👑 [STRIPE] VIP aktif: ${username} (${VIP_PLANS[plan].label})`);
      for (const [, s] of io.sockets.sockets) {
        if (s.socialUsername === username) s.emit('vip_activated', { isVip: true, vipExpiry: user.vipExpiry, plan });
      }
    }
  }
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const user = Object.values(socialData.users).find(u => u.stripeSubscriptionId === sub.id);
    if (user) {
      user.isVip = false; user.vipExpiry = Date.now();
      saveSocialData();
      console.log(`❌ [STRIPE] VIP iptal: ${user.username}`);
      for (const [, s] of io.sockets.sockets) {
        if (s.socialUsername === user.username) s.emit('vip_activated', { isVip: false, vipExpiry: Date.now(), plan: null });
      }
    }
  }
  res.status(200).json({ received: true });
});

// JSON body - webhook'tan sonra
app.use(express.json({ limit: '1mb' }));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, message: { ok: false, message: 'Çok fazla istek. Biraz bekle.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { ok: false, message: 'Çok fazla deneme. 15 dakika bekle.' } });
app.use('/api/', apiLimiter);
app.use('/api/vip/activate', authLimiter);
app.use('/api/vip/admin-grant', authLimiter);

// --- INPUT VALIDATION ---
function sanitize(str, maxLen = 500) {
  return String(str || '').trim().slice(0, maxLen).replace(/[<>]/g, '');
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidUsername(u) {
  return /^[a-z0-9_]{3,20}$/.test(u);
}

// --- ROUTES ---
app.get('/', (req, res) => res.status(200).send('🚀 Couple Meeting Backend Active!'));
app.get('/health', (req, res) => res.json({ ok: true, service: 'couple-meeting-backend', time: Date.now() }));

// --- VIP ---
const VIP_PLANS = {
  monthly: { price: 29.90, duration: 30 * 24 * 60 * 60 * 1000, label: 'Aylık VIP' },
  yearly: { price: 199.90, duration: 365 * 24 * 60 * 60 * 1000, label: 'Yıllık VIP' }
};

// --- STRIPE ÖDEME ---
// Checkout Session oluştur
app.post('/api/vip/create-checkout', async (req, res) => {
  const { token, plan } = req.body;
  if (!token || !plan || !VIP_PLANS[plan]) return res.json({ ok: false, message: 'Geçersiz plan.' });
  const user = getUserByToken(token);
  if (!user) return res.json({ ok: false, message: 'Giriş yapmalısın.' });

  if (!stripe) {
    // Test modu: direkt aktifleştir
    const now = Date.now();
    const currentExpiry = user.vipExpiry || 0;
    const startFrom = currentExpiry > now ? currentExpiry : now;
    user.isVip = true;
    user.vipExpiry = startFrom + VIP_PLANS[plan].duration;
    user.vipPlan = plan;
    user.vipActivatedAt = now;
    saveSocialData();
    for (const [, s] of io.sockets.sockets) {
      if (s.socialUsername === user.username) s.emit('vip_activated', { isVip: true, vipExpiry: user.vipExpiry, plan });
    }
    return res.json({ ok: true, testMode: true, message: 'Test modunda aktifleştirildi.', vipExpiry: user.vipExpiry, plan });
  }

  // Gerçek Stripe checkout
  try {
    const priceId = plan === 'monthly' ? process.env.STRIPE_PRICE_MONTHLY : process.env.STRIPE_PRICE_YEARLY;
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin || 'https://couple-meeting-flax.vercel.app'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://couple-meeting-flax.vercel.app'}/payment-cancel`,
      metadata: { username: user.username, plan }
    });
    res.json({ ok: true, sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe checkout hatası:', err.message);
    res.json({ ok: false, message: 'Ödeme başlatılamadı.' });
  }
});

app.get('/api/vip/plans', (req, res) => res.json({ plans: VIP_PLANS }));

const ADMIN_SECRET = process.env.ADMIN_SECRET;
if (!ADMIN_SECRET) { console.error('⚠️ ADMIN_SECRET tanımlı değil! .env dosyasını kontrol et.'); process.exit(1); }

app.post('/api/vip/admin-grant', (req, res) => {
  const { secret, username, plan } = req.body;
  if (secret !== ADMIN_SECRET) return res.status(403).json({ ok: false, message: 'Yetkisiz erişim.' });
  if (!username || !isValidUsername(username) || !VIP_PLANS[plan || 'yearly']) return res.json({ ok: false, message: 'Geçersiz parametre.' });
  const user = socialData.users[username];
  if (!user) return res.json({ ok: false, message: 'Kullanıcı bulunamadı.' });

  const now = Date.now();
  const currentExpiry = user.vipExpiry || 0;
  const startFrom = currentExpiry > now ? currentExpiry : now;
  user.isVip = true;
  user.vipExpiry = startFrom + VIP_PLANS[plan || 'yearly'].duration;
  user.vipPlan = plan || 'yearly';
  user.vipActivatedAt = now;
  saveSocialData();

  console.log(`👑 [ADMIN] VIP verildi: ${username} (${VIP_PLANS[plan || 'yearly'].label})`);
  for (const [, s] of io.sockets.sockets) {
    if (s.socialUsername === username) s.emit('vip_activated', { isVip: true, vipExpiry: user.vipExpiry, plan: plan || 'yearly' });
  }
  res.json({ ok: true, message: `${username} VIP aktif!`, vipExpiry: user.vipExpiry });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.length === 0) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(null, false);
    },
    credentials: true
  }
});

const rooms = {};
const onlineUsers = {};

// --- SOSYAL SİSTEM ---
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data.json');
const socialData = { users: {}, emailToUsername: {}, tokens: {}, friendRequests: {}, friendships: {}, globalMessages: [] };

function loadSocialData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    Object.assign(socialData, saved);
    socialData.globalMessages = Array.isArray(socialData.globalMessages) ? socialData.globalMessages.slice(-100) : [];
  } catch (e) { console.error('Veri yüklenemedi:', e.message); }
}
function saveSocialData() {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(socialData, null, 2), 'utf8'); }
  catch (e) { console.error('Veri kaydedilemedi:', e.message); }
}
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}
function verifyPassword(password, stored) {
  try {
    const [salt, hash] = stored.split(':');
    const check = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
  } catch { return false; }
}
function createToken(username) {
  for (const [t, u] of Object.entries(socialData.tokens)) {
    if (u === username) delete socialData.tokens[t];
  }
  return crypto.randomBytes(32).toString('hex');
}
const TOKEN_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
setInterval(() => {
  const now = Date.now(); let cleaned = 0;
  for (const [t, u] of Object.entries(socialData.tokens)) {
    const user = socialData.users[u];
    if (!user || (now - user.createdAt) > TOKEN_MAX_AGE) { delete socialData.tokens[t]; cleaned++; }
  }
  if (cleaned > 0) { console.log(`🧹 ${cleaned} eski token temizlendi.`); saveSocialData(); }
}, TOKEN_CLEANUP_INTERVAL);

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
function getUserByToken(token) { const username = socialData.tokens[token]; return username ? socialData.users[username] : null; }
function getFriends(username) { return (socialData.friendships[username] || []).map(n => publicUser(socialData.users[n])).filter(Boolean); }
function getPendingFriendRequests(username) { return Object.values(socialData.friendRequests).filter(r => r.toUsername === username && r.status === 'pending'); }

function sendFriendsUpdate(targetUsername) {
  for (const [, s] of io.sockets.sockets) {
    if (s.socialUsername === targetUsername) {
      s.emit('friends_update', { friends: getFriends(targetUsername), requests: getPendingFriendRequests(targetUsername) });
    }
  }
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
      if (socialData.users[username]) socialData.users[username].lastSeen = Date.now();
    }
  }
}
function broadcastOnlineStatus(username) {
  for (const friendName of (socialData.friendships[username] || [])) {
    for (const [, s] of io.sockets.sockets) {
      if (s.socialUsername === friendName) {
        s.emit('friend_online_status', { username, isOnline: !!onlineUsers[username], lastSeen: onlineUsers[username]?.lastSeen || Date.now() });
      }
    }
  }
}

loadSocialData();

// --- ODA TEMİZLİĞİ ---
const ROOM_CLEANUP_INTERVAL = 30 * 60 * 1000;
const ROOM_EMPTY_TIMEOUT = 2 * 60 * 60 * 1000;
setInterval(() => {
  const now = Date.now(); let cleaned = 0;
  for (const [id, room] of Object.entries(rooms)) {
    if (room.users.length === 0 && !room.password && !room.isVip && (now - room.lastActivityAt) > ROOM_EMPTY_TIMEOUT) {
      delete rooms[id]; cleaned++;
    }
  }
  if (cleaned > 0) { console.log(`🧹 ${cleaned} boş oda temizlendi.`); broadcastRooms(); }
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
  socket.emit('global_chat_history', socialData.globalMessages.slice(-100));

  // AUTH
  socket.on('auth_register', ({ username, email, password, bio, avatar }) => {
    const cleanUsername = sanitize(username, 20).toLowerCase();
    const cleanEmail = sanitize(email, 100).toLowerCase();
    if (!cleanUsername || !cleanEmail || !password) return socket.emit('auth_result', { ok: false, message: 'Kullanıcı adı, e-posta ve şifre gerekli.' });
    if (!isValidUsername(cleanUsername)) return socket.emit('auth_result', { ok: false, message: 'Kullanıcı adı 3-20 karakter olmalı; sadece harf, sayı ve _ kullan.' });
    if (!isValidEmail(cleanEmail)) return socket.emit('auth_result', { ok: false, message: 'Geçerli bir e-posta gir.' });
    if (typeof password !== 'string' || password.length < 6) return socket.emit('auth_result', { ok: false, message: 'Şifre en az 6 karakter olmalı.' });
    if (password.length > 128) return socket.emit('auth_result', { ok: false, message: 'Şifre çok uzun.' });
    if (socialData.users[cleanUsername]) return socket.emit('auth_result', { ok: false, message: 'Bu kullanıcı adı zaten alınmış.' });
    if (socialData.emailToUsername[cleanEmail]) return socket.emit('auth_result', { ok: false, message: 'Bu e-posta zaten kayıtlı.' });
    socialData.users[cleanUsername] = {
      username: cleanUsername, email: cleanEmail, passwordHash: hashPassword(password),
      avatar: sanitize(avatar, 10) || '🐱', bio: sanitize(bio, 120),
      status: '', createdAt: Date.now(), lastSeen: Date.now()
    };
    socialData.emailToUsername[cleanEmail] = cleanUsername;
    const token = createToken(cleanUsername); socialData.tokens[token] = cleanUsername;
    saveSocialData();
    socket.socialUsername = cleanUsername;
    setOnline(cleanUsername, socket.id);
    socket.emit('auth_result', { ok: true, user: publicUser(socialData.users[cleanUsername]), token });
  });

  socket.on('auth_login', ({ email, password }) => {
    const cleanEmail = sanitize(email, 100).toLowerCase();
    const username = socialData.emailToUsername[cleanEmail];
    const user = username ? socialData.users[username] : null;
    if (!user || !verifyPassword(password || '', user.passwordHash)) return socket.emit('auth_result', { ok: false, message: 'E-posta veya şifre hatalı.' });
    const token = createToken(username); socialData.tokens[token] = username;
    socket.socialUsername = username;
    setOnline(username, socket.id);
    broadcastOnlineStatus(username);
    socket.emit('auth_result', { ok: true, user: publicUser(user), token });
    socket.emit('friends_update', { friends: getFriends(username), requests: getPendingFriendRequests(username) });
  });

  socket.on('social_sync', ({ token }) => {
    const user = getUserByToken(token);
    if (!user) return;
    socket.socialUsername = user.username;
    setOnline(user.username, socket.id);
    broadcastOnlineStatus(user.username);
    socket.emit('social_profile', publicUser(user));
    socket.emit('friends_update', { friends: getFriends(user.username), requests: getPendingFriendRequests(user.username) });
  });

  socket.on('update_profile', ({ token, bio, status, avatar }) => {
    const user = getUserByToken(token);
    if (!user) return;
    user.bio = sanitize(bio, 120);
    user.status = sanitize(status, 80);
    user.avatar = sanitize(avatar, 10) || user.avatar || '🐱';
    saveSocialData();
    socket.emit('social_profile', publicUser(user));
  });

  // ARKADAŞLIK
  socket.on('friend_search', ({ q, token }) => {
    const term = sanitize(q, 20).toLowerCase();
    const current = getUserByToken(token)?.username;
    const results = Object.values(socialData.users)
      .filter(u => u.username.includes(term) && u.username !== current)
      .slice(0, 20).map(publicUser);
    socket.emit('friend_search_results', results);
  });

  socket.on('friend_request', ({ targetUsername, token }) => {
    const from = getUserByToken(token);
    const target = socialData.users[sanitize(targetUsername, 20).toLowerCase()];
    if (!from) return socket.emit('friend_request_status', { message: 'Giriş yapmalısın.' });
    if (!target) return socket.emit('friend_request_status', { message: 'Kullanıcı bulunamadı.' });
    if (target.username === from.username) return socket.emit('friend_request_status', { message: 'Kendine istek gönderemezsin.' });
    if ((socialData.friendships[from.username] || []).includes(target.username)) return socket.emit('friend_request_status', { message: 'Zaten arkadaşsınız.' });
    if (Object.values(socialData.friendRequests).find(r => r.fromUsername === from.username && r.toUsername === target.username && r.status === 'pending'))
      return socket.emit('friend_request_status', { message: 'İstek zaten gönderilmiş.' });
    if (Object.values(socialData.friendRequests).find(r => r.fromUsername === target.username && r.toUsername === from.username && r.status === 'pending'))
      return socket.emit('friend_request_status', { message: 'Bu kullanıcı sana zaten istek göndermiş.' });
    const id = crypto.randomBytes(10).toString('hex');
    socialData.friendRequests[id] = { id, fromUsername: from.username, fromAvatar: from.avatar, toUsername: target.username, status: 'pending', createdAt: Date.now() };
    saveSocialData();
    socket.emit('friend_request_status', { message: 'Arkadaşlık isteği gönderildi ✅' });
    sendFriendsUpdate(target.username);
    for (const [, s] of io.sockets.sockets) if (s.socialUsername === target.username) s.emit('friend_request_received', { id, fromUsername: from.username, avatar: from.avatar });
  });

  socket.on('friend_request_response', ({ requestId, action, token }) => {
    const me = getUserByToken(token);
    const req = socialData.friendRequests[requestId];
    if (!me || !req || req.toUsername !== me.username || req.status !== 'pending') return;
    if (action === 'accept') {
      req.status = 'accepted';
      socialData.friendships[me.username] = Array.from(new Set([...(socialData.friendships[me.username] || []), req.fromUsername]));
      socialData.friendships[req.fromUsername] = Array.from(new Set([...(socialData.friendships[req.fromUsername] || []), me.username]));
    } else req.status = 'rejected';
    saveSocialData();
    sendFriendsUpdate(me.username); sendFriendsUpdate(req.fromUsername);
    socket.emit('friend_request_status', { message: action === 'accept' ? 'Arkadaşlık kabul edildi ✅' : 'İstek silindi.' });
  });

  socket.on('unfriend', ({ targetUsername, token }) => {
    const me = getUserByToken(token);
    if (!me) return;
    socialData.friendships[me.username] = (socialData.friendships[me.username] || []).filter(u => u !== targetUsername);
    socialData.friendships[targetUsername] = (socialData.friendships[targetUsername] || []).filter(u => u !== me.username);
    saveSocialData();
    sendFriendsUpdate(me.username); sendFriendsUpdate(targetUsername);
    socket.emit('friend_request_status', { message: 'Arkadaşlık silindi.' });
  });

  // GLOBAL CHAT
  socket.on('global_chat_message', ({ text, username, avatar, token }) => {
    const cleanText = sanitize(text, 500);
    if (!cleanText) return;
    const accountUser = getUserByToken(token);
    const msg = {
      id: crypto.randomBytes(8).toString('hex'),
      username: accountUser?.username || sanitize(username, 24) || 'Misafir',
      avatar: accountUser?.avatar || sanitize(avatar, 10) || '🐱',
      text: cleanText,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now()
    };
    socialData.globalMessages.push(msg);
    socialData.globalMessages = socialData.globalMessages.slice(-100);
    saveSocialData();
    io.emit('global_chat_message', msg);
  });

  // ARAMA
  socket.on('search_music', async ({ query }) => {
    try {
      const q = sanitize(query, 200);
      if (!q || q.length < 2) { socket.emit('search_results', []); return; }
      const encoded = encodeURIComponent(q);
      const baseUrl = 'https://verome-api-hq8s6wtb2v78.kartal1243.deno.net';
      let rawList = [];
      try {
        const res = await fetch(`${baseUrl}/api/yt_search?q=${encoded}`, { signal: AbortSignal.timeout(1800) });
        if (res.ok) { const data = await res.json(); rawList = Array.isArray(data) ? data : (data.results || data.songs || data.content || []); }
      } catch {}
      if (!rawList || rawList.length === 0) { const r = await ytSearch(q); rawList = r.videos || []; }
      const results = rawList.slice(0, 6).map(v => {
        const videoId = v.videoId || v.id || (typeof v.src === 'string' ? v.src : null);
        return { id: videoId, title: v.title || v.name || 'YouTube Videosu', timestamp: v.duration || v.timestamp || 'Müzik', thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, type: 'youtube', src: videoId };
      }).filter(v => v.src && v.src.length === 11);
      socket.emit('search_results', results);
    } catch (err) { console.error("Arama hatası:", err); socket.emit('search_results', []); }
  });

  // ODA
  socket.on('join_room', ({ roomId, password, maxUsers, userId, userCity, username, avatar, isVip }) => {
    const cleanRoomId = sanitize(roomId, 50);
    let room = rooms[cleanRoomId];
    if (!room) {
      rooms[cleanRoomId] = {
        name: cleanRoomId, password: typeof password === 'string' ? password : '',
        maxUsers: Math.min(Math.max(parseInt(maxUsers) || 2, 2), 8),
        hostUserId: userId, theme: 'default', users: [],
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
    if (existingIndex !== -1) room.users[existingIndex] = userInfo;
    else room.users.push(userInfo);
    room.lastActivityAt = Date.now();
    socket.currentRoom = cleanRoomId;
    socket.userId = userId;
    socket.join(cleanRoomId);

    let calcTime = room.currentMedia.time;
    if (room.currentMedia.isPlaying) calcTime += (Date.now() - room.currentMedia.lastUpdated) / 1000;
    socket.emit('room_joined', {
      roomId: cleanRoomId, roomName: room.name, hostUserId: room.hostUserId, theme: room.theme,
      userCount: room.users.length, maxUsers: room.maxUsers, socketId: socket.id,
      users: room.users, playlist: room.playlist, categories: room.categories,
      playMode: room.playMode, messages: (room.messages || []).slice(-100),
      isVip: !!room.isVip, currentMedia: { ...room.currentMedia, time: calcTime }
    });
    updateRoomUsers(cleanRoomId);
    broadcastRooms();
  });

  socket.on('update_room_settings', ({ roomId, newName, newTheme, newHostUserId }) => {
    const room = rooms[sanitize(roomId, 50)];
    if (room && room.hostUserId === socket.userId) {
      if (newName && newName.trim()) room.name = sanitize(newName, 50);
      if (newTheme) room.theme = newTheme;
      if (newHostUserId) room.hostUserId = newHostUserId;
      io.to(roomId).emit('room_settings_updated', { roomName: room.name, theme: room.theme, hostUserId: room.hostUserId });
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
        if (targetSocket) targetSocket.leave(roomId);
        room.users = room.users.filter(u => u.userId !== targetUserId);
        updateRoomUsers(roomId); broadcastRooms();
      }
    }
  });

  socket.on('create_category', ({ roomId, categoryName }) => {
    const room = rooms[sanitize(roomId, 50)];
    const name = sanitize(categoryName, 50);
    if (room && name && !room.categories.includes(name)) {
      room.categories.push(name);
      io.to(roomId).emit('categories_updated', room.categories);
    }
  });

  socket.on('add_to_playlist', ({ roomId, item }) => {
    const room = rooms[sanitize(roomId, 50)];
    if (room && item) { room.playlist.push(item); io.to(roomId).emit('playlist_updated', { playlist: room.playlist, playMode: room.playMode }); }
  });

  socket.on('remove_from_playlist', ({ roomId, itemId }) => {
    const room = rooms[sanitize(roomId, 50)];
    if (room) { room.playlist = room.playlist.filter(i => i.id !== itemId); io.to(roomId).emit('playlist_updated', { playlist: room.playlist, playMode: room.playMode }); }
  });

  socket.on('change_play_mode', ({ roomId, mode }) => {
    const room = rooms[sanitize(roomId, 50)];
    if (room) { room.playMode = mode; io.to(roomId).emit('play_mode_changed', mode); }
  });

  socket.on('room_action', ({ roomId, type, payload }) => {
    const room = rooms[sanitize(roomId, 50)];
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
    socket.to(sanitize(roomId, 50)).emit('room_action', { type, payload });
    if (type === 'CHANGE_MEDIA') {
      io.to(sanitize(roomId, 50)).emit('media_source_changed', { type: payload.type, src: payload.src, source: payload.source || payload.type, title: sanitize(payload.title, 200) || '' });
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
      const rId = socket.currentRoom;
      const sid = socket.id;
      setTimeout(() => {
        if (rooms[rId]) { rooms[rId].users = rooms[rId].users.filter(u => u.socketId !== sid); rooms[rId].lastActivityAt = Date.now(); updateRoomUsers(rId); broadcastRooms(); }
      }, 3000);
    }
    if (socket.socialUsername) {
      setOffline(socket.socialUsername, socket.id);
      broadcastOnlineStatus(socket.socialUsername);
    }
  });
});

// --- START ---
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sunucu ${PORT} portunda aktif! (${isProd ? 'PRODUCTION' : 'DEVELOPMENT'})`);
});
