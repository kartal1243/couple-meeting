import { useState } from 'react';

const BUG_TYPES = [
  { value: 'bug', label: '🐛 Hata / Bug', color: '#ef4444' },
  { value: 'feature', label: '💡 Öneri / İstek', color: '#3b82f6' },
  { value: 'ui', label: '🎨 Tasarım Sorunu', color: '#f59e0b' },
  { value: 'performance', label: '⚡ Performans', color: '#10b981' },
  { value: 'other', label: '📝 Diğer', color: '#8b5cf6' }
];

export default function FeedbackModal({ show, onClose, onSubmit }) {
  const [type, setType] = useState('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState(localStorage.getItem('cm_username') || '');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title: title.trim(), description: description.trim(), username: email, userAgent: navigator.userAgent, url: window.location.href })
      });
      const data = await res.json();
      if (data.ok) { setSent(true); setTimeout(() => { setSent(false); onClose(); }, 2500); }
    } catch {}
    setSending(false);
  };

  const S = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
    modal: { background: '#111827', border: '1px solid rgba(255,255,255,.08)', borderRadius: 18, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto', padding: 0, position: 'relative' },
    header: { padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    close: { background: 'rgba(255,255,255,.06)', border: 'none', color: '#94a3b8', fontSize: 18, width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    body: { padding: '20px 24px 24px' },
    betaBox: { background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' },
    betaText: { color: '#fbbf24', fontSize: 12, lineHeight: 1.5 },
    label: { color: '#94a3b8', fontSize: 12, fontWeight: 700, marginBottom: 6, display: 'block', letterSpacing: '0.3px' },
    input: { width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '11px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
    textarea: { width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '11px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: 100, fontFamily: 'inherit' },
    typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8, marginBottom: 16 },
    typeBtn: (selected, color) => ({
      background: selected ? `${color}15` : 'rgba(255,255,255,.03)',
      border: `1.5px solid ${selected ? color : 'rgba(255,255,255,.06)'}`,
      color: selected ? color : '#94a3b8',
      fontSize: 12, fontWeight: 700, padding: '10px 8px', borderRadius: 10,
      cursor: 'pointer', textAlign: 'center', transition: 'all .15s'
    }),
    submit: { width: '100%', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, padding: '13px', borderRadius: 12, cursor: 'pointer', marginTop: 16, opacity: sending ? .6 : 1 },
    sent: { textAlign: 'center', padding: '40px 24px', color: '#10b981' },
    sentIcon: { fontSize: 48, marginBottom: 12 }
  };

  if (sent) return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.sent}>
          <div style={S.sentIcon}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Teşekkürler!</div>
          <div style={{ color: '#94a3b8', fontSize: 14 }}>Geri bildiriminiz başarıyla gönderildi.</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.header}>
          <div>
            <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>Hata / Öneri Bildir</h3>
            <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>Yasadığın sorunu veya önerini paylaş</p>
          </div>
          <button style={S.close} onClick={onClose}>✕</button>
        </div>
        <div style={S.body}>
          <div style={S.betaBox}>
            <span style={{ fontSize: 18 }}>🔬</span>
            <div style={S.betaText}>
              <strong>Beta Sürümündeyiz!</strong><br />
              Geri bildirimlerin bizim için çok değerli. Karşılaştığın hataları ve önerilerini lütfen paylaş.
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <label style={S.label}>Türü</label>
            <div style={S.typeGrid}>
              {BUG_TYPES.map(bt => (
                <button key={bt.value} type="button" style={S.typeBtn(type === bt.value, bt.color)} onClick={() => setType(bt.value)}>
                  {bt.label}
                </button>
              ))}
            </div>
            <label style={S.label}>Başlık</label>
            <input style={S.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="Kısa bir açıklama..." maxLength={100} required />
            <label style={{ ...S.label, marginTop: 14 }}>Detay</label>
            <textarea style={S.textarea} value={description} onChange={e => setDescription(e.target.value)} placeholder="Adımlar, ekran görüntüsü, ne beklediğin vs." maxLength={2000} required />
            <label style={{ ...S.label, marginTop: 14 }}>Kullanıcı adın (isteğe bağlı)</label>
            <input style={S.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="kullaniciadi" maxLength={24} />
            <button type="submit" style={S.submit} disabled={sending || !title.trim() || !description.trim()}>
              {sending ? 'Gönderiliyor...' : '🚀 Gönder'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
