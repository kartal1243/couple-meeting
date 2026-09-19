// backend/src/sockets/voice.socket.js - Sesli sohbet ve WebRTC sinyalleri
const { sanitize } = require('../utils/helpers');
const { rooms } = require('../services/state');

module.exports = function registerVoiceSocket(io, socket, { requireAuth }) {
  // Voice Join
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

  // Voice Leave
  socket.on('voice_leave', ({ roomId, token }) => {
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
  socket.on('voice_mute', ({ roomId, isMuted }) => {
    const cleanRoomId = sanitize(roomId, 50);
    if (!rooms[cleanRoomId]?.voiceUsers?.[socket.id]) return;
    rooms[cleanRoomId].voiceUsers[socket.id].isMuted = isMuted;
    const vu = Object.entries(rooms[cleanRoomId].voiceUsers).map(([sid, u]) => ({ socketId: sid, username: u.username, isMuted: u.isMuted }));
    socket.to(cleanRoomId).emit('voice_users', { users: vu });
  });

  // Voice Signal (WebRTC SDP / ICE Candidate)
  socket.on('voice_signal', ({ targetId, signal }) => {
    const targetSocket = io.sockets.sockets.get(targetId);
    if (targetSocket) targetSocket.emit('voice_signal', { fromId: socket.id, signal });
  });
};
