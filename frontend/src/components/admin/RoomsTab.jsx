import { memo } from 'react';

const RoomsTab = memo(function RoomsTab({ rooms, closeRoom }) {
  return (
    <div style={{ animation: 'fadeIn .4s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#94a3b8' }}>Aktif Odalar ({rooms.length})</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00a884', animation: 'livePulse 1s infinite' }} />
          <span style={{ fontSize: 10, color: '#00a884', fontWeight: 700 }}>CANLI GÜNCELLENİYOR</span>
        </div>
      </div>
      {rooms.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>Açık oda yok</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rooms.map(r => (
          <div key={r.id} style={{
            background: 'rgba(255,255,255,.02)', padding: '18px 22px', borderRadius: 16,
            border: '1px solid rgba(255,255,255,.05)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
          }} className="admin-card">
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{r.name}</span>
                {r.hasPassword && <span style={{ fontSize: 10, background: 'rgba(234,179,8,.12)', color: '#eab308', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>🔒</span>}
                {r.isVip && <span style={{ fontSize: 10, background: 'rgba(168,85,247,.12)', color: '#a855f7', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>👑</span>}
                {r.userCount > 0 && <span style={{ fontSize: 10, background: 'rgba(0,168,132,.12)', color: '#00a884', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>🟢 Aktif</span>}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span>👥 {r.userCount}/{r.maxUsers}</span>
                <span>📁 {r.id}</span>
                <span>🎤 {r.currentMedia?.type || 'Yok'}</span>
              </div>
              {r.users.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {r.users.map(u => (
                    <span key={u.userId || u.username} style={{ fontSize: 10, background: 'rgba(255,255,255,.05)', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                      {u.avatar} {u.username}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => closeRoom(r.id)} className="admin-action" style={{
              background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)',
              color: '#ef4444', padding: '8px 18px', borderRadius: 10,
              fontWeight: 800, fontSize: 11, cursor: 'pointer'
            }}>🚫 Kapat</button>
          </div>
        ))}
      </div>
    </div>
  );
});

export default RoomsTab;
