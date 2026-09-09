import { useApp } from '../../contexts/AppContext';

const FriendsPage = () => {
  const {
    friends, friendRequests, openAuth, authUser,
    dmConversations, openDm, setShowSocialModal, setSocialTab, respondFriendRequest
  } = useApp();

  const handleOpenDm = (friend) => {
    if (openDm) openDm(friend.username);
    setSocialTab('dm');
    setShowSocialModal(true);
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
          <span className="friends-empty-icon anim-float">👥</span>
          <h2>Arkadaslarini Bul</h2>
          <p>Giris yaparak arkadaslarini bul ve sohbete basla</p>
          <button className="friends-login-btn touch-feedback" onClick={() => openAuth('login')}>Giris Yap</button>
        </div>
      ) : (
        <>
          {friendRequests && friendRequests.length > 0 && (
            <div className="friends-section">
              <h2>🔔 Gelen Istekler ({friendRequests.length})</h2>
              {friendRequests.map((req, i) => (
                <div key={i} className="friends-card">
                  <div className="friends-avatar-wrap">
                    <div className="friends-avatar">{req.avatar || '👤'}</div>
                  </div>
                  <div className="friends-info">
                    <h3>{req.from_username || req.username}</h3>
                    <p>Arkadaslik istegi</p>
                  </div>
                  <div className="friends-request-actions">
                    {respondFriendRequest && <button className="friends-accept-btn" onClick={() => respondFriendRequest(req.id || req.requestId, 'accept')}>✓</button>}
                    {respondFriendRequest && <button className="friends-decline-btn" onClick={() => respondFriendRequest(req.id || req.requestId, 'decline')}>✕</button>}
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
                  <div className="friends-avatar-wrap">
                    <div className="friends-avatar">{friend.avatar || '👤'}</div>
                    <span className={`friends-status-dot ${friend.isOnline ? 'online' : ''}`}></span>
                  </div>
                  <div className="friends-info">
                    <h3>{friend.username}</h3>
                    <p>{friend.isOnline ? '🟢 Çevrimiçi' : '⚫ Çevrimdisi'}</p>
                  </div>
                  <div className="friends-dm-btn">💬</div>
                </div>
              ))
            ) : (
              <div className="friends-no-friends">
                <span>🤝</span>
                <p>Henuz arkadasin yok</p>
                <p className="friends-no-friends-sub">Sohbet sayfasindan insanlari bul!</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FriendsPage;
