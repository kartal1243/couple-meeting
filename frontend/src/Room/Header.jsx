import { useState, memo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

function Header({
  roomName, currentTheme, isConnected, currentRoomInfo, showInstallBtn,
  handleInstallApp, setShowSettingsModal, setShowProfileModal, authUser, myAvatar, handleLeaveRoom,
  roomUsersList, hostUserId, onCloseRoom, roomId
}) {
  const [showUsers, setShowUsers] = useState(false);
  const [showQuickLeave, setShowQuickLeave] = useState(false);
  const [shareTooltip, setShareTooltip] = useState('');
  const usersRef = useRef(null);
  const liveDotStyle = {
    width: 8, height: 8, borderRadius: '50%', background: isConnected ? '#22c55e' : '#ef4444',
    boxShadow: isConnected ? '0 0 8px rgba(34,197,94,.6)' : 'none',
    animation: isConnected ? 'cmPulseLive 2s ease-in-out infinite' : 'none'
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
    if (!showUsers) return;
    const handleClickOutside = (e) => {
      if (usersRef.current && !usersRef.current.contains(e.target)) {
        setShowUsers(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showUsers]);

  return (
    <header style={{
      height: 60, padding: '0 20px',
      background: 'linear-gradient(135deg, rgba(15,23,42,.95), rgba(30,41,59,.95))',
      backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,.06)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexShrink: 0, width: '100vw', boxSizing: 'border-box',
      position: 'relative', zIndex: 100
    }}>
      {/* Animated gradient line at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, #7c3aed, #ec4899, #00a884, #7c3aed)',
        backgroundSize: '300% 100%', animation: 'cmGradientFlow 4s linear infinite'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          onClick={handleLeaveRoom}
        >
          {/* Animated equalizer bars */}
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 2, height: 24,
            background: 'linear-gradient(135deg, rgba(124,58,237,.2), rgba(236,72,153,.15))',
            padding: '0 8px', borderRadius: 8, border: '1px solid rgba(124,58,237,.15)'
          }}>
            {[10,18,24,14,20,12,22,16].map((h, i) => (
              <div key={i} style={{
                width: 2.5, height: `${h}px`, borderRadius: 99,
                background: 'linear-gradient(to top, #ec4899, #7c3aed)',
                transformOrigin: 'bottom',
                animation: `cmWaveBar 0.8s ease-in-out infinite ${i * 0.07}s`
              }} />
            ))}
          </div>
          <h2 style={{
            margin: 0, color: '#fff', fontSize: 15, fontWeight: 900,
            letterSpacing: '-0.3px', textShadow: '0 2px 10px rgba(124,58,237,.3)'
          }}>
            {roomName}
          </h2>
        </div>

        {/* Users pill */}
        <div
          ref={usersRef}
          style={{
            position: 'relative', fontSize: 10, fontWeight: 800,
            padding: '4px 12px', borderRadius: 20, cursor: 'pointer', userSelect: 'none',
            background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)',
            color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: 6,
            transition: 'all 0.2s'
          }}
          onClick={(e) => { e.stopPropagation(); setShowUsers(!showUsers); }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; }}
        >
          <span style={liveDotStyle} />
          <span>👥 {currentRoomInfo.userCount}/{currentRoomInfo.maxUsers}</span>

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
                  {u.userId === hostUserId && (
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
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {showInstallBtn && (
          <button onClick={handleInstallApp} style={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff',
            border: 'none',
            padding: '6px 14px', borderRadius: 10, cursor: 'pointer',
            fontWeight: 800, fontSize: 11, transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(34,197,94,.3)'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Uygulamayı İndir
          </button>
        )}
        <button onClick={() => setShowSettingsModal(true)} style={{
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
        }} style={{
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
          <div onClick={() => setShowProfileModal(true)} style={{
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
            <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {authUser.username}
            </span>
          </div>
        )}
        <button onClick={() => setShowQuickLeave(true)} style={{
          background: 'rgba(239,68,68,.1)', color: '#ef4444',
          border: '1px solid rgba(239,68,68,.2)',
          padding: '6px 12px', borderRadius: 10, cursor: 'pointer',
          fontWeight: 800, fontSize: 11, transition: 'all 0.2s'
        }}>✕ Çıkış</button>
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
            
            {hostUserId === (authUser?.username || myAvatar) && (
              <button onClick={() => { setShowQuickLeave(false); onCloseRoom?.(); }} style={{
                width: '100%', padding: '11px', marginBottom: 6, borderRadius: 12, border: 'none',
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
              width: '100%', padding: '11px', marginBottom: 6, borderRadius: 12, border: 'none',
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
