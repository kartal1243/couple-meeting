import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../constants';

export default function BetaSignup() {
  const navigate = useNavigate();
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
        setStatus({ ok: true, msg: data.message || 'Davetiye listesine eklendin!' });
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
    <section className="cm-section" style={{ marginTop: 60, marginBottom: 20 }}>
      {/* Iconic Tinder Pink Flame Pre-Footer Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #fd267d 0%, #ff6036 100%)',
        borderRadius: 32,
        padding: 'clamp(36px, 5vw, 64px) clamp(24px, 5vw, 48px)',
        textAlign: 'center',
        color: '#ffffff',
        boxShadow: '0 24px 60px rgba(253, 38, 125, 0.35)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative circles */}
        <div style={{
          position: 'absolute', top: -50, right: -50, width: 220, height: 220,
          borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -40, width: 260, height: 260,
          borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 680, margin: '0 auto' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>💕</div>
          <h2 style={{
            fontSize: 'clamp(28px, 4.5vw, 46px)',
            fontWeight: 950,
            lineHeight: 1.1,
            letterSpacing: '-1px',
            margin: '0 0 16px'
          }}>
            Yeni Biriyle Tanışmaya veya <br />
            Sevgilinle Buluşmaya Hazır mısın?
          </h2>

          <p style={{
            fontSize: 'clamp(14.5px, 2vw, 17px)',
            opacity: 0.95,
            fontWeight: 500,
            lineHeight: 1.6,
            margin: '0 auto 32px',
            maxWidth: 540
          }}>
            Hesap açma zorunluluğu yok. İster müzik zevkinle anında eşleşip Sanal Date&apos;e çık, ister saniyeler içinde odanı kurup linki sevgiline gönder.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
            <button
              type="button"
              onClick={() => navigate('/date')}
              style={{
                padding: '16px 38px',
                borderRadius: 999,
                border: 'none',
                background: '#ffffff',
                color: '#fd267d',
                fontSize: 16,
                fontWeight: 950,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; }}
            >
              <span>💘 Hemen Başla (Tamamen Ücretsiz)</span>
              <span style={{ fontSize: 18 }}>↗</span>
            </button>
          </div>

          {/* Quick Mobile App Beta Invite Form */}
          <div style={{
            maxWidth: 440, margin: '0 auto', paddingTop: 20,
            borderTop: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8, opacity: 0.9 }}>
              📱 Mobil Uygulamayı (Android / iOS) İlk Deneyen Ol
            </div>
            <form onSubmit={submit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta adresin..."
                disabled={busy}
                style={{
                  flex: 1, minWidth: 200, padding: '11px 16px', borderRadius: 999,
                  border: 'none', background: 'rgba(255,255,255,0.22)', color: '#ffffff',
                  fontSize: 13, outline: 'none', backdropFilter: 'blur(10px)',
                  fontWeight: 600
                }}
              />
              <button
                type="submit"
                disabled={busy || !email.trim()}
                style={{
                  padding: '11px 22px', borderRadius: 999, border: 'none',
                  background: '#0f172a', color: '#ffffff', fontSize: 13,
                  fontWeight: 900, cursor: email.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                {busy ? '...' : 'Davet İste'}
              </button>
            </form>
            {status && (
              <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, color: status.ok ? '#ffffff' : '#fecdd3' }}>
                {status.msg}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
