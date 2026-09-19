// backend/src/sockets/group.socket.js - Grup sohbetleri yönetimi
const crypto = require('crypto');
const db = require('../../utils/database');
const { sanitize } = require('../utils/helpers');
const { globalChatGroups, onlineUsers, emitToUser } = require('../services/state');

module.exports = function registerGroupSocket(io, socket) {
  const chatGroups = globalChatGroups;

  // Grup Oluştur
  socket.on('group_create', ({ name, members, token }) => {
    const from = db.getUserByToken(token);
    if (!from) return;
    const cleanName = sanitize(name, 30);
    if (!cleanName) return;
    const id = crypto.randomBytes(8).toString('hex');
    const memberList = [from.username, ...(members || []).map(m => sanitize(m, 24)).filter(m => m && m !== from.username)].slice(0, 20);
    chatGroups[id] = { id, name: cleanName, createdBy: from.username, members: memberList, messages: [], createdAt: Date.now() };
    try {
      db.saveGroupChatDef({ id, name: cleanName, createdBy: from.username, members: memberList, createdAt: Date.now() });
    } catch (e) {}
    memberList.forEach(username => emitToUser(username, 'group_created', { id, name: cleanName, members: memberList, createdBy: from.username }));
  });

  // Grup Listesi
  socket.on('group_list', ({ token }) => {
    const from = db.getUserByToken(token);
    if (!from) return;
    const groups = Object.values(chatGroups).filter(g => g.members.includes(from.username));
    socket.emit('group_list', {
      groups: groups.map(g => ({
        id: g.id,
        name: g.name,
        members: g.members,
        createdBy: g.createdBy,
        lastMessage: (g.messages && g.messages.length > 0) ? g.messages[g.messages.length - 1] : null,
        memberStatus: g.members.map(m => ({ username: m, isOnline: !!onlineUsers[m], lastSeen: onlineUsers[m]?.lastSeen || null }))
      }))
    });
  });

  // Grup Mesajı Gönder
  socket.on('group_send', ({ groupId, text, token, replyTo }) => {
    const from = db.getUserByToken(token);
    if (!from) return;
    const group = chatGroups[sanitize(groupId, 20)];
    if (!group || !group.members.includes(from.username)) return;
    const cleanText = sanitize(text, 500);
    if (!cleanText) return;
    const msg = {
      id: crypto.randomBytes(8).toString('hex'),
      from: from.username,
      fromAvatar: from.avatar,
      text: cleanText,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      replyTo: replyTo ? { sender: sanitize(replyTo.sender, 24), text: sanitize(replyTo.text, 200) } : undefined
    };
    db.saveGroupMessage({ ...msg, groupId: group.id });
    group.messages.push(msg);
    if (group.messages.length > 200) group.messages = group.messages.slice(-200);
    group.members.forEach(username => emitToUser(username, 'group_message', { groupId: group.id, msg }));
  });

  // Grup Geçmişi
  socket.on('group_history', ({ groupId, token }) => {
    const from = db.getUserByToken(token);
    if (!from) return;
    const group = chatGroups[sanitize(groupId, 20)];
    if (!group || !group.members.includes(from.username)) return;
    const dbMessages = (db.getGroupHistory(group.id, 50) || []).map(m => ({
      id: m.id,
      from: m.from_username,
      fromAvatar: m.from_avatar || '🐱',
      text: m.text,
      time: m.time,
      createdAt: m.created_at
    }));
    const memMessages = group.messages || [];
    const allMessages = [...dbMessages, ...memMessages.filter(m => !dbMessages.find(d => d.id === m.id))];
    allMessages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    socket.emit('group_history', { groupId: group.id, messages: allMessages.slice(-50) });
  });

  // Gruba Davet Et
  socket.on('group_invite', ({ groupId, username, token }) => {
    const from = db.getUserByToken(token);
    if (!from) return;
    const group = chatGroups[sanitize(groupId, 20)];
    if (!group || group.createdBy !== from.username) return;
    const target = sanitize(username, 24);
    if (!target || group.members.includes(target)) return;
    group.members.push(target);
    try {
      db.saveGroupChatDef({ id: group.id, name: group.name, createdBy: group.createdBy, members: group.members, createdAt: group.createdAt || Date.now() });
    } catch (e) {}
    emitToUser(target, 'group_created', { id: group.id, name: group.name, members: group.members, createdBy: group.createdBy });
    group.members.forEach(u => emitToUser(u, 'group_updated', { id: group.id, members: group.members }));
  });
};
