import { THEMES } from '../constants';

export default function SettingsModal({
  hostUserId, userId, editRoomNameInput, setEditRoomNameInput, roomName,
  roomTheme, setRoomTheme, handleSaveSettings, roomUsersList,
  handleTransferAdmin, handleKickUser, setShowSettingsModal, currentTheme, styles, authUser
}) {
  const isHost = hostUserId === userId;
  const isVip = authUser?.isVip;

  const getThemeLabel = (key) => {
    const labels = { default: '🟢 Koyu Yeşil', purple: '🟣 Gece Moru', blue: '🔵 Okyanus Mavisi', rose: '🩷 Romantik Kırmızı', gold: '🥇 Altın VIP', ocean: '🌊 Okyanus VIP', emerald: '💎 Zümrüt VIP', sunset: '🌅 Günbatımı VIP' };
    return labels[key] || key;
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14
    }}>
      <div style={{
        width: 'min(480px, 100%)', background: 'linear-gradient(180deg, #0f1a24, #0a0f14)',
        border: '1px solid #1e2d3a', borderRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ color: currentTheme.primary, fontSize: 10, fontWeight: 900 }}>ODA YÖNETİMİ</div>
            <h3 style={{ margin: '4px 0 0', color: '#fff', fontSize: 18, fontWeight: 900 }}>⚙️ Ayarlar & Kişiler</h3>
          </div>
          <button onClick={() => setShowSettingsModal(false)}
            style={{ background: '#202c33', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 10, cursor: 'pointer', fontSize: 13 }}>
            ✕
          </button>
        </div>

        {isHost ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            {/* Oda Adı */}
            <div>
              <label style={{ fontSize: 11, color: '#7f8c98', fontWeight: 800, marginBottom: 4, display: 'block' }}>ODA İSMİ</label>
              <input type="text" value={editRoomNameInput || roomName} onChange={(e) => setEditRoomNameInput(e.target.value)}
                style={{ ...styles.input, width: '100%', boxSizing: 'border-box' }} />
            </div>

            {/* Tema Seçimi */}
            <div>
              <label style={{ fontSize: 11, color: '#7f8c98', fontWeight: 800, marginBottom: 8, display: 'block' }}>TEMA (Sohbet + arkaplan dahil)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {Object.entries(THEMES).map(([key, theme]) => {
                  const isLocked = theme.vip && !isVip;
                  const isActive = roomTheme === key;
                  return (
                    <button key={key} type="button"
                      disabled={isLocked}
                      onClick={() => { setRoomTheme(key); }}
                      style={{
                        padding: '10px 12px', borderRadius: 12, border: isActive ? `2px solid ${theme.primary}` : '2px solid #25313a',
                        background: isActive ? `${theme.primary}15` : '#111b21', cursor: isLocked ? 'not-allowed' : 'pointer',
                        opacity: isLocked ? 0.4 : 1, textAlign: 'left', transition: 'all 0.15s'
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 900, color: isActive ? theme.primary : '#e9edef' }}>
                          {getThemeLabel(key)}
                        </span>
                        {isLocked && <span style={{ fontSize: 10 }}>🔒</span>}
                        {isActive && <span style={{ fontSize: 10, color: theme.primary }}>✓</span>}
                      </div>
                      <div style={{ width: '100%', height: 4, borderRadius: 2, background: '#1a2634', marginTop: 6 }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${theme.primary}, ${theme.cardBg})` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={handleSaveSettings}
              style={{ ...styles.buttonPrimary, width: '100%', padding: '12px', fontSize: 14 }}>
              ✓ Ayarları Kaydet
            </button>
          </div>
        ) : (
          <div style={{ background: '#111b21', padding: 12, borderRadius: 12, fontSize: 12, color: '#7f8c98', marginBottom: 16, border: '1px solid #25313a' }}>
            ℹ️ Oda adını ve temasını sadece oda yöneticisi değiştirebilir.
          </div>
        )}

        {/* Kişiler */}
        <div>
          <label style={{ fontSize: 11, color: '#7f8c98', fontWeight: 800, marginBottom: 8, display: 'block' }}>
            ODADAKİ KİŞİLER ({roomUsersList.length})
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
            {roomUsersList.map(u => {
              const isUserHost = u.userId === hostUserId;
              const isMe = u.userId === userId;
              return (
                <div key={u.userId} style={{
                  background: isUserHost ? '#1a2634' : '#0b141a', padding: '10px 12px', borderRadius: 12,
                  border: isUserHost ? `1px solid ${currentTheme.primary}30` : '1px solid #222d34',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{u.avatar}</span>
                    <div>
                      <div style={{ fontSize: 13, color: '#fff', fontWeight: 900 }}>
                        {u.username} {isMe && '(Sen)'}
                      </div>
                      <div style={{ fontSize: 10, color: isUserHost ? currentTheme.primary : '#63727d', fontWeight: 700 }}>
                        {isUserHost ? '👑 Yönetici' : '👤 Üye'}
                      </div>
                    </div>
                  </div>
                  {isHost && !isMe && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { if (confirm(`${u.username} Admin yapılsın mı?`)) handleTransferAdmin(u.userId); }}
                        style={{ background: '#f59e0b', border: 'none', color: '#000', padding: '5px 8px', borderRadius: 8, fontSize: 10, fontWeight: 900, cursor: 'pointer' }}>
                        👑 Yetki Ver
                      </button>
                      <button onClick={() => { if (confirm(`${u.username} odadan atılsın mı?`)) handleKickUser(u.userId); }}
                        style={{ background: '#ea0038', border: 'none', color: '#fff', padding: '5px 8px', borderRadius: 8, fontSize: 10, fontWeight: 900, cursor: 'pointer' }}>
                        🚫 At
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={() => setShowSettingsModal(false)}
          style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid #25313a', background: '#111b21', color: '#7f8c98', fontWeight: 800, cursor: 'pointer', marginTop: 16 }}>
          Kapat
        </button>
      </div>
    </div>
  );
}
