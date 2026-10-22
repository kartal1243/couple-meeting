import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { trackAdCtaClicked } from '../utils/analytics';

export default function AdsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hovered, setHovered] = useState(false);

  const params = new URLSearchParams(location.search);
  const angle = params.get('angle') || 'couple';
  const isCoupleAngle = angle !== 'friends';

  const handleCtaClick = () => {
    trackAdCtaClicked(`ads_page_${angle}`);
    navigate('/?action=create');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0e14, #0f172a, #1a1040)', color: '#e2e8f0', fontFamily: "'Inter', -apple-system, sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
      <style>{`
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 20px rgba(0,168,132,.3); } 50% { box-shadow: 0 0 40px rgba(0,168,132,.6); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}</style>

      <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: 'rgba(236,72,153,.14)', border: '1px solid rgba(236,72,153,.3)', color: '#f472b6', fontSize: 12, fontWeight: 800, marginBottom: 16 }}>
        ✨ UYGULAMA İNDİRMEK YOK • %100 ÜCRETSİZ
      </div>

      <div style={{ fontSize: 56, marginBottom: 16, animation: 'float 3s ease-in-out infinite' }}>
        {isCoupleAngle ? '💕' : '🎬'}
      </div>

      <h1 style={{ fontSize: 'clamp(26px, 5vw, 46px)', fontWeight: 950, marginBottom: 16, background: 'linear-gradient(135deg, #00d4ff, #ec4899, #00a884)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.2, maxWidth: 720 }}>
        {isCoupleAngle
          ? 'Aranızda Mesafeler Olsa Bile Bu Gece Yan Yana Film İzleyin 💕'
          : 'Arkadaşlarınla Aynı Saniyede YouTube İzle & Müzik Dinle!'}
      </h1>

      <p style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#94a3b8', marginBottom: 28, maxWidth: 560, lineHeight: 1.65 }}>
        {isCoupleAngle
          ? '"3, 2, 1 aynı anda başlat!" derdine son. 5 saniyede şifreli çift odanı aç, WhatsApp\'tan sevgiline link at; sesli konuşarak aynı anda YouTube izleyin ve müzik dinleyin.'
          : 'Ücretsiz, kayıt bile gerekmez. Tek link ile özel odanı oluştur, arkadaşlarını davet et, aynı saniyede izleyip sesli sohbet edin.'}
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['🎬 YouTube Senkronizasyonu', '🎤 Net Sesli Sohbet', '🎲 Çift Oyunları', '🧾 Randevu Fişi', '🔒 Şifreli Özel Oda'].map((f, i) => (
          <span key={i} style={{ background: 'rgba(0,168,132,.12)', color: '#00a884', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: '1px solid rgba(0,168,132,.2)' }}>{f}</span>
        ))}
      </div>

      <button
        onClick={handleCtaClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: '18px 44px', borderRadius: 16, border: 'none', cursor: 'pointer',
          background: hovered ? 'linear-gradient(135deg, #00c9a7, #00a884)' : 'linear-gradient(135deg, #00a884, #008f6f)',
          color: '#fff', fontSize: 18, fontWeight: 900,
          boxShadow: hovered ? '0 0 40px rgba(0,168,132,.5)' : '0 0 20px rgba(0,168,132,.3)',
          transition: 'all .3s', animation: 'glow 2s ease-in-out infinite'
        }}
      >
        🚀 Hemen Özel Odanı Aç — Ücretsiz
      </button>

      <div style={{ fontSize: 12, color: '#64748b', marginTop: 12, fontWeight: 600 }}>
        ⚡ Kayıt şartı yok • iPhone, Android ve Bilgisayarda anında açılır
      </div>

      <div style={{ marginTop: 36, display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { n: '10.000+', l: 'Senkronize Buluşma' },
          { n: '%99.8', l: 'Anlık Senkronizasyon' },
          { n: '⚡ 5 Sn', l: 'Ücretsiz Oda Kurulumu' }
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', padding: '14px 20px', borderRadius: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#00a884' }}>{s.n}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: 700 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <p style={{ marginTop: 36, fontSize: 12, color: '#475569' }}>
        © 2026 Couple Meeting • couplemeeting.com.tr
      </p>
    </div>
  );
}
