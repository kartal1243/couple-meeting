import { memo } from 'react';
import { AVATARS } from '../../constants';

const ProfileTab = memo(function ProfileTab({ authUser, profileBioInput, setProfileBioInput, profileStatusInput, setProfileStatusInput, myAvatar, setMyAvatar, saveProfile, styles, followCounts, loadFollowers, loadFollowing, twoFAEnabled, setup2FA, setShow2FAModal, setTwoFACode, sendVerificationEmail, setShowVerifyModal, setShowDeleteAccount }) {
  return (
    <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
      {!authUser ? (
        <div style={{ padding: 30, textAlign: 'center', color: '#7f8c98' }}>Profilini kaydetmek icin hesap acman yeterli.</div>
      ) : (
        <div style={{ maxWidth: 520 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div className="cm-social-profile-avatar" style={{ fontSize: 44, width: 66, height: 66, borderRadius: 18, display: 'grid', placeItems: 'center', background: '#111b21', border: '1px solid #2a3942' }}>{authUser.avatar}</div>
            <div>
              <div className="cm-social-profile-name" style={{ fontSize: 20, color: '#fff', fontWeight: 900 }}>{authUser.username}</div>
              <div style={{ fontSize: 11, color: '#53e6bc' }}>{authUser.email}</div>
              <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
                <span onClick={() => loadFollowers(authUser.username)} style={{ color: '#7f8c98', fontSize: 11, cursor: 'pointer' }}><span style={{ color: '#fff', fontWeight: 900 }}>{followCounts.followers}</span> Takipci</span>
                <span onClick={() => loadFollowing(authUser.username)} style={{ color: '#7f8c98', fontSize: 11, cursor: 'pointer' }}><span style={{ color: '#fff', fontWeight: 900 }}>{followCounts.following}</span> Takip</span>
              </div>
            </div>
          </div>
          <label style={{ fontSize: 11, color: '#7f8c98', fontWeight: 900 }}>DURUM</label>
          <input value={profileStatusInput} onChange={(e) => setProfileStatusInput(e.target.value)} placeholder="Su an ne yapiyorsun?" style={{ ...styles.input, width: '100%', margin: '6px 0 12px' }} />
          <label style={{ fontSize: 11, color: '#7f8c98', fontWeight: 900 }}>HAKKINDA</label>
          <textarea value={profileBioInput} onChange={(e) => setProfileBioInput(e.target.value)} placeholder="Kendinden biraz bahset..." style={{ ...styles.input, width: '100%', minHeight: 100, resize: 'vertical', margin: '6px 0 12px' }} />
          <label style={{ fontSize: 11, color: '#7f8c98', fontWeight: 900 }}>AVATAR</label>
          <div className="cm-social-profile-avatar-grid" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0 16px' }}>
            {AVATARS.map(a => (
              <button key={a} type="button" onClick={() => { setMyAvatar(a); localStorage.setItem('cm_user_avatar', a); }} style={{ width: 44, height: 44, borderRadius: 12, fontSize: 22, cursor: 'pointer', background: myAvatar === a ? '#00a884' : '#111b21', border: myAvatar === a ? '2px solid #53e6bc' : '1px solid #2a3942' }}>{a}</button>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: 12, background: authUser?.email_verified ? 'rgba(0,168,132,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: 12, border: authUser?.email_verified ? '1px solid rgba(0,168,132,0.3)' : '1px solid rgba(239,68,68,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>{authUser?.email_verified ? '✅' : '⚠️'}</span>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>{authUser?.email_verified ? 'Email Dogrulanmis' : 'Email Dogrulanmamis'}</div>
                <div style={{ color: '#7f8c98', fontSize: 10 }}>{authUser?.email}</div>
              </div>
              {!authUser?.email_verified && (
                <button type="button" onClick={() => { sendVerificationEmail(); setShowVerifyModal(true); }} style={{ marginLeft: 'auto', background: '#00a884', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 10 }}>Dogrula</button>
              )}
            </div>
          </div>
          <div style={{ marginTop: 12, padding: 12, background: twoFAEnabled ? 'rgba(0,168,132,0.1)' : 'rgba(245,158,11,0.1)', borderRadius: 12, border: twoFAEnabled ? '1px solid rgba(0,168,132,0.3)' : '1px solid rgba(245,158,11,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>{twoFAEnabled ? '🔐' : '⚠️'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>{twoFAEnabled ? '2FA Aktif' : '2FA Devre Disi'}</div>
                <div style={{ color: '#7f8c98', fontSize: 10 }}>Google Authenticator ile hesabini koru</div>
              </div>
              <button type="button" onClick={twoFAEnabled ? () => { setShow2FAModal(true); setTwoFACode(''); } : setup2FA}
                style={{ background: twoFAEnabled ? '#ea0038' : '#f59e0b', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 10, flexShrink: 0 }}>
                {twoFAEnabled ? 'Devre Disi Birak' : 'Aktif Et'}
              </button>
            </div>
          </div>
          <button type="button" onClick={saveProfile} style={{ ...styles.buttonPrimary, width: '100%', marginTop: 12 }}>Profili Kaydet</button>
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(234,0,56,.15)' }}>
            <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tehlikeli Bolge</div>
            <button type="button" onClick={() => setShowDeleteAccount(true)} style={{ width: '100%', padding: '10px 12px', background: 'rgba(234,0,56,.06)', border: '1px solid rgba(234,0,56,.2)', borderRadius: 10, color: '#ea0038', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>Hesabimi Sil</button>
          </div>
        </div>
      )}
    </div>
  );
});

export default ProfileTab;
