import { memo } from 'react';

const AnalyticsTab = memo(function AnalyticsTab({ analytics, formatTime }) {
  return (
    <div style={{ animation: 'fadeIn .4s ease-out' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }} className="admin-stat-grid">
        {[{ l: 'Bugün Kayıt', v: analytics?.users?.today || 0, c: '#00a884', icon: '👤' },
          { l: 'Bu Hafta Kayıt', v: analytics?.users?.week || 0, c: '#3b82f6', icon: '📈' },
          { l: 'Bu Ay Kayıt', v: analytics?.users?.month || 0, c: '#8b5cf6', icon: '📊' },
          { l: 'Bugün Aktif', v: analytics?.active?.today || 0, c: '#f59e0b', icon: '🔥' },
          { l: 'Bu Hafta Aktif', v: analytics?.active?.week || 0, c: '#ef4444', icon: '⚡' },
          { l: 'Bugün Mesaj', v: analytics?.messages?.today || 0, c: '#06b6d4', icon: '💬' },
          { l: 'Bu Hafta Mesaj', v: analytics?.messages?.week || 0, c: '#ec4899', icon: '💌' },
          { l: 'Bugün Oda', v: analytics?.rooms?.today || 0, c: '#10b981', icon: '🏠' }
        ].map((item, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,.02)', borderRadius: 16, padding: '18px 16px', border: '1px solid rgba(255,255,255,.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ color: '#64748b', fontSize: 11, fontWeight: 700 }}>{item.l}</span>
            </div>
            <div style={{ color: item.c, fontSize: 28, fontWeight: 900 }}>{item.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 14 }} className="admin-grid">
        <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 18, padding: 22, border: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#94a3b8', marginBottom: 14 }}>🏆 En Çok Ziyaret Edilen Odalar (Bugün)</div>
          {analytics?.topRooms?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {analytics.topRooms.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,.03)', borderRadius: 10 }}>
                  <span style={{ color: '#64748b', fontSize: 12, fontWeight: 800, width: 24 }}>#{i + 1}</span>
                  <span style={{ color: '#e2e8f0', fontSize: 13, flex: 1 }}>{r.room_id}</span>
                  <span style={{ color: '#00a884', fontSize: 12, fontWeight: 800 }}>{r.visits} ziyaret</span>
                </div>
              ))}
            </div>
          ) : <p style={{ color: '#64748b', fontSize: 12 }}>Veri yok</p>}
        </div>

        <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 18, padding: 22, border: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#94a3b8', marginBottom: 14 }}>📅 Günlük Kayıtlar (Son 30 Gün)</div>
          {analytics?.dailySignups?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflowY: 'auto' }}>
              {analytics.dailySignups.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', background: 'rgba(255,255,255,.03)', borderRadius: 8 }}>
                  <span style={{ color: '#64748b', fontSize: 12, width: 90 }}>{d.day}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,.05)' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #7c3aed, #a855f7)', width: `${Math.min(100, (d.count / Math.max(...analytics.dailySignups.map(x => x.count))) * 100)}%` }} />
                  </div>
                  <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 800, width: 30, textAlign: 'right' }}>{d.count}</span>
                </div>
              ))}
            </div>
          ) : <p style={{ color: '#64748b', fontSize: 12 }}>Veri yok</p>}
        </div>
      </div>
    </div>
  );
});

export default AnalyticsTab;
