// backend/src/sockets/social.socket.js - Arkadaşlık, takip, feed, bildirimler ve raporlama
const db = require('../../utils/database');
const { sanitize } = require('../utils/helpers');
const {
  rooms,
  onlineUsers,
  emitToUser,
  sendFriendsUpdate
} = require('../services/state');

module.exports = function registerSocialSocket(io, socket) {
  // ── ODA DAVETİ ──
  socket.on('invite_to_room', ({ targetUsername, roomId, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const target = sanitize(targetUsername, 20);
    const room = rooms[roomId];
    if (!room) return socket.emit('room_invite_result', { success: false, message: 'Oda bulunamadı.' });
    if (!room.users.find(u => u.userId === user.username)) return socket.emit('room_invite_result', { success: false, message: 'Bu odada değilsiniz.' });
    emitToUser(target, 'room_invite', { from: user.username, fromAvatar: user.avatar, roomId, roomName: room.name || roomId });
    socket.emit('room_invite_result', { success: true, message: `${target} kullanıcısına davet gönderildi.` });
  });

  // ── TAKİP ET ──
  socket.on('follow_user', ({ targetUsername, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const target = sanitize(targetUsername, 20);
    if (target === user.username) return socket.emit('follow_result', { success: false, message: 'Kendini takip edemezsin.' });
    const targetUser = db.getUser(target);
    if (!targetUser) return socket.emit('follow_result', { success: false, message: 'Kullanıcı bulunamadı.' });
    if (db.isBlocked(target, user.username)) return socket.emit('follow_result', { success: false, message: 'Bu kullanıcı sizi engelledi.' });
    if (db.isBlocked(user.username, target)) return socket.emit('follow_result', { success: false, message: 'Bu kullanıcıyı engellediniz.' });
    const ok = db.followUser(user.username, target);
    if (ok) {
      db.addFeedItem(user.username, 'follow', { following: target });
      emitToUser(target, 'followed_you', { username: user.username, avatar: user.avatar });
      db.createNotification(target, 'follow', user.username, 'Yeni Takipçi', `${user.username} seni takip etti!`, { follower: user.username });
    }
    const counts = db.getFollowCounts(target);
    socket.emit('follow_result', { success: ok, following: ok, target, ...counts });
    emitToUser(target, 'follow_counts_update', counts);
  });

  // ── TAKİBİ BIRAK ──
  socket.on('unfollow_user', ({ targetUsername, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const target = sanitize(targetUsername, 20);
    db.unfollowUser(user.username, target);
    const counts = db.getFollowCounts(target);
    socket.emit('follow_result', { success: true, following: false, target, ...counts });
    emitToUser(target, 'follow_counts_update', counts);
  });

  // ── TAKİPÇİ SAYILARI ──
  socket.on('get_follow_counts', ({ username, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const target = sanitize(username, 20);
    const counts = db.getFollowCounts(target);
    const isFollowing = db.isFollowing(user.username, target);
    socket.emit('follow_counts', { username: target, ...counts, isFollowing });
  });

  socket.on('get_followers', ({ username, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const target = sanitize(username, 20);
    const followers = db.getFollowers(target);
    socket.emit('followers_list', { username: target, followers });
  });

  socket.on('get_following', ({ username, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const target = sanitize(username, 20);
    const following = db.getFollowing(target);
    socket.emit('following_list', { username: target, following });
  });

  // ── FEED (AKIŞ) ──
  socket.on('get_feed', ({ token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const feed = db.getFeedForUser(user.username);
    socket.emit('feed', { items: feed });
  });

  socket.on('feed_create', ({ token, text }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const cleanText = sanitize(text, 500);
    if (!cleanText) return;
    const id = db.addFeedItem(user.username, 'post', { text: cleanText });
    const item = {
      id,
      username: user.username,
      avatar: user.avatar,
      type: 'post',
      data: JSON.stringify({ text: cleanText }),
      created_at: Date.now(),
      liked_by: [],
      like_count: 0,
      comment_count: 0
    };
    if (user.followers) {
      user.followers.forEach(f => emitToUser(f, 'new_feed_item', { item }));
    }
  });

  socket.on('feed_like', ({ token, feedId }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const result = db.likeFeedItem(feedId, user.username);
    if (result !== null) {
      const likes = db.getFeedLikes(feedId);
      const item = db.getDb() ? db.getDb().prepare('SELECT * FROM feed_items WHERE id = ?').get(feedId) : null;
      if (item) {
        const feedUser = item.username;
        if (result === true && feedUser !== user.username) {
          emitToUser(feedUser, 'notification', { type: 'feed_like', from: user.username, title: 'Gönderini beğendi', body: '' });
        }
      }
      socket.emit('feed_like_result', { feedId, liked: result === true, likeCount: likes.length, likedBy: likes });
    }
  });

  socket.on('feed_comment', ({ token, feedId, text }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const cleanText = sanitize(text, 300);
    if (!cleanText) return;
    const comment = db.addFeedComment(feedId, user.username, cleanText);
    if (comment) {
      comment.avatar = user.avatar;
      socket.emit('feed_comment_result', { feedId, comment });
      const item = db.getDb() ? db.getDb().prepare('SELECT username FROM feed_items WHERE id = ?').get(feedId) : null;
      if (item && item.username !== user.username) {
        emitToUser(item.username, 'notification', { type: 'feed_comment', from: user.username, title: 'Gönderine yorum yaptı', body: cleanText.slice(0, 50) });
      }
    }
  });

  socket.on('feed_delete', ({ token, feedId }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    db.deleteFeedItem(feedId, user.username);
    socket.emit('feed_deleted', { feedId });
  });

  socket.on('get_suggested_follows', ({ token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const suggestions = db.getSuggestedFollows(user.username, 10);
    socket.emit('suggested_follows', { suggestions });
  });

  // ── BİLDİRİMLER ──
  socket.on('get_notifications', ({ token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const notifs = db.getNotifications(user.username);
    const unread = db.getUnreadNotifCount(user.username);
    socket.emit('notifications', { notifications: notifs, unread });
  });

  socket.on('mark_notifications_read', ({ token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    db.markNotifsRead(user.username);
    socket.emit('notifications', { notifications: db.getNotifications(user.username), unread: 0 });
  });

  // ── KULLANICI RAPORLAMA ──
  socket.on('report_user', ({ targetUsername, reason, details, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    if (targetUsername === user.username) return socket.emit('report_result', { success: false, message: 'Kendini raporlayamazsın.' });
    const target = db.getUser(sanitize(targetUsername, 20));
    if (!target) return socket.emit('report_result', { success: false, message: 'Kullanıcı bulunamadı.' });
    db.createReport(user.username, target.username, sanitize(reason, 50), sanitize(details, 500));
    socket.emit('report_result', { success: true, message: 'Raporun alındı. Teşekkürler!' });
    const adminRole = db.getUserRole('admin');
    if (adminRole === 'admin' || adminRole === 'superadmin') {
      db.createNotification('admin', 'report', user.username, 'Yeni Rapor', `${user.username} → ${target.username}: ${reason}`, { reported: target.username });
    }
  });

  socket.on('get_reports', ({ token }) => {
    const user = db.getUserByToken(token);
    if (!user || !db.hasPermission(user.username, 'report_view')) return;
    const reports = db.getReports('pending');
    socket.emit('reports_list', { reports });
  });

  socket.on('resolve_report', ({ reportId, action, token }) => {
    const user = db.getUserByToken(token);
    if (!user || !db.hasPermission(user.username, 'ban')) return;
    db.updateReportStatus(reportId, action === 'dismiss' ? 'dismissed' : 'resolved');
    socket.emit('report_result', { success: true, message: 'Rapor güncellendi.' });
  });

  // ── ROL YÖNETİMİ ──
  socket.on('set_role', ({ targetUsername, role, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    if (!db.hasPermission(user.username, 'role_manage')) return socket.emit('role_result', { success: false, message: 'Yetkin yok.' });
    const validRoles = ['user', 'mod', 'admin'];
    if (!validRoles.includes(role)) return socket.emit('role_result', { success: false, message: 'Geçersiz rol.' });
    if (role === 'admin' && !db.hasPermission(user.username, 'admin_manage')) return socket.emit('role_result', { success: false, message: 'Admin atama yetkin yok.' });
    const target = db.getUser(sanitize(targetUsername, 20));
    if (!target) return socket.emit('role_result', { success: false, message: 'Kullanıcı bulunamadı.' });
    db.setUserRole(target.username, role, user.username);
    db.createNotification(target.username, 'role', user.username, 'Rol Değişikliği', `Rolün ${role} olarak değiştirildi.`, { role });
    socket.emit('role_result', { success: true, message: `${target.username} → ${role}` });
  });

  socket.on('get_all_roles', ({ token }) => {
    const user = db.getUserByToken(token);
    if (!user || !db.hasPermission(user.username, 'role_manage')) return;
    socket.emit('roles_list', { roles: db.getAllRoles() });
  });

  // ── PUSH BİLDİRİM ──
  socket.on('save_push_subscription', ({ token, endpoint, p256dh, auth }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    db.savePushSubscription(user.username, endpoint, p256dh, auth);
  });

  socket.on('remove_push_subscription', ({ endpoint }) => {
    db.removePushSubscription(endpoint);
  });

  // ── ARKADAŞLIK SİSTEMİ ──
  socket.on('friend_search', ({ q, token }) => {
    const term = sanitize(q, 20);
    const current = db.getUserByToken(token)?.username;
    if (!term || term.length < 1) return socket.emit('friend_search_results', []);
    const results = db.searchUsers(term, current).map(u => ({
      username: u.username,
      avatar: u.avatar || '🐱',
      isOnline: !!onlineUsers[u.username],
      lastSeen: onlineUsers[u.username]?.lastSeen || u.lastSeen || null
    }));
    socket.emit('friend_search_results', results);
  });

  socket.on('friend_request', ({ targetUsername, token }) => {
    const from = db.getUserByToken(token);
    const cleanTarget = sanitize(targetUsername, 20);
    const target = db.getUser(cleanTarget) || db.getUser(cleanTarget.toLowerCase()) || db.getUser(cleanTarget.toUpperCase());
    if (!from) return socket.emit('friend_request_status', { message: 'Giris yapmalisin.' });
    if (!target) return socket.emit('friend_request_status', { message: 'Kullanici bulunamadi.' });
    if (target.username === from.username) return socket.emit('friend_request_status', { message: 'Kendine istek gonderemezsin.' });
    if (db.areFriends(from.username, target.username)) return socket.emit('friend_request_status', { message: 'Zaten arkadassiniz.' });
    if (db.hasPendingRequest(from.username, target.username)) return socket.emit('friend_request_status', { message: 'Istek zaten gonderilmis.' });
    if (db.hasPendingRequest(target.username, from.username)) return socket.emit('friend_request_status', { message: 'Bu kullanici sana zaten istek gondermis.' });

    const id = db.sendFriendRequest(from.username, from.avatar, target.username);
    socket.emit('friend_request_status', { message: 'Arkadaslik istegi gonderildi' });
    sendFriendsUpdate(target.username);
    emitToUser(target.username, 'friend_request_received', { id, fromUsername: from.username, avatar: from.avatar });
  });

  socket.on('friend_request_response', ({ requestId, action, token }) => {
    const me = db.getUserByToken(token);
    const req = db.getFriendRequest(requestId);
    if (!me || !req || req.to_username !== me.username || req.status !== 'pending') return;
    db.updateFriendRequest(requestId, action === 'accept' ? 'accepted' : 'rejected');
    if (action === 'accept') db.addFriendship(me.username, req.from_username);
    sendFriendsUpdate(me.username);
    sendFriendsUpdate(req.from_username);
    socket.emit('friend_request_status', { message: action === 'accept' ? 'Arkadaslik kabul edildi' : 'Istek silindi.' });
  });

  socket.on('unfriend', ({ targetUsername, token }) => {
    const me = db.getUserByToken(token);
    if (!me) return;
    db.removeFriendship(me.username, targetUsername);
    sendFriendsUpdate(me.username);
    sendFriendsUpdate(targetUsername);
    socket.emit('friend_request_status', { message: 'Arkadaslik silindi.' });
  });
};
