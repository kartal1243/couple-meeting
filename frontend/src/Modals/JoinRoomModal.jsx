import React from 'react';

function JoinRoomModal({
  showJoinModal,
  setShowJoinModal,
  joinRoomTarget,
  setJoinRoomTarget,
  joinModalPass,
  setJoinModalPass,
  joinModalError,
  setJoinModalError,
  handleJoinRoomFromModal
}) {
  if (!showJoinModal || !joinRoomTarget) return null;

  const handleClose = () => {
    setShowJoinModal(false);
    setJoinRoomTarget(null);
    setJoinModalPass('');
    setJoinModalError('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 25000,
        background: 'rgba(0,0,0,.85)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14
      }}
    >
      <div
        style={{
          width: 'min(380px,100%)',
          background: 'linear-gradient(180deg,#111b21,#0a0f14)',
          border: '1px solid #2a3942',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 40px 120px rgba(0,0,0,.6)'
        }}
      >
        <div
          style={{
            padding: '22px 24px',
            borderBottom: '1px solid #25313a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ color: '#2563eb', fontSize: 11, fontWeight: 900 }}>🚪 ODAYA KATIL</div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 950, marginTop: 2 }}>{joinRoomTarget.name}</div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'rgba(255,255,255,.06)',
              border: 'none',
              color: '#7f8c98',
              width: 32,
              height: 32,
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleJoinRoomFromModal} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              background: 'rgba(255,255,255,.03)',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,.06)'
            }}
          >
            <div style={{ fontSize: 24 }}>{joinRoomTarget.hasPassword ? '🔒' : '🎵'}</div>
            <div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 900 }}>{joinRoomTarget.name}</div>
              <div style={{ color: '#64748b', fontSize: 11 }}>
                {joinRoomTarget.userCount}/{joinRoomTarget.maxUsers} kisi • {joinRoomTarget.hasPassword ? 'Sifreli' : 'Acik'}
              </div>
            </div>
          </div>
          {joinModalError && (
            <div
              style={{
                background: 'rgba(239,68,68,.1)',
                border: '1px solid rgba(239,68,68,.2)',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#ef4444',
                fontSize: 12,
                fontWeight: 700,
                textAlign: 'center'
              }}
            >
              ⚠️ {joinModalError}
            </div>
          )}
          {joinRoomTarget.hasPassword && (
            <div>
              <label style={{ color: '#94a3b8', fontSize: 11, fontWeight: 800, display: 'block', marginBottom: 5 }}>Oda Sifresi</label>
              <input
                type="password"
                value={joinModalPass}
                onChange={(e) => {
                  setJoinModalPass(e.target.value);
                  setJoinModalError('');
                }}
                placeholder="Sifreyi girin..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: '#0b141a',
                  border: joinModalError ? '1px solid rgba(239,68,68,.4)' : '1px solid #25313a',
                  color: '#e9edef',
                  borderRadius: 12,
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}
          <button
            type="submit"
            style={{
              padding: '14px',
              borderRadius: 14,
              border: 'none',
              background: 'linear-gradient(135deg,#2563eb,#3b82f6)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(37,99,235,.3)',
              marginTop: 4
            }}
          >
            🚪 Odaya Gir
          </button>
        </form>
      </div>
    </div>
  );
}

export default React.memo(JoinRoomModal);
