import { memo, useState, useEffect, useCallback } from 'react';
import { BACKEND_URL } from '../../constants';

const ACTION_COLORS = {
  join: { bg: 'rgba(0,168,132,.12)', color: '#00a884', label: '➡️ GİRİŞ', icon: '➡️' },
  leave: { bg: 'rgba(239,68,68,.12)', color: '#ef4444', label: '⬅️ AYRILDI', icon: '⬅️' },
  chat: { bg: 'rgba(37,99,235,.12)', color: '#2563eb', label: '💬 MESAJ', icon: '💬' },
  voice: { bg: 'rgba(168,85,247,.12)', color: '#a855f7', label: '🎤 SES', icon: '🎤' },
  screen: { bg: 'rgba(245,158,11,.12)', color: '#f59e0b', label: '🖥️ EKRAN', icon: '🖥️' },
  admin: { bg: 'rgba(234,179,8,.12)', color: '#eab308', label: '👑 YÖNETİCİ', icon: '👑' },
  kick: { bg: 'rgba(239,68,68,.15)', color: '#ef4444', label: '🚫 ATILDI', icon: '🚫' },
  register: { bg: 'rgba(34,197,94,.12)', color: '#22c55e', label: '📝 KAYIT', icon: '📝' },
  login: { bg: 'rgba(59,130,246,.12)', color: '#3b82f6', label: '🔐 GİRİŞ YAPTI', icon: '🔐' },
  default: { bg: 'rgba(100,116,139,.12)', color: '#94a3b8', label: '📋 DİĞER', icon: '📋' }
};

const LogsTab = memo(function LogsTab({ logs, logSearch, setLogSearch, filteredLogs, logRoomFilter, setLogRoomFilter, rooms, formatTime, adminPass }) {
  const [selectedLog, setSelectedLog] = useState(null);
  const [exportFormat, setExportFormat] = useState('csv');
  const [tab, setTab] = useState('logs');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [onlineLoading, setOnlineLoading] = useState(false);

  const fetchOnline = useCallback(async () => {
    setOnlineLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/online`, {
        headers: { 'x-admin-pass': adminPass }
      });
      const data = await res.json();
      if (data.ok) setOnlineUsers(data.users);
    } catch (e) {}
    setOnlineLoading(false);
  }, [adminPass]);

  useEffect(() => {
    if (tab === 'online') fetchOnline();
  }, [tab, fetchOnline]);

  const getActionInfo = (action) => ACTION_COLORS[action] || ACTION_COLORS.default;

  const exportLogs = () => {
    const data = filteredLogs.map(l => ({
      Zaman: formatTime(l.created_at),
      Kullanıcı: l.username || '-',
      IP: l.ip || '-',
      Oda: l.room_id || '-',
      İşlem: l.action || '-',
      UserAgent: l.user_agent || '-'
    }));

    if (exportFormat === 'csv') {
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(r => Object.values(r).map(v => `"${v}"`).join(','));
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `logs_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } else {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `logs_${new Date().toISOString().slice(0, 10)}.json`;
      a.click(); URL.revokeObjectURL(url);
    }
  };

  const stats = {
    total: filteredLogs.length,
    joins: filteredLogs.filter(l => l.action === 'join').length,
    leaves: filteredLogs.filter(l => l.action === 'leave').length,
    uniqueUsers: new Set(filteredLogs.map(l => l.username).filter(Boolean)).size,
    uniqueIPs: new Set(filteredLogs.map(l => l.ip).filter(Boolean)).size
  };

  const tabBtn = (id, label, icon) => (
    <button onClick={() => setTab(id)} style={{
      padding: '8px 16px', borderRadius: 10, border: tab === id ? '1px solid rgba(0,168,132,.4)' : '1px solid rgba(255,255,255,.08)',
      background: tab === id ? 'rgba(0,168,132,.15)' : 'rgba(255,255,255,.04)',
      color: tab === id ? '#00a884' : '#94a3b8', fontWeight: 800, fontSize: 12, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
    }}>{icon} {label}</button>
  );

  return (
    <div style={{ animation: 'fadeIn .4s ease-out' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {tabBtn('logs', '📋 Loglar', '📋')}
        {tabBtn('online', `🟢 Çevrimiçi (${onlineUsers.length})`, '🟢')}
        <button onClick={fetchOnline} style={{
          padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,.08)',
          background: 'rgba(255,255,255,.04)', color: '#94a3b8', fontWeight: 700, fontSize: 11, cursor: 'pointer',
          marginLeft: 'auto'
        }}>🔄 Yenile</button>
      </div>

      {tab === 'online' ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Toplam Online', value: onlineUsers.length, color: '#22c55e' },
              { label: 'Kayıtlı', value: onlineUsers.filter(u => !u.isGuest).length, color: '#3b82f6' },
              { label: 'Misafir', value: onlineUsers.filter(u => u.isGuest).length, color: '#f59e0b' },
              { label: 'Aktif Oda', value: new Set(onlineUsers.map(u => u.room)).size, color: '#a855f7' }
            ].map(s => (
              <div key={s.label} style={{ padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.05)', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid rgba(255,255,255,.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(0,0,0,.2)' }}>
                  {['Durum', 'Kullanıcı', 'IP', 'Oda', 'Tür'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 800, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {onlineUsers.map((u, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,.02)', background: i % 2 === 0 ? 'rgba(255,255,255,.01)' : 'transparent' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block',
                        boxShadow: '0 0 8px rgba(34,197,94,.6)', animation: 'pulseDot 2s ease-in-out infinite'
                      }} />
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {u.avatar ? <span style={{ fontSize: 18 }}>{u.avatar}</span> : <span style={{ fontSize: 14, color: '#64748b' }}>👤</span>}
                      <span>{u.username}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontFamily: 'monospace', fontSize: 11 }}>{u.ip}</td>
                    <td style={{ padding: '10px 14px', color: '#7c3aed', fontSize: 11 }}>{u.roomName || u.room}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800,
                        background: u.isGuest ? 'rgba(245,158,11,.12)' : 'rgba(59,130,246,.12)',
                        color: u.isGuest ? '#f59e0b' : '#3b82f6'
                      }}>
                        {u.isGuest ? '👤 MİSAFİR' : '✅ KAYITLI'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {onlineLoading && <div style={{ textAlign: 'center', padding: 20, color: '#475569' }}>Yükleniyor...</div>}
          {!onlineLoading && onlineUsers.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>Şu an çevrimiçi kullanıcı yok</div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <input type="text" placeholder="🔍 Loglarda ara..." value={logSearch} onChange={e => setLogSearch(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: '10px 16px', borderRadius: 12, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#e2e8f0', fontSize: 13, outline: 'none' }} />
            <input type="text" placeholder="Oda ID filtre..." value={logRoomFilter} onChange={e => setLogRoomFilter(e.target.value)}
              style={{ width: 160, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#e2e8f0', fontSize: 12, outline: 'none' }} />
            <button onClick={() => { setLogSearch(''); setLogRoomFilter(''); }} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', color: '#94a3b8', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>Temizle</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Toplam', value: stats.total, color: '#94a3b8' },
              { label: 'Giriş', value: stats.joins, color: '#00a884' },
              { label: 'Ayrılma', value: stats.leaves, color: '#ef4444' },
              { label: 'Kullanıcı', value: stats.uniqueUsers, color: '#2563eb' },
              { label: 'IP', value: stats.uniqueIPs, color: '#a855f7' }
            ].map(s => (
              <div key={s.label} style={{ padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.05)', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} style={{
              padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
              color: '#e2e8f0', fontSize: 11, outline: 'none'
            }}>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
            <button onClick={exportLogs} style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(0,168,132,.3)',
              background: 'rgba(0,168,132,.1)', color: '#00a884', fontWeight: 700, fontSize: 11, cursor: 'pointer'
            }}>📥 Dışa Aktar</button>
            <span style={{ fontSize: 11, color: '#475569', marginLeft: 'auto' }}>{filteredLogs.length} kayıt</span>
          </div>

          <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid rgba(255,255,255,.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(0,0,0,.2)' }}>
                  {['Zaman', 'Kullanıcı', 'IP', 'Oda', 'İşlem', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 800, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((l, i) => {
                  const actionInfo = getActionInfo(l.action);
                  return (
                    <tr key={i} onClick={() => setSelectedLog(selectedLog === i ? null : i)} style={{ borderBottom: '1px solid rgba(255,255,255,.02)', background: i % 2 === 0 ? 'rgba(255,255,255,.01)' : 'transparent', cursor: 'pointer' }}>
                      <td style={{ padding: '8px 14px', color: '#94a3b8', fontSize: 11, whiteSpace: 'nowrap' }}>{formatTime(l.created_at)}</td>
                      <td style={{ padding: '8px 14px', fontWeight: 700 }}>{l.username || '-'}</td>
                      <td style={{ padding: '8px 14px', color: '#64748b', fontFamily: 'monospace', fontSize: 11 }}>{l.ip || '-'}</td>
                      <td style={{ padding: '8px 14px', color: '#7c3aed', fontSize: 11 }}>{l.room_id || '-'}</td>
                      <td style={{ padding: '8px 14px' }}>
                        <span style={{ background: actionInfo.bg, color: actionInfo.color, padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800 }}>
                          {actionInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: '8px 14px', fontSize: 11, color: '#475569' }}>{selectedLog === i ? '▲' : '▼'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selectedLog !== null && filteredLogs[selectedLog] && (
            <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 8 }}>📋 Log Detayı</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                <div><span style={{ color: '#64748b' }}>Zaman:</span> <span style={{ color: '#e2e8f0' }}>{formatTime(filteredLogs[selectedLog].created_at)}</span></div>
                <div><span style={{ color: '#64748b' }}>Kullanıcı:</span> <span style={{ color: '#e2e8f0' }}>{filteredLogs[selectedLog].username || '-'}</span></div>
                <div><span style={{ color: '#64748b' }}>IP:</span> <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{filteredLogs[selectedLog].ip || '-'}</span></div>
                <div><span style={{ color: '#64748b' }}>Oda:</span> <span style={{ color: '#e2e8f0' }}>{filteredLogs[selectedLog].room_id || '-'}</span></div>
                <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#64748b' }}>User Agent:</span> <span style={{ color: '#94a3b8', fontSize: 10, wordBreak: 'break-all' }}>{filteredLogs[selectedLog].user_agent || '-'}</span></div>
              </div>
            </div>
          )}

          {filteredLogs.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>Kayıt bulunamadı</div>}
        </div>
      )}
    </div>
  );
});

export default LogsTab;
