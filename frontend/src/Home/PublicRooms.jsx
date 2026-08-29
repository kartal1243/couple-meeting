export default function PublicRooms({ publicRooms, onJoinRoom }) {
  return (
    <section className="cm-section">
      <div className="cm-section-head">
        <div>
          <h3>🔥 Şu an açık odalar</h3>
          <p>Bir odaya katılmak için üzerine tıkla.</p>
        </div>
      </div>
      {publicRooms.length ? (
        <div className="cm-room-grid">
          {publicRooms.slice(0, 6).map((r) => (
            <div className="cm-room" key={r.id} onClick={() => onJoinRoom(r)}>
              <div className="cm-room-top">
                <div className="cm-room-icon">{r.hasPassword ? '🔒' : '🎵'}</div>
                <div className="cm-room-count">{r.userCount}/{r.maxUsers}</div>
              </div>
              <div className="cm-room-name">{r.name}</div>
              <div className="cm-room-meta">
                {r.hasPassword ? 'Şifreli oda' : 'Herkes açık'}
              </div>
              <div className="cm-room-users">
                {Array.from({ length: Math.min(r.userCount, 4) }).map((_, i) => (
                  <div key={i} className="cm-room-user-dot" style={{ background: ['#7c3aed','#2563eb','#00a884','#f59e0b'][i % 4] }} />
                ))}
                {r.userCount > 4 && <div className="cm-room-user-dot" style={{ background: '#475569' }}>+{r.userCount - 4}</div>}
              </div>
              <div className="cm-room-join">Katıl →</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="cm-social-card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎶</div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Henüz açık oda yok</div>
          <div style={{ color: '#7f8c98', fontSize: 13, marginTop: 6 }}>İlk odayı sen oluştur ve burayı hareketlendir!</div>
        </div>
      )}
    </section>
  );
}
