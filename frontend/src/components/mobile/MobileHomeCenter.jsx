import { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';

const MobileHomeCenter = () => {
  const { publicRooms, authUser, openAuth, setShowQuickCreate } = useApp();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) setGreeting('Iyi geceler');
    else if (hour < 12) setGreeting('Gunaydin');
    else if (hour < 18) setGreeting('Iyi gunler');
    else setGreeting('Iyi aksamlar');
  }, []);

  const liveCount = publicRooms ? publicRooms.reduce((acc, r) => acc + (r.userCount || 0), 0) : 0;

  return (
    <div className="mobile-page mobile-home-center">
      <div className="mhc-hero">
        <div className="mhc-logo-wrap">
          <div className="mhc-logo">
            <span className="mhc-logo-icon">📱</span>
            <div className="mhc-heart">❤️</div>
          </div>
          <div className="mhc-wifi">
            <span>〰️</span>
          </div>
        </div>
        <h1 className="mhc-title">Couple Meeting</h1>
        <p className="mhc-subtitle">Arkadaşlarınla Canlı Buluş</p>
      </div>

      <div className="mhc-stats">
        <div className="mhc-stat">
          <span className="mhc-stat-num">{publicRooms ? publicRooms.length : 0}</span>
          <span className="mhc-stat-label">Canlı Oda</span>
        </div>
        <div className="mhc-stat-divider"></div>
        <div className="mhc-stat">
          <span className="mhc-stat-num">{liveCount}</span>
          <span className="mhc-stat-label">Aktif Üye</span>
        </div>
        <div className="mhc-stat-divider"></div>
        <div className="mhc-stat">
          <span className="mhc-stat-num">24/7</span>
          <span className="mhc-stat-label">Her Zaman Açık</span>
        </div>
      </div>

      {authUser ? (
        <div className="mhc-welcome">
          <span className="mhc-wave">👋</span>
          <span>{greeting}, <strong>{authUser.username}</strong>!</span>
        </div>
      ) : (
        <div className="mhc-auth-buttons">
          <button className="mhc-btn-primary touch-feedback" onClick={() => openAuth('login')}>
            Giriş Yap
          </button>
          <button className="mhc-btn-secondary touch-feedback" onClick={() => openAuth('register')}>
            Hemen Başla
          </button>
        </div>
      )}

      <button className="mhc-create-btn touch-feedback" onClick={() => authUser ? setShowQuickCreate(true) : openAuth('login')}>
        <span className="mhc-create-icon">+</span>
        <div className="mhc-create-text">
          <span className="mhc-create-title">Yeni Oda Oluştur</span>
          <span className="mhc-create-desc">Arkadaşlarını davet et</span>
        </div>
      </button>

      <div className="mhc-features">
        <div className="mhc-feature">
          <span>🎬</span>
          <span>Video İzle</span>
        </div>
        <div className="mhc-feature">
          <span>🎵</span>
          <span>Müzik Dinle</span>
        </div>
        <div className="mhc-feature">
          <span>🎤</span>
          <span>Sesli Sohbet</span>
        </div>
        <div className="mhc-feature">
          <span>💬</span>
          <span>Yazılı Sohbet</span>
        </div>
      </div>

      <div className="mhc-footer">
        <p>Couple Meeting © 2025</p>
        <p>Her an, her yerde bağlantıda kal</p>
      </div>
    </div>
  );
};

export default MobileHomeCenter;
