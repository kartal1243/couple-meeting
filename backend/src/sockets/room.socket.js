// backend/src/sockets/room.socket.js - Oda yönetimi, senkronizasyon, YouTube arama ve ayrılma
const crypto = require('crypto');
const logger = require('../../utils/logger');
const db = require('../../utils/database');
const { sanitize } = require('../utils/helpers');
const { getInnertube } = require('../services/youtube.service');
const {
  rooms,
  tombalaGames,
  onlineUsers,
  adminSocketIds,
  emitToUser,
  broadcastRooms,
  updateRoomUsers,
  broadcastAdminActivity,
  setOffline,
  broadcastOnlineStatus
} = require('../services/state');

module.exports = function registerRoomSocket(io, socket, { checkRate, requireAuth }) {
  // ── MÜZİK / VİDEO ARAMA ──
  socket.on('search_music', async ({ query, token }) => {
    if (checkRate('search', 10)) return socket.emit('search_results', []);
    try {
      const q = sanitize(query, 200);
      if (!q || q.length < 2) {
        socket.emit('search_results', []);
        return;
      }

      const yt = await getInnertube().catch(() => null);
      if (!yt) {
        socket.emit('search_results', []);
        return;
      }

      try {
        const sr = await yt.search(q, { type: 'video' });
        const results = (sr.videos || []).slice(0, 10).map(v => ({
          id: v.id,
          title: v.title?.text || v.title?.toString() || '',
          artist: v.author?.name || '',
          duration: v.duration?.text || '',
          thumbnail: v.thumbnails?.[v.thumbnails.length - 1]?.url || `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
          src: v.id
        })).filter(s => s.id && s.title);
        if (results.length > 0) {
          socket.emit('search_results', results);
          return;
        }
      } catch {}

      try {
        const sr = await yt.music.search(q, { type: 'song' });
        const results = (sr.songs?.contents || []).map(s => ({
          id: s.id,
          title: s.title?.text || s.title?.toString() || '',
          artist: s.artists?.[0]?.name || '',
          duration: s.duration?.text || '',
          thumbnail: s.thumbnails?.[s.thumbnails.length - 1]?.url || `https://img.youtube.com/vi/${s.id}/hqdefault.jpg`,
          src: s.id
        })).filter(s => s.id && s.title).slice(0, 10);
        socket.emit('search_results', results);
        return;
      } catch {}

      socket.emit('search_results', []);
    } catch (err) {
      logger.error('Arama hatasi', { error: err.message });
      socket.emit('search_results', []);
    }
  });

  // ── ODAYA KATILMA ──
  socket.on('join_room', ({ roomId, password, maxUsers, token, userCity, clientUserId } = {}) => {
    const user = token ? requireAuth(token) : null;
    const cleanRoomId = sanitize(roomId, 50);
    const userId = user
      ? user.username
      : (clientUserId && typeof clientUserId === 'string' ? sanitize(clientUserId, 50) : 'misafir-' + Math.floor(1000 + Math.random() * 9000));
    const username = user ? user.username : userId;
    const avatar = user ? (user.avatar || '🐱') : '🐱';
    const isVip = user ? !!user.isVip : false;
    let room = rooms[cleanRoomId];

    if (!room) {
      const roomMaxUsers = isVip
        ? Math.min(Math.max(parseInt(maxUsers) || 2, 2), 20)
        : Math.min(Math.max(parseInt(maxUsers) || 2, 2), 8);
      rooms[cleanRoomId] = {
        name: cleanRoomId,
        password: typeof password === 'string' ? password : '',
        maxUsers: roomMaxUsers,
        hostUserId: userId,
        theme: 'default',
        users: [],
        kickedUsers: [],
        playlist: [],
        categories: ['Genel'],
        playMode: 'sequence',
        currentMedia: { type: 'none', src: '', time: 0, isPlaying: false, lastUpdated: Date.now() },
        messages: [],
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
        isVip: !!isVip
      };
      room = rooms[cleanRoomId];
      try {
        db.saveRoom({
          id: cleanRoomId,
          name: cleanRoomId,
          hostUserId: userId,
          password: room.password,
          isVip: room.isVip,
          maxUsers: room.maxUsers,
          theme: room.theme,
          createdAt: room.createdAt,
          lastActivityAt: room.lastActivityAt
        });
      } catch (e) {}
    } else {
      if (room.password && room.password !== (password || '')) {
        socket.emit('room_error', 'Şifre hatalı!');
        return;
      }
      if (room.kickedUsers && room.kickedUsers.includes(userId)) {
        socket.emit('room_error', 'Bu odadan atıldınız, tekrar giremezsiniz!');
        return;
      }
      if (!room.users.find(u => u.userId === userId) && room.users.length >= room.maxUsers) {
        socket.emit('room_error', `Oda Dolu! (${room.users.length}/${room.maxUsers})`);
        return;
      }
      if (!room.messages) room.messages = [];
    }

    const existingIndex = room.users.findIndex(u => u.userId === userId);
    const userInfo = {
      socketId: socket.id,
      userId,
      username: sanitize(username, 24) || 'Izleyici',
      avatar: sanitize(avatar, 10) || '🐱',
      userCity
    };
    if (existingIndex !== -1) room.users[existingIndex] = userInfo;
    else room.users.push(userInfo);

    room.lastActivityAt = Date.now();
    socket.currentRoom = cleanRoomId;
    socket.userId = userId;
    socket.join(cleanRoomId);

    const joinClientIp = socket.handshake?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || socket.handshake?.address || '';
    db.addConnectionLog(username, socket.id, joinClientIp, cleanRoomId, 'join', socket.handshake?.headers?.['user-agent'] || '');

    let calcTime = room.currentMedia?.time || 0;
    if (room.currentMedia?.isPlaying) {
      calcTime += (Date.now() - (room.currentMedia.lastUpdated || Date.now())) / 1000;
    }

    socket.emit('room_joined', {
      roomId: cleanRoomId,
      roomName: room.name,
      hostUserId: room.hostUserId,
      theme: room.theme,
      userCount: room.users.length,
      maxUsers: room.maxUsers,
      socketId: socket.id,
      users: room.users,
      playlist: room.playlist,
      categories: room.categories,
      playMode: room.playMode,
      messages: (room.messages || []).slice(-100),
      isVip: !!room.isVip,
      currentMedia: { ...room.currentMedia, time: calcTime }
    });

    // Gec katilan kullanici: aktif bir ekran paylasimi varsa haber ver (WebRTC akisi baslatilir)
    if (room.screenSharer && room.screenSharer.socketId !== socket.id) {
      socket.emit('screen_share_started', { socketId: room.screenSharer.socketId, username: room.screenSharer.username });
    }

    updateRoomUsers(cleanRoomId);
    broadcastRooms();
    try {
      broadcastAdminActivity('room_join', { username, roomId: cleanRoomId, roomName: room.name, message: `${username} odaya katıldı: ${room.name}` });
    } catch (e) {}

    try {
      const feedId = db.addFeedItem(username, 'room_join', { roomId: cleanRoomId, roomName: room.name });
      if (feedId) {
        const userObj = db.getUser(username);
        const followers = db.getDb() ? db.getDb().prepare('SELECT following FROM follows WHERE follower = ?').all(username) : [];
        followers.forEach(f => {
          emitToUser(f.following, 'new_feed_item', {
            item: {
              id: feedId,
              username,
              avatar: userObj?.avatar || '🐱',
              type: 'room_join',
              data: JSON.stringify({ roomId: cleanRoomId, roomName: room.name }),
              created_at: Date.now(),
              liked_by: [],
              like_count: 0,
              comment_count: 0
            }
          });
        });
      }
    } catch (e) {}
  });

  // ── ODA AYARLARINI GÜNCELLE ──
  socket.on('update_room_settings', ({ roomId, newName, newTheme, newHostUserId, newMaxUsers, newPassword } = {}) => {
    const cleanRoomId = sanitize(roomId, 50);
    const room = rooms[cleanRoomId];
    if (!room) return;
    const isHost = room.hostUserId === socket.userId || room.hostUserId === socket.socialUsername;
    if (!isHost) return;

    if (newName && newName.trim()) room.name = sanitize(newName, 50);
    if (newTheme) room.theme = newTheme;
    if (newHostUserId && room.users.find(u => u.userId === newHostUserId)) room.hostUserId = newHostUserId;
    if (newMaxUsers) {
      const maxLimit = room.isVip ? 20 : 8;
      room.maxUsers = Math.min(Math.max(parseInt(newMaxUsers) || 2, 2), maxLimit);
    }
    if (typeof newPassword === 'string') room.password = newPassword;

    try {
      db.saveRoom({
        id: cleanRoomId,
        name: room.name,
        hostUserId: room.hostUserId,
        password: room.password,
        isVip: room.isVip,
        maxUsers: room.maxUsers,
        theme: room.theme,
        createdAt: room.createdAt,
        lastActivityAt: room.lastActivityAt
      });
    } catch (e) {}

    io.to(cleanRoomId).emit('room_settings_updated', {
      roomName: room.name,
      theme: room.theme,
      hostUserId: room.hostUserId,
      maxUsers: room.maxUsers,
      hasPassword: !!room.password
    });
    broadcastRooms();
  });

  // ── ODADAN KULLANICI AT ──
  socket.on('kick_user', ({ roomId, targetUserId, token } = {}) => {
    const user = requireAuth(token);
    if (!user) return;
    const cleanRoomId = sanitize(roomId, 50);
    const room = rooms[cleanRoomId];
    if (room && room.hostUserId === user.username && targetUserId !== user.username) {
      const target = room.users.find(u => u.userId === targetUserId);
      if (target) {
        io.to(target.socketId).emit('kicked_from_room', 'Odadan atıldınız, tekrar giremezsiniz!');
        const targetSocket = io.sockets.sockets.get(target.socketId);
        if (targetSocket) targetSocket.leave(cleanRoomId);
        room.users = room.users.filter(u => u.userId !== targetUserId);
        if (!room.kickedUsers) room.kickedUsers = [];
        room.kickedUsers.push(targetUserId);
        updateRoomUsers(cleanRoomId);
        broadcastRooms();
      }
    }
  });

  // ── KATEGORİ OLUŞTUR ──
  socket.on('create_category', ({ roomId, categoryName, token }) => {
    const user = requireAuth(token);
    if (!user) return;
    const cleanRoomId = sanitize(roomId, 50);
    const room = rooms[cleanRoomId];
    const name = sanitize(categoryName, 50);
    if (room && name && !room.categories.includes(name)) {
      room.categories.push(name);
      io.to(cleanRoomId).emit('categories_updated', room.categories);
    }
  });

  // ── PLAYLIST'E EKLE ──
  socket.on('add_to_playlist', ({ roomId, item, token }) => {
    const user = token ? requireAuth(token) : null;
    const addedBy = user ? user.username : (socket.userId || 'Misafir');
    const cleanRoomId = sanitize(roomId, 50);
    const room = rooms[cleanRoomId];
    if (room && item && typeof item === 'object') {
      const isVip = user && user.isVip && user.vipExpiry > Date.now();
      if (!isVip && room.playlist.length >= 20) {
        socket.emit('room_error', 'Playlist dolu! (Maks. 20 video) VIP ile sinirsiz playlist acabilirsin.');
        return;
      }
      const safeItem = {
        id: item.id || crypto.randomBytes(8).toString('hex'),
        title: sanitize(item.title, 200) || 'Video',
        type: sanitize(item.type, 20) || 'youtube',
        src: sanitize(item.src, 500) || '',
        addedBy: sanitize(addedBy, 24)
      };
      room.playlist.push(safeItem);
      io.to(cleanRoomId).emit('playlist_updated', { playlist: room.playlist, playMode: room.playMode });
    }
  });

  // ── PLAYLIST'TEN ÇIKAR ──
  socket.on('remove_from_playlist', ({ roomId, itemId, token }) => {
    const user = requireAuth(token);
    if (!user) return;
    const cleanRoomId = sanitize(roomId, 50);
    const room = rooms[cleanRoomId];
    if (room) {
      room.playlist = room.playlist.filter(i => i.id !== itemId);
      io.to(cleanRoomId).emit('playlist_updated', { playlist: room.playlist, playMode: room.playMode });
    }
  });

  // ── OYNATMA MODU DEĞİŞTİR ──
  socket.on('change_play_mode', ({ roomId, mode }) => {
    const cleanRoomId = sanitize(roomId, 50);
    const room = rooms[cleanRoomId];
    if (room) {
      room.playMode = mode;
      io.to(cleanRoomId).emit('play_mode_changed', mode);
    }
  });

  // ── ODA AKSIYONLARI (MEDYA & SOHBET) ──
  socket.on('room_action', ({ roomId, type, payload } = {}) => {
    if (type === 'CHAT_MESSAGE' && checkRate('chat', 30)) return;
    if (type !== 'CHAT_MESSAGE' && checkRate('action', 20)) return;
    const cleanRoomId = sanitize(roomId, 50);
    const room = rooms[cleanRoomId];
    if (room) {
      // GUVENLIK: Medya kontrolu ve oda yonetimi sadece host tarafindan yapilabilir
      const isHost = room.hostUserId === socket.socialUsername || room.hostUserId === socket.userId;
      const MEDIA_ACTIONS = ['CHANGE_MEDIA', 'PLAY', 'PAUSE', 'SPEED', 'ROOM_CLOSED', 'UPDATE_MAX_USERS', 'ROOM_NAME_UPDATE', 'ROOM_THEME_UPDATE'];
      if (MEDIA_ACTIONS.includes(type) && !isHost) return;
      if (type === 'ROOM_CLOSED') {
        if (!isHost) return;
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
        room.currentMedia = {
          type: payload.type,
          src: payload.src,
          title: sanitize(payload.title, 200) || '',
          source: payload.source || payload.type,
          time: 0,
          isPlaying: true,
          lastUpdated: Date.now()
        };
      } else if (type === 'PLAY') {
        room.currentMedia.isPlaying = true;
        room.currentMedia.time = payload.time || 0;
        room.currentMedia.lastUpdated = Date.now();
      } else if (type === 'PAUSE') {
        room.currentMedia.isPlaying = false;
        room.currentMedia.time = payload.time || 0;
        room.currentMedia.lastUpdated = Date.now();
      } else if (type === 'CHAT_MESSAGE') {
        const msg = {
          id: payload.id || crypto.randomBytes(8).toString('hex'),
          senderId: payload.senderId,
          text: sanitize(payload.text || '', 500),
          sender: sanitize(payload.sender, 24),
          avatar: sanitize(payload.avatar, 10),
          time: payload.time,
          fileUrl: payload.fileUrl || '',
          fileType: payload.fileType || '',
          fileName: payload.fileName || '',
          replyTo: payload.replyTo || null,
          replyToText: sanitize(payload.replyToText, 500),
          replyToSender: sanitize(payload.replyToSender, 24),
          createdAt: Date.now()
        };
        if (!room.messages) room.messages = [];
        room.messages.push(msg);
        try {
          db.saveRoomMessage({
            id: msg.id,
            roomId: cleanRoomId,
            username: msg.sender,
            avatar: msg.avatar,
            text: msg.text,
            fileUrl: msg.fileUrl,
            fileType: msg.fileType,
            fileName: msg.fileName,
            time: msg.time,
            createdAt: msg.createdAt
          });
        } catch (e) {}
        try {
          db.updateRoomActivity(cleanRoomId);
        } catch (e) {}
        room.messages = room.messages.slice(-200);
        room.lastActivityAt = Date.now();
        socket.to(cleanRoomId).emit('room_action', { type, payload: msg });
        socket.emit('room_action', { type, payload: msg });
        return;
      } else if (type === 'UPDATE_MAX_USERS') {
        const maxLimit = room.isVip ? 20 : 8;
        room.maxUsers = Math.min(Math.max(parseInt(payload.maxUsers) || 2, 2), maxLimit);
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

  // NOT: Ekran paylasimi artik voice.socket.js icinde WebRTC ile yonetiliyor.

  // ── SENKRONİZASYON İSTEĞİ ──
  socket.on('request_room_sync', ({ roomId } = {}) => {
    const cleanRoomId = sanitize(roomId, 50);
    const room = rooms[cleanRoomId];
    if (room) {
      socket.emit('room_sync_data', {
        currentMedia: room.currentMedia,
        users: room.users.map(u => ({ username: u.username, avatar: u.avatar, userId: u.userId, isHost: u.userId === room.hostUserId })),
        hostUserId: room.hostUserId,
        roomName: room.name,
        theme: room.theme,
        playlist: room.playlist,
        playMode: room.playMode,
        categories: room.categories
      });
    }
  });

  // ── ODADAN AYRIL ──
  socket.on('leave_room', () => {
    if (socket.currentRoom && rooms[socket.currentRoom]) {
      const rId = socket.currentRoom;
      const leftUser = rooms[rId].users.find(u => u.socketId === socket.id);
      const leftUsername = leftUser?.username;
      rooms[rId].users = rooms[rId].users.filter(u => u.socketId !== socket.id);
      // Ekran paylasimi yapan kullanici ayrildiysa temizle
      if (rooms[rId].screenSharer?.socketId === socket.id) {
        delete rooms[rId].screenSharer;
        io.to(rId).emit('screen_share_stopped', { socketId: socket.id });
      }
      rooms[rId].lastActivityAt = Date.now();
      socket.leave(rId);
      socket.currentRoom = null;

      if (rooms[rId].users.length === 0) {
        if (!rooms[rId].isVip) {
          rooms[rId].emptySince = Date.now();
          logger.info(`Oda boşaldı (5 dk sonra silinecek): ${rId}`);
        }
        updateRoomUsers(rId);
      } else {
        if (rooms[rId].hostUserId === leftUsername) {
          const newHost = rooms[rId].users[0];
          rooms[rId].hostUserId = newHost.username;
          io.to(rId).emit('room_host_changed', { hostUserId: newHost.username, message: `${newHost.username} artık oda sahibi!` });
          try {
            db.saveRoom({
              id: rId,
              name: rooms[rId].name,
              hostUserId: newHost.username,
              password: rooms[rId].password,
              isVip: rooms[rId].isVip,
              maxUsers: rooms[rId].maxUsers,
              theme: rooms[rId].theme,
              createdAt: rooms[rId].createdAt,
              lastActivityAt: rooms[rId].lastActivityAt
            });
          } catch (e) {}
        }
        updateRoomUsers(rId);
      }
      broadcastRooms();
    }
  });

  // ── HEARTBEAT (CANLILIK SİNYALİ) ──
  socket.on('heartbeat', () => {
    if (socket.socialUsername && onlineUsers[socket.socialUsername]) {
      onlineUsers[socket.socialUsername].lastSeen = Date.now();
    }
  });

  // ── KOPMA (DISCONNECT) ──
  socket.on('disconnect', () => {
    adminSocketIds.delete(socket.id);
    if (socket.currentRoom && rooms[socket.currentRoom]) {
      const rId = socket.currentRoom;
      const sid = socket.id;
      if (rooms[rId]) {
        const leftUser = rooms[rId].users.find(u => u.socketId === sid);
        const leftUsername = leftUser?.username;
        rooms[rId].users = rooms[rId].users.filter(u => u.socketId !== sid);
        if (rooms[rId].voiceUsers) delete rooms[rId].voiceUsers[sid];
        // Ekran paylasimi yapan kullanici ciktysa temizle ve odadakilere bildir
        if (rooms[rId].screenSharer?.socketId === sid) {
          delete rooms[rId].screenSharer;
          io.to(rId).emit('screen_share_stopped', { socketId: sid });
        }
        rooms[rId].lastActivityAt = Date.now();

        if (rooms[rId].users.length === 0) {
          if (!rooms[rId].isVip) {
            rooms[rId].emptySince = Date.now();
            logger.info(`Oda boşaldı (5 dk sonra silinecek): ${rId}`);
          } else {
            logger.info(`VIP oda boş ama korunuyor: ${rId}`);
          }
          updateRoomUsers(rId);
        } else {
          if (rooms[rId].hostUserId === leftUsername && rooms[rId].users.length > 0) {
            const newHost = rooms[rId].users[0];
            rooms[rId].hostUserId = newHost.username;
            io.to(rId).emit('room_host_changed', { hostUserId: newHost.username, message: `${newHost.username} artık oda sahibi!` });
            logger.info(`Host transferi: ${rId} → ${newHost.username}`);
            try {
              db.saveRoom({
                id: rId,
                name: rooms[rId].name,
                hostUserId: newHost.username,
                password: rooms[rId].password,
                isVip: rooms[rId].isVip,
                maxUsers: rooms[rId].maxUsers,
                theme: rooms[rId].theme,
                createdAt: rooms[rId].createdAt,
                lastActivityAt: rooms[rId].lastActivityAt
              });
            } catch (e) {}
          }
          updateRoomUsers(rId);
        }
        broadcastRooms();
      }
    }
    if (socket.socialUsername) {
      setOffline(socket.socialUsername, socket.id);
      broadcastOnlineStatus(socket.socialUsername);
    }
  });
};
