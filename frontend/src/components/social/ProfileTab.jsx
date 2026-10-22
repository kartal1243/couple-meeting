import { memo, useState, useEffect } from 'react';
import { AVATARS, VIP_AVATARS } from '../../constants';

const ProfileTab = memo(function ProfileTab({
  authUser, profileBioInput, setProfileBioInput, profileStatusInput, setProfileStatusInput,
  myAvatar, setMyAvatar, saveProfile, styles, followCounts, loadFollowCounts, loadFollowers, loadFollowing,
  twoFAEnabled, setup2FA, disable2FA, setShow2FAModal, sendVerificationEmail, setShowVerifyModal,
  setShowDeleteAccount
}) {
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    if (authUser?.username && loadFollowCounts) {
      loadFollowCounts(authUser.username);
    }
  }, [authUser?.username]);

  const handleSaveClick = () => {
    saveProfile({ bio: profileBioInput, statusText: profileStatusInput, avatar: myAvatar });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  return (
    <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
      {!authUser ? (
        <div style={{ padding: 30, textAlign: 'center', color: '#7f8c98' }}>Profilini kaydetmek icin hesap acman yeterli.</div>
      ) : (
        <div style={{ maxWidth: 520 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div className="cm-social-profile-avatar" style={{ fontSize: 44, width: 66, height: 66, borderRadius: 18, display: 'grid', placeItems: 'center', background: '#111b21', border: '1px solid #2a3942' }}>{myAvatar || authUser.avatar}</div>
            <div>
              <div className="cm-social-profile-name" style={{ fontSize: 20, color: '#fff', fontWeight: 900 }}>{authUser.username}</div>
              <div style={{ fontSize: 11, color: '#53e6bc' }}>{authUser.email}</div>
              <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
                <span onClick={() => loadFollowers(authUser.username)} style={{ color: '#7f8c98', fontSize: 11, cursor: 'pointer' }}><span style={{ color: '#fff', fontWeight: 900 }}>{followCounts?.followers || 0}</span> Takipçi</span>
                <span onClick={() => loadFollowing(authUser.username)} style={{ color: '#7f8c98', fontSize: 11, cursor: 'pointer' }}><span style={{ color: '#fff', fontWeight: 900 }}>{followCounts?.following || 0}</span> Takip</span>
              </div>
            </div>
          </div>
          <label style={{ fontSize: 11, color: '#7f8c98', fontWeight: 900 }}>DURUM</label>
          <input value={profileStatusInput} onChange={(e) => setProfileStatusInput(e.target.value)} placeholder="Şu an ne yapıyorsun?" style={{ ...styles.input, width: '100%', margin: '6px 0 12px' }} />
          <label style={{ fontSize: 11, color: '#7f8c98', fontWeight: 900 }}>HAKKINDA</label>
          <textarea value={profileBioInput} onChange={(e) => setProfileBioInput(e.target.value)} placeholder="Kendinden biraz bahset..." style={{ ...styles.input, width: '100%', minHeight: 100, resize: 'vertical', margin: '6px 0 12px' }} />
          <label style={{ fontSize: 11, color: '#7f8c98', fontWeight: 900 }}>AVATAR</label>
          <div className="cm-social-profile-avatar-grid" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0 16px' }}>
            {AVATARS.map(a => (
              <button key={a} type="button" onClick={() => { setMyAvatar(a); localStorage.setItem('cm_user_avatar', a); }} style={{ width: 44, height: 44, borderRadius: 12, fontSize: 22, cursor: 'pointer', background: myAvatar === a ? '#00a884' : '#111b21', border: myAvatar === a ? '2px solid #53e6bc' : '1px solid #2a3942' }}>{a}</button>
            ))}
          </div>
          {authUser.isVip && VIP_AVATARS && (
            <>
              <label style={{ fontSize: 11, color: '#f59e0b', fontWeight: 900 }}>👑 VIP AVATARLAR</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0 16px' }}>
                {VIP_AVATARS.map(a => (
                  <button key={a} type="button" onClick={() => { setMyAvatar(a); localStorage.setItem('cm_user_avatar', a); }} style={{ width: 44, height: 44, borderRadius: 12, fontSize: 22, cursor: 'pointer', background: myAvatar === a ? '#f59e0b' : '#111b21', border: myAvatar === a ? '2px solid #fbbf24' : '1px solid rgba(245,158,11,.35)' }}>{a}</button>
                ))}
              </div>
            </>
          )}
          <button
            type="button"
            onClick={handleSaveClick}
            style={{
              ...styles.buttonPrimary,
              width: '100%',
              marginTop: 12,
              background: savedFeedback ? '#10b981' : styles.buttonPrimary?.background
            }}
          >
            {savedFeedback ? '✅ Profil Kaydedildi!' : 'Profili Kaydet'}
          </button>

          {/* Güvenlik & Doğrulama */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #25313a', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {sendVerificationEmail && setShowVerifyModal && (
              <button
                type="button"
                onClick={() => { sendVerificationEmail(); setShowVerifyModal(true); }}
                style={{ flex: 1, minWidth: 160, padding: '10px 12px', background: '#111b21', border: '1px solid #25313a', borderRadius: 10, color: '#e2e8f0', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
              >
                📧 E-posta Doğrula
              </button>
            )}
            {(setup2FA || disable2FA) && setShow2FAModal && (
              <button
                type="button"
                onClick={() => {
                  if (twoFAEnabled && disable2FA) disable2FA();
                  else if (setup2FA) { setup2FA(); setShow2FAModal(true); }
                }}
                style={{ flex: 1, minWidth: 160, padding: '10px 12px', background: '#111b21', border: '1px solid #25313a', borderRadius: 10, color: twoFAEnabled ? '#34d399' : '#e2e8f0', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
              >
                🔐 {twoFAEnabled ? '2FA Aktif (Kapat)' : '2FA Etkinleştir'}
              </button>
            )}
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(234,0,56,.15)' }}>
            <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tehlikeli Bölge</div>
            <button type="button" onClick={() => setShowDeleteAccount(true)} style={{ width: '100%', padding: '10px 12px', background: 'rgba(234,0,56,.06)', border: '1px solid rgba(234,0,56,.2)', borderRadius: 10, color: '#ea0038', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>Hesabımı Sil</button>
          </div>
        </div>
      )}
    </div>
  );
});

export default ProfileTab;

