import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../constants';
import { socket } from '../socket';

function AdminPage() {
  const [pass, setPass] = useState('');
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [rooms, setRooms] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [totalOnlineUsers, setTotalOnlineUsers] = useState(0);
  const [logStats, setLogStats] = useState({ totalLogs: 0, todayLogs: 0, uniqueIps: 0 });
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [system, setSystem] = useState(null);
  const [reports, setReports] = useState([]);
  const [maintenance, setMaintenance] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [activityFeed, setActivityFeed] = useState([]);
  const [activityHistory, setActivityHistory] = useState([]);
  const [logRoomFilter, setLogRoomFilter] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [vipDays, setVipDays] = useState(365);
  const [vipPlan, setVipPlan] = useState('yearly');
  const [toast, setToast] = useState(null);
  const [livePing, setLivePing] = useState(Date.now());
  const navigate = useNavigate();
  const activityFeedRef = useRef([]);
  const chartRef = useRef([]);

  const headers = { 'Content-Type': 'application/json', 'x-admin-pass': pass };

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const api = useCallback(async (path, opts = {}) => {
    const sep = path.includes('?') ? '&' : '?';
    const url = `${BACKEND_URL}${path}${sep}pass=${pass}`;
    const res = await fetch(url, { headers, ...opts });
    return res.json();
  }, [pass]);

  // ── SOCKET.IO REAL-TIME CONNECTION ──
  useEffect(() => {
    if (!authed) return;

    socket.emit('admin_connect', { pass });

    const handleDashboardUpdate = (data) => {
      setRooms(data.rooms || []);
      setOnlineUsers(data.onlineUsers || []);
      setTotalOnlineUsers(data.totalOnlineUsers || 0);
      setLogStats(data.logStats || {});
      setLivePing(Date.now());

      chartRef.current = [...chartRef.current, {
        time: data.timestamp,
        rooms: data.totalRooms,
        users: data.totalOnlineUsers
      }].slice(-60);
      setActivityHistory([...chartRef.current]);
    };

    const handleActivity = (activity) => {
      const newFeed = [activity, ...activityFeedRef.current].slice(0, 50);
      activityFeedRef.current = newFeed;
      setActivityFeed([...newFeed]);

      if (activity.type === 'room_join' || activity.type === 'room_close' || activity.type === 'user_login' || activity.type === 'user_register') {
        fetchLogs();
      }
    };

    socket.on('admin_dashboard_update', handleDashboardUpdate);
    socket.on('admin_activity', handleActivity);

    return () => {
      socket.emit('admin_disconnect');
      socket.off('admin_dashboard_update', handleDashboardUpdate);
      socket.off('admin_activity', handleActivity);
    };
  }, [authed, pass]);

  // ── INITIAL DATA FETCH ──
  const fetchLogs = useCallback(async () => {
    try {
      const [l, u, sys, rep] = await Promise.all([
        api(`/api/admin/logs?limit=500${logRoomFilter ? `&room=${logRoomFilter}` : ''}`),
        api('/api/admin/users'),
        api('/api/admin/system'),
        api('/api/admin/reports')
      ]);
      if (l.ok) setLogs(l.logs);
      if (u.ok) setUsers(u.users);
      if (sys.ok) setSystem(sys);
      if (rep.ok) setReports(rep.reports || []);
    } catch {}
  }, [pass, logRoomFilter, api]);

  useEffect(() => {
    if (authed) fetchLogs();
  }, [authed, logRoomFilter, fetchLogs]);

  useEffect(() => {
    if (!authed) return;
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [authed, fetchLogs]);

  // ── ACTIONS ──
  const closeRoom = async (roomId) => {
    if (!confirm(`"${roomId}" odasını kapatmak istediğine emin misin?`)) return;
    await api(`/api/admin/rooms/${encodeURIComponent(roomId)}`, { method: 'DELETE' });
    showToast(`"${roomId}" kapatıldı`);
  };

  const setVip = async (username, isVip) => {
    await api('/api/admin/users/vip', { method: 'POST', body: JSON.stringify({ username, isVip, vipPlan, vipDays }) });
    showToast(`${username} VIP: ${isVip ? 'aktif' : 'kaldırıldı'}`);
    setShowUserModal(false);
    fetchLogs();
  };

  const toggleBan = async (username, isBanned) => {
    if (!confirm(`${username} kullanıcısını ${isBanned ? 'unban' : 'ban'} etmek istediğine emin misin?`)) return;
    await api('/api/admin/users/ban', { method: 'POST', body: JSON.stringify({ username, isBanned: !isBanned }) });
    showToast(`${username}: ${isBanned ? 'unban edildi' : 'ban edildi'}`);
    fetchLogs();
  };

  const deleteUser = async (username) => {
    if (!confirm(`⚠️ ${username} kullanıcısını kalıcı olarak silmek istediğine emin misin?`)) return;
    await api(`/api/admin/users/${encodeURIComponent(username)}`, { method: 'DELETE' });
    showToast(`${username} silindi`);
    setShowUserModal(false);
    fetchLogs();
  };

  const sendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    await api('/api/admin/broadcast', { method: 'POST', body: JSON.stringify({ message: broadcastMsg }) });
    showToast('广播 mesajı gönderildi');
    setBroadcastMsg('');
  };

  const toggleMaintenance = async () => {
    const newMode = !maintenance;
    await api('/api/admin/maintenance', { method: 'POST', body: JSON.stringify({ enabled: newMode }) });
    setMaintenance(newMode);
    showToast(`Bakım modu: ${newMode ? 'aktif' : 'pasif'}`);
  };

  const handleLogin = (e) => { e.preventDefault(); setAuthed(true); };

  const formatTime = (ts) => {
    if (!ts) return '-';
    return new Date(ts).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatUptime = (s) => {
    if (!s) return '-';
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    return d > 0 ? `${d}g ${h}sa ${m}dk` : h > 0 ? `${h}sa ${m}dk` : `${m}dk`;
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const filteredLogs = logs.filter(l => {
    if (!logSearch) return true;
    const q = logSearch.toLowerCase();
    return (l.username?.toLowerCase().includes(q)) || (l.ip?.toLowerCase().includes(q)) || (l.room_id?.toLowerCase().includes(q));
  });

  const vipCount = users.filter(u => u.isVip).length;
  const totalRoomsCount = rooms.length;

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0e14, #0f172a, #1a1033)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <style>{`
          @keyframes adminPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(124,58,237,.4); } 50% { box-shadow: 0 0 30px 10px rgba(124,58,237,.1); } }
          @keyframes adminGlow { 0%,100% { text-shadow: 0 0 10px rgba(168,85,247,.5); } 50% { text-shadow: 0 0 30px rgba(168,85,247,.8); } }
          @keyframes floatAdmin { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
        <form onSubmit={handleLogin} style={{
          width: 'min(420px, 92%)', background: 'rgba(15,23,42,.97)',
          border: '1px solid rgba(124,58,237,.2)', borderRadius: 24,
          padding: '48px 40px', textAlign: 'center',
          animation: 'adminPulse 3s ease-in-out infinite, slideUp .6s ease-out',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{ fontSize: 56, marginBottom: 16, animation: 'floatAdmin 3s ease-in-out infinite' }}>🛡️</div>
          <h2 style={{ color: '#fff', margin: '0 0 6px', fontSize: 26, fontWeight: 900, animation: 'adminGlow 3s ease-in-out infinite' }}>Admin Panel</h2>
          <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 28px' }}>Couple Meeting Yönetim Merkezi</p>
          <input type="password" placeholder="Admin şifresi..." value={pass} onChange={(e) => setPass(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '14px 18px', borderRadius: 14,
              background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
              color: '#fff', fontSize: 14, outline: 'none', marginBottom: 16
            }} />
          <button type="submit" style={{
            width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff',
            fontWeight: 900, fontSize: 15, cursor: 'pointer'
          }}>🔐 Giriş Yap</button>
        </form>
      </div>
    );
  }

  const tabs = [
    { key: 'dashboard', icon: '📊', label: 'Gösterge Paneli' },
    { key: 'rooms', icon: '🏠', label: `Odalar (${totalRoomsCount})` },
    { key: 'users', icon: '👥', label: `Kullanıcılar (${users.length})` },
    { key: 'logs', icon: '📋', label: 'Loglar' },
    { key: 'reports', icon: '🚨', label: `Raporlar (${reports.length})` },
    { key: 'system', icon: '⚙️', label: 'Sistem' },
    { key: 'tools', icon: '🔧', label: 'Araçlar' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0e14, #0f172a)', color: '#e2e8f0', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes livePulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }
        @keyframes activitySlide { from { opacity: 0; transform: translateY(-12px); max-height: 0; } to { opacity: 1; transform: translateY(0); max-height: 60px; } }
        .admin-tab:hover { background: rgba(124,58,237,.08) !important; }
        .admin-card:hover { border-color: rgba(124,58,237,.3) !important; }
        .admin-action { transition: all .15s !important; }
        .admin-action:hover { transform: scale(1.03); }
        .admin-action:active { transform: scale(0.97); }
        @media(max-width:768px) { .admin-grid { grid-template-columns: 1fr !important; } .admin-header { flex-wrap: wrap !important; } }
      `}</style>

      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'warning' ? 'rgba(234,179,8,.95)' : toast.type === 'error' ? 'rgba(239,68,68,.95)' : 'rgba(0,168,132,.95)',
          color: '#fff', padding: '12px 20px', borderRadius: 12, fontWeight: 700, fontSize: 13,
          backdropFilter: 'blur(10px)', animation: 'slideIn .3s ease-out', boxShadow: '0 10px 40px rgba(0,0,0,.3)'
        }}>
          {toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : '❌'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{
        padding: '14px 24px', background: 'rgba(10,14,20,.95)',
        borderBottom: '1px solid rgba(255,255,255,.05)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100
      }} className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🛡️</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>Admin Panel</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>Couple Meeting v3.0</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Live Ping Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, background: 'rgba(0,168,132,.08)', border: '1px solid rgba(0,168,132,.15)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00a884', animation: 'livePulse 1s ease-in-out infinite' }} />
            <span style={{ color: '#00a884', fontSize: 11, fontWeight: 700 }}>LIVE</span>
          </div>
          {/* Online Counter */}
          <div style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(37,99,235,.08)', border: '1px solid rgba(37,99,235,.15)', fontSize: 11, fontWeight: 700, color: '#2563eb' }}>
            👥 {totalOnlineUsers} online
          </div>
          <button onClick={fetchLogs} className="admin-action" style={{
            padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,.08)',
            background: 'rgba(255,255,255,.04)', color: '#94a3b8', fontWeight: 700, fontSize: 12, cursor: 'pointer'
          }}>🔄 Yenile</button>
          <button onClick={() => navigate('/')} className="admin-action" style={{
            padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,.08)',
            background: 'rgba(255,255,255,.04)', color: '#94a3b8', fontWeight: 700, fontSize: 12, cursor: 'pointer'
          }}>🏠 Ana Sayfa</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.05)', background: 'rgba(0,0,0,.2)', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className="admin-tab" style={{
            flex: '0 0 auto', padding: '12px 18px', border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer',
            background: tab === t.key ? 'rgba(124,58,237,.1)' : 'transparent',
            color: tab === t.key ? '#a855f7' : '#64748b',
            borderBottom: tab === t.key ? '2px solid #7c3aed' : '2px solid transparent',
            transition: 'all .15s', whiteSpace: 'nowrap'
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>

        {/* ═══════════ DASHBOARD ═══════════ */}
        {tab === 'dashboard' && (
          <div style={{ animation: 'fadeIn .4s ease-out' }}>
            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }} className="admin-grid">
              {[
                { icon: '🏠', label: 'Aktif Oda', value: totalRoomsCount, color: '#7c3aed', gradient: 'linear-gradient(135deg, rgba(124,58,237,.12), rgba(168,85,247,.05))' },
                { icon: '👥', label: 'Çevrimiçi', value: totalOnlineUsers, color: '#00a884', gradient: 'linear-gradient(135deg, rgba(0,168,132,.12), rgba(0,168,132,.05))' },
                { icon: '👤', label: 'Toplam Üye', value: users.length, color: '#2563eb', gradient: 'linear-gradient(135deg, rgba(37,99,235,.12), rgba(37,99,235,.05))' },
                { icon: '👑', label: 'VIP Üye', value: vipCount, color: '#eab308', gradient: 'linear-gradient(135deg, rgba(234,179,8,.12), rgba(234,179,8,.05))' }
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

            {/* Live Chart + Activity Feed */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 24 }} className="admin-grid">
              {/* Live Activity Chart */}
              <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 18, padding: 20, border: '1px solid rgba(255,255,255,.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8' }}>📈 Canlı Aktivite Grafiği</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00a884', animation: 'livePulse 1s infinite' }} />
                    <span style={{ fontSize: 10, color: '#00a884', fontWeight: 700 }}>CANLI</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120, padding: '0 4px' }}>
                  {activityHistory.length > 0 ? activityHistory.map((h, i) => (
                    <div key={i} style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
                    }}>
                      <div style={{
                        width: '100%', borderRadius: '3px 3px 0 0', height: `${Math.max(6, (h.users / Math.max(...activityHistory.map(x => x.users), 1)) * 100)}%`,
                        background: `linear-gradient(to top, rgba(124,58,237,.6), rgba(168,85,247,.3))`,
                        transition: 'height .4s ease', minHeight: 4
                      }} title={`${h.users} kullanıcı | ${h.rooms} oda`} />
                    </div>
                  )) : (
                    <div style={{ width: '100%', textAlign: 'center', color: '#475569', fontSize: 12, padding: 40 }}>Veri bekleniyor...</div>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, borderTop: '1px solid rgba(255,255,255,.03)', paddingTop: 8 }}>
                  <span style={{ fontSize: 10, color: '#475569' }}>5sn aralıkla • {activityHistory.length} örnek</span>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 10, color: '#7c3aed' }}>● Odalar: {totalRoomsCount}</span>
                    <span style={{ fontSize: 10, color: '#00a884' }}>● Online: {totalOnlineUsers}</span>
                  </div>
                </div>
              </div>

              {/* Live Activity Feed */}
              <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 18, padding: 20, border: '1px solid rgba(255,255,255,.05)', maxHeight: 320, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8' }}>⚡ Canlı Aktivite Akışı</div>
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

            {/* Online Users */}
            {onlineUsers.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 18, padding: 20, border: '1px solid rgba(255,255,255,.05)', marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', marginBottom: 14 }}>🟢 Çevrimiçi Kullanıcılar ({onlineUsers.length})</div>
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

            {/* Log Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="admin-grid">
              {[
                { icon: '📊', label: 'Toplam Log', value: logStats.totalLogs || 0, color: '#ec4899' },
                { icon: '📝', label: 'Bugünkü Log', value: logStats.todayLogs || 0, color: '#2563eb' },
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
          </div>
        )}

        {/* ═══════════ ROOMS (LIVE) ═══════════ */}
        {tab === 'rooms' && (
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
        )}

        {/* ═══════════ USERS ═══════════ */}
        {tab === 'users' && (
          <div style={{ animation: 'fadeIn .4s ease-out' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <input type="text" placeholder="🔍 Kullanıcı ara..." value={userSearch} onChange={e => setUserSearch(e.target.value)}
                style={{
                  flex: 1, minWidth: 200, padding: '10px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                  color: '#e2e8f0', fontSize: 13, outline: 'none'
                }} />
              <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center' }}>
                {filteredUsers.length} / {users.length} kullanıcı
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredUsers.map((u, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,.02)', padding: '16px 20px', borderRadius: 14,
                  border: u.isBanned ? '1px solid rgba(239,68,68,.2)' : '1px solid rgba(255,255,255,.05)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
                  cursor: 'pointer'
                }} className="admin-card" onClick={() => { setSelectedUser(u); setShowUserModal(true); }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 26 }}>{u.avatar}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 800, fontSize: 14 }}>{u.username}</span>
                        {u.isVip && <span style={{ fontSize: 9, background: 'rgba(234,179,8,.12)', color: '#eab308', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>👑 {u.vipPlan}</span>}
                        {u.isBanned && <span style={{ fontSize: 9, background: 'rgba(239,68,68,.12)', color: '#ef4444', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>🚫 BANNED</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{u.email || 'Email yok'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={(e) => { e.stopPropagation(); setVip(u.username, !u.isVip); }} className="admin-action"
                      style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: u.isVip ? 'rgba(234,179,8,.12)' : 'rgba(255,255,255,.05)', color: u.isVip ? '#eab308' : '#64748b', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>
                      {u.isVip ? '👑 Kaldır' : '⭐ VIP Ver'}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleBan(u.username, u.isBanned); }} className="admin-action"
                      style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: u.isBanned ? 'rgba(0,168,132,.12)' : 'rgba(239,68,68,.12)', color: u.isBanned ? '#00a884' : '#ef4444', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>
                      {u.isBanned ? '✅ Unban' : '🚫 Ban'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* User Detail Modal */}
            {showUserModal && selectedUser && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
                onClick={() => setShowUserModal(false)}>
                <div style={{ background: 'rgba(15,23,42,.98)', borderRadius: 20, padding: 28, width: 'min(440px, 92%)', border: '1px solid rgba(255,255,255,.08)' }}
                  onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 36 }}>{selectedUser.avatar}</span>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: 18 }}>{selectedUser.username}</div>
                        <div style={{ color: '#64748b', fontSize: 12 }}>{selectedUser.email}</div>
                      </div>
                    </div>
                    <button onClick={() => setShowUserModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                    <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: 12 }}>
                      <div style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>Kayıt</div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{formatTime(selectedUser.createdAt)}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: 12 }}>
                      <div style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>Son Görülme</div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{formatTime(selectedUser.lastSeen)}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: 12 }}>
                      <div style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>VIP</div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{selectedUser.isVip ? `👑 ${selectedUser.vipPlan}` : 'Yok'}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: 12 }}>
                      <div style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>Durum</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: selectedUser.isBanned ? '#ef4444' : '#00a884' }}>{selectedUser.isBanned ? '🚫 Banned' : '✅ Aktif'}</div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(234,179,8,.04)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#eab308', marginBottom: 10 }}>👑 VIP Ayarları</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <select value={vipPlan} onChange={e => setVipPlan(e.target.value)}
                        style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: '#0f172a', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', fontSize: 12 }}>
                        <option value="monthly">Aylık</option>
                        <option value="yearly">Yıllık</option>
                        <option value="lifetime">Ömür Boyu</option>
                      </select>
                      <input type="number" value={vipDays} onChange={e => setVipDays(e.target.value)}
                        style={{ width: 70, padding: '8px 10px', borderRadius: 8, background: '#0f172a', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', fontSize: 12 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setVip(selectedUser.username, true)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #eab308, #f59e0b)', color: '#000', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>👑 VIP Ver</button>
                      <button onClick={() => setVip(selectedUser.username, false)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid rgba(234,179,8,.3)', background: 'transparent', color: '#eab308', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>Kaldır</button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => toggleBan(selectedUser.username, selectedUser.isBanned)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: selectedUser.isBanned ? 'rgba(0,168,132,.15)' : 'rgba(239,68,68,.15)', color: selectedUser.isBanned ? '#00a884' : '#ef4444', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                      {selectedUser.isBanned ? '✅ Unban' : '🚫 Ban'}
                    </button>
                    <button onClick={() => deleteUser(selectedUser.username)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: 'rgba(239,68,68,.2)', color: '#ef4444', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                      🗑️ Sil
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ LOGS ═══════════ */}
        {tab === 'logs' && (
          <div style={{ animation: 'fadeIn .4s ease-out' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <input type="text" placeholder="🔍 Loglarda ara..." value={logSearch} onChange={e => setLogSearch(e.target.value)}
                style={{ flex: 1, minWidth: 200, padding: '10px 16px', borderRadius: 12, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#e2e8f0', fontSize: 13, outline: 'none' }} />
              <input type="text" placeholder="Oda ID filtre..." value={logRoomFilter} onChange={e => setLogRoomFilter(e.target.value)}
                style={{ width: 160, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#e2e8f0', fontSize: 12, outline: 'none' }} />
              <button onClick={() => { setLogSearch(''); setLogRoomFilter(''); }} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', color: '#94a3b8', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>Temizle</button>
              <span style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center' }}>{filteredLogs.length} kayıt</span>
            </div>
            <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid rgba(255,255,255,.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(0,0,0,.2)' }}>
                    {['Zaman', 'Kullanıcı', 'IP', 'Oda', 'İşlem'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 800, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((l, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,.02)', background: i % 2 === 0 ? 'rgba(255,255,255,.01)' : 'transparent' }}>
                      <td style={{ padding: '8px 14px', color: '#94a3b8', fontSize: 11, whiteSpace: 'nowrap' }}>{formatTime(l.created_at)}</td>
                      <td style={{ padding: '8px 14px', fontWeight: 700 }}>{l.username || '-'}</td>
                      <td style={{ padding: '8px 14px', color: '#64748b', fontFamily: 'monospace', fontSize: 11 }}>{l.ip || '-'}</td>
                      <td style={{ padding: '8px 14px', color: '#7c3aed', fontSize: 11 }}>{l.room_id || '-'}</td>
                      <td style={{ padding: '8px 14px' }}>
                        <span style={{
                          background: l.action === 'join' ? 'rgba(0,168,132,.12)' : 'rgba(239,68,68,.12)',
                          color: l.action === 'join' ? '#00a884' : '#ef4444',
                          padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800
                        }}>
                          {l.action === 'join' ? '➡️ GİRİŞ' : '⬅️ AYRILDI'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredLogs.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>Kayıt bulunamadı</div>}
          </div>
        )}

        {/* ═══════════ REPORTS ═══════════ */}
        {tab === 'reports' && (
          <div style={{ animation: 'fadeIn .4s ease-out' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#94a3b8', marginBottom: 16 }}>🚨 Kullanıcı Raporları ({reports.length})</div>
            {reports.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>Rapor yok</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reports.map((r, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,.02)', padding: '16px 20px', borderRadius: 14, border: '1px solid rgba(255,255,255,.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: 'rgba(239,68,68,.12)', color: '#ef4444', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800 }}>⚠️ RAPOR</span>
                      <span style={{ fontWeight: 800 }}>{r.reporter} → {r.target}</span>
                    </div>
                    <span style={{ color: '#475569', fontSize: 10 }}>{formatTime(r.created_at)}</span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>Sebep: {r.reason}</div>
                  {r.details && <div style={{ color: '#64748b', fontSize: 11 }}>{r.details}</div>}
                  <div style={{ marginTop: 10 }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800,
                      background: r.status === 'resolved' ? 'rgba(0,168,132,.12)' : 'rgba(234,179,8,.12)',
                      color: r.status === 'resolved' ? '#00a884' : '#eab308'
                    }}>
                      {r.status === 'resolved' ? '✅ Çözüldü' : '⏳ Beklemede'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════ SYSTEM ═══════════ */}
        {tab === 'system' && (
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
        )}

        {/* ═══════════ TOOLS ═══════════ */}
        {tab === 'tools' && (
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
        )}
      </div>
    </div>
  );
}

export default memo(AdminPage);
