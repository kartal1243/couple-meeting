import { useState, useMemo } from 'react';

export default function PublicRooms({ publicRooms, onJoinRoom, onCreateRoom }) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    let list = Array.isArray(publicRooms) ? publicRooms : [];
    if (typeFilter === 'video') list = list.filter(r => r.roomType !== 'music');
    else if (typeFilter === 'music') list = list.filter(r => r.roomType === 'music');
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(r => (r.name || '').toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => (b.userCount || 0) - (a.userCount || 0));
  }, [publicRooms, typeFilter, query]);

  const counts = {
    all: publicRooms?.length || 0,
    video: (publicRooms || []).filter(r => r.roomType !== 'music').length,
    music: (publicRooms || []).filter(r => r.roomType === 'music').length,
  };

  const btn = (key, label) => {
    const isSelected = typeFilter === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setTypeFilter(key)}
        style={{
          padding: '8px 16px',
          borderRadius: 999,
          border: isSelected ? 'none' : '1.5px solid #e2e8f0',
          cursor: 'pointer',
          fontSize: 12.5,
          fontWeight: 900,
          background: isSelected ? 'linear-gradient(135deg, #fd267d, #ff6036)' : '#ffffff',
          color: isSelected ? '#ffffff' : '#475569',
          boxShadow: isSelected ? '0 4px 14px rgba(253,38,125,0.3)' : 'none',
          transition: 'all 0.15s ease'
        }}
      >
        {label} ({counts[key]})
      </button>
    );
  };

  return (
    <section className="cm-section" style={{ marginTop: 40 }}>
      <div className="cm-section-head">
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#0f172a' }}>
            <span style={{ display: 'inline-flex', width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,.5)', animation: 'cmLivePulse 2s ease-in-out infinite' }} />
            Canlı Buluşma Odaları
          </h3>
          <p style={{ color: '#64748b' }}>Şu an sevgililerin ve arkadaşların birlikte izlediği aktif odalar.</p>
        </div>
        <button
          type="button"
          onClick={onCreateRoom}
          style={{
            padding: '8px 18px',
            borderRadius: 999,
            background: '#0f172a',
            border: 'none',
            color: '#ffffff',
            fontSize: 12.5,
            fontWeight: 900,
            cursor: 'pointer'
          }}
        >
          + Odanı Kur
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        {btn('all', 'Tüm Odalar')}
        {btn('video', '🎬 Video & Sinema')}
        {btn('music', '🎵 Müzik')}

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Oda veya sanatçı ara..."
          style={{
            flex: 1, minWidth: 180, padding: '9px 16px', borderRadius: 999,
            background: '#ffffff', border: '1.5px solid #0f172a', color: '#0f172a',
            fontSize: 13, fontWeight: 600, outline: 'none'
          }}
        />
      </div>

      {filtered.length > 0 ? (
        <div className="cm-room-grid">
          {filtered.slice(0, 18).map((r, i) => (
            <div
              className="cm-room"
              key={r.id}
              onClick={() => onJoinRoom(r)}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="cm-room-top">
                <div
                  className="cm-room-icon-wrap"
                  style={{
                    background: r.roomType === 'music'
                      ? 'linear-gradient(135deg, rgba(253,38,125,0.12), rgba(255,96,54,0.12))'
                      : 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.12))'
                  }}
                >
                  <span className="cm-room-emoji">{r.roomType === 'music' ? '🎵' : '🎬'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    color: r.userCount > 0 ? '#16a34a' : '#64748b',
                    fontSize: 10, fontWeight: 900, padding: '3px 9px', borderRadius: 999,
                    background: r.userCount > 0 ? '#dcfce7' : '#f1f5f9'
                  }}>
                    {r.userCount > 0 ? `${r.userCount} kişi buluşuyor` : 'Boş'}
                  </span>
                  {r.hasPassword && <span style={{ fontSize: 11 }}>🔒</span>}
                </div>
              </div>

              <div className="cm-room-name">{r.name}</div>
              <div className="cm-room-meta">
                {r.roomType === 'music' ? '🎵 Ortak Müzik Odası' : '🎬 Birlikte Video Odası'}
                {r.isVip ? ' • 👑 VIP' : ''}
              </div>

              <div className="cm-room-bottom">
                <div className="cm-room-users">
                  {Array.isArray(r.users) && r.users.length > 0 ? (
                    r.users.slice(0, 4).map((u, ui) => (
                      <span key={ui} className="cm-room-user-avatar">{u.avatar || '🐱'}</span>
                    ))
                  ) : (
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Henüz kimse yok</span>
                  )}
                </div>
                <span className="cm-room-join-btn">
                  Katıl →
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="cm-empty-state">
          <div className="cm-empty-icon">🛋️</div>
          <div className="cm-empty-title">Aktif Oda Bulunamadı</div>
          <div className="cm-empty-desc">Hemen ilk odayı sen kur, sevgilinle veya arkadaşlarınla buluş!</div>
          <button
            type="button"
            onClick={onCreateRoom}
            style={{
              marginTop: 16, padding: '11px 24px', borderRadius: 999, border: 'none',
              background: 'linear-gradient(135deg, #fd267d, #ff6036)', color: '#ffffff',
              fontSize: 13, fontWeight: 900, cursor: 'pointer'
            }}
          >
            🚀 İlk Odayı Kur
          </button>
        </div>
      )}
    </section>
  );
}
