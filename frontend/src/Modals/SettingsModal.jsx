export default function SettingsModal({
  hostUserId, userId, editRoomNameInput, setEditRoomNameInput, roomName,
  roomTheme, setRoomTheme, handleSaveSettings, roomUsersList,
  handleTransferAdmin, handleKickUser, setShowSettingsModal, currentTheme, styles
}) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ ...styles.card, width: '460px', textAlign: 'left' }}>
        <h3 style={{ margin: '0 0 16px 0', color: currentTheme.primary, fontSize: '18px', fontWeight: '800' }}>
          ⚙️ Oda Ayarları & Kişiler
        </h3>

        {hostUserId === userId ? (
          <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#8696a0', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                ODA İSMİ DEĞİŞTİR
              </label>
              <input
                type="text"
                value={editRoomNameInput || roomName}
                onChange={(e) => setEditRoomNameInput(e.target.value)}
                style={{ ...styles.input, width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#8696a0', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                ODA TEMASI SEÇ
              </label>
              <select
                value={roomTheme}
                onChange={(e) => setRoomTheme(e.target.value)}
                style={{ ...styles.input, width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}
              >
                <option value="default" style={{ background: '#111b21' }}>Koyu Yeşil (Varsayılan)</option>
                <option value="purple" style={{ background: '#111b21' }}>Gece Moru</option>
                <option value="blue" style={{ background: '#111b21' }}>Okyanus Mavisi</option>
                <option value="rose" style={{ background: '#111b21' }}>Romantik Kırmızı</option>
              </select>
            </div>

            <button onClick={handleSaveSettings} style={{ ...styles.buttonPrimary, width: '100%' }}>
              Ayarları Kaydet
            </button>
          </div>
        ) : (
          <div style={{ background: '#202c33', padding: '10px', borderRadius: '10px', fontSize: '12px', color: '#8696a0', marginBottom: '16px' }}>
            ℹ️ Oda adını ve temasını sadece oda yöneticisi değiştirebilir.
          </div>
        )}

        <div>
          <label style={{ fontSize: '11px', color: '#8696a0', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
            ODADAKİ KİŞİLER ({roomUsersList.length})
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
            {roomUsersList.map(u => (
              <div key={u.userId} style={{
                background: '#0b141a', padding: '8px 12px', borderRadius: '10px',
                border: '1px solid #222d34', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>
                  {u.avatar} {u.username} {u.userId === hostUserId && '👑 (Admin)'}
                </span>
                {hostUserId === userId && u.userId !== userId && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleTransferAdmin(u.userId)}
                      style={{ background: '#ffa502', border: 'none', color: '#000', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      👑 Admin Yap
                    </button>
                    <button
                      onClick={() => handleKickUser(u.userId)}
                      style={{ background: '#ff4757', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      🚫 At
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowSettingsModal(false)}
          style={{
            background: '#202c33', color: '#fff', border: '1px solid #222d34',
            width: '100%', padding: '10px', borderRadius: '10px', cursor: 'pointer',
            fontWeight: 'bold', marginTop: '16px'
          }}
        >
          Kapat
        </button>
      </div>
    </div>
  );
}
