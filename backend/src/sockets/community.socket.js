module.exports = function registerCommunityHandlers(io, socket, db, sanitize, emitToUser, crypto) {

  // ═══════════════════════════════════════════════════════════
  // TOPLULUK (COMMUNITY) HANDLER'LARI
  // ═══════════════════════════════════════════════════════════

  function getDb() { return db.getDb(); }

  function requireAuth(token) {
    if (!token) return null;
    return db.getUserByToken(token);
  }

  // ── TOPLULUK OLUŞTUR ──
  socket.on('community_create', ({ name, description, icon, token }) => {
    const user = requireAuth(token);
    if (!user) return socket.emit('community_result', { ok: false, message: 'Giriş yapmalısın.' });

    const cleanName = sanitize(name, 50).trim();
    const cleanDesc = sanitize(description, 300).trim();
    const cleanIcon = sanitize(icon, 10) || '👥';

    if (!cleanName) return socket.emit('community_result', { ok: false, message: 'Topluluk adı gerekli.' });
    if (cleanName.length < 2) return socket.emit('community_result', { ok: false, message: 'Topluluk adı en az 2 karakter olmalı.' });

    const id = crypto.randomUUID();
    const now = Date.now();

    if (getDb()) {
      const existing = getDb().prepare('SELECT id FROM communities WHERE LOWER(name) = LOWER(?)').get(cleanName);
      if (existing) return socket.emit('community_result', { ok: false, message: 'Bu isimde bir topluluk zaten var.' });

      getDb().prepare('INSERT INTO communities (id, name, description, icon, created_by, member_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, cleanName, cleanDesc, cleanIcon, user.username, 1, now);
      getDb().prepare('INSERT INTO community_members (community_id, username, role, joined_at) VALUES (?, ?, ?, ?)').run(id, user.username, 'admin', now);
    } else {
      return socket.emit('community_result', { ok: false, message: 'Veritabanı mevcut değil.' });
    }

    const community = getDb().prepare('SELECT * FROM communities WHERE id = ?').get(id);
    socket.emit('community_result', { ok: true, community });
    socket.broadcast.emit('community_created', { id, name: cleanName, icon: cleanIcon, memberCount: 1 });
  });

  // ── TOPLULUĞA KATIL ──
  socket.on('community_join', ({ communityId, token }) => {
    const user = requireAuth(token);
    if (!user) return socket.emit('community_result', { ok: false, message: 'Giriş yapmalısın.' });

    const cleanId = sanitize(communityId, 64);
    if (!cleanId || !getDb()) return socket.emit('community_result', { ok: false, message: 'Geçersiz istek.' });

    const community = getDb().prepare('SELECT * FROM communities WHERE id = ?').get(cleanId);
    if (!community) return socket.emit('community_result', { ok: false, message: 'Topluluk bulunamadı.' });

    const isMember = getDb().prepare('SELECT 1 FROM community_members WHERE community_id = ? AND username = ?').get(cleanId, user.username);
    if (isMember) return socket.emit('community_result', { ok: false, message: 'Zaten üyesin.' });

    getDb().prepare('INSERT INTO community_members (community_id, username, role, joined_at) VALUES (?, ?, ?, ?)').run(cleanId, user.username, 'member', Date.now());
    getDb().prepare('UPDATE communities SET member_count = member_count + 1 WHERE id = ?').run(cleanId);

    const updated = getDb().prepare('SELECT * FROM communities WHERE id = ?').get(cleanId);
    socket.emit('community_result', { ok: true, message: 'Topluluğa katıldın.', community: updated });
    io.emit('community_updated', { id: cleanId, memberCount: updated.member_count });
  });

  // ── TOPLULUKTAN AYRIL ──
  socket.on('community_leave', ({ communityId, token }) => {
    const user = requireAuth(token);
    if (!user) return socket.emit('community_result', { ok: false, message: 'Giriş yapmalısın.' });

    const cleanId = sanitize(communityId, 64);
    if (!cleanId || !getDb()) return socket.emit('community_result', { ok: false, message: 'Geçersiz istek.' });

    const community = getDb().prepare('SELECT * FROM communities WHERE id = ?').get(cleanId);
    if (!community) return socket.emit('community_result', { ok: false, message: 'Topluluk bulunamadı.' });

    if (community.created_by === user.username) return socket.emit('community_result', { ok: false, message: 'Kurucu ayrılamaz. Topluluğu sil.' });

    const membership = getDb().prepare('SELECT 1 FROM community_members WHERE community_id = ? AND username = ?').get(cleanId, user.username);
    if (!membership) return socket.emit('community_result', { ok: false, message: 'Bu topluluğun üyesi değilsin.' });

    getDb().prepare('DELETE FROM community_members WHERE community_id = ? AND username = ?').run(cleanId, user.username);
    getDb().prepare('UPDATE communities SET member_count = MAX(member_count - 1, 0) WHERE id = ?').run(cleanId);

    const updated = getDb().prepare('SELECT * FROM communities WHERE id = ?').get(cleanId);
    socket.emit('community_result', { ok: true, message: 'Topluluktan ayrıldın.', community: updated });
    io.emit('community_updated', { id: cleanId, memberCount: updated.member_count });
  });

  // ── TOPLULUK LİSTESİ ──
  socket.on('community_list', ({ token }) => {
    const user = requireAuth(token);
    if (!user) return socket.emit('community_result', { ok: false, message: 'Giriş yapmalısın.' });

    if (!getDb()) return socket.emit('community_list_result', { ok: false, communities: [] });

    const communities = getDb().prepare('SELECT * FROM communities ORDER BY member_count DESC, created_at DESC').all();
    socket.emit('community_list_result', { ok: true, communities });
  });

  // ── TOPLULUK BİLGİSİ ──
  socket.on('community_info', ({ communityId, token }) => {
    const user = requireAuth(token);
    if (!user) return socket.emit('community_result', { ok: false, message: 'Giriş yapmalısın.' });

    const cleanId = sanitize(communityId, 64);
    if (!cleanId || !getDb()) return socket.emit('community_result', { ok: false, message: 'Geçersiz istek.' });

    const community = getDb().prepare('SELECT * FROM communities WHERE id = ?').get(cleanId);
    if (!community) return socket.emit('community_result', { ok: false, message: 'Topluluk bulunamadı.' });

    const members = getDb().prepare('SELECT cm.*, u.avatar FROM community_members cm LEFT JOIN users u ON cm.username = u.username WHERE cm.community_id = ? ORDER BY cm.role = ? DESC, cm.joined_at ASC').all(cleanId, 'admin');
    const membership = getDb().prepare('SELECT role FROM community_members WHERE community_id = ? AND username = ?').get(cleanId, user.username);

    socket.emit('community_info_result', {
      ok: true,
      community,
      members,
      myRole: membership?.role || null,
      isMember: !!membership
    });
  });

  // ── TOPLULUKTA GÖNDERİ PAYLAŞ ──
  socket.on('community_post', ({ communityId, text, imageUrl, token }) => {
    const user = requireAuth(token);
    if (!user) return socket.emit('community_result', { ok: false, message: 'Giriş yapmalısın.' });

    const cleanId = sanitize(communityId, 64);
    const cleanText = sanitize(text, 1000).trim();
    const cleanImage = sanitize(imageUrl, 500).trim();

    if (!cleanId || !getDb()) return socket.emit('community_result', { ok: false, message: 'Geçersiz istek.' });
    if (!cleanText && !cleanImage) return socket.emit('community_result', { ok: false, message: 'Gönderi metni veya resim gerekli.' });

    const membership = getDb().prepare('SELECT 1 FROM community_members WHERE community_id = ? AND username = ?').get(cleanId, user.username);
    if (!membership) return socket.emit('community_result', { ok: false, message: 'Bu topluluğun üyesi değilsin.' });

    const postId = crypto.randomUUID();
    const now = Date.now();

    getDb().prepare('INSERT INTO community_posts (id, community_id, username, text, image_url, likes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(postId, cleanId, user.username, cleanText, cleanImage, 0, now);

    const post = getDb().prepare('SELECT * FROM community_posts WHERE id = ?').get(postId);
    io.to(`community_${cleanId}`).emit('community_new_post', { post });
    socket.emit('community_post_result', { ok: true, post });
  });

  // ── TOPLULUK GÖNDERİLERİNİ GETİR ──
  socket.on('community_posts', ({ communityId, token }) => {
    const user = requireAuth(token);
    if (!user) return socket.emit('community_result', { ok: false, message: 'Giriş yapmalısın.' });

    const cleanId = sanitize(communityId, 64);
    if (!cleanId || !getDb()) return socket.emit('community_result', { ok: false, message: 'Geçersiz istek.' });

    const membership = getDb().prepare('SELECT 1 FROM community_members WHERE community_id = ? AND username = ?').get(cleanId, user.username);
    if (!membership) return socket.emit('community_result', { ok: false, message: 'Bu topluluğun üyesi değilsin.' });

    const posts = getDb().prepare(`
      SELECT cp.*, u.avatar FROM community_posts cp
      LEFT JOIN users u ON cp.username = u.username
      WHERE cp.community_id = ?
      ORDER BY cp.created_at DESC
      LIMIT 100
    `).all(cleanId);

    socket.emit('community_posts_result', { ok: true, posts });
  });

  // ── GÖNDERİYE YORUM YAP ──
  socket.on('community_comment', ({ postId, text, token }) => {
    const user = requireAuth(token);
    if (!user) return socket.emit('community_result', { ok: false, message: 'Giriş yapmalısın.' });

    const cleanPostId = sanitize(postId, 64);
    const cleanText = sanitize(text, 500).trim();

    if (!cleanPostId || !cleanText || !getDb()) return socket.emit('community_result', { ok: false, message: 'Geçersiz istek.' });

    const post = getDb().prepare('SELECT * FROM community_posts WHERE id = ?').get(cleanPostId);
    if (!post) return socket.emit('community_result', { ok: false, message: 'Gönderi bulunamadı.' });

    const membership = getDb().prepare('SELECT 1 FROM community_members WHERE community_id = ? AND username = ?').get(post.community_id, user.username);
    if (!membership) return socket.emit('community_result', { ok: false, message: 'Bu topluluğun üyesi değilsin.' });

    const commentId = crypto.randomUUID();
    getDb().prepare('INSERT INTO community_comments (id, post_id, username, text, created_at) VALUES (?, ?, ?, ?, ?)').run(commentId, cleanPostId, user.username, cleanText, Date.now());

    const comment = getDb().prepare('SELECT * FROM community_comments WHERE id = ?').get(commentId);
    io.to(`community_${post.community_id}`).emit('community_new_comment', { postId: cleanPostId, comment });
    socket.emit('community_comment_result', { ok: true, comment });
  });

  // ── GÖNDERİ BEĞEN / BEĞENME ──
  socket.on('community_like', ({ postId, token }) => {
    const user = requireAuth(token);
    if (!user) return socket.emit('community_result', { ok: false, message: 'Giriş yapmalısın.' });

    const cleanPostId = sanitize(postId, 64);
    if (!cleanPostId || !getDb()) return socket.emit('community_result', { ok: false, message: 'Geçersiz istek.' });

    const post = getDb().prepare('SELECT * FROM community_posts WHERE id = ?').get(cleanPostId);
    if (!post) return socket.emit('community_result', { ok: false, message: 'Gönderi bulunamadı.' });

    const membership = getDb().prepare('SELECT 1 FROM community_members WHERE community_id = ? AND username = ?').get(post.community_id, user.username);
    if (!membership) return socket.emit('community_result', { ok: false, message: 'Bu topluluğun üyesi değilsin.' });

    const existing = getDb().prepare('SELECT 1 FROM message_reactions WHERE message_id = ? AND message_type = ? AND username = ? AND emoji = ?').get(cleanPostId, 'community_post', user.username, '❤️');

    if (existing) {
      getDb().prepare('DELETE FROM message_reactions WHERE message_id = ? AND message_type = ? AND username = ? AND emoji = ?').run(cleanPostId, 'community_post', user.username, '❤️');
      getDb().prepare('UPDATE community_posts SET likes = MAX(likes - 1, 0) WHERE id = ?').run(cleanPostId);
    } else {
      getDb().prepare('INSERT INTO message_reactions (message_id, message_type, username, emoji, created_at) VALUES (?, ?, ?, ?, ?)').run(cleanPostId, 'community_post', user.username, '❤️', Date.now());
      getDb().prepare('UPDATE community_posts SET likes = likes + 1 WHERE id = ?').run(cleanPostId);
    }

    const updatedPost = getDb().prepare('SELECT likes FROM community_posts WHERE id = ?').get(cleanPostId);
    const liked = !existing;

    io.to(`community_${post.community_id}`).emit('community_like_update', { postId: cleanPostId, likes: updatedPost.likes, liked });
    socket.emit('community_like_result', { ok: true, liked, likes: updatedPost.likes });
  });

  // ── BAĞLANTI KESME temizliği ──
  socket.on('disconnect', () => {
    if (socket.socialUsername && getDb()) {
      const joinedCommunities = getDb().prepare('SELECT community_id FROM community_members WHERE username = ?').all(socket.socialUsername);
      for (const { community_id } of joinedCommunities) {
        socket.leave(`community_${community_id}`);
      }
    }
  });
};
