export default function PublicRooms({ publicRooms, onJoinRoom, onCreateRoom }) {
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
      {publicRooms.length > 0 ? (
        <div className="cm-room-grid">
          {publicRooms.slice(0, 9).map((r, i) => (
            <div className="cm-room" key={r.id} onClick={() => onJoinRoom(r)} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="cm-room-glow" />
              <div className="cm-room-top">
                <div className="cm-room-icon-wrap" style={{ background: 'linear-gradient(135deg,rgba(124,58,237,.2),rgba(37,99,235,.15))' }}>
                  <span className="cm-room-emoji">🎬</span>
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
                {r.isVip ? '👑 VIP Oda' : 'Birlikte İzle & Dinle'}
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
          <div className="cm-empty-title">Henüz açık oda yok</div>
          <div className="cm-empty-desc">İlk odayı sen oluştur ve burayı hareketlendir!</div>
          <button onClick={onCreateRoom} style={{ marginTop:16, padding:'12px 24px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#7c3aed,#a855f7)', color:'#fff', fontSize:13, fontWeight:800, cursor:'pointer' }}>🚀 Oda Oluştur</button>
        </div>
      )}
    </section>
  );
}
