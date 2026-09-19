// backend/src/routes/admin.routes.js - Yönetici paneli REST API rotaları
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const logger = require('../../utils/logger');
const db = require('../../utils/database');
const { adminAuth } = require('../middlewares/auth.middleware');
const { sanitize, getVipLevel } = require('../utils/helpers');
const {
  rooms,
  tombalaGames,
  onlineUsers,
  getIo,
  broadcastRooms,
  broadcastAdminActivity
} = require('../services/state');

let nodemailer = null;
try { nodemailer = require('nodemailer'); } catch { nodemailer = null; }

let bcrypt = null;
try { bcrypt = require('bcryptjs'); } catch { bcrypt = null; }

let maintenanceMode = false;

// Admin Stats
router.get('/api/admin/stats', adminAuth, (req, res) => {
  const roomList = Object.entries(rooms).map(([id, r]) => ({
    id,
    name: r.name,
    userCount: r.users.length,
    maxUsers: r.maxUsers,
    hasPassword: !!r.password,
    isVip: !!r.isVip,
    users: r.users.map(u => ({ username: u.username, userId: u.userId, avatar: u.avatar })),
    currentMedia: r.currentMedia,
    createdAt: r.createdAt,
    lastActivityAt: r.lastActivityAt
  }));
  const totalUsers = Object.keys(onlineUsers).length;
  const logStats = db.getLogStats();
  res.json({
    ok: true,
    rooms: roomList,
    totalRooms: roomList.length,
    totalOnlineUsers: totalUsers,
    onlineUsers: Object.entries(onlineUsers).map(([name, data]) => ({
      username: name,
      socketCount: data.socketIds.size,
      lastSeen: data.lastSeen
    })),
    logStats
  });
});

// Admin Rooms
router.get('/api/admin/rooms', adminAuth, (req, res) => {
  const roomList = Object.entries(rooms).map(([id, r]) => ({
    id,
    name: r.name,
    userCount: r.users.length,
    maxUsers: r.maxUsers,
    hasPassword: !!r.password,
    isVip: !!r.isVip,
    hostUserId: r.hostUserId,
    users: r.users.map(u => ({ username: u.username, userId: u.userId, avatar: u.avatar, socketId: u.socketId })),
    currentMedia: r.currentMedia,
    createdAt: r.createdAt
  }));
  res.json({ ok: true, rooms: roomList });
});

// Admin Delete Room
router.delete('/api/admin/rooms/:roomId', adminAuth, (req, res) => {
  const io = getIo();
  const roomId = sanitize(req.params.roomId, 50);
  const room = rooms[roomId];
  if (!room) return res.status(404).json({ ok: false, message: 'Oda bulunamadi' });

  if (io) {
    io.to(roomId).emit('room_action', { type: 'ROOM_CLOSED', payload: { message: 'Oda yönetici tarafından kapatıldı.' } });
    io.to(roomId).emit('kicked_from_room', 'Oda kapatıldı.');
    for (const u of room.users) {
      io.sockets.sockets.get(u.socketId)?.leave(roomId);
    }
  }

  delete rooms[roomId];
  delete tombalaGames[roomId];
  try { db.deleteRoom(roomId); } catch (e) {}

  broadcastRooms();
  try { broadcastAdminActivity('room_close', { roomId, message: `Oda kapatıldı: ${roomId}` }); } catch (e) {}
  logger.info(`[ADMIN] Oda kapatildi: ${roomId}`);
  res.json({ ok: true, message: 'Oda kapatildi' });
});

// Admin Connection Logs
router.get('/api/admin/logs', adminAuth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 200, 1000);
  const roomId = req.query.room || null;
  const logs = db.getConnectionLogs(limit, roomId);
  res.json({ ok: true, logs });
});

// Admin Online Users
router.get('/api/admin/online', adminAuth, (req, res) => {
  const io = getIo();
  const activeOnline = [];
  if (io) {
    for (const [socketId, s] of io.sockets.sockets) {
      if (s.currentRoom) {
        const room = rooms[s.currentRoom];
        const userInRoom = room?.users.find(u => u.socketId === socketId);
        activeOnline.push({
          socketId,
          userId: s.userId || '-',
          username: s.socialUsername || s.userId || 'Misafir',
          ip: s.handshake?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || s.handshake?.address || '-',
          room: s.currentRoom,
          roomName: room?.name || s.currentRoom,
          avatar: userInRoom?.avatar || null,
          isGuest: !s.socialUsername
        });
      }
    }
  }
  res.json({ ok: true, users: activeOnline, count: activeOnline.length });
});

// Admin Users List
router.get('/api/admin/users', adminAuth, (req, res) => {
  const users = db.getAllUsers().map(u => ({
    username: u.username,
    email: u.email,
    avatar: u.avatar,
    isVip: u.isVip,
    vipExpiry: u.vipExpiry,
    vipPlan: u.vipPlan,
    createdAt: u.createdAt,
    lastSeen: u.lastSeen
  }));
  res.json({ ok: true, users });
});

// Admin Search Users
router.get('/api/admin/users/search', adminAuth, (req, res) => {
  const q = sanitize(req.query.q || '', 50).toLowerCase();
  const users = db.getAllUsers()
    .filter(u => u.username.toLowerCase().includes(q) || (u.email && u.email.toLowerCase().includes(q)))
    .map(u => ({
      username: u.username,
      email: u.email,
      avatar: u.avatar,
      isVip: u.isVip,
      vipExpiry: u.vipExpiry,
      vipPlan: u.vipPlan,
      role: u.role || 'user',
      isBanned: u.isBanned || false,
      createdAt: u.createdAt,
      lastSeen: u.lastSeen
    }));
  res.json({ ok: true, users });
});

// Admin Set VIP
router.post('/api/admin/users/vip', adminAuth, (req, res) => {
  const { username, isVip, vipPlan, vipDays } = req.body;
  const uname = sanitize(username, 30);
  if (!uname) return res.status(400).json({ ok: false, message: 'Gecersiz kullanici' });
  const expiry = isVip ? Date.now() + (parseInt(vipDays) || 30) * 86400000 : null;
  db.updateUser(uname, {
    is_vip: !!isVip,
    vip_plan: isVip ? (vipPlan || 'yearly') : null,
    vip_expiry: expiry,
    vip_level: isVip ? getVipLevel(Date.now()) : 0
  });
  logger.info(`[ADMIN] VIP degistirildi: ${uname} -> ${isVip}`);
  res.json({ ok: true });
});

// Admin Ban/Unban
router.post('/api/admin/users/ban', adminAuth, (req, res) => {
  const { username, isBanned } = req.body;
  const uname = sanitize(username, 30);
  if (!uname) return res.status(400).json({ ok: false, message: 'Gecersiz kullanici' });
  db.updateUser(uname, { is_banned: !!isBanned });
  logger.info(`[ADMIN] Ban degistirildi: ${uname} -> ${isBanned}`);
  res.json({ ok: true });
});

// Admin Delete User
router.delete('/api/admin/users/:username', adminAuth, (req, res) => {
  const uname = sanitize(req.params.username, 30);
  if (!uname) return res.status(400).json({ ok: false, message: 'Gecersiz kullanici' });
  try {
    db.getDb().prepare('DELETE FROM users WHERE username = ?').run(uname);
    logger.info(`[ADMIN] Kullanici silindi: ${uname}`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// Admin System Health
router.get('/api/admin/system', adminAuth, (req, res) => {
  const io = getIo();
  const uptime = process.uptime();
  const mem = process.memoryUsage();
  res.json({
    ok: true,
    uptime: Math.floor(uptime),
    memory: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024)
    },
    nodeVersion: process.version,
    platform: process.platform,
    pid: process.pid,
    activeRooms: Object.keys(rooms).length,
    totalSockets: io && io.engine ? io.engine.clientsCount : 0
  });
});

// Admin Get Reports
router.get('/api/admin/reports', adminAuth, (req, res) => {
  try {
    const reports = db.getDb().prepare('SELECT * FROM user_reports ORDER BY created_at DESC LIMIT 100').all();
    res.json({ ok: true, reports });
  } catch (e) {
    res.json({ ok: true, reports: [] });
  }
});

// Admin Broadcast Message
router.post('/api/admin/broadcast', adminAuth, (req, res) => {
  const io = getIo();
  const { message } = req.body;
  const msg = sanitize(message, 500);
  if (!msg) return res.status(400).json({ ok: false, message: 'Mesaj bos olamaz' });

  if (io) {
    io.emit('global_chat_message', {
      id: 'admin_' + Date.now(),
      sender: 'Admin',
      senderId: 'admin',
      avatar: '🛡️',
      text: msg,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      isAdmin: true
    });
  }
  logger.info(`[ADMIN] Broadcast: ${msg}`);
  res.json({ ok: true });
});

// Admin Maintenance
router.post('/api/admin/maintenance', adminAuth, (req, res) => {
  const io = getIo();
  maintenanceMode = !!req.body.enabled;
  if (io) io.emit('system_maintenance', { enabled: maintenanceMode });
  res.json({ ok: true, maintenanceMode });
});

router.get('/api/admin/maintenance', adminAuth, (req, res) => {
  res.json({ ok: true, maintenanceMode });
});

// Admin Feedback Listesi
router.get('/api/admin/feedback', adminAuth, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status || '';
    let rows;
    if (status) {
      rows = db.getDb().prepare('SELECT * FROM feedback WHERE status = ? ORDER BY created_at DESC LIMIT ?').all(status, limit);
    } else {
      rows = db.getDb().prepare('SELECT * FROM feedback ORDER BY created_at DESC LIMIT ?').all(limit);
    }
    res.json({ ok: true, feedback: rows });
  } catch (e) {
    res.json({ ok: true, feedback: [] });
  }
});

// Admin Feedback Durumu Güncelle
router.post('/api/admin/feedback/:id', adminAuth, (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['open', 'in_progress', 'resolved', 'dismissed'];
    if (!valid.includes(status)) return res.status(400).json({ ok: false });
    db.getDb().prepare('UPDATE feedback SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

// Admin Kullanıcı Detayı
router.get('/api/admin/users/:username/detail', adminAuth, (req, res) => {
  try {
    const uname = sanitize(req.params.username, 30);
    const user = db.getUser(uname);
    if (!user) return res.status(404).json({ ok: false, message: 'Kullanıcı bulunamadı' });

    const friendCount = db.getDb().prepare('SELECT COUNT(*) as c FROM friendships WHERE user1 = ? OR user2 = ?').get(uname, uname)?.c || 0;
    const messageCount = db.getDb().prepare('SELECT COUNT(*) as c FROM dm_messages WHERE from_username = ? OR to_username = ?').get(uname, uname)?.c || 0;
    const roomCount = db.getDb().prepare('SELECT COUNT(*) as c FROM rooms WHERE host_user_id = ?').get(uname)?.c || 0;
    const logCount = db.getDb().prepare('SELECT COUNT(*) as c FROM connection_logs WHERE username = ?').get(uname)?.c || 0;
    const lastLogs = db.getDb().prepare('SELECT * FROM connection_logs WHERE username = ? ORDER BY created_at DESC LIMIT 10').all(uname);
    const reportCount = db.getDb().prepare('SELECT COUNT(*) as c FROM user_reports WHERE reporter = ? OR reported = ?').get(uname, uname)?.c || 0;
    const followCount = db.getDb().prepare('SELECT COUNT(*) as c FROM follows WHERE follower = ?').get(uname)?.c || 0;
    const followerCount = db.getDb().prepare('SELECT COUNT(*) as c FROM follows WHERE following = ?').get(uname)?.c || 0;

    res.json({
      ok: true,
      user: {
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        status: user.status,
        isVip: user.isVip,
        vipExpiry: user.vipExpiry,
        vipPlan: user.vipPlan,
        vipLevel: user.vipLevel,
        role: user.role,
        frozen: user.frozen,
        created_at: user.createdAt,
        last_seen: user.lastSeen
      },
      stats: { friendCount, messageCount, roomCount, logCount, reportCount, followCount, followerCount },
      recentLogs: lastLogs.map(l => ({ ip: l.ip, room_id: l.room_id, action: l.action, created_at: l.created_at }))
    });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

// Admin Şifre Sıfırla
router.post('/api/admin/users/reset-password', adminAuth, async (req, res) => {
  try {
    const { username } = req.body;
    const uname = sanitize(username, 30);
    const user = db.getUser(uname);
    if (!user) return res.status(404).json({ ok: false, message: 'Kullanıcı bulunamadı' });
    const newPass = crypto.randomBytes(8).toString('hex');
    let hash = newPass;
    if (bcrypt) {
      hash = await bcrypt.hash(newPass, 10);
    }
    db.updateUser(uname, { password_hash: hash });
    res.json({ ok: true, newPassword: newPass });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

// Admin E-posta Değiştir
router.post('/api/admin/users/change-email', adminAuth, (req, res) => {
  try {
    const { username, newEmail } = req.body;
    const uname = sanitize(username, 30);
    const email = sanitize(newEmail, 100);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ ok: false, message: 'Geçersiz e-posta' });
    const existing = db.getUserByEmail(email);
    if (existing && existing.username !== uname) return res.status(400).json({ ok: false, message: 'Bu e-posta zaten kayıtlı' });
    db.updateUser(uname, { email });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

// Admin Hesap Dondur
router.post('/api/admin/users/freeze', adminAuth, (req, res) => {
  try {
    const { username, frozen } = req.body;
    const uname = sanitize(username, 30);
    db.updateUser(uname, { frozen: frozen ? 1 : 0 });
    logger.info(`[ADMIN] Hesap donduruldu: ${uname} -> ${frozen}`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

// Admin Analytics
router.get('/api/admin/analytics', adminAuth, (req, res) => {
  try {
    const now = Date.now();
    const day = 86400000;
    const usersToday = db.getDb().prepare('SELECT COUNT(*) as c FROM users WHERE created_at > ?').get(now - day)?.c || 0;
    const usersWeek = db.getDb().prepare('SELECT COUNT(*) as c FROM users WHERE created_at > ?').get(now - 7 * day)?.c || 0;
    const usersMonth = db.getDb().prepare('SELECT COUNT(*) as c FROM users WHERE created_at > ?').get(now - 30 * day)?.c || 0;
    const activeToday = db.getDb().prepare('SELECT COUNT(DISTINCT username) as c FROM connection_logs WHERE created_at > ?').get(now - day)?.c || 0;
    const activeWeek = db.getDb().prepare('SELECT COUNT(DISTINCT username) as c FROM connection_logs WHERE created_at > ?').get(now - 7 * day)?.c || 0;
    const roomsCreatedToday = db.getDb().prepare('SELECT COUNT(*) as c FROM rooms WHERE created_at > ?').get(now - day)?.c || 0;
    const roomsCreatedWeek = db.getDb().prepare('SELECT COUNT(*) as c FROM rooms WHERE created_at > ?').get(now - 7 * day)?.c || 0;
    const messagesToday = db.getDb().prepare('SELECT COUNT(*) as c FROM dm_messages WHERE created_at > ?').get(now - day)?.c || 0;
    const messagesWeek = db.getDb().prepare('SELECT COUNT(*) as c FROM dm_messages WHERE created_at > ?').get(now - 7 * day)?.c || 0;
    const topRooms = db.getDb().prepare('SELECT room_id, COUNT(*) as visits FROM connection_logs WHERE created_at > ? GROUP BY room_id ORDER BY visits DESC LIMIT 10').all(now - day);
    const dailySignups = db.getDb().prepare("SELECT date(created_at/1000, 'unixepoch') as day, COUNT(*) as count FROM users WHERE created_at > ? GROUP BY day ORDER BY day DESC LIMIT 30").all(now - 30 * day);

    res.json({
      ok: true,
      analytics: {
        users: { today: usersToday, week: usersWeek, month: usersMonth },
        active: { today: activeToday, week: activeWeek },
        rooms: { today: roomsCreatedToday, week: roomsCreatedWeek },
        messages: { today: messagesToday, week: messagesWeek },
        topRooms,
        dailySignups
      }
    });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

// Admin Clear Global Chat
router.delete('/api/admin/clear-global-chat', adminAuth, (req, res) => {
  const io = getIo();
  try {
    db.clearGlobalMessages();
    logger.info('[ADMIN] Canlı sohbet mesajları temizlendi');
    if (io) io.emit('global_chat_cleared', { by: 'admin' });
    res.json({ ok: true, message: 'Canlı sohbet temizlendi' });
  } catch (err) {
    logger.error('[ADMIN] Canlı sohbet temizleme hatası:', err.message);
    res.status(500).json({ ok: false, message: 'Temizleme hatası' });
  }
});

// Admin Bulk Message
router.post('/api/admin/bulk-message', adminAuth, (req, res) => {
  try {
    const { target, message, type } = req.body;
    const msg = sanitize(message, 1000);
    if (!msg) return res.status(400).json({ ok: false, message: 'Mesaj boş olamaz' });

    if (type === 'all') {
      const users = db.getDb().prepare('SELECT username FROM users').all();
      let count = 0;
      for (const u of users) {
        try {
          db.createNotification(u.username, 'admin_broadcast', 'admin', 'Admin Duyurusu', msg, {});
          count++;
        } catch {}
      }
      logger.info(`[ADMIN] Toplu mesaj gönderildi: ${count} kullanıcıya`);
      res.json({ ok: true, sentCount: count });
    } else if (type === 'vip') {
      const users = db.getDb().prepare('SELECT username FROM users WHERE is_vip = 1').all();
      let count = 0;
      for (const u of users) {
        try {
          db.createNotification(u.username, 'admin_broadcast', 'admin', 'VIP Duyurusu', msg, {});
          count++;
        } catch {}
      }
      res.json({ ok: true, sentCount: count });
    } else if (type === 'single' && target) {
      const uname = sanitize(target, 30);
      db.createNotification(uname, 'admin_broadcast', 'admin', 'Admin Mesajı', msg, {});
      res.json({ ok: true, sentCount: 1 });
    } else {
      res.status(400).json({ ok: false, message: 'Geçersiz hedef' });
    }
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

// Admin Send Email
router.post('/api/admin/send-email', adminAuth, async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    if (!nodemailer) return res.status(500).json({ ok: false, message: 'E-posta servisi mevcut değil' });
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    if (to === 'all') {
      const users = db.getDb().prepare('SELECT email FROM users WHERE email IS NOT NULL AND email != ""').all();
      const emails = users.map(u => u.email);
      if (emails.length === 0) return res.json({ ok: true, sentCount: 0 });
      await transporter.sendMail({
        from: process.env.SMTP_USER || 'noreply@couplemeeting.com.tr',
        to: emails.join(','),
        subject: sanitize(subject, 200),
        html: sanitize(body, 5000)
      });
      res.json({ ok: true, sentCount: emails.length });
    } else {
      await transporter.sendMail({
        from: process.env.SMTP_USER || 'noreply@couplemeeting.com.tr',
        to: sanitize(to, 100),
        subject: sanitize(subject, 200),
        html: sanitize(body, 5000)
      });
      res.json({ ok: true, sentCount: 1 });
    }
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

module.exports = router;
