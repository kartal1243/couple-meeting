import React from 'react';

function QuickCreateModal({
  showQuickCreate,
  setShowQuickCreate,
  quickRoomName,
  setQuickRoomName,
  quickRoomPass,
  setQuickRoomPass,
  quickMaxUsers,
  setQuickMaxUsers,
  handleQuickCreateSubmit
}) {
  if (!showQuickCreate) return null;

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
          width: 'min(420px,100%)',
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
            <div style={{ color: '#a78bfa', fontSize: 11, fontWeight: 900 }}>🚀 YENI ODA</div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 950, marginTop: 2 }}>Oda Olustur</div>
          </div>
          <button
            onClick={() => setShowQuickCreate(false)}
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
        <form onSubmit={handleQuickCreateSubmit} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ color: '#94a3b8', fontSize: 11, fontWeight: 800, display: 'block', marginBottom: 5 }}>Oda Adi</label>
            <input
              value={quickRoomName}
              onChange={(e) => setQuickRoomName(e.target.value)}
              placeholder="orn: muzik gecesi"
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#0b141a',
                border: '1px solid #25313a',
                color: '#e9edef',
                borderRadius: 12,
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ color: '#94a3b8', fontSize: 11, fontWeight: 800, display: 'block', marginBottom: 5 }}>Sifre (istege bagli)</label>
            <input
              type="password"
              value={quickRoomPass}
              onChange={(e) => setQuickRoomPass(e.target.value)}
              placeholder="Sifre koymak istersen yaz"
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#0b141a',
                border: '1px solid #25313a',
                color: '#e9edef',
                borderRadius: 12,
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ color: '#94a3b8', fontSize: 11, fontWeight: 800, display: 'block', marginBottom: 5 }}>Maksimum Kisi</label>
            <select
              value={quickMaxUsers}
              onChange={(e) => setQuickMaxUsers(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#0b141a',
                border: '1px solid #25313a',
                color: '#e9edef',
                borderRadius: 12,
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="2">2 Kisi 💑</option>
              <option value="4">4 Kisi 👥</option>
              <option value="8">8 Kisi 🎉</option>
            </select>
          </div>
          <button
            type="submit"
            style={{
              padding: '14px',
              borderRadius: 14,
              border: 'none',
              background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(124,58,237,.3)',
              marginTop: 4
            }}
          >
            🚀 Odayi Baslat
          </button>
        </form>
      </div>
    </div>
  );
}

export default React.memo(QuickCreateModal);
