import { useState } from 'react';

const AVATARS = ['🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🦁', '🐸', '🐵', '🦄', '🐰', '🐲', '🤖', '👻', '🎃', '💀', '🎃', '👽', '🧙', '🧛', '🦸', '🧑‍🚀', '🧑‍🎤', '🧑‍💻'];
const AVATAR_COLORS = ['#7c3aed', '#2563eb', '#00a884', '#f59e0b', '#ec4899', '#ef4444', '#06b6d4', '#8b5cf6'];

export default function ProfileModal({ authUser, setShowProfileModal, saveProfile, friendOnlineStatuses, friends }) {
  const [username, setUsername] = useState(authUser?.username || '');
  const [bio, setBio] = useState(authUser?.bio || '');
  const [avatar, setAvatar] = useState(authUser?.avatar || '🐱');
  const [status, setStatus] = useState(authUser?.status || 'online');
  const [saveMsg, setSaveMsg] = useState('');

  const handleSave = () => {
    saveProfile({ username, bio, avatar, status });
    setSaveMsg('✓ Profil güncellendi!');
    setTimeout(() => { setSaveMsg(''); setShowProfileModal(false); }, 1200);
  };

  const getStatusLabel = (s) => {
    const labels = { online: '🟢 Çevrimiçi', away: '🟡 Uzakta', busy: '🔴 Meşgul', offline: '⚫ Çevrimdışı' };
    return labels[s] || labels.online;
  };

  const onlineFriends = friends?.filter(f => friendOnlineStatuses?.[f.username]?.isOnline) || [];
  const offlineFriends = friends?.filter(f => !friendOnlineStatuses?.[f.username]?.isOnline) || [];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 30000,
      background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14
    }}>
      <div style={{
        width: 'min(440px, 100%)',
        background: 'linear-gradient(180deg, rgba(15,23,42,.98), rgba(10,14,20,.98))',
        border: '1px solid rgba(255,255,255,.06)',
        borderRadius: 24, maxHeight: '90vh', overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,.6)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 24px 16px', textAlign: 'center',
          background: 'linear-gradient(180deg, rgba(124,58,237,.1), transparent)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 900 }}>👤 Profil</h3>
            <button onClick={() => setShowProfileModal(false)} style={{
              background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)',
              color: '#94a3b8', width: 32, height: 32, borderRadius: 10,
              cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>✕</button>
          </div>

          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: 24, margin: '0 auto 12px',
            background: `linear-gradient(135deg, ${AVATAR_COLORS[authUser?.username?.charCodeAt(0) % 8 || 0]}, ${AVATAR_COLORS[authUser?.username?.charCodeAt(0) % 8 || 0]}aa)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40, border: '3px solid rgba(255,255,255,.1)',
            boxShadow: '0 10px 30px rgba(0,0,0,.3)'
          }}>
            {avatar}
          </div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>{authUser?.username}</div>
          {authUser?.isVip && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4,
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              color: '#fff', padding: '3px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900
            }}>👑 VIP Üye</div>
          )}
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>{getStatusLabel(status)}</div>
        </div>

        {/* Content */}
        <div style={{ padding: 20, overflowY: 'auto', maxHeight: 'calc(90vh - 200px)' }}>
          {/* Avatar Seçimi */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, color: '#64748b', fontWeight: 800, display: 'block', marginBottom: 8, letterSpacing: 0.5 }}>
              AVATAR
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {AVATARS.map(a => (
                <button key={a} onClick={() => setAvatar(a)} style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: avatar === a ? 'rgba(124,58,237,.2)' : 'rgba(255,255,255,.04)',
                  border: avatar === a ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,.06)',
                  fontSize: 20, cursor: 'pointer', transition: 'all 0.2s'
                }}>{a}</button>
              ))}
            </div>
          </div>

          {/* Durum */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, color: '#64748b', fontWeight: 800, display: 'block', marginBottom: 8, letterSpacing: 0.5 }}>
              DURUM
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { key: 'online', label: '🟢 Çevrimiçi' },
                { key: 'away', label: '🟡 Uzakta' },
                { key: 'busy', label: '🔴 Meşgul' },
                { key: 'offline', label: '⚫ Görünmez' }
              ].map(s => (
                <button key={s.key} onClick={() => setStatus(s.key)} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 10,
                  background: status === s.key ? 'rgba(124,58,237,.15)' : 'rgba(255,255,255,.03)',
                  border: status === s.key ? '1px solid #7c3aed55' : '1px solid rgba(255,255,255,.06)',
                  color: status === s.key ? '#a855f7' : '#64748b',
                  fontWeight: 800, fontSize: 10, cursor: 'pointer', transition: 'all 0.2s'
                }}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, color: '#64748b', fontWeight: 800, display: 'block', marginBottom: 6, letterSpacing: 0.5 }}>
              HAKKINDA
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={150}
              placeholder="Kendin hakkında kısa bir şey yaz..."
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)',
                borderRadius: 12, color: '#e2e8f0', padding: '10px 14px', fontSize: 12,
                outline: 'none', resize: 'none', fontFamily: 'inherit'
              }}
            />
            <div style={{ fontSize: 10, color: '#475569', textAlign: 'right' }}>{bio.length}/150</div>
          </div>

          {/* Arkadaşlar */}
          {friends && friends.length > 0 && (
            <div>
              <label style={{ fontSize: 10, color: '#64748b', fontWeight: 800, display: 'block', marginBottom: 8, letterSpacing: 0.5 }}>
                ARKADAŞLAR ({friends.length})
              </label>
              {onlineFriends.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 800, marginBottom: 4 }}>🟢 Çevrimiçi ({onlineFriends.length})</div>
                  {onlineFriends.map(f => (
                    <div key={f.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                      borderRadius: 8, background: 'rgba(34,197,94,.05)', marginBottom: 2
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', background: '#22c55e',
                        boxShadow: '0 0 6px rgba(34,197,94,.5)'
                      }} />
                      <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 700 }}>{f.username}</span>
                    </div>
                  ))}
                </div>
              )}
              {offlineFriends.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, marginBottom: 4 }}>⚫ Çevrimdışı ({offlineFriends.length})</div>
                  {offlineFriends.map(f => (
                    <div key={f.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                      borderRadius: 8, background: 'rgba(255,255,255,.02)', marginBottom: 2
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#475569' }} />
                      <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>{f.username}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Save message */}
          {saveMsg && (
            <div style={{
              background: 'rgba(0,168,132,.12)', color: '#00a884',
              padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 800,
              border: '1px solid rgba(0,168,132,.2)', textAlign: 'center', marginTop: 12
            }}>{saveMsg}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', gap: 8 }}>
          <button onClick={() => setShowProfileModal(false)} style={{
            flex: 1, padding: 10, borderRadius: 12,
            border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)',
            color: '#94a3b8', fontWeight: 800, fontSize: 12, cursor: 'pointer'
          }}>İptal</button>
          <button onClick={handleSave} style={{
            flex: 1, padding: 10, borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(124,58,237,.3)'
          }}>Kaydet</button>
        </div>
      </div>
    </div>
  );
}
