import { memo } from 'react';

const ReportsTab = memo(function ReportsTab({ reports, resolveReport, formatTime }) {
  return (
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
  );
});

export default ReportsTab;
