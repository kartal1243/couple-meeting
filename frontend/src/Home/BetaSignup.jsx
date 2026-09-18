import { useState } from 'react';
import { BACKEND_URL, PLAY_STORE_URL } from '../constants';

export default function BetaSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/beta/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      if (data.ok) {
        setStatus({ ok: true, msg: data.message || 'Kaydın alındı!' });
        setEmail('');
      } else {
        setStatus({ ok: false, msg: data.message || 'Kayıt başarısız.' });
      }
    } catch {
      setStatus({ ok: false, msg: 'Bağlantı hatası, tekrar dene.' });
    }
    setBusy(false);
  };

  return (
    <section className="cm-section" style={{ marginTop: 32 }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,168,132,.12), rgba(37,99,235,.12))',
        border: '1px solid rgba(0,168,132,.25)', borderRadius: 20, padding: '28px 24px',
        display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap'
      }}>
        <div style={{ fontSize: 44, flexShrink: 0 }}>🤖</div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ color: '#00a884', fontSize: 11, fontWeight: 900 }}>ANDROID KAPALI BETA</div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: '4px 0 6px' }}>Telefon uygulamasını ilk deneyenlerden ol</div>
          <div style={{ color: '#8696a0', fontSize: 13, lineHeight: 1.6 }}>
            Play Store kapalı betaya katılmak için Gmail adresini bırak. Davetiye sırayla gönderiliyor.
          </div>
          <form onSubmit={submit} style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@gmail.com" disabled={busy}
              style={{ flex: 1, minWidth: 200, padding: '11px 14px', background: '#0b141a', border: '1px solid #25313a', color: '#e9edef', borderRadius: 12, fontSize: 13, outline: 'none' }}
            />
            <button type="submit" disabled={busy || !email.trim()} style={{
              padding: '11px 20px', borderRadius: 12, border: 'none',
              background: email.trim() ? 'linear-gradient(135deg,#00a884,#008f6f)' : 'rgba(0,168,132,.2)',
              color: '#fff', fontSize: 13, fontWeight: 900, cursor: email.trim() ? 'pointer' : 'not-allowed'
            }}>
              {busy ? '...' : 'Beta Daveti İste'}
            </button>
          </form>
          {status && (
            <div style={{ color: status.ok ? '#00a884' : '#ef4444', fontSize: 12, fontWeight: 700, marginTop: 8 }}>
              {status.ok ? '✅ ' : '⚠️ '}{status.msg}
            </div>
          )}
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12,
            padding: '10px 18px', borderRadius: 12, background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(255,255,255,.1)', color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none'
          }}>
            ▶️ Play Store'da Gör
          </a>
        </div>
      </div>
    </section>
  );
}
