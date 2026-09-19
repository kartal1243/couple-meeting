// backend/src/sockets/chat.socket.js - Global sohbet, DM, tepkiler ve yazma indikatörü
const crypto = require('crypto');
const db = require('../../utils/database');
const { sanitize } = require('../utils/helpers');
const {
  rooms,
  globalDmMessages,
  onlineUsers,
  emitToUser,
  sendFriendsUpdate
} = require('../services/state');

module.exports = function registerChatSocket(io, socket, { checkRate, requireAuth }) {
  const dmMessages = globalDmMessages;

  // ── YAZMA İNDİKATÖRÜ (DM) ──
  socket.on('typing_start', ({ to, token } = {}) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    emitToUser(sanitize(to, 24), 'typing_indicator', { from: user.username, typing: true });
  });

  socket.on('typing_stop', ({ to, token } = {}) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    emitToUser(sanitize(to, 24), 'typing_indicator', { from: user.username, typing: false });
  });

  // ── ODA İÇİ YAZMA İNDİKATÖRÜ ──
  socket.on('room_typing_start', ({ roomId } = {}) => {
    const cleanRoomId = sanitize(roomId, 50);
    if (!rooms[cleanRoomId]) return;
    const username = socket.userId || 'Biri';
    socket.to(cleanRoomId).emit('room_typing_indicator', { username, typing: true });
  });

  socket.on('room_typing_stop', ({ roomId } = {}) => {
    const cleanRoomId = sanitize(roomId, 50);
    if (!rooms[cleanRoomId]) return;
    const username = socket.userId || 'Biri';
    socket.to(cleanRoomId).emit('room_typing_indicator', { username, typing: false });
  });

  // ── KULLANICI ENGELLEME ──
  socket.on('block_user', ({ targetUsername, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const target = sanitize(targetUsername, 20);
    if (target === user.username) return;
    const targetUser = db.getUser(target);
    if (!targetUser) return socket.emit('block_result', { success: false, message: 'Kullanıcı bulunamadı.' });
    db.blockUser(user.username, target);
    socket.emit('block_result', { success: true, blocked: target });
    sendFriendsUpdate(user.username);
  });

  socket.on('unblock_user', ({ targetUsername, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    db.unblockUser(user.username, sanitize(targetUsername, 20));
    socket.emit('unblock_result', { success: true, unblocked: sanitize(targetUsername, 20) });
    sendFriendsUpdate(user.username);
  });

  socket.on('get_blocked_users', ({ token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    socket.emit('blocked_users_list', { blocked: db.getBlockedUsers(user.username) });
  });

  // ── DM MESAJ SİLME / DÜZENLEME ──
  socket.on('dm_delete', ({ messageId, withUser, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const key = [user.username, sanitize(withUser, 24)].sort().join(':');
    let deleted = false;
    if (dmMessages[key]) {
      const msg = dmMessages[key].find(m => m.id === messageId);
      if (msg && msg.from === user.username) {
        dmMessages[key] = dmMessages[key].filter(m => m.id !== messageId);
        deleted = true;
      }
    }
    if (deleted) {
      emitToUser(sanitize(withUser, 24), 'dm_deleted', { messageId, from: user.username });
      socket.emit('dm_deleted', { messageId, from: user.username });
    }
  });

  socket.on('dm_edit', ({ messageId, withUser, newText, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const cleanText = sanitize(newText, 500);
    if (!cleanText) return;
    const key = [user.username, sanitize(withUser, 24)].sort().join(':');
    if (dmMessages[key]) {
      const msg = dmMessages[key].find(m => m.id === messageId && m.from === user.username);
      if (msg) {
        msg.text = cleanText;
        msg.edited = true;
      }
    }
    emitToUser(sanitize(withUser, 24), 'dm_edited', { messageId, text: cleanText, from: user.username });
    socket.emit('dm_edited', { messageId, text: cleanText, from: user.username });
  });

  // ── MESAJ TEPKİLERİ ──
  socket.on('add_reaction', ({ messageId, messageType, emoji, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const cleanEmoji = sanitize(emoji, 8);
    if (!cleanEmoji) return;
    db.addReaction(messageId, messageType || 'dm', user.username, cleanEmoji);
    const reactions = db.getReactions(messageId, messageType || 'dm');
    socket.broadcast.emit('reactions_update', { messageId, messageType: messageType || 'dm', reactions });
  });

  socket.on('remove_reaction', ({ messageId, messageType, emoji, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const cleanEmoji = sanitize(emoji, 8);
    if (!cleanEmoji) return;
    db.removeReaction(messageId, messageType || 'dm', user.username, cleanEmoji);
    const reactions = db.getReactions(messageId, messageType || 'dm');
    socket.broadcast.emit('reactions_update', { messageId, messageType: messageType || 'dm', reactions });
  });

  // ── GLOBAL CANLI SOHBET ──
  socket.on('global_chat_message', ({ text, token } = {}) => {
    const user = requireAuth(token);
    if (!user) return;
    const cleanText = sanitize(text, 500);
    if (!cleanText) return;
    if (checkRate('chat', 30)) return;
    const msg = {
      id: crypto.randomBytes(8).toString('hex'),
      username: user.username,
      avatar: user.avatar || '🐱',
      text: cleanText,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now()
    };
    db.addGlobalMessage(msg);
    io.emit('global_chat_message', msg);
  });

  // ── ÖZEL MESAJ (DM) GÖNDER ──
  socket.on('dm_send', ({ to, text, token, msgId, replyTo } = {}) => {
    if (checkRate('chat', 30)) return;
    const from = db.getUserByToken(token);
    if (!from) return;
    const cleanText = sanitize(text, 500);
    if (!cleanText) return;
    const toUser = db.getUser(sanitize(to, 24)) || db.getUser(sanitize(to, 24).toLowerCase()) || db.getUser(sanitize(to, 24).toUpperCase());
    if (!toUser) return;
    if (!db.areFriends(from.username, toUser.username)) return socket.emit('dm_status', { message: 'Sadece arkadaşlarınızla mesajlaşabilirsiniz.' });
    if (db.isBlocked(toUser.username, from.username)) return socket.emit('dm_status', { message: 'Bu kullanıcı sizi engelledi.' });
    if (db.isBlocked(from.username, toUser.username)) return socket.emit('dm_status', { message: 'Bu kullanıcıyı engellediniz. Engellemek için kaldırın.' });

    const msg = {
      id: msgId || crypto.randomBytes(8).toString('hex'),
      from: from.username,
      fromAvatar: from.avatar,
      to: toUser.username,
      toAvatar: toUser.avatar,
      text: cleanText,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      replyTo: replyTo ? { sender: sanitize(replyTo.sender, 24), text: sanitize(replyTo.text, 200) } : undefined
    };

    db.saveDmMessage(msg);
    const key = [from.username, toUser.username].sort().join(':');
    if (!dmMessages[key]) dmMessages[key] = [];
    dmMessages[key].push(msg);
    if (dmMessages[key].length > 200) dmMessages[key] = dmMessages[key].slice(-200);

    emitToUser(toUser.username, 'dm_received', msg);
    socket.emit('dm_sent', { ...msg, localMsgId: msgId });
  });

  // ── DM GEÇMİŞİ ──
  socket.on('dm_history', ({ withUser, token }) => {
    const from = db.getUserByToken(token);
    if (!from) return;
    const other = sanitize(withUser, 24);
    const dbMessages = db.getDmHistory(from.username, other, 50);
    const key = [from.username, other].sort().join(':');
    const memMessages = dmMessages[key] || [];
    const allMessages = [...dbMessages, ...memMessages.filter(m => !dbMessages.find(d => d.id === m.id))];
    allMessages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    socket.emit('dm_history', { messages: allMessages.slice(-50), withUser: other });
  });

  // ── DM LİSTESİ ──
  socket.on('dm_list', ({ token }) => {
    const from = db.getUserByToken(token);
    if (!from) return;
    const conversations = {};

    const dbConvs = db.getDmConversations(from.username);
    for (const conv of dbConvs) {
      conversations[conv.username] = {
        username: conv.username,
        avatar: conv.avatar || '🐱',
        lastMessage: conv.lastMessage,
        lastTime: conv.lastTime,
        lastCreatedAt: conv.lastCreatedAt || 0,
        unread: conv.unread,
        isOnline: !!onlineUsers[conv.username],
        lastSeen: onlineUsers[conv.username]?.lastSeen || conv.lastSeen || null
      };
    }

    for (const [key, msgs] of Object.entries(dmMessages)) {
      if (key.includes(from.username) && msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        const other = last.from === from.username ? last.to : last.from;
        const otherUser = db.getUser(other);
        const existing = conversations[other];
        const memCreatedAt = last.createdAt || 0;
        if (!existing || memCreatedAt > (existing.lastCreatedAt || 0)) {
          conversations[other] = {
            username: other,
            avatar: otherUser?.avatar || '🐱',
            lastMessage: last.text,
            lastTime: last.time,
            lastCreatedAt: memCreatedAt,
            unread: msgs.filter(m => m.to === from.username && !m.read).length,
            isOnline: !!onlineUsers[other],
            lastSeen: onlineUsers[other]?.lastSeen || otherUser?.lastSeen || null
          };
        }
      }
    }
    socket.emit('dm_list', {
      conversations: Object.values(conversations).sort((a, b) => (b.lastCreatedAt || 0) - (a.lastCreatedAt || 0))
    });
  });

  // ── DM OKUNDU BİLGİSİ ──
  socket.on('dm_read', ({ withUser, token }) => {
    const from = db.getUserByToken(token);
    if (!from) return;
    const other = sanitize(withUser, 24);
    const key = [from.username, other].sort().join(':');
    if (dmMessages[key]) {
      dmMessages[key].forEach(m => {
        if (m.to === from.username) m.read = true;
      });
    }
    db.markDmRead(other, from.username);
    emitToUser(other, 'dm_read_receipt', { from: from.username, readBy: from.username, time: Date.now() });
  });
};
