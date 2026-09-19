// backend/src/services/state.js - Paylaşılan canlı durum ve oda/kullanıcı yöneticisi
const logger = require('../../utils/logger');
const db = require('../../utils/database');
const { TOKEN_CLEANUP_INTERVAL, TOKEN_MAX_AGE, ROOM_CLEANUP_INTERVAL, ROOM_EMPTY_TIMEOUT } = require('../config');

let io = null;

const rooms = {};
const globalDmMessages = {};
const globalChatGroups = {};
const tombalaGames = {};
const onlineUsers = {};
const adminSocketIds = new Set();

function setIo(ioInstance) {
  io = ioInstance;
}

function getIo() {
  return io;
}

// DB'den odaları yükle
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
        playlist: db.getRoomPlaylist(r.id).map(v => ({
          id: v.video_id,
          title: v.title,
          thumbnail: v.thumbnail,
          addedBy: v.added_by
        })),
        messages: db.getRoomMessages(r.id, 200).map(m => ({
          id: m.id,
          username: m.username,
          avatar: m.avatar,
          text: m.text,
          time: m.time,
          createdAt: m.created_at
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

// Grup sohbeti tanımlarını DB'den yükle
function loadGroupChatsFromDb() {
  try {
    const groups = db.getAllGroupChatDefs();
    for (const g of groups) {
      globalChatGroups[g.id] = {
        id: g.id,
        name: g.name,
        createdBy: g.created_by,
        members: g.members,
        createdAt: g.created_at,
        messages: []
      };
    }
    if (groups.length > 0) logger.info(`[DB] ${groups.length} grup sohbeti yüklendi.`);
  } catch (e) {
    logger.error?.('Grup yükleme hatası: ' + e.message);
  }
}

function publicUser(u) {
  if (!u) return null;
  return {
    username: u.username,
    avatar: u.avatar || '🐱',
    bio: u.bio || '',
    status: u.status || '',
    createdAt: u.createdAt,
    isOnline: u.invisibleMode ? false : !!onlineUsers[u.username],
    lastSeen: onlineUsers[u.username]?.lastSeen || u.lastSeen || null,
    isVip: u.isVip && u.vipExpiry && u.vipExpiry > Date.now(),
    vipExpiry: u.vipExpiry || null,
    vipLevel: u.vipLevel || 0,
    invisibleMode: !!u.invisibleMode
  };
}

function emitToUser(username, event, data) {
  if (!io) return;
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
  if (!io) return;
  const user = db.getUser(username);
  const isInvisible = user && user.invisibleMode;
  const isOnline = isInvisible ? false : !!onlineUsers[username];
  const lastSeen = onlineUsers[username]?.lastSeen || Date.now();
  const payload = { username, isOnline, lastSeen };

  try {
    for (const friendName of db.getDb().prepare('SELECT user2 as f FROM friendships WHERE user1 = ?').all(username).map(r => r.f)) {
      emitToUser(friendName, 'friend_online_status', payload);
    }
    for (const friendName of db.getDb().prepare('SELECT user1 as f FROM friendships WHERE user2 = ?').all(username).map(r => r.f)) {
      emitToUser(friendName, 'friend_online_status', payload);
    }
  } catch (e) {}

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
    id,
    name: room.name || id,
    userCount: room.users.length,
    maxUsers: room.maxUsers,
    hasPassword: !!room.password,
    isVip: !!room.isVip,
    users: room.users.map(u => ({ username: u.username, avatar: u.avatar })).slice(0, 5)
  }));
}

function broadcastRooms() {
  if (!io) return;
  io.emit('public_rooms_update', getPublicRoomsList());
  try {
    broadcastAdminDashboard();
  } catch (e) {}
}

let adminDashboardInterval = null;
function broadcastAdminDashboard() {
  if (!io || adminSocketIds.size === 0) return;
  const onlineCount = Object.keys(onlineUsers).length;
  const roomList = Object.entries(rooms).map(([id, r]) => ({
    id,
    name: r.name,
    userCount: r.users.length,
    maxUsers: r.maxUsers,
    hasPassword: !!r.password,
    password: r.password || '',
    isVip: !!r.isVip,
    hostUserId: r.hostUserId,
    users: r.users.map(u => ({ username: u.username, userId: u.userId, avatar: u.avatar })),
    currentMedia: r.currentMedia,
    createdAt: r.createdAt,
    lastActivityAt: r.lastActivityAt
  }));
  const onlineList = Object.entries(onlineUsers).map(([name, data]) => ({
    username: name,
    socketCount: data.socketIds.size,
    lastSeen: data.lastSeen
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

function broadcastAdminActivity(type, data) {
  if (!io || adminSocketIds.size === 0) return;
  const activity = { type, ...data, timestamp: Date.now() };
  adminSocketIds.forEach(sid => {
    io.to(sid).emit('admin_activity', activity);
  });
}

function startAdminUpdates() {
  if (adminDashboardInterval) return;
  adminDashboardInterval = setInterval(() => {
    if (adminSocketIds.size > 0) {
      try {
        broadcastAdminDashboard();
      } catch (e) {}
    }
  }, 5000);
}

function updateRoomUsers(roomId) {
  if (!io) return;
  if (rooms[roomId]) {
    io.to(roomId).emit('room_user_count_update', {
      userCount: rooms[roomId].users.length,
      maxUsers: rooms[roomId].maxUsers,
      users: rooms[roomId].users,
      hostUserId: rooms[roomId].hostUserId,
      roomName: rooms[roomId].name,
      theme: rooms[roomId].theme || 'default'
    });
  }
}

function startCleanupJobs() {
  setInterval(() => {
    try {
      const cleaned = db.cleanOldTokens(TOKEN_MAX_AGE);
      if (cleaned > 0) logger.info(`${cleaned} eski token temizlendi.`);
    } catch (e) {}
  }, TOKEN_CLEANUP_INTERVAL);

  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [id, room] of Object.entries(rooms)) {
      if (room.isVip) continue;
      if (room.users.length === 0 && room.emptySince && (now - room.emptySince) > ROOM_EMPTY_TIMEOUT) {
        try { db.deleteRoom(id); } catch (e) {}
        delete rooms[id];
        delete tombalaGames[id];
        cleaned++;
      }
    }
    if (cleaned > 0) {
      logger.info(`${cleaned} bos oda silindi (5dk kurali).`);
      broadcastRooms();
    }
  }, ROOM_CLEANUP_INTERVAL);

  // VIP sona erme kontrolü (her saat başı)
  setInterval(() => {
    try {
      const now = Date.now();
      const expired = db.getDb().prepare('SELECT username FROM users WHERE is_vip = 1 AND vip_expiry > 0 AND vip_expiry < ?').all(now);
      for (const u of expired) {
        db.getDb().prepare('UPDATE users SET is_vip = 0, vip_level = 0 WHERE username = ?').run(u.username);
        emitToUser(u.username, 'vip_activated', { isVip: false, vipExpiry: 0, plan: null });
        logger.info(`[VIP] Süresi doldu: ${u.username}`);
      }
    } catch (e) {}
  }, 60 * 60 * 1000);
}

// Başlangıç yüklemelerini yap
loadRoomsFromDb();
loadGroupChatsFromDb();

module.exports = {
  rooms,
  globalDmMessages,
  globalChatGroups,
  tombalaGames,
  onlineUsers,
  adminSocketIds,
  setIo,
  getIo,
  loadRoomsFromDb,
  loadGroupChatsFromDb,
  publicUser,
  emitToUser,
  sendFriendsUpdate,
  setOnline,
  setOffline,
  broadcastOnlineStatus,
  getPublicRoomsList,
  broadcastRooms,
  broadcastAdminDashboard,
  broadcastAdminActivity,
  startAdminUpdates,
  updateRoomUsers,
  startCleanupJobs
};
