import { THEMES } from '../constants';
import { useState } from 'react';

const AVATAR_COLORS = ['#7c3aed', '#2563eb', '#00a884', '#f59e0b', '#ec4899', '#ef4444', '#06b6d4', '#8b5cf6'];
function getAvatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default function SettingsModal({
  hostUserId, userId, editRoomNameInput, setEditRoomNameInput, roomName,
  roomTheme, setRoomTheme, handleSaveSettings, roomUsersList,
  handleTransferAdmin, handleKickUser, setShowSettingsModal, currentTheme, styles, authUser,
  socket, roomId, currentRoomInfo
}) {
  const isHost = hostUserId === userId;
  const isVip = authUser?.isVip;
  const [tab, setTab] = useState('settings');
  const [newPassword, setNewPassword] = useState('');
  const [maxUsers, setMaxUsers] = useState(currentRoomInfo?.maxUsers || 2);
  const [saveMsg, setSaveMsg] = useState('');

  const getThemeLabel = (key) => {
    const labels = { default: '🟢 Koyu Yeşil', purple: '🟣 Gece Moru', blue: '🔵 Okyanus Mavisi', rose: '🩷 Romantik Kırmızı', gold: '🥇 Altın VIP', ocean: '🌊 Okyanus VIP', emerald: '💎 Zümrüt VIP', sunset: '🌅 Günbatımı VIP' };
    return labels[key] || key;
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 12, color: '#e2e8f0', padding: '10px 14px', fontSize: 13,
    outline: 'none', transition: 'all 0.2s'
  };

  const handlePasswordChange = async () => {
    if (!newPassword.trim() || newPassword.trim().length < 4) {
      setSaveMsg('✗ Şifre en az 4 karakter olmalı');
      setTimeout(() => setSaveMsg(''), 2000);
      return;
    }
    socket.emit('update_room_settings', { roomId, newPassword: newPassword.trim() });
    localStorage.setItem('cm_saved_pass', newPassword.trim());
    setSaveMsg('✓ Şifre güncellendi!');
    setTimeout(() => setSaveMsg(''), 2000);
    setNewPassword('');
  };

  const handleMaxUsersChange = () => {
    if (socket) socket.emit('room_action', { roomId, type: 'UPDATE_MAX_USERS', payload: { maxUsers } });
    setSaveMsg('✓ Maks. kullanıcı güncellendi!');
    setTimeout(() => setSaveMsg(''), 2000);
  };

  const handleSaveAll = () => {
    if (!isHost) return;
    // Room name + theme
    handleSaveSettings();
    // Max users
    if (socket) socket.emit('room_action', { roomId, type: 'UPDATE_MAX_USERS', payload: { maxUsers } });
    // Password
    if (newPassword.trim()) handlePasswordChange();
    setSaveMsg('✓ Tüm ayarlar kaydedildi!');
    setTimeout(() => { setSaveMsg(''); setShowSettingsModal(false); }, 1200);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(20px)',
      zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14
    }}>
      <div style={{
        width: 'min(460px, 100%)',
        background: 'linear-gradient(180deg, rgba(15,23,42,.98), rgba(10,14,20,.98))',
        border: '1px solid rgba(255,255,255,.06)',
        borderRadius: 24, maxHeight: '90vh', overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,.6), 0 0 0 1px rgba(124,58,237,.08)'
      }}>
        {/* Header with gradient */}
        <div style={{
          padding: '24px 24px 0', position: 'relative',
          background: 'linear-gradient(180deg, rgba(124,58,237,.08), transparent)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{
                fontSize: 10, fontWeight: 900, letterSpacing: 1,
                color: '#7c3aed', marginBottom: 4
              }}>ODA YÖNETİMİ</div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 900 }}>
                ⚙️ Ayarlar
              </h3>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                {roomUsersList.length} kişi odada
              </div>
            </div>
            <button onClick={() => setShowSettingsModal(false)}
              style={{
                background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)',
                color: '#94a3b8', width: 34, height: 34, borderRadius: 10,
                cursor: 'pointer', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,.15)'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.color = '#94a3b8'; }}
            >✕</button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginTop: 16 }}>
            {[
              { key: 'settings', icon: '⚙️', label: 'Ayarlar' },
              { key: 'users', icon: '👥', label: `Kişiler (${roomUsersList.length})` },
              { key: 'themes', icon: '🎨', label: 'Tema' }
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                flex: 1, padding: '10px 0', border: 'none', borderRadius: '10px 10px 0 0',
                background: tab === t.key ? 'rgba(124,58,237,.12)' : 'transparent',
                color: tab === t.key ? '#a855f7' : '#64748b',
                fontWeight: 800, fontSize: 12, cursor: 'pointer',
                borderBottom: tab === t.key ? '2px solid #7c3aed' : '2px solid transparent',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 20, maxHeight: 'calc(90vh - 130px)', overflowY: 'auto' }}>
          {/* Settings Tab */}
          {tab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {isHost ? (
                <>
                  <div>
                    <label style={{ fontSize: 10, color: '#64748b', fontWeight: 800, display: 'block', marginBottom: 6, letterSpacing: 0.5 }}>
                      ODA İSMİ
                    </label>
                    <input
                      type="text"
                      value={editRoomNameInput || roomName}
                      onChange={(e) => setEditRoomNameInput(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 10, color: '#64748b', fontWeight: 800, display: 'block', marginBottom: 6, letterSpacing: 0.5 }}>
                      🔒 ŞİFRE DEĞİŞTİR
                    </label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Yeni şifre (boş = şifresiz)"
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button onClick={handlePasswordChange} style={{
                        background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                        color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 12,
                        fontWeight: 800, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap'
                      }}>Kaydet</button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 10, color: '#64748b', fontWeight: 800, display: 'block', marginBottom: 6, letterSpacing: 0.5 }}>
                      👥 MAKS. KULLANICI
                    </label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {[2, 3, 4, 5, 6, 8].map(n => (
                        <button key={n} onClick={() => { setMaxUsers(n); }} style={{
                          width: 40, height: 36, borderRadius: 10,
                          background: maxUsers === n ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,.04)',
                          border: maxUsers === n ? '1px solid #7c3aed55' : '1px solid rgba(255,255,255,.06)',
                          color: maxUsers === n ? '#fff' : '#64748b',
                          fontWeight: 900, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s'
                        }}>{n}</button>
                      ))}
                    </div>
                  </div>

                  <button onClick={handleSaveAll} style={{
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    color: '#fff', border: 'none', padding: '12px', fontSize: 13,
                    fontWeight: 800, borderRadius: 12, cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(124,58,237,.3)',
                    transition: 'all 0.2s'
                  }}>
                    ✓ Ayarları Kaydet
                  </button>
                </>
              ) : (
                <div style={{
                  background: 'rgba(124,58,237,.06)', padding: 14, borderRadius: 14,
                  fontSize: 12, color: '#94a3b8', border: '1px solid rgba(124,58,237,.1)',
                  lineHeight: 1.5
                }}>
                  <span style={{ fontSize: 18, display: 'block', marginBottom: 6 }}>ℹ️</span>
                  Oda ayarlarını sadece <b style={{ color: '#a855f7' }}>oda yöneticisi</b> değiştirebilir.
                </div>
              )}

              {/* Save message */}
              {saveMsg && (
                <div style={{
                  background: saveMsg.startsWith('✓') ? 'rgba(0,168,132,.12)' : 'rgba(239,68,68,.12)',
                  color: saveMsg.startsWith('✓') ? '#00a884' : '#ef4444',
                  padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 800,
                  border: `1px solid ${saveMsg.startsWith('✓') ? 'rgba(0,168,132,.2)' : 'rgba(239,68,68,.2)'}`,
                  textAlign: 'center'
                }}>{saveMsg}</div>
              )}

              {/* Room info cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{
                  background: 'rgba(255,255,255,.03)', padding: '12px 14px', borderRadius: 12,
                  border: '1px solid rgba(255,255,255,.05)'
                }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>👥</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{roomUsersList.length}</div>
                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>Kişi</div>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,.03)', padding: '12px 14px', borderRadius: 12,
                  border: '1px solid rgba(255,255,255,.05)'
                }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>🎨</div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>{getThemeLabel(roomTheme)}</div>
                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>Tema</div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {tab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {roomUsersList.map(u => {
                const isUserHost = u.userId === hostUserId;
                const isMe = u.userId === userId;
                const color = getAvatarColor(u.username);
                return (
                  <div key={u.userId} style={{
                    background: isUserHost
                      ? 'linear-gradient(135deg, rgba(124,58,237,.08), rgba(236,72,153,.04))'
                      : 'rgba(255,255,255,.03)',
                    padding: '12px 14px', borderRadius: 14,
                    border: isUserHost
                      ? '1px solid rgba(124,58,237,.15)'
                      : '1px solid rgba(255,255,255,.04)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'all 0.2s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                        background: `linear-gradient(135deg, ${color}, ${color}bb)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, boxShadow: `0 4px 12px ${color}22`,
                        border: `1px solid ${color}33`
                      }}>
                        {u.avatar || '🐱'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {u.username}
                          {isMe && (
                            <span style={{
                              fontSize: 9, background: 'rgba(0,168,132,.15)', color: '#00a884',
                              padding: '1px 6px', borderRadius: 6, fontWeight: 800
                            }}>SEN</span>
                          )}
                        </div>
                        <div style={{ fontSize: 10, color: isUserHost ? '#a855f7' : '#64748b', fontWeight: 700, marginTop: 1 }}>
                          {isUserHost ? '👑 Yönetici' : '👤 Üye'}
                        </div>
                      </div>
                    </div>
                    {isHost && !isMe && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { if (confirm(`${u.username} Admin yapılsın mı?`)) handleTransferAdmin(u.userId); }}
                          style={{
                            background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.2)',
                            color: '#f59e0b', padding: '6px 10px', borderRadius: 8,
                            fontSize: 10, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
                          }}>
                          👑 Yetki
                        </button>
                        <button onClick={() => { if (confirm(`${u.username} odadan atılsın mı?`)) handleKickUser(u.userId); }}
                          style={{
                            background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.2)',
                            color: '#ef4444', padding: '6px 10px', borderRadius: 8,
                            fontSize: 10, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
                          }}>
                          🚫 At
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Themes Tab */}
          {tab === 'themes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!isHost && (
                <div style={{
                  background: 'rgba(124,58,237,.06)', padding: 12, borderRadius: 12,
                  fontSize: 11, color: '#94a3b8', border: '1px solid rgba(124,58,237,.1)'
                }}>
                  ℹ️ Tema değiştirmek için yönetici olmalısın.
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {Object.entries(THEMES).map(([key, theme]) => {
                  const isLocked = theme.vip && !isVip;
                  const isActive = roomTheme === key;
                  return (
                    <button key={key} type="button"
                      disabled={isLocked || !isHost}
                      onClick={() => { if (isHost) setRoomTheme(key); }}
                      style={{
                        padding: '14px', borderRadius: 14,
                        border: isActive ? `2px solid ${theme.primary}` : '1px solid rgba(255,255,255,.06)',
                        background: isActive ? `${theme.primary}12` : 'rgba(255,255,255,.02)',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        opacity: isLocked ? 0.35 : 1,
                        textAlign: 'left', transition: 'all 0.2s'
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 800,
                          color: isActive ? theme.primary : '#e2e8f0'
                        }}>
                          {getThemeLabel(key)}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {isLocked && <span style={{ fontSize: 10 }}>🔒</span>}
                          {isActive && <span style={{
                            fontSize: 10, color: theme.primary,
                            background: `${theme.primary}20`, padding: '2px 6px', borderRadius: 6
                          }}>✓</span>}
                        </div>
                      </div>
                      <div style={{
                        width: '100%', height: 4, borderRadius: 2,
                        background: 'rgba(255,255,255,.06)', marginTop: 8
                      }}>
                        <div style={{
                          width: '100%', height: '100%', borderRadius: 2,
                          background: `linear-gradient(90deg, ${theme.primary}, ${theme.primary}66)`
                        }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <button onClick={() => setShowSettingsModal(false)} style={{
            width: '100%', padding: 10, borderRadius: 12,
            border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)',
            color: '#94a3b8', fontWeight: 800, fontSize: 12, cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
