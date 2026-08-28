export default function PublicRooms({ publicRooms, setJoinRoomInput, setActiveTab }) {
  return (
    <section className="cm-section">
      <div className="cm-section-head">
        <div>
          <h3>🔥 Şu an açık odalar</h3>
          <p>Bir odaya katılmak için tek dokunuş yeterli.</p>
        </div>
      </div>
      {publicRooms.length ? (
        <div className="cm-room-grid">
          {publicRooms.slice(0, 6).map((r) => (
            <div className="cm-room" key={r.id}>
              <div className="cm-room-row">
                <div className="cm-room-name">{r.name}</div>
                <div className="cm-room-meta">{r.userCount}/{r.maxUsers} 👥</div>
              </div>
              <div className="cm-room-meta" style={{ marginTop: 6 }}>
                {r.hasPassword ? '🔒 Şifreli oda' : '🌍 Açık oda'}
              </div>
              <button onClick={() => {
                setJoinRoomInput(r.id);
                setActiveTab('join');
                document.getElementById('cm-room-box')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                🚪 Katıl
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="cm-social-card">
          <div style={{ color: '#fff', fontWeight: 800 }}>Henüz herkese açık oda görünmüyor.</div>
          <div style={{ color: '#7f8c98', fontSize: 12, marginTop: 5 }}>İlk odayı sen oluştur ve burayı hareketlendirelim. 🚀</div>
        </div>
      )}
    </section>
  );
}
