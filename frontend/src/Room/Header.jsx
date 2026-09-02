import { useState } from 'react';

export default function Header({
  roomName, currentTheme, isConnected, currentRoomInfo, showInstallBtn,
  handleInstallApp, setShowSettingsModal, setShowProfileModal, authUser, myAvatar, handleLeaveRoom
}) {
  const [showUsers, setShowUsers] = useState(false);
  const liveDotStyle = {
    width: 8, height: 8, borderRadius: '50%', background: isConnected ? '#22c55e' : '#ef4444',
    boxShadow: isConnected ? '0 0 8px rgba(34,197,94,.6)' : 'none',
    animation: isConnected ? 'cmPulseLive 2s ease-in-out infinite' : 'none'
  };

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

          {showUsers && currentRoomInfo.users && (
            <div style={{
              position: 'absolute', top: 32, left: 0, minWidth: 220,
              background: 'rgba(15,23,42,.95)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,.08)', borderRadius: 14,
              padding: 8, zIndex: 9999, boxShadow: '0 20px 50px rgba(0,0,0,.6)'
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, padding: '4px 8px', marginBottom: 4 }}>
                ODA KİŞİLERİ ({currentRoomInfo.users.length})
              </div>
              {currentRoomInfo.users.map((u, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px', borderRadius: 8, fontSize: 12,
                  background: 'rgba(255,255,255,.03)', marginBottom: 2
                }}>
                  <span style={{ fontSize: 16 }}>{u.avatar || '🐱'}</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 700, flex: 1 }}>{u.username || 'İzleyici'}</span>
                  {u.userId === currentRoomInfo.hostUserId && (
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
            background: 'rgba(34,197,94,.1)', color: '#22c55e',
            border: '1px solid rgba(34,197,94,.2)',
            padding: '6px 12px', borderRadius: 10, cursor: 'pointer',
            fontWeight: 800, fontSize: 11, transition: 'all 0.2s'
          }}>📲 İndir</button>
        )}
        <button onClick={() => setShowSettingsModal(true)} style={{
          background: 'rgba(255,255,255,.05)', color: '#94a3b8',
          border: '1px solid rgba(255,255,255,.08)',
          padding: '6px 10px', borderRadius: 10, cursor: 'pointer',
          fontWeight: 800, fontSize: 13, transition: 'all 0.2s'
        }}>⚙️</button>
        <button onClick={() => setShowProfileModal(true)} style={{
          background: 'rgba(255,255,255,.05)', color: '#94a3b8',
          border: '1px solid rgba(255,255,255,.08)',
          padding: '6px 10px', borderRadius: 10, cursor: 'pointer',
          fontWeight: 800, fontSize: 13, transition: 'all 0.2s'
        }}>👤</button>
        {authUser && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,168,132,.1), rgba(0,168,132,.05))',
            color: '#00a884', border: '1px solid rgba(0,168,132,.2)',
            padding: '6px 10px', borderRadius: 10, fontWeight: 800, fontSize: 11,
            display: 'flex', alignItems: 'center', gap: 4
          }}>
            <span>{authUser.avatar || myAvatar}</span>
            <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {authUser.username}
            </span>
          </div>
        )}
        <button onClick={handleLeaveRoom} style={{
          background: 'rgba(239,68,68,.1)', color: '#ef4444',
          border: '1px solid rgba(239,68,68,.2)',
          padding: '6px 12px', borderRadius: 10, cursor: 'pointer',
          fontWeight: 800, fontSize: 11, transition: 'all 0.2s'
        }}>✕ Çıkış</button>
      </div>

      <style>{`
        @keyframes cmGradientFlow { 0%{background-position:0% 50%} 100%{background-position:300% 50%} }
        @keyframes cmPulseLive { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.85)} }
      `}</style>
    </header>
  );
}
