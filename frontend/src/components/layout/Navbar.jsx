import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import ProfileDropdown from './ProfileDropdown';

export default function Navbar({ onOpenAuth, onOpenFeedback }) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    authUser, myAvatar, setShowSocialModal, setShowVipModal, handleLogout,
    friendRequests, friends, friendOnlineStatuses, setSocialTab, openAuth
  } = useApp();

  const handleAuth = onOpenAuth || openAuth;
  const openSocial = (tab) => { setSocialTab(tab); setShowSocialModal(true); };

  const navItems = [
    { path: '/', label: '✨ Keşfet' },
    { path: '/date', label: '💘 Sanal Date', badge: 'YENİ' },
    { path: '/communities', label: '👥 Topluluklar' },
    { path: '/events', label: '📅 Etkinlikler' }
  ];

  return (
    <header className="cm-header">
      <div className="cm-header-inner">
        {/* Brand */}
        <div className="cm-brand" onClick={() => navigate('/')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 26 }}>
            {[10, 20, 14, 24, 16, 22].map((h, i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: `${h}px`,
                  borderRadius: 99,
                  background: 'linear-gradient(to top, #f43f5e, #c084fc)',
                  animation: `cmWaveBar 0.9s ease-in-out infinite ${i * 0.1}s`
                }}
              />
            ))}
          </div>
          <div className="cm-brand-title">
            <span>Couple Meeting</span>
            <span className="cm-brand-badge">2.0</span>
          </div>
        </div>

        {/* Center Navigation Bar */}
        <nav className="cm-nav-center">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`cm-nav-tab ${active ? 'active' : ''}`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="cm-nav-badge">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="cm-nav-actions">
          <button
            type="button"
            onClick={() => openSocial('global')}
            className="cm-action-pill"
            title="Global Sohbet Odası"
          >
            🌍 <span>Global</span>
          </button>
          <button
            type="button"
            onClick={() => openSocial('dm')}
            className="cm-action-pill"
            title="Özel Mesajlar & Sohbetler"
          >
            💬 <span>Sohbet</span>
          </button>
          <button
            type="button"
            onClick={() => setShowVipModal(true)}
            className="cm-action-pill cm-vip-pill"
            title="Couple Pass VIP"
          >
            👑 <span>VIP</span>
          </button>

          {authUser ? (
            <ProfileDropdown
              authUser={authUser} myAvatar={myAvatar}
              friendRequests={friendRequests} friends={friends}
              friendOnlineStatuses={friendOnlineStatuses}
              onOpenSocial={openSocial} onOpenAuth={handleAuth}
              onLogout={handleLogout}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
              <button
                type="button"
                onClick={() => handleAuth?.('login')}
                className="cm-action-pill"
                style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.14)' }}
              >
                Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => handleAuth?.('register')}
                className="cm-action-pill"
                style={{
                  background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
                  border: 'none',
                  color: '#fff',
                  boxShadow: '0 4px 16px rgba(244,63,94,0.35)'
                }}
              >
                Katıl
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
