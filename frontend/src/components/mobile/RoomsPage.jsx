import { useApp } from '../../contexts/AppContext';

const RoomsPage = () => {
  const { publicRooms, setShowJoinModal, setJoinRoomTarget, setShowQuickCreate } = useApp();

  return (
    <div className="mobile-page rooms-page">
      <div className="rooms-page-header">
        <h1>Odalar</h1>
        <button className="rooms-create-btn touch-feedback" onClick={() => setShowQuickCreate(true)}>
          ➕ Yeni Oda
        </button>
      </div>

      <div className="rooms-page-list">
        {publicRooms && publicRooms.length > 0 ? (
          publicRooms.map((room, i) => (
            <div
              key={room.id || i}
              className="rooms-page-card touch-feedback"
              onClick={() => { setJoinRoomTarget(room); setShowJoinModal(true); }}
            >
              <div className="rooms-page-avatar">{room.hostAvatar || '🎵'}</div>
              <div className="rooms-page-info">
                <h3>{room.name}</h3>
                <p>{room.userCount || 0}/{room.maxUsers || 2} kisi</p>
              </div>
              <div className="rooms-page-badge">
                {room.hasPassword ? '🔒' : '🔓'}
              </div>
            </div>
          ))
        ) : (
          <div className="rooms-page-empty">
            <span>🎵</span>
            <p>Henuz canli oda yok</p>
            <button onClick={() => setShowQuickCreate(true)}>Ilk oda sen ol!</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomsPage;
