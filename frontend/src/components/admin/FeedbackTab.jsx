import { memo } from 'react';

const FeedbackTab = memo(function FeedbackTab({ feedbackList, fetchLogs, api }) {
  return (
    <div style={{ animation: 'fadeIn .4s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#94a3b8' }}>🐛 Geri Bildirimler ({feedbackList.length})</div>
        <button onClick={() => fetchLogs()} style={{ padding: '6px 12px', background: 'rgba(124,58,237,.15)', border: '1px solid rgba(124,58,237,.3)', borderRadius: 8, color: '#a855f7', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🔄 Yenile</button>
      </div>
      {feedbackList.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>Henüz geri bildirim yok</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {feedbackList.map((f) => (
          <div key={f.id} style={{
            background: 'rgba(255,255,255,.02)', padding: '16px 20px', borderRadius: 14,
            border: `1px solid ${f.status === 'open' ? 'rgba(245,158,11,.2)' : f.status === 'resolved' ? 'rgba(16,185,129,.2)' : 'rgba(255,255,255,.05)'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <span style={{
                  display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800, marginRight: 8,
                  background: f.type === 'bug' ? 'rgba(239,68,68,.15)' : f.type === 'feature' ? 'rgba(59,130,246,.15)' : f.type === 'ui' ? 'rgba(245,158,11,.15)' : f.type === 'performance' ? 'rgba(16,185,129,.15)' : 'rgba(139,92,246,.15)',
                  color: f.type === 'bug' ? '#ef4444' : f.type === 'feature' ? '#3b82f6' : f.type === 'ui' ? '#f59e0b' : f.type === 'performance' ? '#10b981' : '#8b5cf6'
                }}>{f.type === 'bug' ? '🐛 Hata' : f.type === 'feature' ? '💡 Öneri' : f.type === 'ui' ? '🎨 Tasarım' : f.type === 'performance' ? '⚡ Performans' : '📝 Diğer'}</span>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>{f.title}</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['open', 'in_progress', 'resolved', 'dismissed'].map(s => (
                  <button key={s} onClick={async () => { await api(`/api/admin/feedback/${f.id}`, { method: 'POST', body: JSON.stringify({ status: s }) }); fetchLogs(); }}
                    style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 800, border: 'none', cursor: 'pointer',
                      background: f.status === s ? (s === 'open' ? '#f59e0b' : s === 'in_progress' ? '#3b82f6' : s === 'resolved' ? '#10b981' : '#64748b') : 'rgba(255,255,255,.05)',
                      color: f.status === s ? '#fff' : '#64748b'
                    }}>{s === 'open' ? 'Açık' : s === 'in_progress' ? 'Devam' : s === 'resolved' ? 'Çözüldü' : 'Reddedildi'}</button>
                ))}
              </div>
            </div>
            <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>{f.description}</div>
            <div style={{ display: 'flex', gap: 12, color: '#475569', fontSize: 10 }}>
              {f.username && <span>👤 {f.username}</span>}
              <span>🕐 {new Date(f.created_at).toLocaleString('tr-TR')}</span>
              {f.ip && <span>🌐 {f.ip}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default FeedbackTab;
