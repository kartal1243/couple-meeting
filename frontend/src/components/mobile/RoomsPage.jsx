import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';

const RoomsPage = () => {
  const { publicRooms, setShowJoinModal, setJoinRoomTarget, setShowQuickCreate } = useApp();
  const [livePulse, setLivePulse] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setLivePulse(p => !p), 1500);
    return () => clearInterval(interval);
  }, []);

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

  const chip = (key, label) => (
    <button key={key} onClick={() => setTypeFilter(key)} className="rooms-filter-chip" style={{
      padding: '6px 12px', borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800,
      background: typeFilter === key ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(255,255,255,.06)',
      color: typeFilter === key ? '#fff' : '#94a3b8'
    }}>{label}</button>
  );

  return (
    <div className="mobile-page rooms-page">
      <div className="rooms-page-header">
        <div className="rooms-header-left">
          <h1>Odalar</h1>
          <div className="rooms-live-indicator">
            <span className={`rooms-live-dot ${livePulse ? 'pulse' : ''}`}></span>
            <span className="rooms-live-text">CANLI</span>
          </div>
        </div>
        <button className="rooms-create-btn touch-feedback" onClick={() => setShowQuickCreate(true)}>
          <span className="rooms-create-icon">+</span>
          <span>Yeni Oda</span>
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {chip('all', 'Tümü')}{chip('video', '🎬 Video')}{chip('music', '🎵 Müzik')}
      </div>
      <input
        value={query} onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 Oda ara..."
        style={{
          width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 10,
          background: '#111b21', border: '1px solid #25313a', color: '#e9edef',
          fontSize: 13, outline: 'none', marginBottom: 10
        }}
      />

      <div className="rooms-count-bar">
        <span>{filtered.length} oda</span>
        <div className="rooms-count-wave"></div>
      </div>

      <div className="rooms-page-list">
        {filtered.length > 0 ? (
          filtered.map((room, i) => (
            <div
              key={room.id || i}
              className="rooms-page-card touch-feedback"
              style={{ animationDelay: `${i * 0.08}s` }}
              onClick={() => { setJoinRoomTarget(room); setShowJoinModal(true); }}
            >
              <div className="rooms-page-avatar-wrap">
                <div className="rooms-page-avatar">{room.roomType === 'music' ? '🎵' : '🎬'}</div>
                <span className="rooms-page-status-dot"></span>
              </div>
              <div className="rooms-page-info">
                <h3>{room.name}</h3>
                <div className="rooms-page-meta">
                  <span className="rooms-page-users">👥 {room.userCount || 0}/{room.maxUsers || 2}</span>
                  <span className="rooms-page-lock">{room.hasPassword ? '🔒 Gizli' : '🔓 Açık'}</span>
                  {room.roomType === 'music' && <span>🎵</span>}
                  {room.isVip && <span>👑</span>}
                </div>
              </div>
              <div className="rooms-page-join">
                <span className="rooms-join-arrow">›</span>
              </div>
            </div>
          ))
        ) : (
          <div className="rooms-page-empty">
            <div className="rooms-empty-icon anim-float">🎵</div>
            <h3>Eşleşen oda yok</h3>
            <p>Filtreyi değiştir veya yeni oda aç!</p>
            <button className="rooms-empty-btn touch-feedback" onClick={() => setShowQuickCreate(true)}>
              <span>+</span> Oda Olustur
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomsPage;
