import { useApp } from '../../contexts/AppContext';
import ProfileDropdown from './ProfileDropdown';

export default function Navbar({ onOpenAuth }) {
  const {
    authUser, myAvatar, setShowSocialModal, handleLogout,
    friendRequests, friends, friendOnlineStatuses, socialTab, setSocialTab
  } = useApp();

  const openSocial = (tab) => { setSocialTab(tab); setShowSocialModal(true); };

  return (
    <header className="cm-home-nav">
      <div className="cm-home-brand">
        <div className="cm-nav-soundwave">
          {[10,18,26,14,22,16,24,12,20].map((h, i) => (
            <div key={i} className="cm-nav-bar" style={{ height: `${h}px`, animation: `cmWaveBar 0.8s ease-in-out infinite ${i * 0.07}s` }} />
          ))}
        </div>
        <div>
          <div style={{ fontWeight: 950, color: '#fff', fontSize: 17, letterSpacing: '-0.5px' }}>Couple Meeting</div>
          <div style={{ fontSize: 10, color: '#a78bfa', fontWeight: 800, letterSpacing: '0.5px' }}>LISTEN • CONNECT • SHARE</div>
        </div>
      </div>
      <div className="cm-nav-actions">
        {authUser ? (
          <ProfileDropdown
            authUser={authUser} myAvatar={myAvatar}
            friendRequests={friendRequests} friends={friends}
            friendOnlineStatuses={friendOnlineStatuses}
            onOpenSocial={openSocial} onOpenAuth={onOpenAuth}
            onLogout={handleLogout}
          />
        ) : (
          <>
            <button onClick={() => onOpenAuth('login')} className="cm-nav-btn cm-nav-btn-ghost">Giriş Yap</button>
            <button onClick={() => onOpenAuth('register')} className="cm-nav-btn cm-nav-btn-green">Ücretsiz Katıl</button>
          </>
        )}
      </div>
    </header>
  );
}
