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
  const btn = (key, label) => (
    <button key={key} onClick={() => setTypeFilter(key)} style={{
      padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
      fontSize: 11, fontWeight: 800,
      background: typeFilter === key ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(255,255,255,.06)',
      color: typeFilter === key ? '#fff' : '#94a3b8'
    }}>{label} ({counts[key]})</button>
  );

  return (
    <section className="cm-section" style={{ marginTop: 32 }}>
      <div className="cm-section-head">
        <div>
          <h3 style={{ display:'flex', alignItems:'center', gap: 10 }}>
            <span style={{ display:'inline-flex', width:10, height:10, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 8px rgba(34,197,94,.5)', animation:'cmLivePulse 2s ease-in-out infinite' }} />
            Canlı Odalar
          </h3>
          <p>Şu an aktif olan odalara katıl veya yarat.</p>
        </div>
        <div style={{ color:'#64748b', fontSize:12, fontWeight:800 }}>
          {publicRooms.length} oda aktif
        </div>
      </div>

      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:14, flexWrap:'wrap' }}>
        {btn('all','Tümü')}{btn('video','🎬 Video')}{btn('music','🎵 Müzik')}
        <input
          value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Oda ara..."
          style={{
            flex:1, minWidth:160, padding:'8px 12px', borderRadius:10,
            background:'#111b21', border:'1px solid #25313a', color:'#e9edef',
            fontSize:12, outline:'none'
          }}
        />
      </div>

      {filtered.length > 0 ? (
        <div className="cm-room-grid">
          {filtered.slice(0, 18).map((r, i) => (
            <div className="cm-room" key={r.id} onClick={() => onJoinRoom(r)} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="cm-room-glow" />
              <div className="cm-room-top">
                <div className="cm-room-icon-wrap" style={{ background: r.roomType === 'music'
                  ? 'linear-gradient(135deg,rgba(0,168,132,.2),rgba(8,145,178,.15))'
                  : 'linear-gradient(135deg,rgba(124,58,237,.2),rgba(37,99,235,.15))' }}>
                  <span className="cm-room-emoji">{r.roomType === 'music' ? '🎵' : '🎬'}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ color: r.userCount > 0 ? '#22c55e' : '#64748b', fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:8, background: r.userCount > 0 ? 'rgba(34,197,94,.12)' : 'rgba(255,255,255,.05)' }}>
                    {r.userCount > 0 ? `${r.userCount} kişi` : 'Boş'}
                  </span>
                  {r.hasPassword && <span style={{ fontSize:10 }}>🔒</span>}
                </div>
              </div>
              <div className="cm-room-name">{r.name}</div>
              <div className="cm-room-meta">
                {r.roomType === 'music' ? '🎵 Müzik Odası' : '🎬 Video Odası'}{r.isVip ? ' • 👑 VIP' : ''}
              </div>
              <div className="cm-room-bottom">
                <div className="cm-room-users">
                  {r.users && r.users.length > 0 ? (
                    r.users.slice(0, 4).map((u, j) => (
                      <div key={j} className="cm-room-user-avatar" style={{ background: ['#7c3aed','#2563eb','#00a884','#f59e0b'][j % 4] }}>
                        {u.avatar || ['🐱','🐶','🦊','🐻'][j % 4]}
                      </div>
                    ))
                  ) : (
                    Array.from({ length: Math.min(r.userCount, 4) }).map((_, j) => (
                      <div key={j} className="cm-room-user-avatar" style={{ background: ['#7c3aed','#2563eb','#00a884','#f59e0b'][j % 4] }}>
                        {['🐱','🐶','🦊','🐻'][j % 4]}
                      </div>
                    ))
                  )}
                  {r.userCount > 4 && <div className="cm-room-user-more">+{r.userCount - 4}</div>}
                </div>
                <div className="cm-room-join-btn">Katıl →</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="cm-empty-state">
          <div className="cm-empty-icon">🎶</div>
          <div className="cm-empty-title">{query || typeFilter !== 'all' ? 'Eşleşen oda yok' : 'Henüz açık oda yok'}</div>
          <div className="cm-empty-desc">{query || typeFilter !== 'all' ? 'Filtreyi değiştir veya yeni oda aç.' : 'İlk odayı sen oluştur ve burayı hareketlendir!'}</div>
          <button onClick={onCreateRoom} style={{ marginTop:16, padding:'12px 24px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#7c3aed,#a855f7)', color:'#fff', fontSize:13, fontWeight:800, cursor:'pointer' }}>🚀 Oda Oluştur</button>
        </div>
      )}
    </section>
  );
}
