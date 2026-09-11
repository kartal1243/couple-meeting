import { useState, useEffect, memo } from 'react';
import DmChat from '../components/social/DmChat';
import GroupChat from '../components/social/GroupChat';
import GlobalChatTab from '../components/social/GlobalChatTab';
import FriendsTab from '../components/social/FriendsTab';
import FeedTab from '../components/social/FeedTab';
import ProfileTab from '../components/social/ProfileTab';
import GroupsTab from '../components/social/GroupsTab';

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
          <div className="cm-social-content" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Global Chat */}
            {socialTab === 'global' && (
              <GlobalChatTab globalMessages={globalMessages} globalChatInput={globalChatInput} setGlobalChatInput={setGlobalChatInput} sendGlobalMessage={sendGlobalMessage} styles={styles} />
            )}

            {/* DM */}
            {socialTab === 'dm' && !dmActiveChat && (
              <div style={{ padding: 14, overflowY: 'auto', flex: 1 }}>
                {!authUser ? (
                  <div style={{ padding: 30, textAlign: 'center', color: '#7f8c98' }}>Mesajlaşma için hesap açmalısın.</div>
                ) : dmConversations.length === 0 ? (
                  <div style={{ padding: 30, textAlign: 'center', color: '#7f8c98' }}>Henüz konuşmanın yok. Arkadaşlarından birine mesaj gönder!</div>
                ) : dmConversations.map(c => (
                  <div key={c.username} onClick={() => openDm(c)} className="cm-social-card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#111b21', borderRadius: 12, marginBottom: 7, cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1a2634'} onMouseLeave={(e) => e.currentTarget.style.background = '#111b21'}>
                    <div className="cm-social-card-avatar" style={{ fontSize: 24, position: 'relative', flexShrink: 0 }}>
                      {c.avatar}
                      <span style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: c.isOnline ? '#25d366' : '#63727d', border: '2px solid #111b21' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="cm-social-card-name" style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>{c.username}</span>
                        <span style={{ color: c.isOnline ? '#25d366' : '#63727d', fontSize: 10 }}>{c.isOnline ? '●' : '○'}</span>
                      </div>
                      <div className="cm-social-card-sub" style={{ color: '#7f8c98', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.lastMessage}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <div style={{ color: '#667781', fontSize: 10 }}>{c.lastTime}</div>
                      {c.unread > 0 && <span style={{ background: '#00a884', color: '#fff', borderRadius: 10, padding: '2px 7px', fontSize: 10, fontWeight: 900 }}>{c.unread}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {socialTab === 'dm' && dmActiveChat && (
              <DmChat activeChat={dmActiveChat} messages={dmMessages[dmActiveChat.username] || []} input={dmInput} setInput={setDmInput} onSend={(text) => sendDm(dmActiveChat.username, text)} onBack={() => { setDmActiveChat(null); }} typingUsers={typingUsers} sendDmTyping={sendDmTyping} sendDmStopTyping={sendDmStopTyping} followUser={followUser} unfollowUser={unfollowUser} isFollowingUser={isFollowingUser} />
            )}

            {/* Groups */}
            {socialTab === 'groups' && !activeGroup && (
              <GroupsTab authUser={authUser} chatGroups={chatGroups} openGroup={openGroup} setShowGroupCreate={setShowGroupCreate} showGroupCreate={showGroupCreate} groupNameInput={groupNameInput} setGroupNameInput={setGroupNameInput} groupMemberInput={groupMemberInput} setGroupMemberInput={setGroupMemberInput} friends={friends} createGroup={createGroup} />
            )}
            {socialTab === 'groups' && activeGroup && (
              <GroupChat group={chatGroups.find(g => g.id === activeGroup) || { name: 'Grup', members: [] }} messages={groupMessages} input={groupInput} setInput={setGroupInput} onSend={sendGroupMessage} onBack={() => { setActiveGroup(null); setGroupMessages([]); }} />
            )}

            {/* Friends */}
            {socialTab === 'friends' && (
              <FriendsTab authUser={authUser} friendSearch={friendSearch} setFriendSearch={setFriendSearch} searchFriends={searchFriends} friendSearchResults={friendSearchResults} sendFriendRequest={sendFriendRequest} friendRequests={friendRequests} respondFriendRequest={respondFriendRequest} friends={friends} friendOnlineStatuses={friendOnlineStatuses} openDm={openDm} unfriendUser={unfriendUser} styles={styles} openAuth={openAuth} />
            )}

            {/* Feed */}
            {socialTab === 'feed' && (
              <FeedTab authUser={authUser} feedItems={feedItems} suggestedFollows={suggestedFollows} followUser={followUser} />
            )}

            {/* Profile */}
            {socialTab === 'profile' && (
              <ProfileTab authUser={authUser} profileBioInput={profileBioInput} setProfileBioInput={setProfileBioInput} profileStatusInput={profileStatusInput} setProfileStatusInput={setProfileStatusInput} myAvatar={myAvatar} setMyAvatar={setMyAvatar} saveProfile={saveProfile} styles={styles} followCounts={followCounts} loadFollowers={loadFollowers} loadFollowing={loadFollowing} twoFAEnabled={twoFAEnabled} setup2FA={setup2FA} setShow2FAModal={setShow2FAModal} setTwoFACode={setTwoFACode} sendVerificationEmail={sendVerificationEmail} setShowVerifyModal={setShowVerifyModal} setShowDeleteAccount={setShowDeleteAccount} />
            )}
          </div>
        </div>
      </div>

      {/* Takipçiler Modalı */}
      {showFollowersModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 20000, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowFollowersModal(false)}>
          <div className="cm-social-followers-box" style={{ width: 360, maxHeight: '70vh', background: '#111b21', borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #25313a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900 }}>👤 Takipçiler ({followersList.length})</span>
              <button onClick={() => setShowFollowersModal(false)} style={{ background: 'none', border: 'none', color: '#7f8c98', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              {followersList.length === 0 ? (
                <div style={{ color: '#7f8c98', textAlign: 'center', padding: 20 }}>Henüz takipçin yok.</div>
              ) : followersList.map(u => (
                <div key={u.username} className="cm-social-follow-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#0b141a', borderRadius: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: 24 }}>{u.avatar}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>{u.username}</div>
                    {u.bio && <div style={{ color: '#7f8c98', fontSize: 10 }}>{u.bio.slice(0, 50)}</div>}
                  </div>
                  <button type="button" onClick={() => { followUser(u.username); setShowFollowersModal(false); }} style={{ background: '#00a884', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 10, flexShrink: 0 }}>Takip Et</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Takip Edilenler Modalı */}
      {showFollowingModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 20000, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowFollowingModal(false)}>
          <div className="cm-social-followers-box" style={{ width: 360, maxHeight: '70vh', background: '#111b21', borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #25313a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900 }}>👥 Takip Edilen ({followingList.length})</span>
              <button onClick={() => setShowFollowingModal(false)} style={{ background: 'none', border: 'none', color: '#7f8c98', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              {followingList.length === 0 ? (
                <div style={{ color: '#7f8c98', textAlign: 'center', padding: 20 }}>Henüz kimseleri takip etmiyorsun.</div>
              ) : followingList.map(u => (
                <div key={u.username} className="cm-social-follow-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#0b141a', borderRadius: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: 24 }}>{u.avatar}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>{u.username}</div>
                    {u.bio && <div style={{ color: '#7f8c98', fontSize: 10 }}>{u.bio.slice(0, 50)}</div>}
                  </div>
                  <button type="button" onClick={() => { unfollowUser(u.username); setShowFollowingModal(false); }} style={{ background: '#ea0038', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 10, flexShrink: 0 }}>Takipten Çık</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bildirim Paneli */}
      {showNotifPanel && (
        <div className="cm-social-notif-panel" style={{ position: 'fixed', top: 70, right: 30, zIndex: 21000, width: 360, maxHeight: 500, background: '#111b21', borderRadius: 18, border: '1px solid #25313a', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #25313a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>🔔 Bildirimler</span>
            <button onClick={() => setShowNotifPanel(false)} style={{ background: 'none', border: 'none', color: '#7f8c98', fontSize: 14, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 420, padding: 8 }}>
            {notifications.length === 0 ? (
              <div style={{ color: '#7f8c98', textAlign: 'center', padding: 30, fontSize: 12 }}>Henüz bildirimin yok.</div>
            ) : notifications.map(n => (
              <div key={n.id} style={{ padding: '10px 12px', background: n.read ? 'transparent' : 'rgba(0,168,132,0.08)', borderRadius: 12, marginBottom: 4, borderLeft: n.read ? '3px solid transparent' : '3px solid #00a884' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 14 }}>{n.type === 'follow' ? '👆' : n.type === 'report' ? '🚨' : n.type === 'role' ? '👮' : '🔔'}</span>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>{n.title}</span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: 11 }}>{n.body}</div>
                <div style={{ color: '#475569', fontSize: 9, marginTop: 4 }}>{new Date(n.created_at).toLocaleString('tr')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Doğrulama Modalı */}
      {showVerifyModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 22000, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowVerifyModal(false)}>
          <div className="cm-social-verify-box" style={{ width: 380, background: '#111b21', borderRadius: 18, padding: 24, border: '1px solid #25313a' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>📧</div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>Email Doğrulama</div>
              <div style={{ color: '#7f8c98', fontSize: 12, marginTop: 6 }}>6 haneli doğrulama kodunu gir</div>
            </div>
            <input value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} placeholder="000000" style={{ width: '100%', background: '#1f2c34', border: '1px solid #2a3942', color: '#e9edef', padding: '12px', borderRadius: 12, fontSize: 24, textAlign: 'center', letterSpacing: 8, outline: 'none', marginBottom: 14 }} maxLength={6} />
            <button type="button" onClick={verifyEmailCode} style={{ width: '100%', background: '#00a884', color: '#fff', border: 'none', padding: '12px', borderRadius: 12, fontWeight: 900, cursor: 'pointer', fontSize: 14, marginBottom: 10 }}>Doğrula</button>
            <button type="button" onClick={() => { sendVerificationEmail(); }} style={{ width: '100%', background: 'transparent', color: '#00a884', border: '1px solid #00a884', padding: '10px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>Tekrar Gönder</button>
          </div>
        </div>
      )}

      {/* 2FA Modalı */}
      {show2FAModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 23000, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShow2FAModal(false)}>
          <div className="cm-social-2fa-box" style={{ width: 400, background: '#111b21', borderRadius: 18, padding: 24, border: '1px solid #25313a' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>🔐</div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>{twoFAEnabled ? '2FA Devre Dışı Bırak' : '2FA Kurulumu'}</div>
              <div style={{ color: '#7f8c98', fontSize: 12, marginTop: 6 }}>{twoFAEnabled ? 'Devre dışı bırakmak için kodunu gir' : 'Google Authenticator ile tara'}</div>
            </div>
            {twoFAQR && !twoFAEnabled && (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <img src={twoFAQR} alt="2FA QR" style={{ width: 180, height: 180, borderRadius: 12, background: '#fff', padding: 8 }} />
                <div style={{ color: '#7f8c98', fontSize: 10, marginTop: 8 }}>Secret: <span style={{ color: '#f59e0b', fontFamily: 'monospace' }}>{twoFASecret}</span></div>
              </div>
            )}
            <input value={twoFACode} onChange={(e) => setTwoFACode(e.target.value)} placeholder="6 haneli kod" style={{ width: '100%', background: '#1f2c34', border: '1px solid #2a3942', color: '#e9edef', padding: '12px', borderRadius: 12, fontSize: 24, textAlign: 'center', letterSpacing: 8, outline: 'none', marginBottom: 14 }} maxLength={6} />
            <button type="button" onClick={twoFAEnabled ? disable2FA : verify2FASetup} style={{ width: '100%', background: twoFAEnabled ? '#ea0038' : '#00a884', color: '#fff', border: 'none', padding: '12px', borderRadius: 12, fontWeight: 900, cursor: 'pointer', fontSize: 14 }}>
              {twoFAEnabled ? 'Devre Dışı Bırak' : 'Doğrula ve Aktif Et'}
            </button>
          </div>
        </div>
      )}

      {/* Hesap Silme Onay Modalı */}
      {showDeleteAccount && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 20000, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setShowDeleteAccount(false); setDeletePass(''); }}>
          <div className="cm-social-delete-box" style={{ width: 380, background: '#111827', border: '1px solid rgba(234,0,56,.2)', borderRadius: 18, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
              <h3 style={{ color: '#ea0038', fontSize: 18, fontWeight: 900, margin: '0 0 8px' }}>Hesabını Silmek İstiyor Musun?</h3>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 20px', lineHeight: 1.5 }}>Bu işlem geri alınamaz!<br />Tüm verilerin, arkadaşların, mesajların kalıcı olarak silinir.</p>
              <input type="password" value={deletePass} onChange={(e) => setDeletePass(e.target.value)} placeholder="Şifreni girerek onayla" style={{ width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(234,0,56,.2)', borderRadius: 10, padding: '12px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setShowDeleteAccount(false); setDeletePass(''); }} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 10, color: '#94a3b8', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>İptal</button>
                <button onClick={deleteAccount} disabled={!deletePass} style={{ flex: 1, padding: '12px', background: deletePass ? '#ea0038' : 'rgba(234,0,56,.3)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 900, fontSize: 13, cursor: deletePass ? 'pointer' : 'not-allowed' }}>🗑️ Kalıcı Sil</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(SocialModal);
