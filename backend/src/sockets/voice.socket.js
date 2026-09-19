// backend/src/sockets/voice.socket.js - Sesli sohbet, ekran paylaşımı ve WebRTC sinyalleri
const { sanitize } = require('../utils/helpers');
const { rooms } = require('../services/state');

module.exports = function registerVoiceSocket(io, socket, { requireAuth }) {
  // Kullanıcının odaya üye olup olmadığını doğrula
  const isRoomMember = (roomId, userId) => {
    const room = rooms[roomId];
    if (!room) return false;
    return !!room.users.find(u => u.userId === userId);
  };

  // ─ SESLİ SOHBET ─
  socket.on('voice_join', ({ roomId, token }) => {
    const user = token ? requireAuth(token) : null;
    const userId = user ? user.username : socket.userId;
    const username = user ? user.username : userId;
    const cleanRoomId = sanitize(roomId, 50);
    if (!rooms[cleanRoomId]) return;
    if (!isRoomMember(cleanRoomId, userId)) return;
    if (!rooms[cleanRoomId].voiceUsers) rooms[cleanRoomId].voiceUsers = {};
    rooms[cleanRoomId].voiceUsers[socket.id] = { username, isMuted: false };
    socket.to(cleanRoomId).emit('voice_join', { socketId: socket.id });
    const vu = Object.entries(rooms[cleanRoomId].voiceUsers).map(([sid, u]) => ({ socketId: sid, username: u.username, isMuted: u.isMuted }));
    socket.emit('voice_users', { users: vu });
    socket.to(cleanRoomId).emit('voice_users', { users: vu });
  });

  // Voice Leave
  socket.on('voice_leave', ({ roomId } = {}) => {
    const cleanRoomId = sanitize(roomId, 50);
    if (!rooms[cleanRoomId]) return;
    if (rooms[cleanRoomId].voiceUsers) delete rooms[cleanRoomId].voiceUsers[socket.id];
    socket.to(cleanRoomId).emit('voice_leave', { socketId: socket.id });
    const vu = rooms[cleanRoomId].voiceUsers
      ? Object.entries(rooms[cleanRoomId].voiceUsers).map(([sid, u]) => ({ socketId: sid, username: u.username, isMuted: u.isMuted }))
      : [];
    socket.emit('voice_users', { users: vu });
    socket.to(cleanRoomId).emit('voice_users', { users: vu });
  });

  // Voice Mute
  socket.on('voice_mute', ({ roomId, isMuted } = {}) => {
    const cleanRoomId = sanitize(roomId, 50);
    if (!rooms[cleanRoomId]?.voiceUsers?.[socket.id]) return;
    rooms[cleanRoomId].voiceUsers[socket.id].isMuted = !!isMuted;
    const vu = Object.entries(rooms[cleanRoomId].voiceUsers).map(([sid, u]) => ({ socketId: sid, username: u.username, isMuted: u.isMuted }));
    socket.to(cleanRoomId).emit('voice_users', { users: vu });
  });

  // ── WEBRTC SİNYALİ (ses) ──
  // GÜVENLİK: Sadece aynı odadaki kullanıcılar birbirine sinyal gönderebilir.
  socket.on('voice_signal', ({ targetId, signal } = {}) => {
    if (!targetId || typeof targetId !== 'string') return;
    if (!signal || typeof signal !== 'object') return;
    const roomId = socket.currentRoom;
    if (!roomId || !rooms[roomId]) return;
    const targetSocket = io.sockets.sockets.get(targetId);
    if (!targetSocket || targetSocket.currentRoom !== roomId) return;
    targetSocket.emit('voice_signal', { fromId: socket.id, signal });
  });

  // ── EKRAN PAYLAŞIMI (WebRTC) ──
  socket.on('screen_share_start', ({ roomId, token } = {}) => {
    const user = token ? requireAuth(token) : null;
    const userId = user ? user.username : socket.userId;
    const cleanRoomId = sanitize(roomId, 50);
    if (!userId || !isRoomMember(cleanRoomId, userId)) return;
    // GÜVENLİK: Aynı odada aynı anda yalnızca bir ekran paylaşımı olabilir
    if (rooms[cleanRoomId].screenSharer && rooms[cleanRoomId].screenSharer.socketId !== socket.id) {
      socket.emit('room_error', 'Odada zaten bir ekran paylaşımı sürüyor.');
      return;
    }
    const username = user ? user.username : (socket.userId || 'Misafir');
    rooms[cleanRoomId].screenSharer = { socketId: socket.id, username };
    socket.to(cleanRoomId).emit('screen_share_started', { socketId: socket.id, username });
  });

  socket.on('screen_share_stop', ({ roomId } = {}) => {
    const cleanRoomId = sanitize(roomId, 50);
    const room = rooms[cleanRoomId];
    if (!room) return;
    // GÜVENLİK: Paylaşımı yalnızca paylaşan kişi sonlandırabilir
    if (room.screenSharer?.socketId !== socket.id) return;
    delete room.screenSharer;
    socket.to(cleanRoomId).emit('screen_share_stopped', { socketId: socket.id });
  });

  // Ekran paylaşımı WebRTC sinyali (offer/answer/ice) — ayrı kanal
  socket.on('screen_signal', ({ targetId, signal } = {}) => {
    if (!targetId || typeof targetId !== 'string') return;
    if (!signal || typeof signal !== 'object') return;
    const roomId = socket.currentRoom;
    if (!roomId || !rooms[roomId]) return;
    const targetSocket = io.sockets.sockets.get(targetId);
    if (!targetSocket || targetSocket.currentRoom !== roomId) return;
    targetSocket.emit('screen_signal', { fromId: socket.id, signal });
  });
};