import { memo } from 'react';

const DashboardTab = memo(function DashboardTab({ totalRoomsCount, totalOnlineUsers, users, vipCount, reports, activityHistory, activityFeed, onlineUsers, logStats, logs, formatTime }) {
  return (
    <div style={{ animation: 'fadeIn .4s ease-out' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24 }} className="admin-grid admin-stat-grid">
        {[
          { icon: '🏠', label: 'Aktif Oda', value: totalRoomsCount, color: '#7c3aed', gradient: 'linear-gradient(135deg, rgba(124,58,237,.12), rgba(168,85,247,.05))' },
          { icon: '👥', label: 'Cevrimici', value: totalOnlineUsers, color: '#00a884', gradient: 'linear-gradient(135deg, rgba(0,168,132,.12), rgba(0,168,132,.05))' },
          { icon: '👤', label: 'Toplam Uye', value: users.length, color: '#2563eb', gradient: 'linear-gradient(135deg, rgba(37,99,235,.12), rgba(37,99,235,.05))' },
          { icon: '👑', label: 'VIP Uye', value: vipCount, color: '#eab308', gradient: 'linear-gradient(135deg, rgba(234,179,8,.12), rgba(234,179,8,.05))' },
          { icon: '🚫', label: 'Banli', value: users.filter(u => u.isBanned).length, color: '#ef4444', gradient: 'linear-gradient(135deg, rgba(239,68,68,.12), rgba(239,68,68,.05))' },
          { icon: '🚨', label: 'Rapor', value: reports.length, color: '#f97316', gradient: 'linear-gradient(135deg, rgba(249,115,22,.12), rgba(249,115,22,.05))' }
        ].map((s, i) => (
          <div key={i} style={{
            background: s.gradient, padding: '20px 22px', borderRadius: 18,
            border: '1px solid rgba(255,255,255,.05)', position: 'relative', overflow: 'hidden'
          }} className="admin-card">
            <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 80, opacity: .05 }}>{s.icon}</div>
            <div style={{ fontSize: 14, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 24 }} className="admin-grid">
        <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 18, padding: 20, border: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8' }}>Canli Aktivite Grafigi</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00a884', animation: 'livePulse 1s infinite' }} />
              <span style={{ fontSize: 10, color: '#00a884', fontWeight: 700 }}>CANLI</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120, padding: '0 4px' }}>
            {activityHistory.length > 0 ? activityHistory.map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{
                  width: '100%', borderRadius: '3px 3px 0 0', height: `${Math.max(6, (h.users / Math.max(...activityHistory.map(x => x.users), 1)) * 100)}%`,
                  background: 'linear-gradient(to top, rgba(124,58,237,.6), rgba(168,85,247,.3))',
                  transition: 'height .4s ease', minHeight: 4
                }} title={`${h.users} kullanici | ${h.rooms} oda`} />
              </div>
            )) : (
              <div style={{ width: '100%', textAlign: 'center', color: '#475569', fontSize: 12, padding: 40 }}>Veri bekleniyor...</div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, borderTop: '1px solid rgba(255,255,255,.03)', paddingTop: 8 }}>
            <span style={{ fontSize: 10, color: '#475569' }}>5sn aralikla - {activityHistory.length} ornek</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 10, color: '#7c3aed' }}>Odalar: {totalRoomsCount}</span>
              <span style={{ fontSize: 10, color: '#00a884' }}>Online: {totalOnlineUsers}</span>
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 18, padding: 20, border: '1px solid rgba(255,255,255,.05)', maxHeight: 320, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8' }}>Canli Aktivite Akisi</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'livePulse 1s infinite' }} />
              <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>FEED</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', maxHeight: 250 }}>
            {activityFeed.length > 0 ? activityFeed.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8,
                background: 'rgba(255,255,255,.02)', animation: i === 0 ? 'activitySlide .3s ease-out' : 'none'
              }}>
                <span style={{ fontSize: 14 }}>
                  {a.type === 'room_join' ? '🟢' : a.type === 'room_close' ? '🔴' : a.type === 'user_login' ? '🔑' : a.type === 'user_register' ? '✨' : a.type === 'admin_login' ? '🛡️' : '📌'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>{a.message}</div>
                  <div style={{ fontSize: 9, color: '#475569' }}>{formatTime(a.timestamp)}</div>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, padding: 40 }}>Aktivite bekleniyor...</div>
            )}
          </div>
        </div>
      </div>

      {onlineUsers.length > 0 && (
        <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 18, padding: 20, border: '1px solid rgba(255,255,255,.05)', marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', marginBottom: 14 }}>Cevrimici Kullanicilar ({onlineUsers.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {onlineUsers.map((u, i) => (
              <div key={i} style={{
                background: 'rgba(0,168,132,.06)', border: '1px solid rgba(0,168,132,.12)',
                padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00a884' }} />
                {u.username}
                <span style={{ color: '#475569', fontSize: 10 }}>({u.socketCount}s)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="admin-grid">
        {[
          { icon: '📊', label: 'Toplam Log', value: logStats.totalLogs || 0, color: '#ec4899' },
          { icon: '📝', label: 'Bugunku Log', value: logStats.todayLogs || 0, color: '#2563eb' },
          { icon: '🌐', label: 'Benzersiz IP', value: logStats.uniqueIps || 0, color: '#f59e0b' }
        ].map((s, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,.02)', padding: '16px 20px', borderRadius: 14,
            border: '1px solid rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', gap: 12
          }}>
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }} className="admin-grid">
        <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 18, padding: 20, border: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', marginBottom: 12 }}>Son Kayitlar</div>
          {users.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5).map((u, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,.03)' : 'none' }}>
              <span style={{ fontSize: 18 }}>{u.avatar}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{u.username}</div>
                <div style={{ fontSize: 10, color: '#475569' }}>{formatTime(u.createdAt)}</div>
              </div>
              {u.frozen && <span style={{ fontSize: 9, background: 'rgba(239,68,68,.12)', color: '#ef4444', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>F</span>}
              {u.isVip && <span style={{ fontSize: 9, background: 'rgba(234,179,8,.12)', color: '#eab308', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>V</span>}
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 18, padding: 20, border: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', marginBottom: 12 }}>Son Girisler</div>
          {logs.filter(l => l.action === 'join').slice(0, 5).map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,.03)' : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00a884' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{l.username || 'Anonim'}</div>
                <div style={{ fontSize: 10, color: '#475569' }}>{l.ip || 'IP yok'} - {l.room_id || '-'}</div>
              </div>
              <div style={{ fontSize: 10, color: '#475569' }}>{formatTime(l.created_at)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default DashboardTab;
