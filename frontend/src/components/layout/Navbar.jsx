import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import ProfileDropdown from './ProfileDropdown';

export default function Navbar({ onOpenAuth, onOpenFeedback }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    authUser, myAvatar, setShowSocialModal, setShowVipModal, handleLogout,
    friendRequests, friends, friendOnlineStatuses, setSocialTab, openAuth,
    setShowQuickCreate
  } = useApp();

  const handleAuth = onOpenAuth || openAuth;
  const openSocial = (tab) => {
    setSocialTab(tab);
    setShowSocialModal(true);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { path: '/', label: 'Keşfet' },
    { path: '/date', label: 'Sanal Date', badge: 'YENİ' },
    { path: '/communities', label: 'Topluluklar' },
    { path: '/events', label: 'Etkinlikler' }
  ];

  const handleNavClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="cm-header">
      <div className="cm-header-inner">
        {/* Brand */}
        <div className="cm-brand" onClick={() => handleNavClick('/')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 24 }}>
            {[8, 16, 22, 14, 18, 10].map((h, i) => (
              <div
                key={i}
                style={{
                  width: 3.5,
                  height: `${h}px`,
                  borderRadius: 99,
                  background: 'linear-gradient(to top, #fd267d, #ff6036)',
                  animation: `cmWaveBar 0.9s ease-in-out infinite ${i * 0.12}s`
                }}
              />
            ))}
          </div>
          <div className="cm-brand-title">
            <span>Couple Meeting</span>
            <span className="cm-brand-badge">2.0</span>
          </div>
        </div>

        {/* Center Navigation Bar (Desktop Minimalist Links) */}
        <nav className="cm-nav-center">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNavClick(item.path)}
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
          {/* Desktop-only pills */}
          <div className="cm-desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              onClick={() => setShowVipModal(true)}
              className="cm-action-pill cm-vip-pill"
              title="Couple Pass VIP"
            >
              👑 <span>VIP</span>
            </button>
          </div>

          {/* User Profile or Login or CTA */}
          {authUser ? (
            <ProfileDropdown
              authUser={authUser} myAvatar={myAvatar}
              friendRequests={friendRequests} friends={friends}
              friendOnlineStatuses={friendOnlineStatuses}
              onOpenSocial={openSocial} onOpenAuth={handleAuth}
              onLogout={handleLogout}
            />
          ) : (
            <button
              type="button"
              onClick={() => handleAuth?.('login')}
              className="cm-action-pill cm-desktop-actions"
            >
              Giriş Yap
            </button>
          )}

          {/* Prominent Reference-Style CTA Button (Teklif İste style) */}
          <button
            type="button"
            onClick={() => handleNavClick('/date')}
            className="cm-cta-pill cm-cta-flame"
            title="Sanal Date Lobisine Git"
          >
            <span>💘 Sanal Date</span>
            <span style={{ fontSize: 15, fontWeight: 900 }}>↗</span>
          </button>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="cm-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menüyü Aç/Kapat"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Drawer Menu */}
      {mobileMenuOpen && (
        <div className="cm-mobile-drawer open">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <div
                key={item.path}
                className={`cm-mobile-item ${active ? 'active' : ''}`}
                onClick={() => handleNavClick(item.path)}
              >
                <span>{item.label}</span>
                {item.badge && <span className="cm-nav-badge">{item.badge}</span>}
              </div>
            );
          })}

          <div style={{ height: 1, background: '#e2e8f0', margin: '4px 0' }} />

          <div className="cm-mobile-item" onClick={() => openSocial('global')}>
            <span>🌍 Global Canlı Sohbet</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>Açık</span>
          </div>

          <div className="cm-mobile-item" onClick={() => openSocial('dm')}>
            <span>💬 Özel Mesajlar & Arkadaşlar</span>
          </div>

          <div className="cm-mobile-item" style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#b45309' }} onClick={() => { setShowVipModal(true); setMobileMenuOpen(false); }}>
            <span>👑 Couple Pass VIP Ayrıcalıkları</span>
            <span style={{ fontWeight: 900 }}>PRO</span>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {setShowQuickCreate && (
              <button
                type="button"
                onClick={() => { setShowQuickCreate(true); setMobileMenuOpen(false); }}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #0f172a',
                  background: '#ffffff', color: '#0f172a', fontWeight: 900, fontSize: 13, cursor: 'pointer'
                }}
              >
                🎬 Özel Oda Kur
              </button>
            )}

            {!authUser ? (
              <button
                type="button"
                onClick={() => { handleAuth?.('login'); setMobileMenuOpen(false); }}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                  background: '#0f172a', color: '#ffffff', fontWeight: 900, fontSize: 13, cursor: 'pointer'
                }}
              >
                Giriş Yap
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #fecaca',
                  background: '#fff1f2', color: '#ef4444', fontWeight: 900, fontSize: 13, cursor: 'pointer'
                }}
              >
                Çıkış Yap
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
