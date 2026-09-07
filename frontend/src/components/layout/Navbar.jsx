import { useApp } from '../../contexts/AppContext';
import ProfileDropdown from './ProfileDropdown';

export default function Navbar({ onOpenAuth, onOpenFeedback }) {
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
          <div style={{ fontWeight: 950, color: '#fff', fontSize: 17, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 8 }}>
            Couple Meeting
            <span style={{
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              color: '#000', fontSize: 9, fontWeight: 900, padding: '2px 7px',
              borderRadius: 6, letterSpacing: '0.5px', lineHeight: '14px'
            }}>BETA</span>
          </div>
          <div style={{ fontSize: 10, color: '#a78bfa', fontWeight: 800, letterSpacing: '0.5px' }}>LISTEN • CONNECT • SHARE</div>
        </div>
      </div>
      <div className="cm-nav-actions">
        <button
          onClick={onOpenFeedback}
          style={{
            background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
            color: '#94a3b8', fontSize: 12, padding: '7px 12px', borderRadius: 8,
            cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5
          }}
        >🐛 Hata Bildir</button>
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
