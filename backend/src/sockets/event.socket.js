module.exports = function registerEventHandlers(io, socket, db, sanitize, crypto) {

  // ──────────────────────────────────────────────────────
  // ETKINLIK TAKVIMI SOCKET HANDLER'LARI
  // ──────────────────────────────────────────────────────

  socket.on('event_create', ({ title, description, date, time, location, communityId, maxAttendees, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return socket.emit('event_result', { ok: false, message: 'Giriş yapmalısın.' });

    const cleanTitle = sanitize(title, 100);
    if (!cleanTitle) return socket.emit('event_result', { ok: false, message: 'Etkinlik başlığı gerekli.' });
    if (!date) return socket.emit('event_result', { ok: false, message: 'Tarih gerekli.' });

    const id = crypto.randomBytes(12).toString('hex');
    const now = Date.now();
    const max = Math.min(Math.max(parseInt(maxAttendees) || 0, 0), 1000);

    if (db.getDb()) {
      db.getDb().prepare(
        'INSERT INTO events (id, title, description, date, time, location, created_by, community_id, max_attendees, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(id, cleanTitle, sanitize(description, 500) || '', String(date).slice(0, 30), sanitize(time, 20) || '', sanitize(location, 200) || '', user.username, sanitize(communityId, 50) || null, max, now);

      db.getDb().prepare(
        'INSERT INTO event_attendees (event_id, username, status, joined_at) VALUES (?, ?, ?, ?)'
      ).run(id, user.username, 'going', now);
    }

    const event = {
      id, title: cleanTitle, description: sanitize(description, 500) || '',
      date: String(date).slice(0, 30), time: sanitize(time, 20) || '',
      location: sanitize(location, 200) || '', createdBy: user.username,
      communityId: sanitize(communityId, 50) || null, maxAttendees: max,
      createdAt: now, attendees: [{ username: user.username, status: 'going', joinedAt: now }]
    };

    socket.emit('event_result', { ok: true, event });
    if (event.communityId) io.to('community:' + event.communityId).emit('event_created', event);
    else io.emit('event_created', event);
  });

  socket.on('event_list', ({ communityId, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return socket.emit('event_list_result', { ok: false, message: 'Giriş yapmalısın.' });

    if (!db.getDb()) return socket.emit('event_list_result', { ok: true, events: [] });

    let rows;
    const cleanCommunityId = sanitize(communityId, 50);

    if (cleanCommunityId) {
      rows = db.getDb().prepare(
        'SELECT * FROM events WHERE community_id = ? ORDER BY date ASC, time ASC'
      ).all(cleanCommunityId);
    } else {
      rows = db.getDb().prepare(
        `SELECT e.* FROM events e
         LEFT JOIN event_attendees ea ON e.id = ea.event_id
         WHERE e.created_by = ? OR ea.username = ?
         GROUP BY e.id
         ORDER BY e.date ASC, e.time ASC`
      ).all(user.username, user.username);
    }

    const events = rows.map(row => {
      const attendees = db.getDb().prepare(
        'SELECT username, status, joined_at FROM event_attendees WHERE event_id = ? ORDER BY joined_at ASC'
      ).all(row.id);

      return {
        id: row.id, title: row.title, description: row.description,
        date: row.date, time: row.time, location: row.location,
        createdBy: row.created_by, communityId: row.community_id,
        maxAttendees: row.max_attendees, createdAt: row.created_at,
        attendeeCount: attendees.length,
        attendees: attendees.map(a => ({ username: a.username, status: a.status, joinedAt: a.joined_at }))
      };
    });

    socket.emit('event_list_result', { ok: true, events });
  });

  socket.on('event_info', ({ eventId, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return socket.emit('event_info_result', { ok: false, message: 'Giriş yapmalısın.' });

    if (!db.getDb()) return socket.emit('event_info_result', { ok: false, message: 'Etkinlik bulunamadı.' });

    const cleanId = sanitize(eventId, 50);
    const row = db.getDb().prepare('SELECT * FROM events WHERE id = ?').get(cleanId);
    if (!row) return socket.emit('event_info_result', { ok: false, message: 'Etkinlik bulunamadı.' });

    const attendees = db.getDb().prepare(
      'SELECT username, status, joined_at FROM event_attendees WHERE event_id = ? ORDER BY joined_at ASC'
    ).all(row.id);

    socket.emit('event_info_result', {
      ok: true,
      event: {
        id: row.id, title: row.title, description: row.description,
        date: row.date, time: row.time, location: row.location,
        createdBy: row.created_by, communityId: row.community_id,
        maxAttendees: row.max_attendees, createdAt: row.created_at,
        attendees: attendees.map(a => ({ username: a.username, status: a.status, joinedAt: a.joined_at }))
      }
    });
  });

  socket.on('event_rsvp', ({ eventId, status, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return socket.emit('event_result', { ok: false, message: 'Giriş yapmalısın.' });

    if (!db.getDb()) return socket.emit('event_result', { ok: false, message: 'Etkinlik bulunamadı.' });

    const cleanId = sanitize(eventId, 50);
    const validStatuses = ['going', 'maybe', 'cancel'];
    const cleanStatus = validStatuses.includes(status) ? status : 'going';

    const row = db.getDb().prepare('SELECT * FROM events WHERE id = ?').get(cleanId);
    if (!row) return socket.emit('event_result', { ok: false, message: 'Etkinlik bulunamadı.' });

    if (cleanStatus === 'cancel') {
      db.getDb().prepare('DELETE FROM event_attendees WHERE event_id = ? AND username = ?').run(cleanId, user.username);
    } else {
      const goingCount = db.getDb().prepare(
        'SELECT COUNT(*) as c FROM event_attendees WHERE event_id = ? AND status = ?'
      ).get(cleanId, 'going').c;

      if (cleanStatus === 'going' && row.max_attendees > 0) {
        const existing = db.getDb().prepare(
          'SELECT status FROM event_attendees WHERE event_id = ? AND username = ?'
        ).get(cleanId, user.username);
        if (!existing && goingCount >= row.max_attendees) {
          return socket.emit('event_result', { ok: false, message: 'Etkinlik dolu.' });
        }
      }

      db.getDb().prepare(
        'INSERT INTO event_attendees (event_id, username, status, joined_at) VALUES (?, ?, ?, ?) ON CONFLICT(event_id, username) DO UPDATE SET status = ?, joined_at = ?'
      ).run(cleanId, user.username, cleanStatus, Date.now(), cleanStatus, Date.now());
    }

    const attendees = db.getDb().prepare(
      'SELECT username, status, joined_at FROM event_attendees WHERE event_id = ? ORDER BY joined_at ASC'
    ).all(cleanId);

    const result = {
      id: row.id, title: row.title, description: row.description,
      date: row.date, time: row.time, location: row.location,
      createdBy: row.created_by, communityId: row.community_id,
      maxAttendees: row.max_attendees, createdAt: row.created_at,
      attendees: attendees.map(a => ({ username: a.username, status: a.status, joinedAt: a.joined_at }))
    };

    socket.emit('event_result', { ok: true, event: result });
    if (row.community_id) io.to('community:' + row.community_id).emit('event_updated', result);
    else io.emit('event_updated', result);
  });

  socket.on('event_update', ({ eventId, title, description, date, time, location, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return socket.emit('event_result', { ok: false, message: 'Giriş yapmalısın.' });

    if (!db.getDb()) return socket.emit('event_result', { ok: false, message: 'Etkinlik bulunamadı.' });

    const cleanId = sanitize(eventId, 50);
    const row = db.getDb().prepare('SELECT * FROM events WHERE id = ?').get(cleanId);
    if (!row) return socket.emit('event_result', { ok: false, message: 'Etkinlik bulunamadı.' });
    if (row.created_by !== user.username) return socket.emit('event_result', { ok: false, message: 'Sadece oluşturucu güncelleyebilir.' });

    const sets = [];
    const vals = [];

    if (title !== undefined) { const v = sanitize(title, 100); if (v) { sets.push('title = ?'); vals.push(v); } }
    if (description !== undefined) { sets.push('description = ?'); vals.push(sanitize(description, 500) || ''); }
    if (date !== undefined) { sets.push('date = ?'); vals.push(String(date).slice(0, 30)); }
    if (time !== undefined) { sets.push('time = ?'); vals.push(sanitize(time, 20) || ''); }
    if (location !== undefined) { sets.push('location = ?'); vals.push(sanitize(location, 200) || ''); }

    if (sets.length === 0) return socket.emit('event_result', { ok: false, message: 'Güncellenecek alan yok.' });

    vals.push(cleanId);
    db.getDb().prepare(`UPDATE events SET ${sets.join(', ')} WHERE id = ?`).run(...vals);

    const updated = db.getDb().prepare('SELECT * FROM events WHERE id = ?').get(cleanId);
    const attendees = db.getDb().prepare(
      'SELECT username, status, joined_at FROM event_attendees WHERE event_id = ? ORDER BY joined_at ASC'
    ).all(cleanId);

    const event = {
      id: updated.id, title: updated.title, description: updated.description,
      date: updated.date, time: updated.time, location: updated.location,
      createdBy: updated.created_by, communityId: updated.community_id,
      maxAttendees: updated.max_attendees, createdAt: updated.created_at,
      attendees: attendees.map(a => ({ username: a.username, status: a.status, joinedAt: a.joined_at }))
    };

    socket.emit('event_result', { ok: true, event });
    if (updated.community_id) io.to('community:' + updated.community_id).emit('event_updated', event);
    else io.emit('event_updated', event);
  });

  socket.on('event_delete', ({ eventId, token }) => {
    const user = db.getUserByToken(token);
    if (!user) return socket.emit('event_result', { ok: false, message: 'Giriş yapmalısın.' });

    if (!db.getDb()) return socket.emit('event_result', { ok: false, message: 'Etkinlik bulunamadı.' });

    const cleanId = sanitize(eventId, 50);
    const row = db.getDb().prepare('SELECT * FROM events WHERE id = ?').get(cleanId);
    if (!row) return socket.emit('event_result', { ok: false, message: 'Etkinlik bulunamadı.' });
    if (row.created_by !== user.username) return socket.emit('event_result', { ok: false, message: 'Sadece oluşturucu silebilir.' });

    db.getDb().prepare('DELETE FROM event_attendees WHERE event_id = ?').run(cleanId);
    db.getDb().prepare('DELETE FROM events WHERE id = ?').run(cleanId);

    socket.emit('event_result', { ok: true, deletedId: cleanId });
    if (row.community_id) io.to('community:' + row.community_id).emit('event_deleted', { eventId: cleanId });
    else io.emit('event_deleted', { eventId: cleanId });
  });
};
