import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackInviteShared } from '../utils/analytics';

export default function Hero({ authUser, openAuth, handleQuickCreateRoom, onOpenSocial }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleShareHero = async () => {
    trackInviteShared('hero');
    const shareData = {
      title: 'Couple Meeting — Birlikte İzle & Dinle',
      text: 'Sevgilinle ve arkadaşlarınla aynı saniyede YouTube izle, müzik dinle, sesli sohbet et!',
      url: 'https://couplemeeting.com.tr'
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (_) {}
    }
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {}
  };

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

      <p style={{
        maxWidth: 580, margin: '10px auto 22px', color: '#94a3b8',
        fontSize: 'clamp(13px, 2.2vw, 16px)', lineHeight: 1.65, fontWeight: 500, padding: '0 12px'
      }}>
        Mesafeleri sıfırla 💕 Sevgilinle veya en yakın arkadaşlarınla aynı saniyede YouTube izle, müzik dinle, sesli konuş ve çift oyunları oyna — uygulama indirmeden, tek linkle.
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
        <button
          className="cm-big-btn"
          onClick={handleShareHero}
          style={{
            background: copied ? 'rgba(0,168,132,.2)' : 'rgba(168,85,247,.15)',
            border: copied ? '1px solid rgba(0,168,132,.4)' : '1px solid rgba(168,85,247,.25)',
            color: copied ? '#00a884' : '#a855f7'
          }}
        >
          {copied ? '✅ Link Kopyalandı!' : '📤 Davet Linki Paylaş'}
        </button>
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
        <span>✓ Kayıtsız Misafir Girişi</span>
        <span>✓ Senkronize Video & Müzik</span>
        <span>✓ Sesli & Yazılı Sohbet</span>
        <span>✓ Çift Oyunları & Randevu Fişi</span>
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
