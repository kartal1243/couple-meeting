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
    { path: '/', label: '🔥 Keşfet' },
    { path: '/date', label: '💘 Sanal Date', badge: 'YENİ' },
    { path: '/communities', label: '🏘️ Topluluklar' },
    { path: '/events', label: '📅 Etkinlikler' }
  ];

  return (
    <header className="cm-home-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <div
        className="cm-home-brand"
        onClick={() => navigate('/')}
        style={{ cursor: 'pointer', flexShrink: 0 }}
      >
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
            }}>2.0</span>
          </div>
          <div style={{ fontSize: 10, color: '#a78bfa', fontWeight: 800, letterSpacing: '0.5px' }}>LISTEN • CONNECT • DATE</div>
        </div>
      </div>

      {/* Center Navigation Bar */}
      <nav style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255,255,255,0.08)',
        padding: '5px 7px', borderRadius: 14, backdropFilter: 'blur(12px)',
        overflowX: 'auto', maxWidth: '100%'
      }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          const isDate = item.path === '/date';
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 13px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', transition: 'all 0.2s',
                background: active
                  ? (isDate ? 'linear-gradient(135deg, #e11d48, #db2777)' : 'rgba(255,255,255,0.12)')
                  : (isDate ? 'rgba(225, 29, 72, 0.12)' : 'transparent'),
                color: active ? '#fff' : (isDate ? '#fb7185' : '#cbd5e1'),
                boxShadow: active && isDate ? '0 4px 16px rgba(225,29,72,.35)' : 'none'
              }}
            >
              <span>{item.label}</span>
              {item.badge && (
                <span style={{
                  background: active ? '#fff' : 'linear-gradient(135deg, #fb7185, #e11d48)',
                  color: active ? '#e11d48' : '#fff',
                  fontSize: 9, fontWeight: 900, padding: '1px 6px', borderRadius: 99,
                  letterSpacing: '0.4px'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Actions */}
      <div className="cm-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => openSocial('global')}
          style={{
            background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
            color: '#e2e8f0', fontSize: 12, padding: '7px 11px', borderRadius: 10,
            cursor: 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5
          }}
        >🌍 Global</button>
        <button
          type="button"
          onClick={() => openSocial('dm')}
          style={{
            background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
            color: '#e2e8f0', fontSize: 12, padding: '7px 11px', borderRadius: 10,
            cursor: 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5
          }}
        >💬 Sohbet</button>
        <button
          type="button"
          onClick={() => setShowVipModal(true)}
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,.18), rgba(225,29,72,.15))',
            border: '1px solid rgba(245,158,11,.35)',
            color: '#fbbf24', fontSize: 12, padding: '7px 11px', borderRadius: 10,
            cursor: 'pointer', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4
          }}
        >👑 VIP</button>
        {onOpenFeedback && (
          <button
            type="button"
            onClick={onOpenFeedback}
            title="Hata / Geri Bildirim"
            style={{
              background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
              color: '#94a3b8', fontSize: 12, padding: '7px 9px', borderRadius: 10,
              cursor: 'pointer', fontWeight: 600
            }}
          >🐛</button>
        )}
        {authUser ? (
          <ProfileDropdown
            authUser={authUser} myAvatar={myAvatar}
            friendRequests={friendRequests} friends={friends}
            friendOnlineStatuses={friendOnlineStatuses}
            onOpenSocial={openSocial} onOpenAuth={handleAuth}
            onLogout={handleLogout}
          />
        ) : (
          <>
            <button onClick={() => handleAuth?.('login')} className="cm-nav-btn cm-nav-btn-ghost">Giriş Yap</button>
            <button onClick={() => handleAuth?.('register')} className="cm-nav-btn cm-nav-btn-green">Ücretsiz Katıl</button>
          </>
        )}
      </div>
    </header>
  );
}

