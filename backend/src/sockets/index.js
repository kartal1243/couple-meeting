// backend/src/sockets/index.js - Tüm Socket.IO olaylarını bağlayıcı ana modül
const crypto = require('crypto');
const db = require('../../utils/database');
const { sanitize } = require('../utils/helpers');
const { getPublicRoomsList, emitToUser } = require('../services/state');

const registerAuthSocket = require('./auth.socket');
const registerChatSocket = require('./chat.socket');
const registerGroupSocket = require('./group.socket');
const registerSocialSocket = require('./social.socket');
const registerRoomSocket = require('./room.socket');
const registerVoiceSocket = require('./voice.socket');
const registerGameSocket = require('./game.socket');
const registerCommunitySocket = require('./community.socket');
const registerEventSocket = require('./event.socket');

module.exports = function initSockets(io) {
  io.on('connection', (socket) => {
    // Başlangıç verilerini gönder
    socket.emit('public_rooms_update', getPublicRoomsList());
    socket.emit('global_chat_history', db.getGlobalMessages(100));

    // Socket rate limiting & auth helper
    let lastReset = Date.now();
    const socketRateLimit = { auth: 0, chat: 0, action: 0, search: 0 };
    const resetRateLimits = () => {
      const now = Date.now();
      if (now - lastReset > 10000) {
        socketRateLimit.auth = 0;
        socketRateLimit.chat = 0;
        socketRateLimit.action = 0;
        socketRateLimit.search = 0;
        lastReset = now;
      }
    };
    const checkRate = (type, max) => {
      resetRateLimits();
      socketRateLimit[type]++;
      return socketRateLimit[type] > max;
    };

    const requireAuth = (token) => {
      if (!token) return null;
      return db.getUserByToken(token);
    };

    const context = { checkRate, requireAuth };

    // Modüler handler'ları kaydet
    registerAuthSocket(io, socket, context);
    registerChatSocket(io, socket, context);
    registerGroupSocket(io, socket, context);
    registerSocialSocket(io, socket, context);
    registerRoomSocket(io, socket, context);
    registerVoiceSocket(io, socket, context);
    registerGameSocket(io, socket, context);
    registerCommunitySocket(io, socket, db, sanitize, emitToUser, crypto);
    registerEventSocket(io, socket, db, sanitize, crypto);
  });
};
