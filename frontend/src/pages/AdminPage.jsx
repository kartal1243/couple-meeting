import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../constants';

export default function AdminPage() {
  const [pass, setPass] = useState('');
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logRoomFilter, setLogRoomFilter] = useState('');
  const navigate = useNavigate();

  const headers = { 'Content-Type': 'application/json', 'x-admin-pass': pass };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [statsRes, roomsRes, logsRes, usersRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/stats?pass=${pass}`),
        fetch(`${BACKEND_URL}/api/admin/rooms?pass=${pass}`),
        fetch(`${BACKEND_URL}/api/admin/logs?limit=300&pass=${pass}` + (logRoomFilter ? `&room=${logRoomFilter}` : '')),
        fetch(`${BACKEND_URL}/api/admin/users?pass=${pass}`)
      ]);
      const statsData = await statsRes.json();
      const roomsData = await roomsRes.json();
      const logsData = await logsRes.json();
      const usersData = await usersRes.json();
      if (statsData.ok) setStats(statsData);
      if (roomsData.ok) setRooms(roomsData.rooms);
      if (logsData.ok) setLogs(logsData.logs);
      if (usersData.ok) setUsers(usersData.users);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (authed) fetchStats(); }, [authed, logRoomFilter]);

  const closeRoom = async (roomId) => {
    if (!confirm(`${roomId} odasını kapatmak istediğine emin misin?`)) return;
    await fetch(`${BACKEND_URL}/api/admin/rooms/${encodeURIComponent(roomId)}?pass=${pass}`, { method: 'DELETE' });
    fetchStats();
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthed(true);
  };

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0e14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={handleLogin} style={{
          width: 'min(360px, 90%)', background: 'rgba(15,23,42,.95)', border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 20, padding: 32, textAlign: 'center'
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
          <h2 style={{ color: '#fff', margin: '0 0 20px', fontSize: 18, fontWeight: 900 }}>Admin Paneli</h2>
          <input type="password" placeholder="Admin şifresi..." value={pass} onChange={(e) => setPass(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12,
              background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
              color: '#fff', fontSize: 14, outline: 'none', marginBottom: 14
            }} />
          <button type="submit" style={{
            width: '100%', padding: 12, borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff',
            fontWeight: 800, fontSize: 14, cursor: 'pointer'
          }}>Giriş Yap</button>
        </form>
      </div>
    );
  }

  const tabs = [
    { key: 'stats', icon: '📊', label: 'İstatistik' },
    { key: 'rooms', icon: '🏠', label: `Odalar (${rooms.length})` },
    { key: 'logs', icon: '📋', label: 'Loglar' },
    { key: 'users', icon: '👤', label: `Kullanıcılar (${users.length})` }
  ];

  const formatTime = (ts) => {
    if (!ts) return '-';
    return new Date(ts).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e14', color: '#e2e8f0' }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', background: 'rgba(15,23,42,.95)',
        borderBottom: '1px solid rgba(255,255,255,.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🛡️</span>
          <span style={{ fontWeight: 900, fontSize: 16 }}>Admin Panel</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchStats} style={{
            padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)',
            background: 'rgba(255,255,255,.05)', color: '#94a3b8', fontWeight: 700, fontSize: 12, cursor: 'pointer'
          }}>🔄 Yenile</button>
          <button onClick={() => navigate('/')} style={{
            padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)',
            background: 'rgba(255,255,255,.05)', color: '#94a3b8', fontWeight: 700, fontSize: 12, cursor: 'pointer'
          }}>🏠 Ana Sayfa</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(0,0,0,.3)' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '12px 0', border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer',
            background: tab === t.key ? 'rgba(124,58,237,.12)' : 'transparent',
            color: tab === t.key ? '#a855f7' : '#64748b',
            borderBottom: tab === t.key ? '2px solid #7c3aed' : '2px solid transparent'
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Yükleniyor...</div>}

        {/* Stats Tab */}
        {tab === 'stats' && stats && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
              {[
                { icon: '🏠', label: 'Toplam Oda', value: stats.totalRooms, color: '#7c3aed' },
                { icon: '👥', label: 'Çevrimiçi', value: stats.totalOnlineUsers, color: '#00a884' },
                { icon: '📝', label: 'Bugünkü Log', value: stats.logStats.todayLogs, color: '#2563eb' },
                { icon: '🌐', label: 'Bugünkü IP', value: stats.logStats.uniqueIps, color: '#f59e0b' },
                { icon: '📊', label: 'Toplam Log', value: stats.logStats.totalLogs, color: '#ec4899' }
              ].map((s, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,.03)', padding: '18px 20px', borderRadius: 16,
                  border: '1px solid rgba(255,255,255,.05)'
                }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Online Users */}
            {stats.onlineUsers.length > 0 && (
              <div>
                <h3 style={{ fontSize: 14, color: '#94a3b8', fontWeight: 800, marginBottom: 10 }}>🟢 Çevrimiçi Kullanıcılar</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {stats.onlineUsers.map((u, i) => (
                    <div key={i} style={{
                      background: 'rgba(0,168,132,.08)', border: '1px solid rgba(0,168,132,.15)',
                      padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700
                    }}>
                      {u.username} <span style={{ color: '#64748b', fontSize: 10 }}>({u.socketCount} soket)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rooms Tab */}
        {tab === 'rooms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rooms.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>Açık oda yok</div>}
            {rooms.map(r => (
              <div key={r.id} style={{
                background: 'rgba(255,255,255,.03)', padding: '16px 20px', borderRadius: 14,
                border: '1px solid rgba(255,255,255,.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {r.name}
                    {r.hasPassword && <span style={{ fontSize: 10 }}>🔒</span>}
                    {r.isVip && <span style={{ fontSize: 10 }}>👑</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                    👥 {r.userCount}/{r.maxUsers} • 📁 {r.id}
                    {r.users.length > 0 && ' • ' + r.users.map(u => u.username).join(', ')}
                  </div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                    Oluşturulma: {formatTime(r.createdAt)}
                  </div>
                </div>
                <button onClick={() => closeRoom(r.id)} style={{
                  background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.2)',
                  color: '#ef4444', padding: '8px 16px', borderRadius: 10,
                  fontWeight: 800, fontSize: 11, cursor: 'pointer'
                }}>🚫 Kapat</button>
              </div>
            ))}
          </div>
        )}

        {/* Logs Tab */}
        {tab === 'logs' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input type="text" placeholder="Oda ID ile filtrele..."
                value={logRoomFilter} onChange={(e) => setLogRoomFilter(e.target.value)}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)',
                  color: '#e2e8f0', fontSize: 12, outline: 'none'
                }} />
              <button onClick={() => setLogRoomFilter('')} style={{
                padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)',
                background: 'rgba(255,255,255,.05)', color: '#94a3b8', fontWeight: 700, fontSize: 11, cursor: 'pointer'
              }}>Temizle</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                    {['Zaman', 'Kullanıcı', 'IP', 'Oda', 'İşlem'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 800, fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,.03)' }}>
                      <td style={{ padding: '8px 12px', color: '#94a3b8', fontSize: 11 }}>{formatTime(l.created_at)}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700 }}>{l.username || '-'}</td>
                      <td style={{ padding: '8px 12px', color: '#64748b', fontFamily: 'monospace', fontSize: 11 }}>{l.ip || '-'}</td>
                      <td style={{ padding: '8px 12px', color: '#7c3aed', fontSize: 11 }}>{l.room_id || '-'}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{
                          background: l.action === 'join' ? 'rgba(0,168,132,.12)' : 'rgba(239,68,68,.12)',
                          color: l.action === 'join' ? '#00a884' : '#ef4444',
                          padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800
                        }}>
                          {l.action === 'join' ? '➡️ Katıldı' : '⬅️ Ayrıldı'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {logs.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>Kayıt yok</div>}
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {users.map((u, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,.03)', padding: '14px 18px', borderRadius: 14,
                border: '1px solid rgba(255,255,255,.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{u.avatar}</span>
                  <div>
                    <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {u.username}
                      {u.isVip && <span style={{ fontSize: 9, background: 'rgba(234,179,8,.15)', color: '#eab308', padding: '1px 6px', borderRadius: 6, fontWeight: 800 }}>👑 VIP</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{u.email}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 10, color: '#475569' }}>
                  <div>Kayıt: {formatTime(u.createdAt)}</div>
                  <div>Son görülme: {formatTime(u.lastSeen)}</div>
                </div>
              </div>
            ))}
            {users.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>Kullanıcı yok</div>}
          </div>
        )}
      </div>
    </div>
  );
}
