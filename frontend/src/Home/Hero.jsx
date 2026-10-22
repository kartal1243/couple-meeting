import { useNavigate } from 'react-router-dom';

export default function Hero({ handleQuickCreateRoom }) {
  const navigate = useNavigate();

  return (
    <section className="cm-hero" style={{ padding: '44px 0 28px', position: 'relative', textAlign: 'center' }}>
      {/* Pulse Micro-Badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 16px',
        borderRadius: 999,
        background: '#fff1f2',
        border: '1.5px solid #fecdd3',
        marginBottom: 20
      }}>
        <span style={{ fontSize: 13, animation: 'cmPulseHeart 1.4s ease-in-out infinite' }}>💕</span>
        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.6px', color: '#e11d48', textTransform: 'uppercase' }}>
          DİJİTAL ÇİFT EVİ & SANAL DATE
        </span>
      </div>

      {/* Modern, Editorial Tinder-Grade Headline */}
      <h1 style={{
        fontSize: 'clamp(36px, 6vw, 64px)',
        fontWeight: 950,
        lineHeight: 1.08,
        letterSpacing: '-2px',
        color: '#0f172a',
        margin: '0 auto 16px',
        maxWidth: 860
      }}>
        Kaydırmayı Bırak. <br />
        <span style={{
          background: 'linear-gradient(135deg, #fd267d 0%, #ff6036 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Birlikte İzle ve Tanış.
        </span>
      </h1>

      <p style={{
        maxWidth: 580,
        margin: '0 auto 36px',
        color: '#64748b',
        fontSize: 'clamp(14px, 2vw, 16.5px)',
        lineHeight: 1.6,
        fontWeight: 600,
        padding: '0 16px'
      }}>
        Uzak mesafe sevgilileri ve yeni tanışanlar için aynı saniyede senkronize YouTube, müzik sahneleri, sesli sohbet ve yeni nesil Sanal Date deneyimi.
      </p>

      {/* 2-Card Clean Dual Concept Grid */}
      <div style={{
        maxWidth: 860,
        margin: '0 auto',
        padding: '0 16px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
        textAlign: 'left'
      }}>
        {/* Card 1: Sanal Date & Canlı Eşleş */}
        <div style={{
          background: '#ffffff',
          border: '1.5px solid #0f172a',
          borderRadius: 24,
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 8px 24px rgba(253, 38, 125, 0.08)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 11px',
              borderRadius: 999,
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              color: '#e11d48',
              fontSize: 10.5,
              fontWeight: 900,
              letterSpacing: '0.4px',
              marginBottom: 14
            }}>
              💘 CANLI EŞLEŞME • BLIND DATE
            </div>
            <h2 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: 23, fontWeight: 950, letterSpacing: '-0.5px' }}>
              Sanal Date&apos;e Çık & Tanış
            </h2>
            <p style={{ margin: '0 0 24px', color: '#475569', fontSize: 13.5, lineHeight: 1.6, fontWeight: 500 }}>
              Müzik ve film zevkinle anında eşleş, 10 dakikalık baş başa romantik lounge odasında sohbet et ve kimyanızı keşfet.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/date')}
            style={{
              width: '100%', padding: '14px 20px', borderRadius: 999, border: 'none',
              background: 'linear-gradient(135deg, #fd267d 0%, #ff6036 100%)',
              color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 6px 20px rgba(253, 38, 125, 0.35)',
              transition: 'transform 0.15s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <span>✨ Sanal Date Lobisine Gir</span>
            <span style={{ fontSize: 16 }}>↗</span>
          </button>
        </div>

        {/* Card 2: Özel Oda & Birlikte İzle */}
        <div style={{
          background: '#ffffff',
          border: '1.5px solid #0f172a',
          borderRadius: 24,
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 11px',
              borderRadius: 999,
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: 10.5,
              fontWeight: 900,
              letterSpacing: '0.4px',
              marginBottom: 14
            }}>
              🎬 SEVGİLİNLE VEYA ARKADAŞLARINLA
            </div>
            <h2 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: 23, fontWeight: 950, letterSpacing: '-0.5px' }}>
              Özel Sinema & Müzik Odası
            </h2>
            <p style={{ margin: '0 0 24px', color: '#475569', fontSize: 13.5, lineHeight: 1.6, fontWeight: 500 }}>
              YouTube videolarını ve müzikleri aynı saniyede birlikte izleyin, sesli sohbet edin ve tepki verin.
            </p>
          </div>
          <button
            type="button"
            onClick={handleQuickCreateRoom}
            style={{
              width: '100%', padding: '14px 20px', borderRadius: 999, border: '1.5px solid #0f172a',
              background: '#0f172a',
              color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 6px 18px rgba(15, 23, 42, 0.2)',
              transition: 'transform 0.15s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <span>🚀 Hemen Odanı Kur</span>
            <span style={{ fontSize: 16 }}>↗</span>
          </button>
        </div>
      </div>
    </section>
  );
}
