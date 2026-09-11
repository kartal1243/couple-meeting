import { useState, useEffect, memo } from 'react';
import DmChat from '../components/social/DmChat';
import GroupChat from '../components/social/GroupChat';
import GlobalChatTab from '../components/social/GlobalChatTab';
import FriendsTab from '../components/social/FriendsTab';
import FeedTab from '../components/social/FeedTab';
import ProfileTab from '../components/social/ProfileTab';
import GroupsTab from '../components/social/GroupsTab';

const SOCIAL_MOBILE_CSS = `
@media (max-width: 768px) {
  .cm-social-root { padding: 0 !important; align-items: stretch !important; justify-content: stretch !important; }
  .cm-social-box { width: 100% !important; height: 100% !important; border-radius: 0 !important; max-height: 100dvh !important; }
  .cm-social-header { padding: 8px 10px !important; flex-wrap: wrap !important; gap: 4px !important; min-height: auto !important; }
  .cm-social-header-title { font-size: 14px !important; }
  .cm-social-header-actions { gap: 4px !important; }
  .cm-social-header-actions button { padding: 5px 8px !important; font-size: 10px !important; }
  .cm-social-layout { flex-direction: column !important; }
  .cm-social-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid #25313a !important; padding: 6px 8px !important; flex-direction: row !important; overflow-x: auto !important; overflow-y: hidden !important; gap: 4px !important; -webkit-overflow-scrolling: touch !important; flex-shrink: 0 !important; max-height: none !important; background: #0b141a !important; }
  .cm-social-sidebar::-webkit-scrollbar { display: none !important; }
  .cm-social-sidebar-btn { padding: 7px 12px !important; font-size: 11px !important; white-space: nowrap !important; flex-shrink: 0 !important; border-radius: 8px !important; }
  .cm-social-sidebar-footer { display: none !important; }
  .cm-social-content { padding: 10px !important; flex: 1 !important; min-height: 0 !important; overflow-y: auto !important; }
  .cm-social-content-title { font-size: 14px !important; margin-bottom: 8px !important; }
  .cm-social-msg-input { padding: 8px !important; font-size: 13px !important; }
  .cm-social-msg-btn { padding: 8px 12px !important; }
  .cm-social-msg-row { flex-direction: row !important; gap: 4px !important; }
  .cm-social-msg-row input { min-height: 38px !important; font-size: 13px !important; }
  .cm-social-card { padding: 8px !important; gap: 6px !important; margin-bottom: 6px !important; border-radius: 10px !important; }
  .cm-social-card-avatar { font-size: 20px !important; }
  .cm-social-card-name { font-size: 12px !important; }
  .cm-social-card-sub { font-size: 10px !important; }
  .cm-social-card-btns { gap: 3px !important; }
  .cm-social-card-btns button { padding: 5px 7px !important; font-size: 9px !important; }
  .cm-social-feed-layout { flex-direction: column !important; }
  .cm-social-feed-sidebar { width: 100% !important; border-left: none !important; border-top: 1px solid #25313a !important; padding: 8px !important; max-height: 180px !important; overflow-y: auto !important; }
  .cm-social-profile-avatar { width: 50px !important; height: 50px !important; font-size: 30px !important; border-radius: 14px !important; }
  .cm-social-profile-name { font-size: 16px !important; }
  .cm-social-profile-avatar-grid button { width: 34px !important; height: 34px !important; font-size: 16px !important; }
  .cm-social-dm-header { padding: 8px 10px !important; gap: 6px !important; }
  .cm-social-dm-header-name { font-size: 12px !important; }
  .cm-social-dm-msgs { padding: 8px !important; gap: 5px !important; }
  .cm-social-dm-bubble { max-width: 80% !important; padding: 6px 9px !important; font-size: 12px !important; }
  .cm-social-dm-input { padding: 6px !important; gap: 4px !important; }
  .cm-social-dm-input input { padding: 8px !important; font-size: 13px !important; }
  .cm-social-follow-row { padding: 6px 8px !important; }
  .cm-social-notif-panel { top: auto !important; bottom: 0 !important; left: 0 !important; right: 0 !important; width: 100% !important; max-height: 55vh !important; border-radius: 16px 16px 0 0 !important; }
  .cm-social-verify-box { width: 100% !important; padding: 14px !important; }
  .cm-social-2fa-box { width: 100% !important; padding: 14px !important; }
  .cm-social-delete-box { width: 100% !important; }
  .cm-social-followers-box { width: 100% !important; max-height: 75vh !important; }
  .cm-social-group-create-box { width: 100% !important; max-height: 80vh !important; overflow-y: auto !important; }
  .cm-social-group-create-box > div { width: 100% !important; max-width: none !important; }
}
`;

function SocialModal({
  authUser, socialTab, setSocialTab, globalMessages, globalChatInput, setGlobalChatInput,
  sendGlobalMessage, friendSearch, setFriendSearch, searchFriends, friendSearchResults,
  sendFriendRequest, friendRequests, respondFriendRequest, friends,
  friendOnlineStatuses, unfriendUser,
  profileBioInput, setProfileBioInput, profileStatusInput, setProfileStatusInput,
  myAvatar, setMyAvatar, saveProfile, openAuth, handleLogout, setShowSocialModal,
  showVipModal, setShowVipModal, styles,
  dmConversations, dmActiveChat, setDmActiveChat, dmMessages, dmInput, setDmInput,
  sendDm, openDm, loadDmList,
  chatGroups, activeGroup, setActiveGroup, groupMessages, groupInput, setGroupInput,
  showGroupCreate, setShowGroupCreate, groupNameInput, setGroupNameInput,
  groupMemberInput, setGroupMemberInput, createGroup, openGroup, sendGroupMessage, loadGroups,
  typingUsers, sendDmTyping, sendDmStopTyping,
  followUser, unfollowUser, loadFollowCounts, loadFollowers, loadFollowing,
  followCounts, isFollowingUser, followersList, followingList,
  showFollowersModal, setShowFollowersModal, showFollowingModal, setShowFollowingModal,
  feedItems, loadFeed, showFeedModal, setShowFeedModal,
  suggestedFollows, loadSuggestedFollows,
  createFeedPost, likeFeedPost, commentFeedPost,
  notifications, unreadCount, loadNotifications, markNotifsRead, showNotifPanel, setShowNotifPanel,
  myRole, reportUser, showVerifyModal, setShowVerifyModal, verifyCode, setVerifyCode,
  verifySent, setVerifySent, sendVerificationEmail, verifyEmailCode,
  show2FAModal, setShow2FAModal, twoFAEnabled, setup2FA, disable2FA, twoFASecret, twoFAQR, twoFACode, setTwoFACode, verify2FASetup,
  showDeleteAccount, setShowDeleteAccount, deleteAccount, deletePass, setDeletePass
}) {
  useEffect(() => { if (authUser && socialTab === 'dm') loadDmList(); }, [socialTab, authUser]);
  useEffect(() => { if (authUser && socialTab === 'groups') loadGroups(); }, [socialTab, authUser]);
  useEffect(() => { if (authUser && socialTab === 'feed') { loadFeed(); loadSuggestedFollows(); } }, [socialTab, authUser]);

  const tabs = [
    { tab: 'global', label: '🌐 Global' },
    { tab: 'dm', label: '💬 Mesajlar' },
    { tab: 'groups', label: '👥 Gruplar' },
    { tab: 'friends', label: `🤝 Arkadaşlar${friendRequests.length ? ` (${friendRequests.length})` : ''}` },
    { tab: 'feed', label: '📰 Akış' },
    { tab: 'profile', label: '👤 Profilim' }
  ];

  return (
    <div className="cm-social-root" style={{ position: 'fixed', inset: 0, zIndex: 19000, background: 'rgba(0,0,0,.78)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <style>{SOCIAL_MOBILE_CSS}</style>
      <div className="cm-social-box" style={{ width: 'min(900px, 100%)', height: 'min(760px, 94vh)', background: '#0f171d', border: '1px solid #2a3942', borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 35px 100px rgba(0,0,0,.5)' }}>
        {/* Header */}
        <div className="cm-social-header" style={{ padding: '14px 16px', background: '#111b21', borderBottom: '1px solid #25313a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#53e6bc', fontSize: 10, fontWeight: 900 }}>COUPLE MEETING SOCIAL</div>
            <div className="cm-social-header-title" style={{ color: '#fff', fontSize: 18, fontWeight: 900 }}>🌍 Topluluk</div>
          </div>
          <div className="cm-social-header-actions" style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
            {authUser && (
              <button type="button" onClick={() => { if (showNotifPanel) { setShowNotifPanel(false); } else { loadNotifications(); markNotifsRead(); } }}
                style={{ position: 'relative', background: showNotifPanel ? '#00a884' : '#202c33', color: '#fff', border: '1px solid #2c3b44', padding: '8px 10px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>
                🔔
                {unreadCount > 0 && <span style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', color: '#fff', borderRadius: 10, padding: '1px 5px', fontSize: 9, fontWeight: 900 }}>{unreadCount}</span>}
              </button>
            )}
            {authUser && !authUser.isVip && (
              <button type="button" onClick={() => { setShowSocialModal(false); setShowVipModal(true); }} style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#fff', border: 'none', padding: '8px 10px', borderRadius: 10, fontWeight: 900, cursor: 'pointer', fontSize: 11 }}>⭐ VIP Ol</button>
            )}
            {authUser?.isVip && <span style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#fff', padding: '6px 10px', borderRadius: 10, fontWeight: 900, fontSize: 11 }}>👑 VIP</span>}
            {authUser ? (
              <button type="button" onClick={handleLogout} style={{ background: '#202c33', color: '#fff', border: '1px solid #2c3b44', padding: '8px 10px', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>Çıkış</button>
            ) : (
              <button type="button" onClick={() => openAuth('login')} style={{ background: '#00a884', color: '#fff', border: 'none', padding: '8px 10px', borderRadius: 10, fontWeight: 900, cursor: 'pointer' }}>Giriş</button>
            )}
            <button type="button" onClick={() => setShowSocialModal(false)} style={{ background: '#202c33', color: '#fff', border: 'none', width: 34, height: 34, borderRadius: 10, cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
        </div>

        <div className="cm-social-layout" style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Sidebar */}
          <div className="cm-social-sidebar" style={{ width: 200, borderRight: '1px solid #25313a', background: '#0b141a', padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tabs.map(({ tab, label }) => (
              <button key={tab} type="button" className="cm-social-sidebar-btn" onClick={() => { setSocialTab(tab); setDmActiveChat(null); setActiveGroup(null); }}
                style={{ padding: '10px 12px', border: 'none', borderRadius: 10, textAlign: 'left', background: socialTab === tab ? '#00a884' : '#111b21', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>
                {label}
              </button>
            ))}
            <div className="cm-social-sidebar-footer" style={{ marginTop: 'auto', padding: 10, borderRadius: 12, background: '#111b21', color: '#7f8c98', fontSize: 10, lineHeight: 1.5 }}>
              {authUser ? 'Hesabın aktif.' : 'Misafir olarak sohbet edebilirsin.'}
            </div>
          </div>

          {/* Content */}
          <div className="cm-social-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            {socialTab === 'global' && <GlobalChatTab globalMessages={globalMessages} globalChatInput={globalChatInput} setGlobalChatInput={setGlobalChatInput} sendGlobalMessage={sendGlobalMessage} styles={styles} />}
            {socialTab === 'dm' && <DmChat authUser={authUser} dmConversations={dmConversations} dmActiveChat={dmActiveChat} setDmActiveChat={setDmActiveChat} dmMessages={dmMessages} dmInput={dmInput} setDmInput={setDmInput} sendDm={sendDm} openDm={openDm} typingUsers={typingUsers} sendDmTyping={sendDmTyping} sendDmStopTyping={sendDmStopTyping} followUser={followUser} unfollowUser={unfollowUser} isFollowingUser={isFollowingUser} styles={styles} />}
            {socialTab === 'groups' && <GroupsTab authUser={authUser} chatGroups={chatGroups} activeGroup={activeGroup} setActiveGroup={setActiveGroup} groupMessages={groupMessages} groupInput={groupInput} setGroupInput={setGroupInput} showGroupCreate={showGroupCreate} setShowGroupCreate={setShowGroupCreate} groupNameInput={groupNameInput} setGroupNameInput={setGroupNameInput} groupMemberInput={groupMemberInput} setGroupMemberInput={setGroupMemberInput} friends={friends} createGroup={createGroup} openGroup={openGroup} sendGroupMessage={sendGroupMessage} loadGroups={loadGroups} styles={styles} />}
            {socialTab === 'friends' && <FriendsTab authUser={authUser} friendSearch={friendSearch} setFriendSearch={setFriendSearch} searchFriends={searchFriends} friendSearchResults={friendSearchResults} sendFriendRequest={sendFriendRequest} friendRequests={friendRequests} respondFriendRequest={respondFriendRequest} friends={friends} friendOnlineStatuses={friendOnlineStatuses} openDm={openDm} unfriendUser={unfriendUser} styles={styles} openAuth={openAuth} />}
            {socialTab === 'feed' && <FeedTab authUser={authUser} feedItems={feedItems} suggestedFollows={suggestedFollows} followUser={followUser} createFeedPost={createFeedPost} likeFeedPost={likeFeedPost} commentFeedPost={commentFeedPost} />}
            {socialTab === 'profile' && <ProfileTab authUser={authUser} profileBioInput={profileBioInput} setProfileBioInput={setProfileBioInput} profileStatusInput={profileStatusInput} setProfileStatusInput={setProfileStatusInput} myAvatar={myAvatar} setMyAvatar={setMyAvatar} saveProfile={saveProfile} styles={styles} followCounts={followCounts} loadFollowers={loadFollowers} loadFollowing={loadFollowing} twoFAEnabled={twoFAEnabled} setup2FA={setup2FA} setShow2FAModal={setShow2FAModal} setTwoFACode={setTwoFACode} sendVerificationEmail={sendVerificationEmail} setShowVerifyModal={setShowVerifyModal} setShowDeleteAccount={setShowDeleteAccount} />}
          </div>
        </div>
      </div>

      {showNotifPanel && (
        <div className="cm-social-notif-panel" style={{ position: 'fixed', top: 100, right: 20, width: 320, maxHeight: '70vh', background: '#111b21', border: '1px solid #25313a', borderRadius: 16, overflow: 'hidden', zIndex: 9999, boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #25313a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>Bildirimler</span>
            <button onClick={() => setShowNotifPanel(false)} style={{ background: 'none', border: 'none', color: '#7f8c98', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 'calc(70vh - 50px)' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#7f8c98', fontSize: 12 }}>Bildirim yok</div>
            ) : notifications.map(n => (
              <div key={n.id} style={{ padding: '10px 16px', borderBottom: '1px solid #1a2634', background: n.read ? 'transparent' : 'rgba(0,168,132,.05)' }}>
                <div style={{ color: '#e9edef', fontSize: 12 }}>{n.message}</div>
                <div style={{ color: '#63727d', fontSize: 10, marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showFollowersModal && (
        <div className="cm-social-followers-box" onClick={() => setShowFollowersModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 300, maxHeight: '80vh', background: '#111b21', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #25313a', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>Takipçiler</span>
              <button onClick={() => setShowFollowersModal(false)} style={{ background: 'none', border: 'none', color: '#7f8c98', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 'calc(80vh - 50px)', padding: 8 }}>
              {followersList.map(u => (
                <div key={u.username} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px', borderRadius: 8 }}>
                  <span style={{ fontSize: 20 }}>{u.avatar || '🐱'}</span>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>{u.username}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showFollowingModal && (
        <div className="cm-social-followers-box" onClick={() => setShowFollowingModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 300, maxHeight: '80vh', background: '#111b21', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #25313a', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>Takip Edilenler</span>
              <button onClick={() => setShowFollowingModal(false)} style={{ background: 'none', border: 'none', color: '#7f8c98', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 'calc(80vh - 50px)', padding: 8 }}>
              {followingList.map(u => (
                <div key={u.username} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px', borderRadius: 8 }}>
                  <span style={{ fontSize: 20 }}>{u.avatar || '🐱'}</span>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>{u.username}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showVerifyModal && (
        <div onClick={() => setShowVerifyModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="cm-social-verify-box" onClick={e => e.stopPropagation()} style={{ width: 320, background: '#111b21', borderRadius: 16, padding: 20 }}>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 14, marginBottom: 12 }}>E-posta Doğrula</div>
            <input value={verifyCode} onChange={e => setVerifyCode(e.target.value)} placeholder="Doğrulama kodu" style={{ width: '100%', padding: '10px', background: '#0b141a', border: '1px solid #25313a', borderRadius: 8, color: '#fff', fontSize: 13, marginBottom: 10 }} />
            <button onClick={() => { verifyEmailCode(verifyCode); setShowVerifyModal(false); }} style={{ width: '100%', padding: 10, background: '#00a884', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>Doğrula</button>
          </div>
        </div>
      )}

      {show2FAModal && (
        <div onClick={() => setShow2FAModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="cm-social-2fa-box" onClick={e => e.stopPropagation()} style={{ width: 320, background: '#111b21', borderRadius: 16, padding: 20, textAlign: 'center' }}>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 14, marginBottom: 12 }}>İki Faktörlü Doğrulama</div>
            {twoFAQR && <img src={twoFAQR} alt="QR" style={{ width: 180, height: 180, marginBottom: 12, borderRadius: 8 }} />}
            <input value={twoFACode} onChange={e => setTwoFACode(e.target.value)} placeholder="6 haneli kod" style={{ width: '100%', padding: 10, background: '#0b141a', border: '1px solid #25313a', borderRadius: 8, color: '#fff', fontSize: 13, marginBottom: 10, textAlign: 'center', letterSpacing: 4 }} />
            <button onClick={() => { verify2FASetup(twoFACode); setShow2FAModal(false); }} style={{ width: '100%', padding: 10, background: '#00a884', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>Aktifleştir</button>
            {twoFAEnabled && <button onClick={() => { disable2FA(); setShow2FAModal(false); }} style={{ width: '100%', padding: 10, marginTop: 8, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>Devre Dışı Bırak</button>}
          </div>
        </div>
      )}

      {showDeleteAccount && (
        <div onClick={() => setShowDeleteAccount(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="cm-social-delete-box" onClick={e => e.stopPropagation()} style={{ width: 320, background: '#111b21', borderRadius: 16, padding: 20 }}>
            <div style={{ color: '#ef4444', fontWeight: 900, fontSize: 14, marginBottom: 8 }}>Hesabı Sil</div>
            <div style={{ color: '#7f8c98', fontSize: 12, marginBottom: 12 }}>Bu işlem geri alınamaz. Tüm verileriniz silinecek.</div>
            <input type="password" value={deletePass} onChange={e => setDeletePass(e.target.value)} placeholder="Şifreni gir" style={{ width: '100%', padding: 10, background: '#0b141a', border: '1px solid #25313a', borderRadius: 8, color: '#fff', fontSize: 13, marginBottom: 10 }} />
            <button onClick={() => { deleteAccount(deletePass); setShowDeleteAccount(false); }} style={{ width: '100%', padding: 10, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>Hesabımı Sil</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(SocialModal);
