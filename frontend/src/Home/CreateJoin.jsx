import { getStyles } from '../styles';

export default function CreateJoin({
  activeTab, setActiveTab, errorMessage,
  roomId, setRoomId, roomPassword, setRoomPassword, maxUsers, setMaxUsers,
  joinRoomInput, setJoinRoomInput, joinPassInput, setJoinPassInput,
  handleCreateRoomSubmit, handleJoinRoomSubmit, currentTheme
}) {
  const styles = getStyles(currentTheme);

  return (
    <section className="cm-section" id="cm-room-box">
      <div style={{ maxWidth: 650, margin: '0 auto' }}>
        <div className="cm-social-card">
          {errorMessage && (
            <div style={{ background: '#ea0038', color: '#fff', padding: '11px 13px', borderRadius: 12, fontWeight: 800, fontSize: 12, marginBottom: 14 }}>
              {errorMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, background: '#0b141a', padding: 5, borderRadius: 13, marginBottom: 16 }}>
            <button
              onClick={() => setActiveTab('create')}
              style={{
                flex: 1, padding: 11, border: 'none', borderRadius: 10,
                background: activeTab === 'create' ? '#00a884' : 'transparent',
                color: '#fff', fontWeight: 900
              }}
            >
              🚀 Oda Oluştur
            </button>
            <button
              onClick={() => setActiveTab('join')}
              style={{
                flex: 1, padding: 11, border: 'none', borderRadius: 10,
                background: activeTab === 'join' ? '#3742fa' : 'transparent',
                color: '#fff', fontWeight: 900
              }}
            >
              🚪 Odaya Katıl
            </button>
          </div>

          {activeTab === 'create' ? (
            <form onSubmit={handleCreateRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                placeholder="Oda ismi (boş bırakırsan otomatik)"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                style={styles.input}
              />
              <input
                type="password"
                placeholder="Şifre (isteğe bağlı)"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                style={styles.input}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <select
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(e.target.value)}
                  style={{ ...styles.input, flex: 1 }}
                >
                  <option value="2">2 Kişi</option>
                  <option value="4">4 Kişi</option>
                  <option value="8">8 Kişi</option>
                </select>
                <button type="submit" style={{ ...styles.buttonPrimary, flex: 1 }}>
                  Odayı Başlat 🚀
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleJoinRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                placeholder="Oda ismi"
                value={joinRoomInput}
                onChange={(e) => setJoinRoomInput(e.target.value)}
                style={styles.input}
              />
              <input
                type="password"
                placeholder="Şifre (varsa)"
                value={joinPassInput}
                onChange={(e) => setJoinPassInput(e.target.value)}
                style={styles.input}
              />
              <button
                type="submit"
                style={{ ...styles.buttonPrimary, background: 'linear-gradient(135deg,#3742fa,#5352ed)' }}
              >
                Odaya Giriş Yap 🚪
              </button>
            </form>
          )}

          <div style={{
            display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16,
            color: '#6f7d88', fontSize: 11, fontWeight: 800, flexWrap: 'wrap'
          }}>
            <span>👤 Hesapsız giriş</span>
            <span>🔒 Oda şifresi</span>
            <span>⚡ Anında senkron</span>
          </div>
        </div>
      </div>
    </section>
  );
}
