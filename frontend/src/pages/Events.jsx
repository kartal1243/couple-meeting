import React, { useState, useEffect, memo } from 'react';

function Events({ currentTheme, token, username, socket }) {
  const [events, setEvents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    socket.emit('event_list', { token });
    socket.on('event_list_result', (data) => setEvents(data.events || []));
    socket.on('event_info_result', (data) => setSelectedEvent(data));
    socket.on('event_created', () => { setShowCreate(false); socket.emit('event_list', { token }); });
    socket.on('event_deleted', () => { setSelectedEvent(null); socket.emit('event_list', { token }); });
    return () => {
      socket.off('event_list_result');
      socket.off('event_info_result');
      socket.off('event_created');
      socket.off('event_deleted');
    };
  }, [token]);

  const createEvent = () => {
    if (!title.trim() || !date.trim()) return;
    socket.emit('event_create', { title, description: desc, date, time, location, token });
    setTitle(''); setDesc(''); setDate(''); setTime(''); setLocation('');
  };

  const rsvp = (eventId, status) => {
    socket.emit('event_rsvp', { eventId, status, token });
    setTimeout(() => socket.emit('event_info', { eventId, token }), 100);
  };

  const deleteEvent = (eventId) => {
    if (confirm('Etkinliği silmek istediğine emin misin?')) {
      socket.emit('event_delete', { eventId, token });
    }
  };

  const formatDate = (d) => {
    try { return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return d; }
  };

  if (selectedEvent) {
    const ev = selectedEvent.event;
    const attendees = selectedEvent.attendees || [];
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: 20 }}>
        <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: 16, fontSize: 14 }}>← Geri</button>

        <div style={{ background: 'rgba(30,41,59,.8)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>📅</span>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>{ev.title}</div>
              <div style={{ color: currentTheme.primary, fontSize: 12, fontWeight: 700 }}>{formatDate(ev.date)} {ev.time && `· ${ev.time}`}</div>
            </div>
          </div>
          {ev.description && <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12, lineHeight: 1.4 }}>{ev.description}</div>}
          {ev.location && <div style={{ color: '#64748b', fontSize: 12, marginBottom: 12 }}>📍 {ev.location}</div>}
          {ev.created_by === username && (
            <button onClick={() => deleteEvent(ev.id)} style={{ background: 'rgba(239,68,68,.15)', color: '#ef4444', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>🗑️ Sil</button>
          )}
        </div>

        <div style={{ background: 'rgba(30,41,59,.8)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Yanıtla</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['going', 'maybe', 'cancel'].map(s => (
              <button key={s} onClick={() => rsvp(ev.id, s)} style={{ flex: 1, background: attendees.find(a => a.username === username && a.status === s) ? currentTheme.primary : '#1f2c34', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
                {s === 'going' ? '✅ Geliyorum' : s === 'maybe' ? '🤔 Belki' : '❌ Katılmıyorum'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(30,41,59,.8)', borderRadius: 16, padding: 14 }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 13, marginBottom: 8 }}>Katılımcılar ({attendees.length})</div>
          {attendees.map(a => (
            <div key={a.username} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
              <span style={{ fontSize: 14 }}>{a.avatar || '🐱'}</span>
              <span style={{ color: '#e2e8f0', fontSize: 12 }}>{a.username}</span>
              <span style={{ color: a.status === 'going' ? '#22c55e' : a.status === 'maybe' ? '#eab308' : '#ef4444', fontSize: 10, fontWeight: 700 }}>
                {a.status === 'going' ? 'Geliyor' : a.status === 'maybe' ? 'Belki' : 'Katılmıyor'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 24 }}>📅 Etkinlik Takvimi</div>
        <button onClick={() => setShowCreate(true)} style={{ background: currentTheme.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>+ Yeni Etkinlik</button>
      </div>

      {showCreate && (
        <div style={{ background: 'rgba(30,41,59,.95)', borderRadius: 14, padding: 20, marginBottom: 20, border: `1px solid ${currentTheme.primary}33` }}>
          <div style={{ color: '#fff', fontWeight: 800, marginBottom: 12 }}>Yeni Etkinlik Oluştur</div>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Etkinlik adı *" style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(100,116,139,.3)', borderRadius: 10, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Açıklama" style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(100,116,139,.3)', borderRadius: 10, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ flex: 1, background: '#0f172a', border: '1px solid rgba(100,116,139,.3)', borderRadius: 10, padding: '10px 12px', color: '#e2e8f0', fontSize: 13 }} />
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ flex: 1, background: '#0f172a', border: '1px solid rgba(100,116,139,.3)', borderRadius: 10, padding: '10px 12px', color: '#e2e8f0', fontSize: 13 }} />
          </div>
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Konum (isteğe bağlı)" style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(100,116,139,.3)', borderRadius: 10, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, marginBottom: 12, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowCreate(false)} style={{ flex: 1, background: '#1f2c34', color: '#94a3b8', border: 'none', borderRadius: 10, padding: '10px 0', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
            <button onClick={createEvent} style={{ flex: 1, background: currentTheme.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', fontWeight: 700, cursor: 'pointer' }}>Oluştur</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {events.map(ev => (
          <div key={ev.id} onClick={() => socket.emit('event_info', { eventId: ev.id, token })} style={{ background: 'rgba(30,41,59,.8)', borderRadius: 14, padding: 16, cursor: 'pointer', border: `1px solid ${currentTheme.primary}22` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28 }}>📅</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{ev.title}</div>
                <div style={{ color: currentTheme.primary, fontSize: 12, fontWeight: 700 }}>{formatDate(ev.date)} {ev.time && `· ${ev.time}`}</div>
                {ev.location && <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>📍 {ev.location}</div>}
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>Henüz etkinlik yok. İlk etkinliği sen oluştur!</div>}
      </div>
    </div>
  );
}

export default memo(Events);
