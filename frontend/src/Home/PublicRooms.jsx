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
          {publicRooms.slice(0, 6).map((r, i) => (
            <div className="cm-room" key={r.id} onClick={() => onJoinRoom(r)} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="cm-room-glow" />
              <div className="cm-room-top">
                <div className="cm-room-icon-wrap">
                  <span className="cm-room-emoji">{r.hasPassword ? '🔒' : '🎵'}</span>
                </div>
                <div className="cm-room-count">{r.userCount}/{r.maxUsers} 👥</div>
              </div>
              <div className="cm-room-name">{r.name}</div>
              <div className="cm-room-meta">
                {r.hasPassword ? 'Şifreli oda' : 'Herkes açık'}
              </div>
              <div className="cm-room-bottom">
                <div className="cm-room-users">
                  {Array.from({ length: Math.min(r.userCount, 3) }).map((_, j) => (
                    <div key={j} className="cm-room-user-avatar" style={{ background: ['#7c3aed','#2563eb','#00a884'][j % 3] }}>
                      {['🐱','🐶','🦊'][j % 3]}
                    </div>
                  ))}
                  {r.userCount > 3 && <div className="cm-room-user-more">+{r.userCount - 3}</div>}
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
        </div>
      )}
    </section>
  );
}
