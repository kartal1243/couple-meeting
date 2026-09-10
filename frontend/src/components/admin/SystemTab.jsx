import { memo } from 'react';

const SystemTab = memo(function SystemTab({ system, maintenance, toggleMaintenance, broadcastMsg, setBroadcastMsg, sendBroadcast, formatUptime, users, vipCount, totalRoomsCount, logStats }) {
  return (
    <div style={{ animation: 'fadeIn .4s ease-out' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }} className="admin-grid">
        <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 18, padding: 22, border: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#94a3b8', marginBottom: 16 }}>🖥️ Sunucu</div>
          {system ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[{ label: 'Uptime', value: formatUptime(system.uptime), color: '#00a884' }, { label: 'Node.js', value: system.nodeVersion, color: '#2563eb' }, { label: 'Platform', value: system.platform, color: '#7c3aed' }, { label: 'PID', value: system.pid, color: '#e2e8f0' }, { label: 'Aktif Oda', value: system.activeRooms, color: '#f59e0b' }, { label: 'Soket', value: system.totalSockets, color: '#ec4899' }].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: 12 }}>{item.label}</span>
                  <span style={{ color: item.color, fontWeight: 800, fontSize: 13, fontFamily: 'monospace' }}>{item.value}</span>
                </div>
              ))}
            </div>
          ) : <div style={{ color: '#475569' }}>Yükleniyor...</div>}
        </div>

        <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 18, padding: 22, border: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#94a3b8', marginBottom: 16 }}>💾 Bellek</div>
          {system && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[{ label: 'RSS', value: system.memory?.rss, max: 512, color: '#00a884' }, { label: 'Heap Kullanılan', value: system.memory?.heapUsed, max: system.memory?.heapTotal || 256, color: '#7c3aed' }, { label: 'Heap Toplam', value: system.memory?.heapTotal, max: 512, color: '#2563eb' }].map((item, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'spaceBetween', marginBottom: 6 }}>
                    <span style={{ color: '#64748b', fontSize: 11 }}>{item.label}</span>
                    <span style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 12 }}>{item.value} MB</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,.05)' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${item.color}, ${item.color}88)`, width: `${Math.min(100, (item.value / item.max) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 18, padding: 22, border: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#94a3b8', marginBottom: 16 }}>🗄️ Veritabanı</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[{ l: 'Motor', v: 'SQLite', c: '#e2e8f0' }, { l: 'Üye', v: users.length, c: '#00a884' }, { l: 'VIP', v: vipCount, c: '#eab308' }, { l: 'Oda', v: totalRoomsCount, c: '#7c3aed' }, { l: 'Log', v: logStats.totalLogs || 0, c: '#2563eb' }].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: 12 }}>{item.l}</span>
                <span style={{ color: item.c, fontWeight: 800, fontSize: 12 }}>{item.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default SystemTab;
