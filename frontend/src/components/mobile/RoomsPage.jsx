import { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';

const RoomsPage = () => {
  const { publicRooms, setShowJoinModal, setJoinRoomTarget, setShowQuickCreate } = useApp();
  const [livePulse, setLivePulse] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setLivePulse(p => !p), 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mobile-page rooms-page">
      <div className="rooms-page-header">
        <div className="rooms-header-left">
          <h1>Odalar</h1>
          <div className="rooms-live-indicator">
            <span className={`rooms-live-dot ${livePulse ? 'pulse' : ''}`}></span>
            <span className="rooms-live-text">CANLI</span>
          </div>
        </div>
        <button className="rooms-create-btn touch-feedback" onClick={() => setShowQuickCreate(true)}>
          <span className="rooms-create-icon">+</span>
          <span>Yeni Oda</span>
        </button>
      </div>

      {publicRooms && publicRooms.length > 0 && (
        <div className="rooms-count-bar">
          <span>{publicRooms.length} canli oda</span>
          <div className="rooms-count-wave"></div>
        </div>
      )}

      <div className="rooms-page-list">
        {publicRooms && publicRooms.length > 0 ? (
          publicRooms.map((room, i) => (
            <div
              key={room.id || i}
              className="rooms-page-card touch-feedback"
              style={{ animationDelay: `${i * 0.08}s` }}
              onClick={() => { setJoinRoomTarget(room); setShowJoinModal(true); }}
            >
              <div className="rooms-page-avatar-wrap">
                <div className="rooms-page-avatar">{room.hostAvatar || '🎵'}</div>
                <span className="rooms-page-status-dot"></span>
              </div>
              <div className="rooms-page-info">
                <h3>{room.name}</h3>
                <div className="rooms-page-meta">
                  <span className="rooms-page-users">👤 {room.userCount || 0}/{room.maxUsers || 2}</span>
                  <span className="rooms-page-lock">{room.hasPassword ? '🔒 Gizli' : '🔓 Acik'}</span>
                </div>
              </div>
              <div className="rooms-page-join">
                <span className="rooms-join-arrow">›</span>
              </div>
            </div>
          ))
        ) : (
          <div className="rooms-page-empty">
            <div className="rooms-empty-icon anim-float">🎵</div>
            <h3>Henuz canli oda yok</h3>
            <p>Ilk oda sen ol ve arkadaslarini davet et!</p>
            <button className="rooms-empty-btn touch-feedback" onClick={() => setShowQuickCreate(true)}>
              <span>+</span> Oda Olustur
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomsPage;
