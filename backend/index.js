const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const ytSearch = require('yt-search');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.status(200).send('🚀 Couple Meeting Backend Active!');
});

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'couple-meeting-backend', time: Date.now() });
});

// --- VIP ÖDEME SİSTEMİ ---
const VIP_PLANS = {
  monthly: { price: 29.90, duration: 30 * 24 * 60 * 60 * 1000, label: 'Aylık VIP' },
  yearly: { price: 199.90, duration: 365 * 24 * 60 * 60 * 1000, label: 'Yıllık VIP' }
};

app.post('/api/vip/activate', express.json(), (req, res) => {
  const { token, plan, paymentId } = req.body;
  if (!token || !plan || !VIP_PLANS[plan]) return res.json({ ok: false, message: 'Geçersiz plan.' });
  const user = getUserByToken(token);
  if (!user) return res.json({ ok: false, message: 'Giriş yapmalısın.' });

  // Gerçek ödeme burada işlenir (Stripe/Papara vs.)
  // Şu an simülasyon: paymentId varsa onayla
  if (!paymentId) return res.json({ ok: false, message: 'Ödeme başarısız.' });

  const now = Date.now();
  const currentExpiry = user.vipExpiry || 0;
  const startFrom = currentExpiry > now ? currentExpiry : now;
  user.isVip = true;
  user.vipExpiry = startFrom + VIP_PLANS[plan].duration;
  user.vipPlan = plan;
  user.vipActivatedAt = now;
  saveSocialData();

  console.log(`👑 VIP aktifleştirildi: ${user.username} (${VIP_PLANS[plan].label})`);
  socket_ref = io.sockets.sockets;
  for (const [sid, s] of io.sockets.sockets) {
    if (s.socialUsername === user.username) s.emit('vip_activated', { isVip: true, vipExpiry: user.vipExpiry, plan });
  }
  res.json({ ok: true, isVip: true, vipExpiry: user.vipExpiry, plan });
});

app.get('/api/vip/plans', (req, res) => {
  res.json({ plans: VIP_PLANS });
});

// --- ADMIN: Kendine VIP verme ---
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'couple-meeting-admin-2024';
app.post('/api/vip/admin-grant', express.json(), (req, res) => {
  const { secret, username, plan } = req.body;
  if (secret !== ADMIN_SECRET) return res.json({ ok: false, message: 'Yetkisiz erişim.' });
  if (!username || !VIP_PLANS[plan || 'yearly']) return res.json({ ok: false, message: 'Geçersiz parametre.' });
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
  for (const [sid, s] of io.sockets.sockets) {
    if (s.socialUsername === username) s.emit('vip_activated', { isVip: true, vipExpiry: user.vipExpiry, plan: plan || 'yearly' });
  }
  res.json({ ok: true, message: `${username} VIP aktif!`, vipExpiry: user.vipExpiry });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const rooms = {};
const onlineUsers = {}; // { username: { lastSeen, socketIds: Set } }

// --- SOSYAL SİSTEM ---
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data.json');
const socialData = {
  users: {},
  emailToUsername: {},
  tokens: {},
  friendRequests: {},
  friendships: {},
  globalMessages: []
};

function loadSocialData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    Object.assign(socialData, saved);
    socialData.globalMessages = Array.isArray(socialData.globalMessages) ? socialData.globalMessages.slice(-100) : [];
  } catch (e) {
    console.error('Sosyal veri yüklenemedi:', e.message);
  }
}
function saveSocialData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(socialData, null, 2), 'utf8');
  } catch (e) {
    console.error('Sosyal veri kaydedilemedi:', e.message);
  }
}
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
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
  const now = Date.now();
  let cleaned = 0;
  for (const [t, u] of Object.entries(socialData.tokens)) {
    const user = socialData.users[u];
    if (!user || (now - user.createdAt) > TOKEN_MAX_AGE) {
      delete socialData.tokens[t];
      cleaned++;
    }
  }
  if (cleaned > 0) { console.log(`🧹 ${cleaned} eski token temizlendi.`); saveSocialData(); }
}, TOKEN_CLEANUP_INTERVAL);

function publicUser(u) {
  if (!u) return null;
  const isOnline = !!onlineUsers[u.username];
  const isVip = u.isVip && u.vipExpiry && u.vipExpiry > Date.now();
  return {
    username: u.username, email: u.email, avatar: u.avatar || '🐱',
    bio: u.bio || '', status: u.status || '', createdAt: u.createdAt,
    isOnline, lastSeen: onlineUsers[u.username]?.lastSeen || u.lastSeen || null,
    isVip, vipExpiry: u.vipExpiry || null
  };
}

function getUserByToken(token) { const username = socialData.tokens[token]; return username ? socialData.users[username] : null; }

function getFriends(username) {
  const ids = socialData.friendships[username] || [];
  return ids.map(n => publicUser(socialData.users[n])).filter(Boolean);
}

function getPendingFriendRequests(username) {
  return Object.values(socialData.friendRequests).filter(r => r.toUsername === username && r.status === 'pending');
}

function sendFriendsUpdate(targetUsername) {
  for (const [socketId, s] of io.sockets.sockets) {
    if (s.socialUsername === targetUsername) {
      s.emit('friends_update', {
        friends: getFriends(targetUsername),
        requests: getPendingFriendRequests(targetUsername)
      });
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
  const friends = socialData.friendships[username] || [];
  for (const friendName of friends) {
    for (const [socketId, s] of io.sockets.sockets) {
      if (s.socialUsername === friendName) {
        s.emit('friend_online_status', { username, isOnline: !!onlineUsers[username], lastSeen: onlineUsers[username]?.lastSeen || Date.now() });
      }
    }
  }
}

loadSocialData();

// --- BOŞ ODALARI OTOMATİK TEMİZLE (VIP odalar silinmez) ---
const ROOM_CLEANUP_INTERVAL = 30 * 60 * 1000;
const ROOM_EMPTY_TIMEOUT = 2 * 60 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [id, room] of Object.entries(rooms)) {
    if (room.users.length === 0 && !room.password && !room.isVip && (now - room.lastActivityAt) > ROOM_EMPTY_TIMEOUT) {
      delete rooms[id]; cleaned++;
    }
  }
  if (cleaned > 0) { console.log(`🧹 ${cleaned} boş oda otomatik temizlendi.`); broadcastRooms(); }
}, ROOM_CLEANUP_INTERVAL);

function getPublicRoomsList() {
  const list = [];
  for (const [id, room] of Object.entries(rooms)) {
    list.push({ id, name: room.name || id, userCount: room.users.length, maxUsers: room.maxUsers, hasPassword: !!room.password, isVip: !!room.isVip });
  }
  return list;
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
  socket.emit('global_chat_history', socialData.globalMessages.slice(-100));

  // --- AUTH ---
  socket.on('auth_register', ({ username, email, password, bio, avatar }) => {
    const cleanUsername = String(username || '').trim().toLowerCase();
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanUsername || !cleanEmail || !password) return socket.emit('auth_result', { ok: false, message: 'Kullanıcı adı, e-posta ve şifre gerekli.' });
    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) return socket.emit('auth_result', { ok: false, message: 'Kullanıcı adı 3-20 karakter olmalı; sadece harf, sayı ve _ kullan.' });
    if (password.length < 6) return socket.emit('auth_result', { ok: false, message: 'Şifre en az 6 karakter olmalı.' });
    if (socialData.users[cleanUsername]) return socket.emit('auth_result', { ok: false, message: 'Bu kullanıcı adı zaten alınmış.' });
    if (socialData.emailToUsername[cleanEmail]) return socket.emit('auth_result', { ok: false, message: 'Bu e-posta zaten kayıtlı.' });
    socialData.users[cleanUsername] = { username: cleanUsername, email: cleanEmail, passwordHash: hashPassword(password), avatar: avatar || '🐱', bio: String(bio || '').trim().slice(0, 120), status: '', createdAt: Date.now(), lastSeen: Date.now() };
    socialData.emailToUsername[cleanEmail] = cleanUsername;
    const token = createToken(cleanUsername); socialData.tokens[token] = cleanUsername;
    saveSocialData();
    socket.socialUsername = cleanUsername;
    setOnline(cleanUsername, socket.id);
    socket.emit('auth_result', { ok: true, user: publicUser(socialData.users[cleanUsername]), token });
  });

  socket.on('auth_login', ({ email, password }) => {
    const cleanEmail = String(email || '').trim().toLowerCase();
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
    if (!user) return socket.emit('friend_request_status', { message: 'Profil kaydetmek için giriş yapmalısın.' });
    user.bio = String(bio || '').trim().slice(0, 120); user.status = String(status || '').trim().slice(0, 80); user.avatar = avatar || user.avatar || '🐱';
    saveSocialData(); socket.emit('social_profile', publicUser(user));
  });

  // --- ARKADAŞLIK ---
  socket.on('friend_search', ({ q, token }) => {
    const term = String(q || '').trim().toLowerCase();
    const current = getUserByToken(token)?.username;
    const results = Object.values(socialData.users).filter(u => u.username.includes(term) && u.username !== current).slice(0, 20).map(publicUser);
    socket.emit('friend_search_results', results);
  });

  socket.on('friend_request', ({ targetUsername, token }) => {
    const from = getUserByToken(token);
    const target = socialData.users[String(targetUsername || '').toLowerCase()];
    if (!from) return socket.emit('friend_request_status', { message: 'Arkadaş eklemek için giriş yapmalısın.' });
    if (!target) return socket.emit('friend_request_status', { message: 'Kullanıcı bulunamadı.' });
    if (target.username === from.username) return socket.emit('friend_request_status', { message: 'Kendine arkadaşlık isteği gönderemezsin.' });
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
    for (const [sid, s] of io.sockets.sockets) if (s.socialUsername === target.username) s.emit('friend_request_received', { id, fromUsername: from.username, avatar: from.avatar });
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

  // --- GLOBAL CHAT ---
  socket.on('global_chat_message', ({ text, username, avatar, token }) => {
    const cleanText = String(text || '').trim().slice(0, 500);
    if (!cleanText) return;
    const accountUser = getUserByToken(token);
    const msg = { id: crypto.randomBytes(8).toString('hex'), username: accountUser?.username || String(username || 'Misafir').slice(0, 24), avatar: accountUser?.avatar || avatar || '🐱', text: cleanText, time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), createdAt: Date.now() };
    socialData.globalMessages.push(msg); socialData.globalMessages = socialData.globalMessages.slice(-100); saveSocialData(); io.emit('global_chat_message', msg);
  });

  // --- ARAMA ---
  socket.on('search_music', async ({ query }) => {
    try {
      if (!query || query.trim().length < 2) { socket.emit('search_results', []); return; }
      const encoded = encodeURIComponent(query.trim());
      const baseUrl = 'https://verome-api-hq8s6wtb2v78.kartal1243.deno.net';
      let rawList = [];
      try {
        const res = await fetch(`${baseUrl}/api/yt_search?q=${encoded}`, { signal: AbortSignal.timeout(1800) });
        if (res.ok) { const data = await res.json(); rawList = Array.isArray(data) ? data : (data.results || data.songs || data.content || []); }
      } catch (e) {}
      if (!rawList || rawList.length === 0) { const r = await ytSearch(query); rawList = r.videos || []; }
      const results = rawList.slice(0, 6).map(v => {
        const videoId = v.videoId || v.id || (typeof v.src === 'string' ? v.src : null);
        return { id: videoId, title: v.title || v.name || 'YouTube Videosu', timestamp: v.duration || v.timestamp || 'Müzik', thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, type: 'youtube', src: videoId };
      }).filter(v => v.src && v.src.length === 11);
      socket.emit('search_results', results);
    } catch (err) { console.error("Arama hatası:", err); socket.emit('search_results', []); }
  });

  // --- ODA ---
  socket.on('join_room', ({ roomId, password, maxUsers, userId, userCity, username, avatar, isVip }) => {
    let room = rooms[roomId];
    if (!room) {
      rooms[roomId] = {
        name: roomId, password: password || '', maxUsers: parseInt(maxUsers) || 2,
        hostUserId: userId, theme: 'default', users: [],
        playlist: [], categories: ['Genel'], playMode: 'sequence',
        currentMedia: { type: 'none', src: '', time: 0, isPlaying: false, lastUpdated: Date.now() },
        messages: [], createdAt: Date.now(), lastActivityAt: Date.now(),
        isVip: !!isVip
      };
      room = rooms[roomId];
    } else {
      if (room.password && room.password !== (password || '')) { socket.emit('room_error', '🔒 Hatalı Oda Şifresi!'); return; }
      const existingUser = room.users.find(u => u.userId === userId);
      if (!existingUser && room.users.length >= room.maxUsers) { socket.emit('room_error', `⚠️ Oda Kontenjanı Dolu! (${room.users.length}/${room.maxUsers})`); return; }
      if (!room.messages) room.messages = [];
    }

    const existingUserIndex = room.users.findIndex(u => u.userId === userId);
    const userInfo = { socketId: socket.id, userId, username: username || 'İzleyici', avatar: avatar || '🐱', userCity };
    if (existingUserIndex !== -1) room.users[existingUserIndex] = userInfo;
    else room.users.push(userInfo);

    room.lastActivityAt = Date.now();
    socket.currentRoom = roomId;
    socket.userId = userId;
    socket.join(roomId);

    let calculatedTime = room.currentMedia.time;
    if (room.currentMedia.isPlaying) calculatedTime += (Date.now() - room.currentMedia.lastUpdated) / 1000;

    socket.emit('room_joined', {
      roomId, roomName: room.name, hostUserId: room.hostUserId, theme: room.theme,
      userCount: room.users.length, maxUsers: room.maxUsers, socketId: socket.id,
      users: room.users, playlist: room.playlist, categories: room.categories,
      playMode: room.playMode, messages: (room.messages || []).slice(-100),
      isVip: !!room.isVip,
      currentMedia: { ...room.currentMedia, time: calculatedTime }
    });

    updateRoomUsers(roomId);
    broadcastRooms();
  });

  socket.on('update_room_settings', ({ roomId, newName, newTheme, newHostUserId }) => {
    const room = rooms[roomId];
    if (room && room.hostUserId === socket.userId) {
      if (newName && newName.trim()) room.name = newName.trim();
      if (newTheme) room.theme = newTheme;
      if (newHostUserId) room.hostUserId = newHostUserId;
      io.to(roomId).emit('room_settings_updated', { roomName: room.name, theme: room.theme, hostUserId: room.hostUserId });
      broadcastRooms();
    }
  });

  socket.on('kick_user', ({ roomId, targetUserId }) => {
    const room = rooms[roomId];
    if (room && room.hostUserId === socket.userId && targetUserId !== socket.userId) {
      const targetUser = room.users.find(u => u.userId === targetUserId);
      if (targetUser) {
        io.to(targetUser.socketId).emit('kicked_from_room', '⚠️ Oda yöneticisi tarafından odadan çıkarıldınız.');
        const targetSocket = io.sockets.sockets.get(targetUser.socketId);
        if (targetSocket) targetSocket.leave(roomId);
        room.users = room.users.filter(u => u.userId !== targetUserId);
        updateRoomUsers(roomId); broadcastRooms();
      }
    }
  });

  socket.on('create_category', ({ roomId, categoryName }) => {
    const room = rooms[roomId];
    if (room && categoryName && !room.categories.includes(categoryName)) {
      room.categories.push(categoryName);
      io.to(roomId).emit('categories_updated', room.categories);
    }
  });

  socket.on('add_to_playlist', ({ roomId, item }) => {
    const room = rooms[roomId];
    if (room && item) { room.playlist.push(item); io.to(roomId).emit('playlist_updated', { playlist: room.playlist, playMode: room.playMode }); }
  });

  socket.on('remove_from_playlist', ({ roomId, itemId }) => {
    const room = rooms[roomId];
    if (room) { room.playlist = room.playlist.filter(i => i.id !== itemId); io.to(roomId).emit('playlist_updated', { playlist: room.playlist, playMode: room.playMode }); }
  });

  socket.on('change_play_mode', ({ roomId, mode }) => {
    const room = rooms[roomId];
    if (room) { room.playMode = mode; io.to(roomId).emit('play_mode_changed', mode); }
  });

  // --- ODA EYLEMLERİ (MÜZİK + SOHBET + BİLDİRİM) ---
  socket.on('room_action', ({ roomId, type, payload }) => {
    const room = rooms[roomId];
    if (room) {
      if (type === 'CHANGE_MEDIA') {
        room.currentMedia = { type: payload.type, src: payload.src, title: payload.title || '', source: payload.source || payload.type, time: 0, isPlaying: true, lastUpdated: Date.now() };
      } else if (type === 'PLAY') {
        room.currentMedia.isPlaying = true; room.currentMedia.time = payload.time || 0; room.currentMedia.lastUpdated = Date.now();
      } else if (type === 'PAUSE') {
        room.currentMedia.isPlaying = false; room.currentMedia.time = payload.time || 0; room.currentMedia.lastUpdated = Date.now();
      } else if (type === 'CHAT_MESSAGE') {
        const msg = {
          id: payload.id || crypto.randomBytes(8).toString('hex'),
          senderId: payload.senderId, text: payload.text, sender: payload.sender,
          avatar: payload.avatar, time: payload.time,
          replyTo: payload.replyTo || null, replyToText: payload.replyToText || null, replyToSender: payload.replyToSender || null,
          createdAt: Date.now()
        };
        if (!room.messages) room.messages = [];
        room.messages.push(msg);
        room.messages = room.messages.slice(-200);
      }
      room.lastActivityAt = Date.now();
    }
    socket.to(roomId).emit('room_action', { type, payload });
    if (type === 'CHANGE_MEDIA') {
      io.to(roomId).emit('media_source_changed', { type: payload.type, src: payload.src, source: payload.source || payload.type, title: payload.title || '' });
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
      const socketIdToRemove = socket.id;
      setTimeout(() => {
        if (rooms[rId]) { rooms[rId].users = rooms[rId].users.filter(u => u.socketId !== socketIdToRemove); rooms[rId].lastActivityAt = Date.now(); updateRoomUsers(rId); broadcastRooms(); }
      }, 3000);
    }
    if (socket.socialUsername) {
      setOffline(socket.socialUsername, socket.id);
      broadcastOnlineStatus(socket.socialUsername);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sunucu ${PORT} portunda aktif!`);
});
