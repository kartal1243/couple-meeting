import { useState, memo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

const AMBIENCE_OPTIONS = [
  { id: 'none', label: '🎬 Standart' },
  { id: 'car_rain', label: '🚗🌧️ Yağmur & Araba' },
  { id: 'cinema', label: '🍿 Sinema' },
  { id: 'cafe', label: '☕ Kafe' },
  { id: 'campfire', label: '🔥 Kamp Ateşi' }
];

function Header({
  roomName, currentTheme, isConnected, currentRoomInfo, showInstallBtn,
  handleInstallApp, setShowSettingsModal, setShowProfileModal, authUser, myAvatar, handleLeaveRoom,
  roomUsersList, hostUserId, onCloseRoom, roomId, userId, username,
  socket, roomDateState, setRoomDateState
}) {
  const navigate = useNavigate();
  const [showUsers, setShowUsers] = useState(false);
  const [showAmbienceMenu, setShowAmbienceMenu] = useState(false);
  const [showQuickLeave, setShowQuickLeave] = useState(false);
  const [shareTooltip, setShareTooltip] = useState('');
  const [remainingSecs, setRemainingSecs] = useState(600);
  const usersRef = useRef(null);
  const ambienceRef = useRef(null);

  const activeAmbience = roomDateState?.dateAmbience || roomDateState?.dateConcept || 'none';
  const isDateActive = Boolean(roomDateState?.isDateRoom || (activeAmbience && activeAmbience !== 'none'));
  const myDisplayName = authUser?.username || username || 'Izleyici';
  const hasVotedExtend = Array.isArray(roomDateState?.dateExtendVotes) && roomDateState.dateExtendVotes.includes(myDisplayName);

  useEffect(() => {
    if (!isDateActive || roomDateState?.dateExtended) return;
    const startTs = roomDateState?.dateStartedAt || Date.now();
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTs) / 1000);
      setRemainingSecs(Math.max(0, 600 - elapsed));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [isDateActive, roomDateState?.dateStartedAt, roomDateState?.dateExtended]);

  const formatTimer = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSelectAmbience = (ambience) => {
    setShowAmbienceMenu(false);
    if (setRoomDateState) {
      setRoomDateState((prev) => ({
        ...prev,
        dateAmbience: ambience,
        dateStartedAt: prev?.dateStartedAt || (ambience !== 'none' ? Date.now() : null)
      }));
    }
    if (socket && roomId) {
      socket.emit('date_room_action', { roomId, type: 'SET_AMBIENCE', ambience });
    }
  };

  const handleExtendDate = () => {
    if (setRoomDateState) {
      setRoomDateState((prev) => {
        const votes = Array.from(new Set([...(prev?.dateExtendVotes || []), myDisplayName]));
        return {
          ...prev,
          dateExtendVotes: votes,
          dateExtended: votes.length >= 2 || prev?.dateExtended
        };
      });
    }
    if (socket && roomId) {
      socket.emit('date_room_action', { roomId, type: 'EXTEND_DATE', username: myDisplayName });
    }
  };

  const handleNextDate = () => {
    if (socket) socket.emit('leave_room');
    navigate('/date');
  };

  const isHost = Boolean(
    hostUserId && (
      hostUserId === authUser?.username ||
      (userId && hostUserId === userId) ||
      (username && hostUserId === username)
    )
  );
  const liveDotStyle = {
    width: 8, height: 8, borderRadius: '50%', background: isConnected ? '#22c55e' : '#ef4444',
    boxShadow: isConnected ? '0 0 8px rgba(34,197,94,.6)' : 'none',
    animation: isConnected ? 'cmPulseLive 2s ease-in-out infinite' : 'none', flexShrink: 0
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowQuickLeave(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!showUsers && !showAmbienceMenu) return;
    const handleClickOutside = (e) => {
      if (usersRef.current && !usersRef.current.contains(e.target)) {
        setShowUsers(false);
      }
      if (ambienceRef.current && !ambienceRef.current.contains(e.target)) {
        setShowAmbienceMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showUsers, showAmbienceMenu]);

  const currentAmbienceMeta = AMBIENCE_OPTIONS.find((a) => a.id === activeAmbience) || AMBIENCE_OPTIONS[0];

  return (
    <header className="cm-room-topbar" style={{
      height: 60, padding: '0 14px',
      background: `linear-gradient(135deg, ${(currentTheme?.primary || '#7c3aed')}2e, rgba(15,23,42,.95) 40%, rgba(30,41,59,.95))`,
      backdropFilter: 'blur(20px)', borderBottom: `1px solid ${(currentTheme?.primary || '#ffffff')}33`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
      flexShrink: 0, width: '100vw', boxSizing: 'border-box',
      position: 'relative', zIndex: 100
    }}>
      {/* Animated gradient line at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${currentTheme?.primary || '#7c3aed'}, ${currentTheme?.primary || '#ec4899'}, #00a884, ${currentTheme?.primary || '#7c3aed'})`,
        backgroundSize: '300% 100%', animation: 'cmGradientFlow 4s linear infinite'
      }} />

      <div className="cm-topbar-left" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
        {/* Yeni logo: kompakt marka rozeti */}
        <div
          className="cm-brand"
          style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}
        >
          <div className="cm-brand-logo" style={{
            width: 42, height: 42, borderRadius: 13, flexShrink: 0,
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, boxShadow: '0 4px 14px rgba(124,58,237,.4)',
            border: '1px solid rgba(255,255,255,.15)', position: 'relative'
          }}>
            💕
            <span style={{
              position: 'absolute', bottom: -2, right: -2, width: 10, height: 10,
              borderRadius: '50%', background: isConnected ? '#22c55e' : '#ef4444',
              border: '2px solid #0f172a'
            }} />
          </div>
          <div style={{ minWidth: 0, lineHeight: 1.2 }}>
            <h2 className="cm-room-title" style={{
              margin: 0, color: '#fff', fontSize: 13.5, fontWeight: 900,
              letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              maxWidth: '28vw'
            }}>
              {roomName}
            </h2>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>
              👥 {currentRoomInfo.userCount}/{currentRoomInfo.maxUsers}
            </div>
          </div>
        </div>

        {/* Users pill (desktop & mobile) */}
        <div
          ref={usersRef}
          className="cm-users-pill"
          style={{
            position: 'relative', fontSize: 10, fontWeight: 800,
            padding: '4px 10px', borderRadius: 20, cursor: 'pointer', userSelect: 'none',
            background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)',
            color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: 6,
            transition: 'all 0.2s', flexShrink: 0
          }}
          onClick={(e) => { e.stopPropagation(); setShowUsers(!showUsers); }}
        >
          <span style={liveDotStyle} />
          <span>{isConnected ? 'Canlı' : '...'} • 👥 {currentRoomInfo.userCount}/{currentRoomInfo.maxUsers}</span>

          {showUsers && roomUsersList && roomUsersList.length > 0 && (
            <div style={{
              position: 'absolute', top: 32, left: 0, minWidth: 220,
              background: 'rgba(15,23,42,.95)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,.08)', borderRadius: 14,
              padding: 8, zIndex: 9999, boxShadow: '0 20px 50px rgba(0,0,0,.6)'
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, padding: '4px 8px', marginBottom: 4 }}>
                ODA KİŞİLERİ ({roomUsersList.length})
              </div>
              {roomUsersList.map((u) => (
                <div key={u.userId || u.socketId} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px', borderRadius: 8, fontSize: 12,
                  background: 'rgba(255,255,255,.03)', marginBottom: 2
                }}>
                  <span style={{ fontSize: 16 }}>{u.avatar || '🐱'}</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 700, flex: 1 }}>{u.username || 'İzleyici'}</span>
                  {(u.userId === hostUserId || u.username === hostUserId) && (
                    <span style={{
                      fontSize: 9, background: 'linear-gradient(135deg, rgba(234,179,8,.15), rgba(251,191,36,.1))',
                      color: '#eab308', padding: '2px 8px', borderRadius: 6, fontWeight: 800,
                      border: '1px solid rgba(234,179,8,.2)'
                    }}>
                      👑 YÖNETİCİ
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ✨ Date Modu Ambience Selector Pill */}
        <div ref={ambienceRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowAmbienceMenu((v) => !v); }}
            style={{
              padding: '5px 11px', borderRadius: 999, cursor: 'pointer',
              background: activeAmbience !== 'none'
                ? 'linear-gradient(135deg, rgba(244,63,94,.24), rgba(168,85,247,.24))'
                : 'rgba(255,255,255,.06)',
              border: activeAmbience !== 'none'
                ? '1px solid rgba(251,113,133,.5)'
                : '1px solid rgba(255,255,255,.12)',
              color: activeAmbience !== 'none' ? '#fda4af' : '#cbd5e1',
              fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 5
            }}
          >
            <span>✨ Date Modu:</span>
            <span style={{ color: '#fff', fontWeight: 900 }}>{currentAmbienceMeta.label}</span>
          </button>

          {showAmbienceMenu && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute', top: 34, left: 0, minWidth: 200,
                background: 'rgba(15,23,42,.97)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(251,113,133,.3)', borderRadius: 14,
                padding: 6, zIndex: 9999, boxShadow: '0 20px 50px rgba(0,0,0,.65)',
                display: 'flex', flexDirection: 'column', gap: 3
              }}
            >
              <div style={{ fontSize: 10, color: '#fda4af', fontWeight: 900, padding: '4px 8px' }}>
                ✨ ODA DATE AMBİYANSI SEÇ
              </div>
              {AMBIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectAmbience(opt.id)}
                  style={{
                    textAlign: 'left', padding: '7px 10px', borderRadius: 9, cursor: 'pointer',
                    border: 'none',
                    background: activeAmbience === opt.id ? 'rgba(244,63,94,.22)' : 'transparent',
                    color: activeAmbience === opt.id ? '#fff' : '#cbd5e1',
                    fontSize: 12, fontWeight: 800
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 10:00 Speed Date Sayacı & Beğendim/Sonraki Date Kontrolleri */}
        {isDateActive && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
            padding: '4px 8px', borderRadius: 999,
            background: 'rgba(15,23,42,.75)', border: '1px solid rgba(251,113,133,.3)'
          }}>
            {roomDateState?.dateExtended ? (
              <span style={{ color: '#4ade80', fontSize: 11, fontWeight: 900, padding: '0 4px' }}>
                💖 Eşleşme Onaylandı! (Süresiz Date)
              </span>
            ) : (
              <>
                <span style={{
                  color: remainingSecs < 60 ? '#fb7185' : '#fde047',
                  fontSize: 11, fontWeight: 900, fontVariantNumeric: 'tabular-nums'
                }}>
                  ⏱️ {formatTimer(remainingSecs)}
                </span>
                <button
                  type="button"
                  onClick={handleExtendDate}
                  style={{
                    padding: '4px 9px', borderRadius: 999, border: 'none', cursor: 'pointer',
                    background: hasVotedExtend
                      ? 'rgba(34,197,94,.25)'
                      : 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: '#fff', fontSize: 10.5, fontWeight: 900
                  }}
                  title="İki taraf da tıkladığında Date süresiz olur!"
                >
                  {hasVotedExtend ? '💚 Onayladın (Partner Bekleniyor)' : '💚 Beğendim / Süreyi Uzat'}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleNextDate}
              style={{
                padding: '4px 8px', borderRadius: 999,
                border: '1px solid rgba(255,255,255,.15)',
                background: 'rgba(255,255,255,.06)',
                color: '#cbd5e1', fontSize: 10.5, fontWeight: 800, cursor: 'pointer'
              }}
              title="Bu odadan çıkıp Sanal Date lobisinde yeni partner bul"
            >
              ⏭️ Sonraki Date
            </button>
          </div>
        )}
      </div>

      <div className="cm-topbar-actions" style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        {showInstallBtn && (
          <button onClick={handleInstallApp} className="cm-install-btn" style={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff',
            border: 'none',
            padding: '6px 14px', borderRadius: 10, cursor: 'pointer',
            fontWeight: 800, fontSize: 11, transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(34,197,94,.3)'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span className="cm-install-text">Uygulamayı İndir</span>
          </button>
        )}
        <button onClick={() => setShowSettingsModal(true)} className="cm-icon-btn" title="Ayarlar" style={{
          background: 'rgba(255,255,255,.05)', color: '#94a3b8',
          border: '1px solid rgba(255,255,255,.08)',
          padding: '6px 10px', borderRadius: 10, cursor: 'pointer',
          fontWeight: 800, fontSize: 13, transition: 'all 0.2s'
        }}>⚙️</button>
        <button onClick={() => {
          const url = window.location.origin + '/room/' + encodeURIComponent(roomId);
          if (navigator.share) {
            navigator.share({ title: roomName || 'Couple Meeting', text: 'Bu odaya katıl!', url });
          } else {
            navigator.clipboard.writeText(url);
            setShareTooltip('Link kopyalandı!');
            setTimeout(() => setShareTooltip(''), 2000);
          }
        }} className="cm-icon-btn" style={{
          background: 'rgba(255,255,255,.05)', color: '#94a3b8',
          border: '1px solid rgba(255,255,255,.08)',
          padding: '6px 10px', borderRadius: 10, cursor: 'pointer',
          fontWeight: 800, fontSize: 13, transition: 'all 0.2s',
          position: 'relative'
        }} title="Oda linkini paylaş">📤</button>
        {shareTooltip && (
          <div style={{
            position: 'absolute', top: 50, right: 100, background: '#00a884', color: '#fff',
            padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, zIndex: 99999,
            boxShadow: '0 4px 12px rgba(0,0,0,.3)'
          }}>{shareTooltip}</div>
        )}
        {authUser && (
          <div onClick={() => setShowProfileModal(true)} className="cm-profile-chip" style={{
            background: 'linear-gradient(135deg, rgba(0,168,132,.1), rgba(0,168,132,.05))',
            color: '#00a884', border: '1px solid rgba(0,168,132,.2)',
            padding: '6px 10px', borderRadius: 10, fontWeight: 800, fontSize: 11,
            display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,168,132,.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,168,132,.1), rgba(0,168,132,.05))'; }}
          >
            <span>{authUser.avatar || myAvatar}</span>
            <span className="cm-profile-name" style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {authUser.username}
            </span>
          </div>
        )}
        <button onClick={() => setShowQuickLeave(true)} className="cm-leave-btn" style={{
          background: 'rgba(239,68,68,.1)', color: '#ef4444',
          border: '1px solid rgba(239,68,68,.2)',
          padding: '6px 12px', borderRadius: 10, cursor: 'pointer',
          fontWeight: 800, fontSize: 11, transition: 'all 0.2s'
        }}><span className="cm-leave-text">✕ Çıkış</span><span className="cm-leave-short">✕</span></button>
      </div>

      {/* Quick Leave Modal */}
      {showQuickLeave && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14
        }} onClick={() => setShowQuickLeave(false)}>
          <div style={{
            width: 'min(340px, 100%)',
            background: 'linear-gradient(180deg, rgba(15,23,42,.98), rgba(10,14,20,.98))',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 20, padding: 24, textAlign: 'center'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🚪</div>
            <h3 style={{ color: '#fff', margin: '0 0 6px', fontSize: 16, fontWeight: 900 }}>Odadan Çık</h3>
            <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 16px' }}>Emin misin?</p>

            {isHost && (
              <button onClick={() => { setShowQuickLeave(false); onCloseRoom?.(); }} style={{
                width: '100%', padding: '11px', marginBottom: 6, borderRadius: 12,
                background: 'rgba(239,68,68,.15)', color: '#ef4444',
                fontWeight: 800, fontSize: 12, cursor: 'pointer',
                border: '1px solid rgba(239,68,68,.25)', transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,.15)'; }}
              >
                🗑️ Odayı Kapat & Çık
              </button>
            )}
            <button onClick={() => { setShowQuickLeave(false); handleLeaveRoom(); }} style={{
              width: '100%', padding: '11px', marginBottom: 6, borderRadius: 12,
              background: 'rgba(0,168,132,.15)', color: '#00a884',
              fontWeight: 800, fontSize: 12, cursor: 'pointer',
              border: '1px solid rgba(0,168,132,.25)', transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,168,132,.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,168,132,.15)'; }}
            >
              👋 Sadece Çık
            </button>
            <button onClick={() => setShowQuickLeave(false)} style={{
              width: '100%', padding: '10px', borderRadius: 12, border: 'none',
              background: 'transparent', color: '#475569',
              fontWeight: 700, fontSize: 11, cursor: 'pointer'
            }}>
              İptal (ESC)
            </button>
            <div style={{ marginTop: 10, fontSize: 10, color: '#475569' }}>
              💡 ESC tuşu ile de açabilirsin
            </div>
          </div>
        </div>,
        document.body
      )}

    </header>
  );
}

export default memo(Header);
