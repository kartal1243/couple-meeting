import { useApp } from '../../contexts/AppContext';

export default function Navbar({ onOpenAuth }) {
  const { authUser, myAvatar, setShowSocialModal } = useApp();

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
          <button onClick={() => setShowSocialModal(true)} className="cm-nav-btn cm-nav-btn-green">{authUser.avatar || myAvatar} {authUser.username}</button>
        ) : (
          <>
            <button onClick={() => onOpenAuth('login')} className="cm-nav-btn cm-nav-btn-ghost">Giris Yap</button>
            <button onClick={() => onOpenAuth('register')} className="cm-nav-btn cm-nav-btn-green">Ucretsiz Katil</button>
          </>
        )}
      </div>
    </header>
  );
}
