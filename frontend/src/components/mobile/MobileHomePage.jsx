import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';

const MobileHomePage = () => {
  const {
    authUser, openAuth, publicRooms, setShowJoinModal, setJoinRoomTarget,
    setShowQuickCreate
  } = useApp();

  return (
    <div className="mobile-page mobile-home">
      <div className="mobile-home-header">
        <div className="mobile-home-logo">💕</div>
        <h1 className="mobile-home-title">Couple Meeting</h1>
        <p className="mobile-home-subtitle">Arkadaslarinla birlikte izle</p>
      </div>

      <div className="mobile-home-actions">
        <button className="mobile-create-btn touch-feedback" onClick={() => setShowQuickCreate(true)}>
          <span>➕</span> Oda Olustur
        </button>
        {!authUser && (
          <button className="mobile-login-btn touch-feedback" onClick={() => openAuth()}>
            <span>🔑</span> Giris Yap
          </button>
        )}
      </div>

      <div className="mobile-rooms-section">
        <div className="mobile-section-header">
          <h2>🔴 Canli Odalar</h2>
          <span className="mobile-room-count">{publicRooms?.length || 0} oda</span>
        </div>

        <div className="mobile-rooms-list">
          {publicRooms && publicRooms.length > 0 ? (
            publicRooms.map((room, i) => (
              <div
                key={room.id || i}
                className="mobile-room-card touch-feedback"
                onClick={() => { setJoinRoomTarget(room); setShowJoinModal(true); }}
              >
                <div className="mobile-room-avatar">{room.hostAvatar || '🎵'}</div>
                <div className="mobile-room-info">
                  <h3>{room.name}</h3>
                  <p>{room.userCount || 0}/{room.maxUsers || 2} kisi</p>
                </div>
                <div className="mobile-room-badge">
                  {room.hasPassword ? '🔒' : '🔓'}
                </div>
              </div>
            ))
          ) : (
            <div className="mobile-empty">
              <span>🎵</span>
              <p>Henuz canli oda yok</p>
              <p>Ilk oda sen ol!</p>
            </div>
          )}
        </div>
      </div>

      <div className="mobile-home-footer">
        <p>Couple Meeting v1.0</p>
        <p>couplemeeting.com.tr</p>
      </div>
    </div>
  );
};

export default MobileHomePage;
