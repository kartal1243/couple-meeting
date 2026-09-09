import { useApp } from '../../contexts/AppContext';

const FriendsPage = () => {
  const {
    friends, friendRequests, openAuth, authUser,
    setSocialTab, setShowSocialModal, setActiveDmUser, setShowDmModal
  } = useApp();

  const handleOpenDm = (user) => {
    setActiveDmUser(user);
    setShowDmModal(true);
  };

  return (
    <div className="mobile-page friends-page">
      <div className="friends-header">
        <h1>👥 Arkadaşlar</h1>
        {friendRequests && friendRequests.length > 0 && (
          <span className="friends-badge">{friendRequests.length}</span>
        )}
      </div>

      {!authUser ? (
        <div className="friends-empty">
          <span>👥</span>
          <p>Giris yaparak arkadaslarini bul</p>
        </div>
      ) : (
        <>
          {friendRequests && friendRequests.length > 0 && (
            <div className="friends-section">
              <h2>🔔 Gelen Istekler ({friendRequests.length})</h2>
              {friendRequests.map((req, i) => (
                <div key={i} className="friends-card">
                  <div className="friends-avatar">{req.avatar || '👤'}</div>
                  <div className="friends-info">
                    <h3>{req.username}</h3>
                    <p>Arkadaslik istegi</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="friends-section">
            <h2>✅ Arkadaslar ({friends ? friends.length : 0})</h2>
            {friends && friends.length > 0 ? (
              friends.map((friend, i) => (
                <div key={i} className="friends-card touch-feedback" onClick={() => handleOpenDm(friend)}>
                  <div className="friends-avatar">{friend.avatar || '👤'}</div>
                  <div className="friends-info">
                    <h3>{friend.username}</h3>
                    <p>{friend.isOnline ? '🟢 Çevrimiçi' : '⚫ Çevrimdisi'}</p>
                  </div>
                  <div className="friends-action">💬</div>
                </div>
              ))
            ) : (
              <div className="friends-no-friends">
                <p>Henuz arkadasin yok</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FriendsPage;
