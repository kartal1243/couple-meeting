require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const logger = require('./utils/logger');
const db = require('./utils/database');
const app = require('./src/app');
const { PORT, ALLOWED_ORIGINS } = require('./src/config');
const { setIo, startCleanupJobs, broadcastOnlineStatus, emitToUser, onlineUsers } = require('./src/services/state');
const initSockets = require('./src/sockets');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : '*', credentials: true },
  pingTimeout: 15000,
  pingInterval: 8000,
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 1e6
});

// io örneğini ve durum yöneticisini bağla
setIo(io);
initSockets(io);
startCleanupJobs();

// Hareketsiz kalan kullanıcıları tespit eden canlılık periyodu
const HEARTBEAT_TIMEOUT = 30000;
setInterval(() => {
  const now = Date.now();
  for (const [username, data] of Object.entries(onlineUsers)) {
    if (now - data.lastSeen > HEARTBEAT_TIMEOUT) {
      delete onlineUsers[username];
      db.updateLastSeen(username);
      try {
        if (db.getDb()) {
          for (const friendName of db.getDb().prepare('SELECT user2 as f FROM friendships WHERE user1 = ?').all(username).map(r => r.f)) {
            emitToUser(friendName, 'friend_online_status', { username, isOnline: false, lastSeen: data.lastSeen });
          }
          for (const friendName of db.getDb().prepare('SELECT user1 as f FROM friendships WHERE user2 = ?').all(username).map(r => r.f)) {
            emitToUser(friendName, 'friend_online_status', { username, isOnline: false, lastSeen: data.lastSeen });
          }
        }
      } catch (e) {}
    }
  }
}, 15000);

// Güvenli kapatma işlemleri
process.on('SIGTERM', () => {
  logger.info('SIGTERM alindi, kapatiliyor...');
  db.closeDb();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT alindi, kapatiliyor...');
  db.closeDb();
  process.exit(0);
});

server.listen(PORT, () => {
  logger.info(`🚀 Couple Meeting Backend calisiyor: port ${PORT}`);
});
