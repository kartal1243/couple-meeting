import { memo } from 'react';

const LogsTab = memo(function LogsTab({ logs, logSearch, setLogSearch, filteredLogs, logRoomFilter, setLogRoomFilter, rooms, formatTime }) {
  return (
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
  );
});

export default LogsTab;
