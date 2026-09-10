import { memo } from 'react';

const ToolsTab = memo(function ToolsTab({ broadcastMsg, setBroadcastMsg, sendBroadcast, maintenance, toggleMaintenance, totalRoomsCount, totalOnlineUsers, users, vipCount, logStats, reports }) {
  return (
    <div style={{ animation: 'fadeIn .4s ease-out' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14 }} className="admin-grid">
        <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 18, padding: 22, border: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#94a3b8', marginBottom: 14 }}>📢 Broadcast</div>
          <p style={{ color: '#64748b', fontSize: 11, marginBottom: 12 }}>Tüm online kullanıcılara mesaj gönderir.</p>
          <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Mesaj..."
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical', minHeight: 80 }} />
          <button onClick={sendBroadcast} className="admin-action" style={{ width: '100%', marginTop: 10, padding: '10px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>📤 Gönder</button>
        </div>

        <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 18, padding: 22, border: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#94a3b8', marginBottom: 14 }}>🔧 Bakım Modu</div>
          <p style={{ color: '#64748b', fontSize: 11, marginBottom: 14 }}>Yeni kullanıcılar oda oluşturamaz.</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,.03)', padding: '14px 18px', borderRadius: 12 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13 }}>Bakım Modu</div>
              <div style={{ fontSize: 11, color: maintenance ? '#ef4444' : '#00a884' }}>{maintenance ? '🔴 Aktif' : '🟢 Pasif'}</div>
            </div>
            <button onClick={toggleMaintenance} style={{
              width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
              background: maintenance ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(255,255,255,.1)',
              position: 'relative', transition: 'background .3s'
            }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: maintenance ? 27 : 3, transition: 'left .3s', boxShadow: '0 2px 4px rgba(0,0,0,.3)' }} />
            </button>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 18, padding: 22, border: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#94a3b8', marginBottom: 14 }}>⚡ Hızlı Özet</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[{ icon: '🏠', label: 'Oda', value: totalRoomsCount, color: '#7c3aed' }, { icon: '👥', label: 'Online', value: totalOnlineUsers, color: '#00a884' }, { icon: '👤', label: 'Üye', value: users.length, color: '#2563eb' }, { icon: '👑', label: 'VIP', value: vipCount, color: '#eab308' }, { icon: '📋', label: 'Log', value: logStats.totalLogs || 0, color: '#ec4899' }, { icon: '🚨', label: 'Rapor', value: reports.length, color: '#ef4444' }].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,.03)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ToolsTab;
