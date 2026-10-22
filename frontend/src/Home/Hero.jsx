import { useNavigate } from 'react-router-dom';

export default function Hero({ handleQuickCreateRoom }) {
  const navigate = useNavigate();

  return (
    <section className="cm-hero" style={{ padding: '36px 0 20px', position: 'relative' }}>
      {/* Pulse Hearts Micro-Badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', marginBottom: 20 }}>
        <span style={{ fontSize: 13, animation: 'cmPulseHeart 1.4s ease-in-out infinite' }}>💕</span>
        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.6px', color: '#fda4af', textTransform: 'uppercase' }}>
          DİJİTAL ÇİFT EVİ & SENKRONİZE BULUŞMA
        </span>
      </div>

      {/* Modern, Elegant Headline */}
      <h1 style={{
        fontSize: 'clamp(38px, 6.5vw, 68px)',
        fontWeight: 950,
        lineHeight: 1.08,
        letterSpacing: '-2px',
        color: '#fff',
        margin: '0 auto 16px',
        maxWidth: 860
      }}>
        Birlikte İzle, Dinle <br />
        <span style={{
          background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 45%, #a855f7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 4px 28px rgba(244, 63, 94, 0.35))'
        }}>
          & Sevgilinle Buluş.
        </span>
      </h1>

      <p style={{
        maxWidth: 600,
        margin: '0 auto 32px',
        color: '#94a3b8',
        fontSize: 'clamp(14px, 2vw, 16px)',
        lineHeight: 1.6,
        fontWeight: 500,
        padding: '0 16px'
      }}>
        Uzak mesafe sevgilileri ve yakın arkadaşlar için aynı saniyede senkronize YouTube, müzik sahneleri, sesli sohbet ve yeni nesil Sanal Date deneyimi.
      </p>

      {/* 2-Card Dual Concept Grid - Luxury Dark Glass */}
      <div style={{
        maxWidth: 880,
        margin: '0 auto 28px',
        padding: '0 16px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
        textAlign: 'left'
      }}>
        {/* Card 1: Özel Oda & Birlikte İzle */}
        <div style={{
          background: 'linear-gradient(165deg, rgba(20, 24, 40, 0.72) 0%, rgba(11, 14, 25, 0.88) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: 24,
          padding: '26px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          transition: 'all 0.25s ease'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 11px',
              borderRadius: 999,
              background: 'rgba(99, 102, 241, 0.14)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#a5b4fc',
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '0.5px',
              marginBottom: 14
            }}>
              🎬 SEVGİLİNLE VEYA ARKADAŞLARINLA
            </div>
            <h2 style={{ margin: '0 0 8px', color: '#fff', fontSize: 22, fontWeight: 950, letterSpacing: '-0.4px' }}>
              Özel Sinema & Müzik Odası
            </h2>
            <p style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: 13, lineHeight: 1.55 }}>
              YouTube videolarını ve müzikleri aynı saniyede izleyin, sesli sohbet edin ve tepki verin.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 22 }}>
              {['🍿 Sinema Koltuğu', '🚗 Yağmurlu Araba', '🎧 Müzik & Sohbet'].map((pill) => (
                <span key={pill} style={{
                  fontSize: 11, fontWeight: 700, color: '#cbd5e1',
                  background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)',
                  padding: '5px 11px', borderRadius: 999
                }}>
                  {pill}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickCreateRoom}
            style={{
              width: '100%', padding: '14px 18px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
              transition: 'transform 0.15s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            🚀 Hemen Odanı Kur
          </button>
        </div>

        {/* Card 2: Sanal Date & Canlı Eşleş */}
        <div style={{
          background: 'linear-gradient(165deg, rgba(32, 16, 28, 0.72) 0%, rgba(15, 10, 18, 0.88) 100%)',
          border: '1px solid rgba(244, 63, 94, 0.25)',
          borderRadius: 24,
          padding: '26px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          transition: 'all 0.25s ease'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 11px',
              borderRadius: 999,
              background: 'rgba(244, 63, 94, 0.14)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              color: '#fda4af',
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '0.5px',
              marginBottom: 14
            }}>
              💘 CANLI EŞLEŞME • BLIND DATE
            </div>
            <h2 style={{ margin: '0 0 8px', color: '#fff', fontSize: 22, fontWeight: 950, letterSpacing: '-0.4px' }}>
              Sanal Date&apos;e Çık & Tanış
            </h2>
            <p style={{ margin: '0 0 16px', color: '#cbd5e1', fontSize: 13, lineHeight: 1.55 }}>
              Müzik ve film zevkinle eşleş, 10 dakikalık hızlı date odasında baş başa sohbet et.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 22 }}>
              {['🎧 3 Şarkı Blind Date', '🧊 Buzkıran Sorular', '☕ Loş Kafe'].map((pill) => (
                <span key={pill} style={{
                  fontSize: 11, fontWeight: 700, color: '#fecdd3',
                  background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)',
                  padding: '5px 11px', borderRadius: 999
                }}>
                  {pill}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/date')}
            style={{
              width: '100%', padding: '14px 18px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
              color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(244, 63, 94, 0.38)',
              transition: 'transform 0.15s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            ✨ Sanal Date Lobisine Gir →
          </button>
        </div>
      </div>

      {/* Feature Highlights Ribbon */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        flexWrap: 'wrap',
        margin: '18px auto 0',
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 700
      }}>
        <span>⚡ Sıfır Gecikme Senkronizasyon</span>
        <span style={{ opacity: 0.3 }}>•</span>
        <span>🔒 Şifreli Özel Çift Odaları</span>
        <span style={{ opacity: 0.3 }}>•</span>
        <span>📱 Uygulama İndirmeden Tek Linkle</span>
        <span style={{ opacity: 0.3 }}>•</span>
        <span>🎧 Kristal Netliğinde Sesli Sohbet</span>
      </div>
    </section>
  );
}
