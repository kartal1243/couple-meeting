export default function Header({
  roomName, currentTheme, isConnected, currentRoomInfo, showInstallBtn,
  handleInstallApp, setShowSettingsModal, authUser, myAvatar, handleLeaveRoom
}) {
  return (
    <header
      className="cm-room-header"
      style={{
        height: '60px', padding: '0 28px', background: currentTheme.cardBg,
        borderBottom: '1px solid #222d34', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexShrink: 0, width: '100vw', boxSizing: 'border-box'
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        onClick={handleLeaveRoom}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: '3px', height: '28px',
          background: 'linear-gradient(135deg, rgba(236,72,153,.15), rgba(139,92,246,.15))',
          padding: '0 10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.06)'
        }}>
          {[10,18,24,14,20,12,22,16].map((h, i) => (
            <div key={i} style={{
              width: '2.5px', height: `${h}px`, borderRadius: '99px',
              background: 'linear-gradient(to top, #ec4899, #8b5cf6)',
              transformOrigin: 'bottom',
              animation: `cmWaveBar 0.8s ease-in-out infinite ${i * 0.07}s`
            }} />
          ))}
        </div>
        <h2 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '900', letterSpacing: '-0.3px' }}>
          {roomName}
        </h2>
        <span style={{
          fontSize: '10px', background: 'rgba(255,255,255,.06)', color: '#94a3b8',
          padding: '3px 10px', borderRadius: '20px', fontWeight: '800',
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          border: '1px solid rgba(255,255,255,.06)'
        }}>
          <span className="cm-live-dot" style={{ opacity: isConnected ? 1 : 0.35 }} />
          {currentRoomInfo.userCount}/{currentRoomInfo.maxUsers}
        </span>
      </div>

      <div className="cm-room-header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {showInstallBtn && (
          <button
            onClick={handleInstallApp}
            style={{
              background: 'rgba(34,197,94,.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,.2)',
              padding: '7px 12px', borderRadius: '10px', cursor: 'pointer',
              fontWeight: '800', fontSize: '11px'
            }}
          >
            📲 İndir
          </button>
        )}
        <button
          onClick={() => setShowSettingsModal(true)}
          style={{
            background: 'rgba(255,255,255,.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,.08)',
            padding: '7px 12px', borderRadius: '10px', cursor: 'pointer',
            fontWeight: '800', fontSize: '11px'
          }}
        >
          ⚙️
        </button>
        {authUser && (
          <span style={{
            background: 'rgba(0,168,132,.1)', color: '#00a884', border: '1px solid rgba(0,168,132,.2)',
            padding: '7px 10px', borderRadius: '10px', fontWeight: '800', fontSize: '11px',
            maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {authUser.avatar || myAvatar} {authUser.username}
          </span>
        )}
        <button
          onClick={handleLeaveRoom}
          style={{
            background: 'rgba(239,68,68,.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,.2)',
            padding: '7px 12px', borderRadius: '10px', cursor: 'pointer',
            fontWeight: '800', fontSize: '11px'
          }}
        >
          Çıkış
        </button>
      </div>
    </header>
  );
}
