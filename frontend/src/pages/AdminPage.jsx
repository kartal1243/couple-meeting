import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../constants';
import { socket } from '../socket';
import DashboardTab from '../components/admin/DashboardTab';
import RoomsTab from '../components/admin/RoomsTab';
import UsersTab from '../components/admin/UsersTab';
import LogsTab from '../components/admin/LogsTab';
import FeedbackTab from '../components/admin/FeedbackTab';
import ReportsTab from '../components/admin/ReportsTab';
import SystemTab from '../components/admin/SystemTab';
import AnalyticsTab from '../components/admin/AnalyticsTab';
import BroadcastTab from '../components/admin/BroadcastTab';
import ToolsTab from '../components/admin/ToolsTab';

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
  const [feedbackList, setFeedbackList] = useState([]);
  const [quickVipUser, setQuickVipUser] = useState('');
  const [vipDays, setVipDays] = useState(365);
  const [vipPlan, setVipPlan] = useState('yearly');
  const [toast, setToast] = useState(null);
  const [livePing, setLivePing] = useState(Date.now());
  const [analytics, setAnalytics] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkTarget, setBulkTarget] = useState('all');
  const [bulkType, setBulkType] = useState('notification');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailTarget, setEmailTarget] = useState('all');
  const navigate = useNavigate();
  const activityFeedRef = useRef([]);
  const chartRef = useRef([]);
  const passRef = useRef('');
  passRef.current = pass;

  const headers = { 'Content-Type': 'application/json', 'x-admin-pass': pass };

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const api = useCallback(async (path, opts = {}) => {
    const sep = path.includes('?') ? '&' : '?';
    const url = `${BACKEND_URL}${path}${sep}pass=${passRef.current}`;
    const res = await fetch(url, { headers: { ...headers, 'x-admin-pass': passRef.current }, ...opts });
    return res.json();
  }, []);

  // ── SOCKET.IO REAL-TIME CONNECTION ──
  useEffect(() => {
    if (!authed) return;

    if (!socket.connected) socket.connect();

    const handleConnect = () => {
      socket.emit('admin_connect', { pass });
    };
    socket.on('connect', handleConnect);
    if (socket.connected) socket.emit('admin_connect', { pass });

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
      socket.off('connect', handleConnect);
    };
  }, [authed, pass]);

  // ── INITIAL DATA FETCH ──
  const fetchLogs = useCallback(async () => {
    try {
      const [l, u, sys, rep, fb] = await Promise.all([
        api(`/api/admin/logs?limit=500${logRoomFilter ? `&room=${logRoomFilter}` : ''}`),
        api('/api/admin/users'),
        api('/api/admin/system'),
        api('/api/admin/reports'),
        api('/api/admin/feedback')
      ]);
      if (l.ok) setLogs(l.logs);
      if (u.ok) setUsers(u.users);
      if (sys.ok) setSystem(sys);
      if (rep.ok) setReports(rep.reports || []);
      if (fb.ok) setFeedbackList(fb.feedback || []);
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

  const resolveReport = useCallback((reportId, action) => {
    socket.emit('resolve_report', { reportId, action, token: pass });
    setReports(prev => prev.filter(r => r.id !== reportId));
  }, [pass]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await api('/api/admin/analytics');
      if (res.ok) setAnalytics(res.analytics);
    } catch {}
  }, [api]);

  const fetchUserDetail = useCallback(async (username) => {
    try {
      const res = await api(`/api/admin/users/${encodeURIComponent(username)}/detail`);
      if (res.ok) { setUserDetail(res); setShowUserDetail(true); }
    } catch {}
  }, [api]);

  const resetPassword = async (username) => {
    if (!confirm(`${username} kullanıcısının şifresini sıfırlamak istediğine emin misin?`)) return;
    const res = await api('/api/admin/users/reset-password', { method: 'POST', body: JSON.stringify({ username }) });
    if (res.ok) alert(`Yeni şifre: ${res.newPassword}\nBu şifreyi kaydet!`);
  };

  const changeEmail = async (username) => {
    const newEmail = prompt(`${username} için yeni e-posta adresi:`);
    if (!newEmail) return;
    const res = await api('/api/admin/users/change-email', { method: 'POST', body: JSON.stringify({ username, newEmail }) });
    if (res.ok) showToast('E-posta güncellendi');
    else showToast(res.message || 'Hata', 'error');
  };

  const freezeAccount = async (username, frozen) => {
    if (!confirm(`${username} hesabını ${frozen ? 'dondurmayı kaldır' : 'dondur'}mak istediğine emin misin?`)) return;
    await api('/api/admin/users/freeze', { method: 'POST', body: JSON.stringify({ username, frozen: !frozen }) });
    showToast(`Hesap ${frozen ? 'dondurması kaldırıldı' : 'donduruldu'}`);
  };

  const sendBulkMessage = async (target, message) => {
    const msg = message || bulkMessage;
    const tgt = target || bulkTarget;
    if (!msg.trim()) return;
    const type = tgt === 'all' ? 'all' : tgt === 'vip' ? 'vip' : 'single';
    const res = await api('/api/admin/bulk-message', { method: 'POST', body: JSON.stringify({ target: tgt, message: msg, type }) });
    if (res.ok) { showToast(`${res.sentCount} kullanıcıya mesaj gönderildi`); setBulkMessage(''); }
  };

  const sendBulkEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) return;
    const res = await api('/api/admin/send-email', { method: 'POST', body: JSON.stringify({ to: emailTarget, subject: emailSubject, body: emailBody }) });
    if (res.ok) { showToast(`${res.sentCount} kullanıcıya e-posta gönderildi`); setEmailSubject(''); setEmailBody(''); }
  };

  useEffect(() => {
    if (authed && tab === 'analytics') fetchAnalytics();
  }, [authed, tab, fetchAnalytics]);

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
    { key: 'analytics', icon: '📈', label: 'Analitik' },
    { key: 'broadcast', icon: '📢', label: 'Toplu İletişim' },
    { key: 'feedback', icon: '🐛', label: `Geri Bildirim (${feedbackList.length})` },
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
          {/* Quick VIP Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 10, background: 'rgba(234,179,8,.06)', border: '1px solid rgba(234,179,8,.15)' }}>
            <span style={{ fontSize: 14 }}>👑</span>
            <input type="text" placeholder="Kullanıcı adı..." value={quickVipUser} onChange={e => setQuickVipUser(e.target.value)}
              style={{ width: 100, padding: '4px 8px', borderRadius: 6, background: 'transparent', border: 'none', color: '#eab308', fontSize: 11, fontWeight: 700, outline: 'none' }} />
            <button onClick={async () => {
              if (!quickVipUser.trim()) return;
              await api('/api/admin/users/vip', { method: 'POST', body: JSON.stringify({ username: quickVipUser.trim(), isVip: true, vipPlan: 'lifetime', vipDays: 99999 }) });
              showToast(`👑 ${quickVipUser.trim()} ömür boyu VIP verildi!`);
              setQuickVipUser('');
              fetchLogs();
            }} className="admin-action" style={{
              padding: '4px 10px', borderRadius: 6, border: 'none',
              background: 'linear-gradient(135deg, #eab308, #f59e0b)', color: '#000', fontWeight: 800, fontSize: 10, cursor: 'pointer'
            }}>Ver</button>
          </div>
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
          <DashboardTab
            totalRoomsCount={totalRoomsCount}
            totalOnlineUsers={totalOnlineUsers}
            users={users}
            vipCount={vipCount}
            reports={reports}
            activityHistory={activityHistory}
            activityFeed={activityFeed}
            onlineUsers={onlineUsers}
            logStats={logStats}
            logs={logs}
            formatTime={formatTime}
          />
        )}

        {/* ═══════════ ROOMS (LIVE) ═══════════ */}
        {tab === 'rooms' && <RoomsTab rooms={rooms} closeRoom={closeRoom} />}

        {/* ═══════════ USERS ═══════════ */}
        {tab === 'users' && <UsersTab users={users} userSearch={userSearch} setUserSearch={setUserSearch} filteredUsers={filteredUsers} setSelectedUser={setSelectedUser} setShowUserModal={setShowUserModal} showUserModal={showUserModal} selectedUser={selectedUser} userDetail={userDetail} fetchUserDetail={fetchUserDetail} resetPassword={resetPassword} changeEmail={changeEmail} freezeAccount={freezeAccount} setVip={setVip} toggleBan={toggleBan} deleteUser={deleteUser} showToast={showToast} vipPlan={vipPlan} setVipPlan={setVipPlan} vipDays={vipDays} setVipDays={setVipDays} formatTime={formatTime} />}

        {/* ═══════════ LOGS ═══════════ */}
        {tab === 'logs' && <LogsTab logs={logs} logSearch={logSearch} setLogSearch={setLogSearch} filteredLogs={filteredLogs} logRoomFilter={logRoomFilter} setLogRoomFilter={setLogRoomFilter} rooms={rooms} formatTime={formatTime} adminPass={pass} />}

        {/* ═══════════ FEEDBACK ═══════════ */}
        {tab === 'feedback' && <FeedbackTab feedbackList={feedbackList} fetchLogs={fetchLogs} api={api} />}

        {/* ═══════════ REPORTS ═══════════ */}
        {tab === 'reports' && <ReportsTab reports={reports} resolveReport={resolveReport} formatTime={formatTime} />}

        {/* ═══════════ SYSTEM ═══════════ */}
        {tab === 'system' && <SystemTab system={system} maintenance={maintenance} toggleMaintenance={toggleMaintenance} broadcastMsg={broadcastMsg} setBroadcastMsg={setBroadcastMsg} sendBroadcast={sendBroadcast} formatUptime={formatUptime} users={users} vipCount={vipCount} totalRoomsCount={totalRoomsCount} logStats={logStats} />}

        {/* ═══════════ ANALYTICS ═══════════ */}
        {tab === 'analytics' && <AnalyticsTab analytics={analytics} formatTime={formatTime} />}

        {/* ═══════════ BULK COMMUNICATION ═══════════ */}
        {tab === 'broadcast' && <BroadcastTab bulkMessage={bulkMessage} setBulkMessage={setBulkMessage} bulkTarget={bulkTarget} setBulkTarget={setBulkTarget} sendBulkMessage={sendBulkMessage} emailSubject={emailSubject} setEmailSubject={setEmailSubject} emailBody={emailBody} setEmailBody={setEmailBody} emailTarget={emailTarget} setEmailTarget={setEmailTarget} sendBulkEmail={sendBulkEmail} showToast={showToast} />}

        {/* ═══════════ USER DETAIL MODAL ═══════════ */}
        {showUserDetail && userDetail && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50000, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }} onClick={() => setShowUserDetail(false)}>
            <div style={{ width: 'min(600px, 100%)', maxHeight: '90vh', background: 'linear-gradient(180deg, rgba(15,23,42,.98), rgba(10,14,20,.98))', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: 28, overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ color: '#fff', margin: 0, fontSize: 18, fontWeight: 900 }}>👤 Kullanıcı Detayı</h3>
                <button onClick={() => setShowUserDetail(false)} style={{ background: 'rgba(255,255,255,.06)', border: 'none', color: '#94a3b8', width: 32, height: 32, borderRadius: 16, cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: 16, background: 'rgba(255,255,255,.03)', borderRadius: 14 }}>
                <div style={{ width: 60, height: 60, borderRadius: 30, background: 'rgba(0,168,132,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{userDetail.user?.avatar || '🐱'}</div>
                <div>
                  <div style={{ color: '#fff', fontSize: 18, fontWeight: 900 }}>{userDetail.user?.username}</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>{userDetail.user?.email}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    {userDetail.user?.isVip && <span style={{ background: 'rgba(234,179,8,.15)', color: '#eab308', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>VIP</span>}
                    {userDetail.user?.frozen ? <span style={{ background: 'rgba(239,68,68,.15)', color: '#ef4444', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>Dondurulmuş</span> : null}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 20 }}>
                {[{ l: 'Arkadaş', v: userDetail.stats?.friendCount || 0, c: '#3b82f6' },
                  { l: 'Mesaj', v: userDetail.stats?.messageCount || 0, c: '#00a884' },
                  { l: 'Oda', v: userDetail.stats?.roomCount || 0, c: '#8b5cf6' },
                  { l: 'Log', v: userDetail.stats?.logCount || 0, c: '#64748b' },
                  { l: 'Takip', v: userDetail.stats?.followCount || 0, c: '#ec4899' },
                  { l: 'Takipçi', v: userDetail.stats?.followerCount || 0, c: '#f59e0b' },
                  { l: 'Rapor', v: userDetail.stats?.reportCount || 0, c: '#ef4444' }
                ].map((item, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,.03)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ color: item.c, fontSize: 22, fontWeight: 900 }}>{item.v}</div>
                    <div style={{ color: '#64748b', fontSize: 10, marginTop: 2 }}>{item.l}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 20 }}>
                <button onClick={() => resetPassword(userDetail.user?.username)} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,.12)', color: '#ef4444', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>🔑 Şifre Sıfırla</button>
                <button onClick={() => changeEmail(userDetail.user?.username)} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: 'rgba(59,130,246,.12)', color: '#3b82f6', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>✉️ E-posta Değiştir</button>
                <button onClick={() => freezeAccount(userDetail.user?.username, userDetail.user?.frozen)} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: userDetail.user?.frozen ? 'rgba(16,185,129,.12)' : 'rgba(245,158,11,.12)', color: userDetail.user?.frozen ? '#10b981' : '#f59e0b', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>{userDetail.user?.frozen ? '🔄 Dondurmayı Kaldır' : '❄️ Hesabı Dondur'}</button>
                <button onClick={() => setVip(userDetail.user?.username, !userDetail.user?.isVip)} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: userDetail.user?.isVip ? 'rgba(239,68,68,.12)' : 'rgba(234,179,8,.12)', color: userDetail.user?.isVip ? '#ef4444' : '#eab308', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>{userDetail.user?.isVip ? '⭐ VIP Kaldır' : '⭐ VIP Ver'}</button>
              </div>

              {userDetail.recentLogs?.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', marginBottom: 10 }}>Son Bağlantılar</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                    {userDetail.recentLogs.map((log, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', background: 'rgba(255,255,255,.03)', borderRadius: 8, fontSize: 11 }}>
                        <span style={{ color: '#64748b', width: 80 }}>{formatTime(log.created_at)}</span>
                        <span style={{ color: '#e2e8f0', flex: 1 }}>{log.room_id || '-'}</span>
                        <span style={{ color: '#3b82f6' }}>{log.ip}</span>
                        <span style={{ color: '#64748b' }}>{log.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
