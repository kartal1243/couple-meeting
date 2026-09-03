import { useState, memo } from 'react';

const AVATARS = ['🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🦁', '🐸', '🐵', '🦄', '🐰', '🐲', '🤖', '👻', '🎃', '💀', '🎃', '👽', '🧙', '🧛', '🦸', '🧑‍🚀', '🧑‍🎤', '🧑‍💻'];
const AVATAR_COLORS = ['#7c3aed', '#2563eb', '#00a884', '#f59e0b', '#ec4899', '#ef4444', '#06b6d4', '#8b5cf6'];

function ProfileModal({ authUser, setShowProfileModal, saveProfile, friendOnlineStatuses, friends }) {
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
        width: 'min(440px, 100%)', maxHeight: '90vh',
        background: 'linear-gradient(180deg, rgba(15,23,42,.98), rgba(10,14,20,.98))',
        border: '1px solid rgba(255,255,255,.06)',
        borderRadius: 24, overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,.6)',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Header - sabit */}
        <div style={{
          padding: '20px 20px 14px', textAlign: 'center', flexShrink: 0,
          background: 'linear-gradient(180deg, rgba(124,58,237,.1), transparent)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: 17, fontWeight: 900 }}>👤 Profil</h3>
            <button onClick={() => setShowProfileModal(false)} style={{
              background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)',
              color: '#94a3b8', width: 30, height: 30, borderRadius: 8,
              cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>✕</button>
          </div>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: '0 auto 8px',
            background: `linear-gradient(135deg, ${AVATAR_COLORS[authUser?.username?.charCodeAt(0) % 8 || 0]}, ${AVATAR_COLORS[authUser?.username?.charCodeAt(0) % 8 || 0]}aa)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, border: '3px solid rgba(255,255,255,.1)',
            boxShadow: '0 8px 24px rgba(0,0,0,.3)'
          }}>
            {avatar}
          </div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 15 }}>{authUser?.username}</div>
          {authUser?.isVip && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3,
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              color: '#fff', padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900
            }}>👑 VIP</div>
          )}
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{getStatusLabel(status)}</div>
        </div>

        {/* Content - kaydırılabilir */}
        <div style={{ padding: '0 20px 16px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {/* Kullanıcı Adı */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, color: '#64748b', fontWeight: 800, display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>
              KULLANICI ADI
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20))}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)',
                borderRadius: 10, color: '#e2e8f0', padding: '9px 12px', fontSize: 12,
                outline: 'none', transition: 'all 0.2s'
              }}
            />
            <div style={{ fontSize: 9, color: '#475569', marginTop: 3 }}>3-20 karakter, sadece harf, sayı ve _</div>
          </div>

          {/* Avatar */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, color: '#64748b', fontWeight: 800, display: 'block', marginBottom: 6, letterSpacing: 0.5 }}>
              AVATAR
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {AVATARS.map(a => (
                <button key={a} onClick={() => setAvatar(a)} style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: avatar === a ? 'rgba(124,58,237,.2)' : 'rgba(255,255,255,.04)',
                  border: avatar === a ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,.06)',
                  fontSize: 17, cursor: 'pointer', transition: 'all 0.2s'
                }}>{a}</button>
              ))}
            </div>
          </div>

          {/* Durum */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, color: '#64748b', fontWeight: 800, display: 'block', marginBottom: 6, letterSpacing: 0.5 }}>
              DURUM
            </label>
            <div style={{ display: 'flex', gap: 5 }}>
              {[
                { key: 'online', label: '🟢 Açık' },
                { key: 'away', label: '🟡 Uzakta' },
                { key: 'busy', label: '🔴 Meşgul' },
                { key: 'offline', label: '⚫ Gizli' }
              ].map(s => (
                <button key={s.key} onClick={() => setStatus(s.key)} style={{
                  flex: 1, padding: '7px 2px', borderRadius: 8,
                  background: status === s.key ? 'rgba(124,58,237,.15)' : 'rgba(255,255,255,.03)',
                  border: status === s.key ? '1px solid #7c3aed55' : '1px solid rgba(255,255,255,.06)',
                  color: status === s.key ? '#a855f7' : '#64748b',
                  fontWeight: 800, fontSize: 9, cursor: 'pointer', transition: 'all 0.2s'
                }}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, color: '#64748b', fontWeight: 800, display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>
              HAKKINDA
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={150}
              placeholder="Kendin hakkında kısa bir şey yaz..."
              rows={2}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)',
                borderRadius: 10, color: '#e2e8f0', padding: '8px 12px', fontSize: 11,
                outline: 'none', resize: 'none', fontFamily: 'inherit'
              }}
            />
            <div style={{ fontSize: 9, color: '#475569', textAlign: 'right' }}>{bio.length}/150</div>
          </div>

          {/* Arkadaşlar */}
          {friends && friends.length > 0 && (
            <div>
              <label style={{ fontSize: 10, color: '#64748b', fontWeight: 800, display: 'block', marginBottom: 6, letterSpacing: 0.5 }}>
                ARKADAŞLAR ({friends.length})
              </label>
              {onlineFriends.length > 0 && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 9, color: '#22c55e', fontWeight: 800, marginBottom: 3 }}>🟢 Çevrimiçi ({onlineFriends.length})</div>
                  {onlineFriends.slice(0, 5).map(f => (
                    <div key={f.id} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px',
                      borderRadius: 6, background: 'rgba(34,197,94,.05)', marginBottom: 2
                    }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 4px rgba(34,197,94,.5)' }} />
                      <span style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 700 }}>{f.username}</span>
                    </div>
                  ))}
                  {onlineFriends.length > 5 && <div style={{ fontSize: 9, color: '#64748b', paddingLeft: 6 }}>+{onlineFriends.length - 5} daha</div>}
                </div>
              )}
              {offlineFriends.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, color: '#64748b', fontWeight: 800, marginBottom: 3 }}>⚫ Çevrimdışı ({offlineFriends.length})</div>
                  {offlineFriends.slice(0, 3).map(f => (
                    <div key={f.id} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px',
                      borderRadius: 6, background: 'rgba(255,255,255,.02)', marginBottom: 2
                    }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#475569' }} />
                      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>{f.username}</span>
                    </div>
                  ))}
                  {offlineFriends.length > 3 && <div style={{ fontSize: 9, color: '#64748b', paddingLeft: 6 }}>+{offlineFriends.length - 3} daha</div>}
                </div>
              )}
            </div>
          )}

          {saveMsg && (
            <div style={{
              background: 'rgba(0,168,132,.12)', color: '#00a884',
              padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800,
              border: '1px solid rgba(0,168,132,.2)', textAlign: 'center', marginTop: 10
            }}>{saveMsg}</div>
          )}
        </div>

        {/* Footer - her zaman görünür */}
        <div style={{
          padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,.06)',
          display: 'flex', gap: 8, flexShrink: 0, background: 'rgba(10,14,20,.5)'
        }}>
          <button onClick={() => setShowProfileModal(false)} style={{
            flex: 1, padding: '10px 0', borderRadius: 10,
            border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)',
            color: '#94a3b8', fontWeight: 800, fontSize: 12, cursor: 'pointer'
          }}>İptal</button>
          <button onClick={handleSave} style={{
            flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(124,58,237,.3)'
          }}>💾 Kaydet</button>
        </div>
      </div>
    </div>
  );
}

export default memo(ProfileModal);
