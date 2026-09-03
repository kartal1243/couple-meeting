import { useNavigate } from 'react-router-dom';

export default function Hero({ authUser, openAuth, handleQuickCreateRoom, onOpenSocial }) {
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
      <p className="cm-hero-sub">
        Sevgilinle, arkadaşınla veya yeni insanlarla<br />
        YouTube'da aynı videoyu aynı anda izle, müzik dinle ve sohbet et.
      </p>

      <div className="cm-hero-actions">
        <button
          className="cm-big-btn"
          onClick={handleQuickCreateRoom}
          style={{ background: 'linear-gradient(135deg,#00a884,#008f6f)' }}
        >
          🚀 Hemen Oda Oluştur
        </button>
        {authUser ? (
          <button
            className="cm-big-btn"
            onClick={() => onOpenSocial('friends')}
            style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)' }}
          >
            🤝 Arkadaşları Keşfet
          </button>
        ) : (
          <button
            className="cm-big-btn"
            onClick={() => openAuth('register')}
            style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)' }}
          >
            👤 Ücretsiz Hesap Aç
          </button>
        )}
      </div>

      {authUser && (
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => onOpenSocial('global')} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>🌐 Global Sohbet</button>
          <button onClick={() => onOpenSocial('dm')} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>💬 Mesajlar</button>
          <button onClick={() => onOpenSocial('groups')} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>👥 Gruplar</button>
          <button onClick={() => onOpenSocial('profile')} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>👤 Profilim</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => navigate('/communities')} style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: 'rgba(0,168,132,.13)', color: '#00a884', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>🏘️ Topluluklar</button>
        <button onClick={() => navigate('/events')} style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: 'rgba(168,85,247,.13)', color: '#a855f7', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>📅 Etkinlikler</button>
      </div>

      <div className="cm-hero-features">
        <span>✓ Misafir giriş</span>
        <span>✓ Arkadaş sistemi</span>
        <span>✓ Global sohbet</span>
        <span>✓ Profil & durum</span>
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
                  <div className="cm-screen-song-name">Our Little Moment</div>
                  <div className="cm-screen-song-artist">Couple Meeting Radio</div>
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
                  <div className="cm-screen-song-name" style={{ fontSize: 9 }}>Yıldız Tozu</div>
                  <div className="cm-screen-song-artist" style={{ fontSize: 7 }}>Tarkan</div>
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
                  <div className="cm-screen-song-name" style={{ fontSize: 9 }}>Gece</div>
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
                  <div className="cm-screen-song-name">Seni Dert Etmek</div>
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
