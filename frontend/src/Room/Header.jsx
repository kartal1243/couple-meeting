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
          width: '32px', height: '32px', borderRadius: '8px', background: currentTheme.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
        }}>
          ❤️⚡
        </div>
        <h2 style={{ margin: 0, color: currentTheme.primary, fontSize: '18px', fontWeight: '900' }}>
          {roomName}
        </h2>
        <span style={{
          fontSize: '11px', background: currentTheme.cardBg, color: currentTheme.primary,
          padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold',
          border: '1px solid rgba(255,255,255,0.08)', display: 'inline-flex',
          alignItems: 'center', gap: '6px'
        }}>
          <span className="cm-live-dot" style={{ opacity: isConnected ? 1 : 0.35 }} />
          Kişi: {currentRoomInfo.userCount}/{currentRoomInfo.maxUsers}
        </span>
      </div>

      <div className="cm-room-header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {showInstallBtn && (
          <button
            onClick={handleInstallApp}
            style={{
              background: '#25d366', color: '#000', border: 'none',
              padding: '8px 12px', borderRadius: '10px', cursor: 'pointer',
              fontWeight: '900', fontSize: '12px'
            }}
          >
            📲 İndir
          </button>
        )}
        <button
          onClick={() => setShowSettingsModal(true)}
          style={{
            background: '#202c33', color: '#e9edef', border: '1px solid #222d34',
            padding: '8px 14px', borderRadius: '10px', cursor: 'pointer',
            fontWeight: 'bold', fontSize: '12px'
          }}
        >
          ⚙️ Ayarlar
        </button>
        {authUser && (
          <span style={{
            background: '#0d201d', color: '#53e6bc', border: '1px solid #1c4a41',
            padding: '8px 10px', borderRadius: '10px', fontWeight: '800', fontSize: '11px',
            maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {authUser.avatar || myAvatar} {authUser.username}
          </span>
        )}
        <button
          onClick={handleLeaveRoom}
          style={{
            background: '#202c33', color: '#e9edef', border: '1px solid #222d34',
            padding: '8px 14px', borderRadius: '10px', cursor: 'pointer',
            fontWeight: 'bold', fontSize: '12px'
          }}
        >
          Ana Sayfa 🚪
        </button>
      </div>
    </header>
  );
}
