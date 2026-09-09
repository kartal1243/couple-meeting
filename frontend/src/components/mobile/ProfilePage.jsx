import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';

const ProfilePage = ({ authUser, myAvatar, onAvatarChange, onLogout }) => {
  const {
    openAuth, setShowVipModal, unreadCount, setShowNotifPanel, setShowSocialModal,
    profileBioInput, setProfileBioInput, profileStatusInput, setProfileStatusInput,
    friends, followingList, followersList, saveProfile
  } = useApp();

  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState(authUser?.username || '');
  const [editBio, setEditBio] = useState(authUser?.bio || profileBioInput || '');
  const [editStatus, setEditStatus] = useState(profileStatusInput || '');
  const [showShareToast, setShowShareToast] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setProfileBioInput(editBio);
    setProfileStatusInput(editStatus);
    saveProfile({ bio: editBio, status: editStatus, username: editName });
    setTimeout(() => { setShowSettings(false); setSaving(false); }, 400);
  };

  const handleShare = async () => {
    const text = authUser
      ? `${authUser.username} ile Couple Meeting'te bulus! https://couplemeeting.com.tr`
      : 'Couple Meeting - Arkadaslarinla canli video odalarinda bulus! https://couplemeeting.com.tr';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Couple Meeting', text, url: 'https://couplemeeting.com.tr' });
      } else {
        await navigator.clipboard.writeText(text);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
      }
    } catch (e) {}
  };

  const isVip = authUser?.vip && new Date(authUser.vip) > new Date();

  if (!authUser) {
    return (
      <div className="mobile-page profile-page">
        <div className="profile-guest">
          <div className="profile-guest-avatar anim-float">
            <span>👤</span>
          </div>
          <h2>Hosgeldiniz!</h2>
          <p>Giris yaparak ozelliklerin keyfini cikarin</p>
          <div className="profile-guest-btns">
            <button className="profile-btn-primary touch-feedback" onClick={() => openAuth('login')}>Giris Yap</button>
            <button className="profile-btn-secondary touch-feedback" onClick={() => openAuth('register')}>Kayit Ol</button>
          </div>
          <div className="profile-guest-features">
            <div className="profile-guest-feat"><span>🎬</span> Video izle</div>
            <div className="profile-guest-feat"><span>💬</span> Sohbet et</div>
            <div className="profile-guest-feat"><span>👥</span> Arkadas edin</div>
            <div className="profile-guest-feat"><span>🎤</span> Sesli konus</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-page profile-page">
      {showShareToast && <div className="profile-toast">Panoya kopyalandi!</div>}

      <div className="profile-top-bar">
        <span className="profile-top-title">Profilim</span>
        <button className="profile-settings-btn touch-feedback" onClick={() => { setEditName(authUser.username || ''); setEditBio(authUser.bio || profileBioInput || ''); setEditStatus(profileStatusInput || ''); setShowSettings(true); }}>
          Ayarlar
        </button>
      </div>

      <div className="profile-card">
        <div className="profile-avatar-wrap">
          {myAvatar && myAvatar.length > 2 ? (
            <img src={myAvatar} alt="avatar" className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar-letter">{authUser.username?.[0]?.toUpperCase() || '?'}</div>
          )}
          {isVip && <div className="profile-avatar-badge">💎</div>}
        </div>

        <h2 className="profile-name">{authUser.username}</h2>
        <p className="profile-bio">{profileStatusInput || 'Merhaba, ben Couple Meeting kullaniciyim!'}</p>
        {isVip && <div className="profile-vip-badge">💎 VIP Uye</div>}
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-num">{friends?.length || 0}</span>
          <span className="profile-stat-label">Arkadas</span>
        </div>
        <div className="profile-stat-divider"></div>
        <div className="profile-stat">
          <span className="profile-stat-num">{followersList?.length || 0}</span>
          <span className="profile-stat-label">Takipci</span>
        </div>
        <div className="profile-stat-divider"></div>
        <div className="profile-stat">
          <span className="profile-stat-num">{followingList?.length || 0}</span>
          <span className="profile-stat-label">Takip</span>
        </div>
      </div>

      <div className="profile-menu">
        <button className="profile-menu-item touch-feedback" onClick={handleShare}>
          <span className="profile-menu-icon">📤</span>
          <span className="profile-menu-text">Profili Paylas</span>
          <span className="profile-menu-arrow">›</span>
        </button>

        <button className="profile-menu-item touch-feedback" onClick={() => setShowVipModal(true)}>
          <span className="profile-menu-icon">💎</span>
          <span className="profile-menu-text">VIP Ol</span>
          {isVip && <span className="profile-menu-badge">Aktif</span>}
          <span className="profile-menu-arrow">›</span>
        </button>

        <button className="profile-menu-item touch-feedback" onClick={() => { setShowNotifPanel(true); setShowSocialModal && setShowSocialModal(true); }}>
          <span className="profile-menu-icon">🔔</span>
          <span className="profile-menu-text">Bildirimler</span>
          {unreadCount > 0 && <span className="profile-menu-badge">{unreadCount}</span>}
          <span className="profile-menu-arrow">›</span>
        </button>

        <button className="profile-menu-item touch-feedback" onClick={() => { setEditName(authUser.username || ''); setEditBio(authUser.bio || profileBioInput || ''); setEditStatus(profileStatusInput || ''); setShowSettings(true); }}>
          <span className="profile-menu-icon">⚙️</span>
          <span className="profile-menu-text">Ayarlar</span>
          <span className="profile-menu-arrow">›</span>
        </button>

        <button className="profile-menu-item danger touch-feedback" onClick={onLogout}>
          <span className="profile-menu-icon">🚪</span>
          <span className="profile-menu-text">Cikis Yap</span>
          <span className="profile-menu-arrow">›</span>
        </button>
      </div>

      <div className="profile-footer">
        <p>Couple Meeting v1.0</p>
      </div>

      {showSettings && (
        <div className="profile-settings-overlay">
          <div className="profile-settings">
            <div className="profile-settings-header">
              <button className="profile-settings-back" onClick={() => setShowSettings(false)}>Geri</button>
              <h2>Ayarlar</h2>
              <button className="profile-settings-save" onClick={handleSave} disabled={saving}>{saving ? '...' : 'Kaydet'}</button>
            </div>
            <div className="profile-settings-body">
              <div className="profile-settings-avatar">
                <span>{authUser.username?.[0]?.toUpperCase() || '?'}</span>
              </div>

              <div className="profile-settings-field">
                <label>Kullanici Adi</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Kullanici adin" />
              </div>

              <div className="profile-settings-field">
                <label>Durum</label>
                <input value={editStatus} onChange={(e) => setEditStatus(e.target.value)} placeholder="Su an ne yapiyorsun?" />
              </div>

              <div className="profile-settings-field">
                <label>Hakkinda</label>
                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Kendinden bahset..." rows={4} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
