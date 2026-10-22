import { useNavigate } from 'react-router-dom';

export default function Hero({ handleQuickCreateRoom }) {
  const navigate = useNavigate();

  return (
    <section className="cm-hero">
      {/* Pulse Hearts Logo */}
      <div className="cm-pulse-hearts">
        <div className="cm-pulse-hearts-glow" />
        <div className="cm-pulse-hearts-pair">
          <div className="cm-pulse-heart cm-pulse-heart-1">
            <span>♥</span>
          </div>
          <div className="cm-pulse-heart cm-pulse-heart-2">
            <span>♥</span>
          </div>
        </div>
        <div className="cm-pulse-line" />
      </div>

      {/* Büyük başlık */}
      <h1 className="cm-hero-title">
        BİRLİKTE<br />İZLE & DİNLE
      </h1>

      {/* 2-Card Dual Concept Grid */}
      <div style={{
        maxWidth: 820,
        margin: '24px auto 28px',
        padding: '0 14px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 18,
        textAlign: 'left'
      }}>
        {/* Card 1: Özel Oda & Birlikte İzle */}
        <div style={{
          background: 'linear-gradient(160deg, rgba(17,27,33,.92), rgba(11,20,26,.96))',
          border: '1px solid rgba(0,168,132,.28)',
          borderRadius: 24,
          padding: '24px 22px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 24px 60px rgba(0,0,0,.45), 0 0 40px rgba(0,168,132,.06)'
        }}>
          <div>
            <div style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: 99,
              background: 'rgba(0,168,132,.14)',
              border: '1px solid rgba(0,168,132,.3)',
              color: '#34d399',
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '0.5px',
              marginBottom: 12
            }}>
              🎬 SEVGİLİNLE VEYA ARKADAŞLARINLA
            </div>
            <h2 style={{ margin: '0 0 6px', color: '#fff', fontSize: 21, fontWeight: 950, letterSpacing: '-0.3px' }}>
              Özel Sinema & Müzik Odası
            </h2>
            <p style={{ margin: '0 0 14px', color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}>
              Aynı saniyede YouTube izle, müzik dinle, sesli konuş.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
              {['🍿 Sinema Koltuğu', '🚗 Yağmurlu Araba', '🎵 Müzik'].map((pill) => (
                <span key={pill} style={{
                  fontSize: 11, fontWeight: 700, color: '#cbd5e1',
                  background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)',
                  padding: '4px 10px', borderRadius: 99
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
              background: 'linear-gradient(135deg, #00a884, #059669)',
              color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,168,132,.3)'
            }}
          >
            🚀 Hemen Oda Oluştur
          </button>
        </div>

        {/* Card 2: Sanal Date & Canlı Eşleş */}
        <div style={{
          background: 'linear-gradient(160deg, rgba(38,14,26,.92), rgba(15,10,20,.96))',
          border: '1px solid rgba(251,113,133,.35)',
          borderRadius: 24,
          padding: '24px 22px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 24px 60px rgba(0,0,0,.45), 0 0 40px rgba(225,29,72,.12)'
        }}>
          <div>
            <div style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: 99,
              background: 'rgba(251,113,133,.16)',
              border: '1px solid rgba(251,113,133,.35)',
              color: '#fb7185',
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '0.5px',
              marginBottom: 12
            }}>
              💘 CANLI EŞLEŞME • BLIND DATE
            </div>
            <h2 style={{ margin: '0 0 6px', color: '#fff', fontSize: 21, fontWeight: 950, letterSpacing: '-0.3px' }}>
              Sanal Date&apos;e Çık
            </h2>
            <p style={{ margin: '0 0 14px', color: '#cbd5e1', fontSize: 13, lineHeight: 1.5 }}>
              Müzik ve film zevkinle eşleş, 10 dk sesli/müzikli Date odasına gir.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
              {['🎧 3 Şarkı Date\'i', '🧊 Buzkıran Sorular', '☕ Loş Kafe'].map((pill) => (
                <span key={pill} style={{
                  fontSize: 11, fontWeight: 700, color: '#fecdd3',
                  background: 'rgba(251,113,133,.08)', border: '1px solid rgba(251,113,133,.18)',
                  padding: '4px 10px', borderRadius: 99
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
              background: 'linear-gradient(135deg, #e11d48, #db2777)',
              color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(225,29,72,.35)'
            }}
          >
            💘 Sanal Date Lobisine Gir →
          </button>
        </div>
      </div>

      <div className="cm-hero-features">
        <span>✓ Kayıtsız Misafir Girişi</span>
        <span>✓ Senkronize Video & Müzik</span>
        <span>✓ Sesli & Yazılı Sohbet</span>
        <span>✓ Canlı Sanal Date & Ambience</span>
      </div>

      {/* Cihaz mockupları */}
      <div className="cm-devices-showcase">
        {/* Laptop */}
        <div className="cm-device cm-device-laptop">
          <div className="cm-device-screen">
            <div className="cm-screen-header">
              <span className="cm-screen-dot" style={{ background: '#ff5f57' }} />
              <span className="cm-screen-dot" style={{ background: '#ffbd2e' }} />
              <span className="cm-screen-dot" style={{ background: '#28c840' }} />
              <span className="cm-screen-title">Couple Meeting</span>
            </div>
            <div className="cm-screen-body">
              <div className="cm-screen-player">
                <div className="cm-screen-album" />
                <div className="cm-screen-song">
                  <div className="cm-screen-song-name">Şımarık</div>
                  <div className="cm-screen-song-artist">Tarkan</div>
                </div>
              </div>
              <div className="cm-screen-chat">
                <div className="cm-screen-msg cm-msg-them">Başlattım gelsene ❤️</div>
                <div className="cm-screen-msg cm-msg-me">Geliyorum!</div>
                <div className="cm-screen-msg cm-msg-them">💝</div>
              </div>
            </div>
          </div>
          <div className="cm-device-base" />
          <div className="cm-device-label">
            <span>🖥️</span> Masaüstü
          </div>
        </div>

        {/* Telefon 1 */}
        <div className="cm-device cm-device-phone cm-phone-left">
          <div className="cm-device-notch" />
          <div className="cm-device-screen cm-phone-screen">
            <div className="cm-screen-header">
              <span className="cm-screen-title" style={{ fontSize: 8 }}>Couple Meeting</span>
            </div>
            <div className="cm-screen-body">
              <div className="cm-screen-player">
                <div className="cm-screen-album cm-album-small" />
                <div className="cm-screen-song">
                  <div className="cm-screen-song-name" style={{ fontSize: 9 }}>Ahh</div>
                  <div className="cm-screen-song-artist" style={{ fontSize: 7 }}>Mabel Matiz</div>
                </div>
              </div>
              <div className="cm-screen-chat">
                <div className="cm-screen-msg cm-msg-them" style={{ fontSize: 7 }}>Müzik harika 🔥</div>
                <div className="cm-screen-msg cm-msg-me" style={{ fontSize: 7 }}>Biliyorum!</div>
              </div>
            </div>
          </div>
          <div className="cm-device-label">
            <span>📱</span> iPhone
          </div>
        </div>

        {/* Telefon 2 */}
        <div className="cm-device cm-device-phone cm-phone-right">
          <div className="cm-device-notch" />
          <div className="cm-device-screen cm-phone-screen">
            <div className="cm-screen-header">
              <span className="cm-screen-title" style={{ fontSize: 8 }}>Couple Meeting</span>
            </div>
            <div className="cm-screen-body">
              <div className="cm-screen-player">
                <div className="cm-screen-album cm-album-small" />
                <div className="cm-screen-song">
                  <div className="cm-screen-song-name" style={{ fontSize: 9 }}>Güneşleneceğim</div>
                  <div className="cm-screen-song-artist" style={{ fontSize: 7 }}>Mabel Matiz</div>
                </div>
              </div>
              <div className="cm-screen-chat">
                <div className="cm-screen-msg cm-msg-me" style={{ fontSize: 7 }}>Bu gece de dinliyoruz 🌙</div>
                <div className="cm-screen-msg cm-msg-them" style={{ fontSize: 7 }}>Her gece ❤️</div>
              </div>
            </div>
          </div>
          <div className="cm-device-label">
            <span>📱</span> Android
          </div>
        </div>

        {/* Büyük ekran */}
        <div className="cm-device cm-device-desktop">
          <div className="cm-device-screen cm-desktop-screen">
            <div className="cm-screen-header">
              <span className="cm-screen-dot" style={{ background: '#ff5f57' }} />
              <span className="cm-screen-dot" style={{ background: '#ffbd2e' }} />
              <span className="cm-screen-dot" style={{ background: '#28c840' }} />
              <span className="cm-screen-title">Couple Meeting</span>
            </div>
            <div className="cm-screen-body">
              <div className="cm-screen-player">
                <div className="cm-screen-album" />
                <div className="cm-screen-song">
                  <div className="cm-screen-song-name">Tükeneceğiz</div>
                  <div className="cm-screen-song-artist">Sezen Aksu</div>
                </div>
              </div>
              <div className="cm-screen-chat">
                <div className="cm-screen-msg cm-msg-them">İzliyor musun? 🎬</div>
                <div className="cm-screen-msg cm-msg-me">Evet başladım!</div>
                <div className="cm-screen-msg cm-msg-them">Süper ❤️</div>
              </div>
            </div>
          </div>
          <div className="cm-device-base" />
          <div className="cm-device-label">
            <span>🖥️</span> Windows
          </div>
        </div>
      </div>
    </section>
  );
}
