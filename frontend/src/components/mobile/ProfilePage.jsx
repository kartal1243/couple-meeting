import CameraCapture from './CameraCapture';
import ShareButton from './ShareButton';
import DarkModeToggle from './DarkModeToggle';

const ProfilePage = ({ authUser, myAvatar, onAvatarChange, onLogout }) => {
  return (
    <div className="mobile-page profile-page">
      <div className="profile-header">
        <CameraCapture onCapture={onAvatarChange} currentAvatar={myAvatar} />
        <h2 className="profile-name">{authUser?.username || 'Ziyaretci'}</h2>
        <p className="profile-bio">{authUser?.bio || 'Hosgeldiniz!'}</p>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-num">{authUser?.friendCount || 0}</span>
          <span className="profile-stat-label">Arkadas</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-num">{authUser?.followerCount || 0}</span>
          <span className="profile-stat-label">Takipci</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-num">{authUser?.followingCount || 0}</span>
          <span className="profile-stat-label">Takip</span>
        </div>
      </div>

      <div className="profile-actions">
        <DarkModeToggle isDark={document.body.classList.contains('dark')} onToggle={() => document.body.classList.toggle('dark')} />
        
        <ShareButton />
        
        <button className="profile-action-btn touch-feedback">
          ⚙️ Ayarlar
        </button>
        
        <button className="profile-action-btn touch-feedback">
          🔔 Bildirimler
        </button>
        
        <button className="profile-action-btn touch-feedback">
          💎 VIP Ol
        </button>
        
        {authUser && (
          <button className="profile-action-btn logout touch-feedback" onClick={onLogout}>
            🚪 Cikis Yap
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
