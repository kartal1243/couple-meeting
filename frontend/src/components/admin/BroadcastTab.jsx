import { memo } from 'react';

const BroadcastTab = memo(function BroadcastTab({ bulkMessage, setBulkMessage, bulkTarget, setBulkTarget, sendBulkMessage, emailSubject, setEmailSubject, emailBody, setEmailBody, emailTarget, setEmailTarget, sendBulkEmail, showToast }) {
  return (
    <div style={{ animation: 'fadeIn .4s ease-out' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 14 }} className="admin-grid">
        <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 18, padding: 22, border: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#94a3b8', marginBottom: 14 }}>📢 Bildirim Gönder</div>
          <p style={{ color: '#64748b', fontSize: 11, marginBottom: 12 }}>Seçili kullanıcılara bildirim olarak gider.</p>
          <select value={bulkTarget} onChange={e => setBulkTarget(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#e2e8f0', fontSize: 13, marginBottom: 10 }}>
            <option value="all">Tüm Kullanıcılar</option>
            <option value="vip">Sadece VIP'ler</option>
            <option value="single">Tek Kullanıcı</option>
          </select>
          {bulkTarget === 'single' && (
            <input id="bulkSingleUser" placeholder="Kullanıcı adı" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#e2e8f0', fontSize: 13, marginBottom: 10 }} />
          )}
          <textarea value={bulkMessage} onChange={e => setBulkMessage(e.target.value)} placeholder="Mesajınızı yazın..."
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical', minHeight: 100, marginBottom: 10 }} />
          <button onClick={() => { const u = bulkTarget === 'single' ? document.getElementById('bulkSingleUser')?.value : null; if (bulkTarget === 'single' && !u) return showToast('Kullanıcı adı girin', 'error'); sendBulkMessage(u, bulkMessage); }} className="admin-action" style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>📤 Bildirim Gönder</button>
        </div>

        <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 18, padding: 22, border: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#94a3b8', marginBottom: 14 }}>✉️ E-posta Gönder</div>
          <p style={{ color: '#64748b', fontSize: 11, marginBottom: 12 }}>Seçili kullanıcılara e-posta gönderir. SMTP yapılandırması gerekir.</p>
          <select value={emailTarget} onChange={e => setEmailTarget(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#e2e8f0', fontSize: 13, marginBottom: 10 }}>
            <option value="all">Tüm Kullanıcılar (E-postası olan)</option>
            <option value="single">Tek Kullanıcı</option>
          </select>
          {emailTarget === 'single' && (
            <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Alıcı e-posta" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#e2e8f0', fontSize: 13, marginBottom: 10 }} />
          )}
          <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Konu" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#e2e8f0', fontSize: 13, marginBottom: 10 }} />
          <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} placeholder="E-posta içeriği (HTML destekler)..."
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical', minHeight: 100, marginBottom: 10 }} />
          <button onClick={sendBulkEmail} className="admin-action" style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>✉️ E-posta Gönder</button>
        </div>
      </div>
    </div>
  );
});

export default BroadcastTab;
