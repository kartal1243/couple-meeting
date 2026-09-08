import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdsPage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0e14, #0f172a, #1a1040)', color: '#e2e8f0', fontFamily: "'Inter', -apple-system, sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
      <style>{`
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 20px rgba(0,168,132,.3); } 50% { box-shadow: 0 0 40px rgba(0,168,132,.6); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}</style>

      <div style={{ fontSize: 60, marginBottom: 20, animation: 'float 3s ease-in-out infinite' }}>🎬</div>

      <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, marginBottom: 16, background: 'linear-gradient(135deg, #00a884, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.2 }}>
        Arkadaşlarınla Aynı Anda<br />YouTube İzle!
      </h1>

      <p style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#94a3b8', marginBottom: 32, maxWidth: 500, lineHeight: 1.6 }}>
        Ücretsiz, kayıt gerekmez. Tek link ile oda oluştur, arkadaşlarını davet et, birlikte izleyin.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['YouTube Senkronizasyonu', 'Sesli Sohbet', 'Ücretsiz', 'Kayıt Gerekmez'].map((f, i) => (
          <span key={i} style={{ background: 'rgba(0,168,132,.12)', color: '#00a884', padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, border: '1px solid rgba(0,168,132,.2)' }}>{f}</span>
        ))}
      </div>

      <button
        onClick={() => navigate('/')}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: '18px 48px', borderRadius: 16, border: 'none', cursor: 'pointer',
          background: hovered ? 'linear-gradient(135deg, #00c9a7, #00a884)' : 'linear-gradient(135deg, #00a884, #008f6f)',
          color: '#fff', fontSize: 18, fontWeight: 900,
          boxShadow: hovered ? '0 0 40px rgba(0,168,132,.5)' : '0 0 20px rgba(0,168,132,.3)',
          transition: 'all .3s', animation: 'glow 2s ease-in-out infinite'
        }}
      >
        🚀 Hemen Başla - Ücretsiz
      </button>

      <div style={{ marginTop: 40, display: 'flex', gap: 30, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[{ n: '100+', l: 'Kullanıcı' }, { n: '50+', l: 'Oda' }, { n: '4.8', l: 'Puan' }].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#00a884' }}>{s.n}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{s.l}</div>
          </div>
        ))}
      </div>

      <p style={{ marginTop: 40, fontSize: 12, color: '#475569' }}>
        © 2026 Couple Meeting • couplemeeting.com.tr
      </p>
    </div>
  );
}
