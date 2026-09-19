// backend/src/sockets/auth.socket.js - Kimlik doğrulama, profil ve 2FA socket olayları
const crypto = require('crypto');
const logger = require('../../utils/logger');
const db = require('../../utils/database');
const { EFFECTIVE_ADMIN_PASS } = require('../config');
const { sanitize, isValidEmail, isValidUsername } = require('../utils/helpers');
const {
  adminSocketIds,
  startAdminUpdates,
  broadcastAdminDashboard,
  broadcastAdminActivity,
  setOnline,
  broadcastOnlineStatus,
  publicUser
} = require('../services/state');

module.exports = function registerAuthSocket(io, socket, { checkRate }) {
  // ── ADMIN REAL-TIME DASHBOARD ──
  socket.on('admin_connect', ({ pass } = {}) => {
    if (pass !== EFFECTIVE_ADMIN_PASS) return;
    adminSocketIds.add(socket.id);
    startAdminUpdates();
    try { broadcastAdminDashboard(); } catch (e) {}
    try { broadcastAdminActivity('admin_login', { message: 'Admin panele bağlandı' }); } catch (e) {}
  });

  socket.on('admin_disconnect', () => {
    adminSocketIds.delete(socket.id);
  });

  // ── KAYIT OL ──
  socket.on('auth_register', ({ username, email, password, bio, avatar } = {}) => {
    if (checkRate('auth', 5)) return socket.emit('auth_result', { ok: false, message: 'Çok fazla deneme. Biraz bekle.' });
    const cleanUsername = sanitize(username, 20).toLowerCase();
    const cleanEmail = sanitize(email, 100).toLowerCase();
    if (!cleanUsername || !cleanEmail || !password) return socket.emit('auth_result', { ok: false, message: 'Kullanici adi, e-posta ve sifre gerekli.' });
    if (!isValidUsername(cleanUsername)) return socket.emit('auth_result', { ok: false, message: 'Kullanici adi 3-20 karakter olmali; sadece harf, sayi ve _ kullan.' });
    if (!isValidEmail(cleanEmail)) return socket.emit('auth_result', { ok: false, message: 'Gecerli bir e-posta gir.' });
    if (typeof password !== 'string' || password.length < 6) return socket.emit('auth_result', { ok: false, message: 'Sifre en az 6 karakter olmali.' });
    if (password.length > 128) return socket.emit('auth_result', { ok: false, message: 'Sifre cok uzun.' });
    if (db.getUser(cleanUsername)) return socket.emit('auth_result', { ok: false, message: 'Bu kullanici adi zaten alinmis.' });
    if (db.getUserByEmail(cleanEmail)) return socket.emit('auth_result', { ok: false, message: 'Bu e-posta zaten kayitli.' });

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    try {
      db.createUser(cleanUsername, cleanEmail, `${salt}:${hash}`, sanitize(avatar, 10) || '🐱', sanitize(bio, 120));
    } catch (e) {
      logger.error(`[KAYIT] DB hatasi: ${cleanUsername} - ${e.message}`);
      return socket.emit('auth_result', { ok: false, message: 'Bu kullanici adi veya e-posta zaten kayitli.' });
    }
    const token = db.createToken(cleanUsername);
    socket.socialUsername = cleanUsername;
    setOnline(cleanUsername, socket.id);
    const clientIp = socket.handshake?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || socket.handshake?.address || 'bilinmiyor';
    const userAgent = socket.handshake?.headers?.['user-agent'] || 'bilinmiyor';
    const timestamp = new Date().toISOString();
    logger.info(`[KAYIT] ${cleanUsername} | IP: ${clientIp} | Tarayıcı: ${userAgent} | Zaman: ${timestamp}`);
    db.addConnectionLog(cleanUsername, socket.id, clientIp, '', 'register', userAgent);
    socket.emit('auth_result', { ok: true, user: publicUser(db.getUser(cleanUsername)), token });
    try { broadcastAdminActivity('user_register', { username: cleanUsername, message: `${cleanUsername} kayıt oldu`, ip: clientIp, time: timestamp }); } catch (e) {}
    try { broadcastAdminDashboard(); } catch (e) {}
  });

  // ── GİRİŞ YAP ──
  socket.on('auth_login', ({ email, password } = {}) => {
    if (checkRate('auth', 5)) return socket.emit('auth_result', { ok: false, message: 'Çok fazla deneme. Biraz bekle.' });
    const cleanEmail = sanitize(email, 100).toLowerCase();
    const user = db.getUserByEmail(cleanEmail);
    if (!user) return socket.emit('auth_result', { ok: false, message: 'E-posta veya sifre hatali.' });
    try {
      const [salt, storedHash] = user.passwordHash.split(':');
      const check = crypto.scryptSync(password || '', salt, 64).toString('hex');
      if (!crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(check, 'hex'))) {
        return socket.emit('auth_result', { ok: false, message: 'E-posta veya sifre hatali.' });
      }
    } catch { return socket.emit('auth_result', { ok: false, message: 'E-posta veya sifre hatali.' }); }

    const token = db.createToken(user.username);
    socket.socialUsername = user.username;
    setOnline(user.username, socket.id);
    broadcastOnlineStatus(user.username);
    const clientIp = socket.handshake?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || socket.handshake?.address || 'bilinmiyor';
    const userAgent = socket.handshake?.headers?.['user-agent'] || 'bilinmiyor';
    const timestamp = new Date().toISOString();
    logger.info(`[GIRIS] ${user.username} | IP: ${clientIp} | Tarayıcı: ${userAgent} | Zaman: ${timestamp}`);
    db.addConnectionLog(user.username, socket.id, clientIp, '', 'login', userAgent);
    socket.emit('auth_result', { ok: true, user: publicUser(user), token });
    try { broadcastAdminActivity('user_login', { username: user.username, message: `${user.username} giriş yaptı`, ip: clientIp, time: timestamp }); } catch (e) {}
    try { broadcastAdminDashboard(); } catch (e) {}
    socket.emit('friends_update', {
      friends: db.getFriends(user.username).map(publicUser).filter(Boolean),
      requests: db.getPendingFriendRequests(user.username)
    });
  });

  // ── ŞİFREMİ UNUTTUM ──
  socket.on('auth_forgot_password', ({ email }) => {
    if (checkRate('auth', 5)) return socket.emit('forgot_result', { ok: false, message: 'Çok fazla deneme. Biraz bekle.' });
    const cleanEmail = sanitize(email, 100).toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return socket.emit('forgot_result', { ok: false, message: 'Geçerli bir e-posta girin.' });
    const user = db.getUserByEmail(cleanEmail);
    if (!user) return socket.emit('forgot_result', { ok: true, message: 'E-posta bulunamadı, ama endişelenme!' });
    const resetToken = crypto.randomBytes(16).toString('hex');
    const expiry = Date.now() + 3600000;
    db.updateUser(user.username, { reset_token: resetToken, reset_expiry: expiry });
    logger.info?.(`[SIFRE SIFIRLAMA] ${cleanEmail} | IP: ${socket.handshake?.address || 'bilinmiyor'}`);
    socket.emit('forgot_result', { ok: true, message: 'Şifre sıfırlama kodu e-postana gönderildi.' });
  });

  // ── ŞİFRE SIFIRLA ──
  socket.on('auth_reset_password', ({ resetToken, newPassword }) => {
    const cleanToken = sanitize(resetToken, 64);
    const cleanPass = newPassword;
    if (!cleanToken || !cleanPass || cleanPass.length < 6) return socket.emit('reset_result', { ok: false, message: 'Token ve en az 6 karakterlik şifre gerekli.' });
    const user = db.getUserByResetToken(cleanToken);
    if (!user) return socket.emit('reset_result', { ok: false, message: 'Token geçersiz veya süresi dolmuş.' });
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(cleanPass, salt, 64).toString('hex');
    db.updateUser(user.username, { password_hash: `${salt}:${hash}`, reset_token: '', reset_expiry: 0 });
    logger.info?.(`Şifre sıfırlandı: ${user.username}`);
    socket.emit('reset_result', { ok: true, message: 'Şifren başarıyla sıfırlandı! Giriş yapabilirsin.' });
  });

  // ── HESAP SİLME ──
  socket.on('delete_account', ({ token, password }) => {
    const user = db.getUserByToken(token);
    if (!user) return socket.emit('delete_account_result', { ok: false, message: 'Kullanıcı bulunamadı.' });
    try {
      const [salt, hash] = user.passwordHash.split(':');
      const check = crypto.scryptSync(password || '', salt, 64).toString('hex');
      if (!crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'))) {
        return socket.emit('delete_account_result', { ok: false, message: 'Şifre hatalı.' });
      }
      const username = user.username;
      db.getDb().prepare('DELETE FROM tokens WHERE username = ?').run(username);
      db.getDb().prepare('DELETE FROM friendships WHERE user1 = ? OR user2 = ?').run(username, username);
      db.getDb().prepare('DELETE FROM friend_requests WHERE from_username = ? OR to_username = ?').run(username, username);
      db.getDb().prepare('DELETE FROM dm_messages WHERE from_username = ? OR to_username = ?').run(username, username);
      db.getDb().prepare('DELETE FROM notifications WHERE username = ?').run(username);
      db.getDb().prepare('DELETE FROM user_reports WHERE reporter = ? OR reported = ?').run(username, username);
      db.getDb().prepare('DELETE FROM follows WHERE follower = ? OR following = ?').run(username, username);
      db.getDb().prepare('DELETE FROM user_roles WHERE username = ?').run(username);
      db.getDb().prepare('DELETE FROM blocked_users WHERE blocker = ? OR blocked = ?').run(username, username);
      db.getDb().prepare('DELETE FROM message_reactions WHERE username = ?').run(username);
      db.getDb().prepare('DELETE FROM feed_items WHERE username = ?').run(username);
      db.getDb().prepare('DELETE FROM push_subscriptions WHERE username = ?').run(username);
      db.getDb().prepare('DELETE FROM users WHERE username = ?').run(username);
      logger.info(`[HESAP SILINDI] ${username}`);
      socket.emit('delete_account_result', { ok: true, message: 'Hesabın başarıyla silindi.' });
    } catch (e) {
      logger.error?.('Hesap silme hatası: ' + e.message);
      socket.emit('delete_account_result', { ok: false, message: 'Bir hata oluştu.' });
    }
  });

  // ── SOSYAL SENKRON ──
  socket.on('social_sync', ({ token } = {}) => {
    const user = db.getUserByToken(token);
    if (!user) {
      socket.emit('social_profile', null);
      return;
    }
    socket.socialUsername = user.username;
    setOnline(user.username, socket.id);
    broadcastOnlineStatus(user.username);
    socket.emit('social_profile', publicUser(user));
    socket.emit('friends_update', {
      friends: db.getFriends(user.username).map(publicUser).filter(Boolean),
      requests: db.getPendingFriendRequests(user.username)
    });
  });

  // ── PROFİL GÜNCELLE ──
  socket.on('update_profile', ({ token, bio, status, avatar, username }) => {
    const user = db.getUserByToken(token);
    if (!user) return;
    const updates = { bio: sanitize(bio, 150), status: sanitize(status, 80), avatar: sanitize(avatar, 10) || user.avatar || '🐱' };
    if (username && username !== user.username) {
      const cleanName = sanitize(username, 20).toLowerCase();
      if (/^[a-z0-9_]{3,20}$/.test(cleanName) && !db.getUser(cleanName)) {
        updates.username = cleanName;
      }
    }
    const oldName = user.username;
    db.updateUser(oldName, updates);
    if (updates.username && updates.username !== oldName) {
      try { db.getDb().prepare('UPDATE tokens SET username = ? WHERE username = ?').run(updates.username, oldName); } catch (e) {}
    }
    const updated = db.getUser(updates.username || user.username);
    socket.emit('social_profile', publicUser(updated));
  });

  // ── ŞİFRE DEĞİŞTİR ──
  socket.on('change_password', ({ token, currentPassword, newPassword }) => {
    const user = db.getUserByToken(token);
    if (!user) return socket.emit('change_password_result', { success: false, message: 'Kullanıcı bulunamadı.' });
    const [salt, hash] = user.passwordHash.split(':');
    const newHash = crypto.scryptSync(currentPassword, salt, 64).toString('hex');
    const match = crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(newHash, 'hex'));
    if (!match) return socket.emit('change_password_result', { success: false, message: 'Mevcut şifre hatalı.' });
    if (!newPassword || newPassword.length < 6) return socket.emit('change_password_result', { success: false, message: 'Yeni şifre en az 6 karakter olmalı.' });
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHashFull = crypto.scryptSync(newPassword, newSalt, 64).toString('hex');
    db.updateUser(user.username, { password_hash: `${newSalt}:${newHashFull}` });
    socket.emit('change_password_result', { success: true, message: 'Şifre başarıyla değiştirildi.' });
  });

  // ── EMAIL DOGRULAMA (stub) ──
  socket.on('send_verification_email', () => {
    socket.emit('verify_result', { success: true, message: 'Email doğrulama şu an pasif.' });
  });

  socket.on('verify_email_code', () => {
    socket.emit('verify_result', { success: true, message: 'Email doğrulama şu an pasif.' });
  });

  // ── IKI FAKTORLU DOGRULAMA (stub) ──
  socket.on('setup_2fa', () => {
    socket.emit('two_factor_setup', { success: false, message: '2FA şu an kullanılamıyor.' });
  });

  socket.on('verify_2fa_setup', () => {
    socket.emit('two_factor_result', { success: false, message: '2FA şu an kullanılamıyor.' });
  });

  socket.on('disable_2fa', () => {
    socket.emit('two_factor_result', { success: false, message: '2FA şu an kullanılamıyor.' });
  });

  socket.on('get_2fa_status', () => {
    socket.emit('two_factor_status', { enabled: false });
  });
};
