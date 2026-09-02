import { AVATARS } from '../constants';
import { useState, useEffect, useRef } from 'react';

function formatLastSeen(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Az önce';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} dk önce`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} saat önce`;
  return `${Math.floor(diff / 86400000)} gün önce`;
}

function DmChat({ activeChat, messages, input, setInput, onSend, onBack, typingUsers, sendDmTyping, sendDmStopTyping, followUser, unfollowUser, isFollowingUser }) {
  const endRef = useRef(null);
  const typingTimeout = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  const isTyping = typingUsers && typingUsers[activeChat?.username];
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (sendDmTyping && activeChat?.username) {
      sendDmTyping(activeChat.username);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => { if (sendDmStopTyping) sendDmStopTyping(activeChat.username); }, 2000);
    }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #25313a', display: 'flex', alignItems: 'center', gap: 10, background: '#111b21' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#53e6bc', cursor: 'pointer', fontSize: 16, fontWeight: 900 }}>←</button>
        <div style={{ fontSize: 18, position: 'relative' }}>
          {activeChat.avatar}
          <span style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: activeChat.isOnline ? '#25d366' : '#63727d', border: '2px solid #111b21' }} />
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>{activeChat.username}</div>
          <div style={{ color: activeChat.isOnline ? '#25d366' : '#7f8c98', fontSize: 10 }}>{isTyping ? '✏️ yazıyor...' : (activeChat.isOnline ? '🟢 Çevrimiçi' : 'Çevrimdışı')}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => isFollowingUser ? unfollowUser(activeChat.username) : followUser(activeChat.username)}
            style={{ background: isFollowingUser ? '#ea0038' : '#00a884', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 10 }}>
            {isFollowingUser ? '✕ Takipten Çık' : '👆 Takip Et'}
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && <div style={{ color: '#7f8c98', textAlign: 'center', fontSize: 12, padding: 20 }}>Henüz mesaj yok. İlk mesajı sen gönder!</div>}
        {messages.map((m, i) => {
          const msgFrom = m.from || m.from_username;
          const isMe = msgFrom !== activeChat.username;
          return (
            <div key={m.id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '75%', padding: '8px 12px', borderRadius: 14, background: isMe ? '#005c4b' : '#1f2c34', borderBottomRightRadius: isMe ? 4 : 14, borderBottomLeftRadius: isMe ? 14 : 4 }}>
                <div style={{ fontSize: 12, color: '#e9edef', wordBreak: 'break-word' }}>{m.text}{m.edited && <span style={{ fontSize: 9, color: '#667781', marginLeft: 4 }}>(düzenlendi)</span>}</div>
                <div style={{ fontSize: 9, color: '#667781', textAlign: 'right', marginTop: 3 }}>{m.time}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) { onSend(input.trim()); setInput(''); } }} style={{ padding: 10, borderTop: '1px solid #25313a', display: 'flex', gap: 7, background: '#111b21' }}>
        <input value={input} onChange={handleInputChange} placeholder="Mesaj yaz..." style={{ flex: 1, background: '#1f2c34', border: '1px solid #2a3942', color: '#e9edef', padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none' }} />
        <button type="submit" style={{ background: '#00a884', color: '#fff', border: 'none', padding: '9px 14px', borderRadius: 10, fontWeight: 900, cursor: 'pointer' }}>➤</button>
      </form>
    </div>
  );
}

function GroupChat({ group, messages, input, setInput, onSend, onBack }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #25313a', display: 'flex', alignItems: 'center', gap: 10, background: '#111b21' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#53e6bc', cursor: 'pointer', fontSize: 16, fontWeight: 900 }}>←</button>
        <div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>👥 {group.name}</div>
          <div style={{ color: '#7f8c98', fontSize: 10 }}>{group.members?.length || 0} üye</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && <div style={{ color: '#7f8c98', textAlign: 'center', fontSize: 12, padding: 20 }}>Henüz mesaj yok.</div>}
        {messages.map((m, i) => (
          <div key={m.id || i} style={{ display: 'flex', gap: 8 }}>
            <div style={{ fontSize: 18 }}>{m.fromAvatar || '🐱'}</div>
            <div style={{ background: '#1f2c34', padding: '7px 10px', borderRadius: 12, maxWidth: '75%' }}>
              <div style={{ fontSize: 10, color: '#53e6bc', fontWeight: 900 }}>{m.from} <span style={{ color: '#667781', fontWeight: 600 }}>• {m.time}</span></div>
              <div style={{ fontSize: 12, color: '#e9edef', marginTop: 2, wordBreak: 'break-word' }}>{m.text}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) { onSend(input.trim()); setInput(''); } }} style={{ padding: 10, borderTop: '1px solid #25313a', display: 'flex', gap: 7, background: '#111b21' }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Gruba mesaj yaz..." style={{ flex: 1, background: '#1f2c34', border: '1px solid #2a3942', color: '#e9edef', padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none' }} />
        <button type="submit" style={{ background: '#00a884', color: '#fff', border: 'none', padding: '9px 14px', borderRadius: 10, fontWeight: 900, cursor: 'pointer' }}>➤</button>
      </form>
    </div>
  );
}

export default function SocialModal({
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
  show2FAModal, setShow2FAModal, twoFAEnabled, setup2FA, disable2FA, twoFASecret, twoFAQR, twoFACode, setTwoFACode, verify2FASetup
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 19000, background: 'rgba(0,0,0,.78)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div style={{ width: 'min(900px, 100%)', height: 'min(760px, 94vh)', background: '#0f171d', border: '1px solid #2a3942', borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 35px 100px rgba(0,0,0,.5)' }}>
        {/* Header */}
        <div style={{ padding: '14px 16px', background: '#111b21', borderBottom: '1px solid #25313a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#53e6bc', fontSize: 10, fontWeight: 900 }}>COUPLE MEETING SOCIAL</div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 900 }}>🌍 Topluluk</div>
          </div>
          <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
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

        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Sidebar */}
          <div style={{ width: 200, borderRight: '1px solid #25313a', background: '#0b141a', padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tabs.map(({ tab, label }) => (
              <button key={tab} type="button" onClick={() => { setSocialTab(tab); setDmActiveChat(null); setActiveGroup(null); }}
                style={{ padding: '10px 12px', border: 'none', borderRadius: 10, textAlign: 'left', background: socialTab === tab ? '#00a884' : '#111b21', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>
                {label}
              </button>
            ))}
            <div style={{ marginTop: 'auto', padding: 10, borderRadius: 12, background: '#111b21', color: '#7f8c98', fontSize: 10, lineHeight: 1.5 }}>
              {authUser ? 'Hesabın aktif.' : 'Misafir olarak sohbet edebilirsin.'}
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Global Chat */}
            {socialTab === 'global' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {globalMessages.map((m, i) => (
                    <div key={m.id || i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 22 }}>{m.avatar || '🐱'}</div>
                      <div style={{ background: '#111b21', padding: '8px 10px', borderRadius: 12, maxWidth: '80%' }}>
                        <div style={{ fontSize: 11, color: '#53e6bc', fontWeight: 900 }}>{m.username || 'Misafir'} <span style={{ color: '#63727d', fontWeight: 600 }}>• {m.time || ''}</span></div>
                        <div style={{ fontSize: 13, color: '#e9edef', marginTop: 3, wordBreak: 'break-word' }}>{m.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={sendGlobalMessage} style={{ padding: 10, borderTop: '1px solid #25313a', display: 'flex', gap: 7, background: '#111b21' }}>
                  <input value={globalChatInput} onChange={(e) => setGlobalChatInput(e.target.value)} placeholder="Global sohbete bir şey yaz..." style={{ ...styles.input, flex: 1 }} />
                  <button type="submit" style={{ ...styles.buttonPrimary, padding: '10px 14px' }}>➤</button>
                </form>
              </div>
            )}

            {/* DM */}
            {socialTab === 'dm' && !dmActiveChat && (
              <div style={{ padding: 14, overflowY: 'auto', flex: 1 }}>
                {!authUser ? (
                  <div style={{ padding: 30, textAlign: 'center', color: '#7f8c98' }}>Mesajlaşma için hesap açmalısın.</div>
                ) : dmConversations.length === 0 ? (
                  <div style={{ padding: 30, textAlign: 'center', color: '#7f8c98' }}>Henüz konuşmanın yok. Arkadaşlarından birine mesaj gönder!</div>
                ) : dmConversations.map(c => (
                  <div key={c.username} onClick={() => openDm(c)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#111b21', borderRadius: 12, marginBottom: 7, cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1a2634'} onMouseLeave={(e) => e.currentTarget.style.background = '#111b21'}>
                    <div style={{ fontSize: 24, position: 'relative' }}>
                      {c.avatar}
                      <span style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: c.isOnline ? '#25d366' : '#63727d', border: '2px solid #111b21' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>{c.username}</span>
                        <span style={{ color: c.isOnline ? '#25d366' : '#63727d', fontSize: 10 }}>{c.isOnline ? '●' : '○'}</span>
                      </div>
                      <div style={{ color: '#7f8c98', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.lastMessage}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <div style={{ color: '#667781', fontSize: 10 }}>{c.lastTime}</div>
                      {c.unread > 0 && <span style={{ background: '#00a884', color: '#fff', borderRadius: 10, padding: '2px 7px', fontSize: 10, fontWeight: 900 }}>{c.unread}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {socialTab === 'dm' && dmActiveChat && (
              <DmChat activeChat={dmActiveChat} messages={dmMessages} input={dmInput} setInput={setDmInput} onSend={(text) => sendDm(dmActiveChat.username, text)} onBack={() => { setDmActiveChat(null); setDmMessages([]); }} typingUsers={typingUsers} sendDmTyping={sendDmTyping} sendDmStopTyping={sendDmStopTyping} followUser={followUser} unfollowUser={unfollowUser} isFollowingUser={isFollowingUser} />
            )}

            {/* Groups */}
            {socialTab === 'groups' && !activeGroup && (
              <div style={{ padding: 14, overflowY: 'auto', flex: 1 }}>
                {!authUser ? (
                  <div style={{ padding: 30, textAlign: 'center', color: '#7f8c98' }}>Grup sohbeti için hesap açmalısın.</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>👥 Grup Sohbeti</div>
                      <button onClick={() => setShowGroupCreate(true)} style={{ background: '#00a884', color: '#fff', border: 'none', padding: '7px 12px', borderRadius: 10, fontWeight: 900, cursor: 'pointer', fontSize: 11 }}>+ Yeni Grup</button>
                    </div>
                    {showGroupCreate && (
                      <div style={{ background: '#111b21', borderRadius: 14, padding: 14, marginBottom: 12, border: '1px solid #2a3942' }}>
                        <div style={{ color: '#fff', fontWeight: 900, fontSize: 13, marginBottom: 10 }}>Yeni Grup Oluştur</div>
                        <input value={groupNameInput} onChange={(e) => setGroupNameInput(e.target.value)} placeholder="Grup adı..." style={{ ...styles.input, width: '100%', marginBottom: 8 }} />
                        <input value={groupMemberInput} onChange={(e) => setGroupMemberInput(e.target.value)} placeholder="Üyeler (virgülle ayır: user1, user2)" style={{ ...styles.input, width: '100%', marginBottom: 8 }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={createGroup} style={{ ...styles.buttonPrimary, flex: 1, padding: '8px' }}>Oluştur</button>
                          <button onClick={() => setShowGroupCreate(false)} style={{ background: '#202c33', color: '#fff', border: '1px solid #2a3942', padding: '8px 14px', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>İptal</button>
                        </div>
                      </div>
                    )}
                    {chatGroups.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', color: '#7f8c98' }}>Henüz grubun yok. Yeni bir grup oluştur!</div>
                    ) : chatGroups.map(g => (
                      <div key={g.id} onClick={() => openGroup(g.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#111b21', borderRadius: 12, marginBottom: 7, cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#1a2634'} onMouseLeave={(e) => e.currentTarget.style.background = '#111b21'}>
                        <div style={{ fontSize: 24 }}>👥</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>{g.name}</div>
                          <div style={{ color: '#7f8c98', fontSize: 11 }}>{g.members?.length || 0} üye{g.lastMessage ? ` • ${g.lastMessage.text}` : ''}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
            {socialTab === 'groups' && activeGroup && (
              <GroupChat group={chatGroups.find(g => g.id === activeGroup) || { name: 'Grup', members: [] }} messages={groupMessages} input={groupInput} setInput={setGroupInput} onSend={sendGroupMessage} onBack={() => { setActiveGroup(null); setGroupMessages([]); }} />
            )}

            {/* Friends */}
            {socialTab === 'friends' && (
              <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
                {!authUser ? (
                  <div style={{ padding: 30, textAlign: 'center', color: '#7f8c98' }}>Arkadaşlık sistemi için hesap açmalısın.<br/><button type="button" onClick={() => openAuth('register')} style={{ ...styles.buttonPrimary, marginTop: 12 }}>Ücretsiz Hesap Aç</button></div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: 7 }}>
                      <input value={friendSearch} onChange={(e) => setFriendSearch(e.target.value)} placeholder="Kullanıcı adı ara..." style={{ ...styles.input, flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && searchFriends()} />
                      <button type="button" onClick={searchFriends} style={styles.buttonPrimary}>Ara</button>
                    </div>
                    {friendSearchResults.length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ color: '#7f8c98', fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Sonuçlar</div>
                        {friendSearchResults.map(u => (
                          <div key={u.username} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 10, background: '#111b21', borderRadius: 12, marginBottom: 7 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ position: 'relative' }}>
                                <span style={{ fontSize: 24 }}>{u.avatar}</span>
                                <span style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: u.isOnline ? '#25d366' : '#63727d', border: '2px solid #111b21' }} />
                              </div>
                              <div>
                                <div style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>{u.username}</div>
                                <div style={{ color: '#7f8c98', fontSize: 11 }}>{u.isOnline ? '🟢 Çevrimiçi' : (u.lastSeen ? `Son görülme: ${formatLastSeen(u.lastSeen)}` : 'Çevrimdışı')}</div>
                              </div>
                            </div>
                            <button type="button" onClick={() => sendFriendRequest(u.username)} style={{ ...styles.buttonPrimary, padding: '7px 10px', fontSize: 11 }}>➕ Ekle</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {friendRequests.length > 0 && (
                      <div>
                        <div style={{ color: '#fff', fontWeight: 900, margin: '18px 0 8px' }}>📩 Gelen istekler</div>
                        {friendRequests.map(r => (
                          <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 10, background: '#111b21', borderRadius: 12, marginBottom: 7 }}>
                            <span style={{ color: '#fff', fontWeight: 800 }}>{r.avatar || '🐱'} {r.fromUsername}</span>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button type="button" onClick={() => respondFriendRequest(r.id, 'accept')} style={{ ...styles.buttonPrimary, padding: '7px 10px', fontSize: 11 }}>Kabul</button>
                              <button type="button" onClick={() => respondFriendRequest(r.id, 'reject')} style={{ background: '#202c33', color: '#fff', border: '1px solid #2d3b44', padding: '7px 10px', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>Sil</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {friends.length > 0 && (
                      <div>
                        <div style={{ color: '#fff', fontWeight: 900, margin: '18px 0 8px' }}>🤝 Arkadaşların ({friends.length})</div>
                        {friends.map(f => {
                          const onlineStatus = friendOnlineStatuses[f.username];
                          const isOnline = f.isOnline || onlineStatus?.isOnline;
                          return (
                            <div key={f.username} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#111b21', borderRadius: 12, marginBottom: 7, border: isOnline ? '1px solid rgba(37,211,102,0.25)' : '1px solid transparent' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ position: 'relative' }}>
                                  <span style={{ fontSize: 24 }}>{f.avatar}</span>
                                  <span style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: isOnline ? '#25d366' : '#63727d', border: '2px solid #111b21' }} />
                                </div>
                                <div>
                                  <div style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>{f.username}</div>
                                  <div style={{ color: isOnline ? '#25d366' : '#7f8c98', fontSize: 11 }}>{isOnline ? '🟢 Çevrimiçi' : (onlineStatus?.lastSeen ? `Son görülme: ${formatLastSeen(onlineStatus.lastSeen)}` : 'Çevrimdışı')}</div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button type="button" onClick={() => openDm(f)} style={{ background: '#00a884', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 8px', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>💬</button>
                                <button type="button" onClick={() => { if (confirm(`${f.username} arkadaşlığını silmek istediğine emin misin?`)) unfriendUser(f.username); }} style={{ background: '#ea0038', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 8px', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>✕</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Feed */}
            {socialTab === 'feed' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                {!authUser ? (
                  <div style={{ padding: 30, textAlign: 'center', color: '#7f8c98' }}>Akışı görmek için hesap açmalısın.</div>
                ) : (
                  <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
                    <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
                      <div style={{ color: '#fff', fontWeight: 900, fontSize: 16, marginBottom: 14 }}>📰 Akış</div>
                      {feedItems.length === 0 ? (
                        <div style={{ padding: 30, textAlign: 'center', color: '#7f8c98' }}>
                          Henüz akış yok. Takip ettiğin kişilerin aktiviteleri burada görünecek.
                        </div>
                      ) : feedItems.map((item, i) => {
                        let content = '';
                        try {
                          const data = JSON.parse(item.data);
                          if (item.type === 'follow') content = `${item.username} birini takip etti → ${data.following}`;
                          else if (item.type === 'message') content = `${item.username} birine mesaj gönderdi`;
                          else if (item.type === 'room') content = `${item.username} bir odaya katıldı`;
                          else content = `${item.username}: ${item.type}`;
                        } catch { content = `${item.username}: ${item.type}`; }
                        return (
                          <div key={item.id || i} style={{ padding: '10px 14px', background: '#111b21', borderRadius: 12, marginBottom: 7 }}>
                            <div style={{ fontSize: 12, color: '#e9edef' }}>{content}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ width: 200, borderLeft: '1px solid #25313a', background: '#0b141a', padding: 14, overflowY: 'auto' }}>
                      <div style={{ color: '#fff', fontWeight: 900, fontSize: 13, marginBottom: 12 }}>💡 Önerilen</div>
                      {suggestedFollows.map(s => (
                        <div key={s.username} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #25313a' }}>
                          <span style={{ fontSize: 20 }}>{s.avatar}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: '#fff', fontWeight: 800, fontSize: 11 }}>{s.username}</div>
                            <div style={{ color: '#667781', fontSize: 10 }}>{s.follower_count || 0} takipçi</div>
                          </div>
                          <button type="button" onClick={() => followUser(s.username)} style={{ background: '#00a884', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 10 }}>Takip Et</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile */}
            {socialTab === 'profile' && (
              <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
                {!authUser ? (
                  <div style={{ padding: 30, textAlign: 'center', color: '#7f8c98' }}>Profilini kaydetmek için hesap açman yeterli.</div>
                ) : (
                  <div style={{ maxWidth: 520 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                      <div style={{ fontSize: 44, width: 66, height: 66, borderRadius: 18, display: 'grid', placeItems: 'center', background: '#111b21', border: '1px solid #2a3942' }}>{authUser.avatar}</div>
                      <div>
                        <div style={{ fontSize: 20, color: '#fff', fontWeight: 900 }}>{authUser.username}</div>
                        <div style={{ fontSize: 11, color: '#53e6bc' }}>{authUser.email}</div>
                        <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
                          <span onClick={() => loadFollowers(authUser.username)} style={{ color: '#7f8c98', fontSize: 11, cursor: 'pointer' }}><span style={{ color: '#fff', fontWeight: 900 }}>{followCounts.followers}</span> Takipçi</span>
                          <span onClick={() => loadFollowing(authUser.username)} style={{ color: '#7f8c98', fontSize: 11, cursor: 'pointer' }}><span style={{ color: '#fff', fontWeight: 900 }}>{followCounts.following}</span> Takip</span>
                        </div>
                      </div>
                    </div>
                    <label style={{ fontSize: 11, color: '#7f8c98', fontWeight: 900 }}>DURUM</label>
                    <input value={profileStatusInput} onChange={(e) => setProfileStatusInput(e.target.value)} placeholder="Şu an ne yapıyorsun?" style={{ ...styles.input, width: '100%', margin: '6px 0 12px' }} />
                    <label style={{ fontSize: 11, color: '#7f8c98', fontWeight: 900 }}>HAKKINDA</label>
                    <textarea value={profileBioInput} onChange={(e) => setProfileBioInput(e.target.value)} placeholder="Kendinden biraz bahset..." style={{ ...styles.input, width: '100%', minHeight: 100, resize: 'vertical', margin: '6px 0 12px' }} />
                    <label style={{ fontSize: 11, color: '#7f8c98', fontWeight: 900 }}>AVATAR</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0 16px' }}>
                      {AVATARS.map(a => (
                        <button key={a} type="button" onClick={() => { setMyAvatar(a); localStorage.setItem('cm_user_avatar', a); }} style={{ width: 44, height: 44, borderRadius: 12, fontSize: 22, cursor: 'pointer', background: myAvatar === a ? '#00a884' : '#111b21', border: myAvatar === a ? '2px solid #53e6bc' : '1px solid #2a3942' }}>{a}</button>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, padding: 12, background: authUser?.email_verified ? 'rgba(0,168,132,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: 12, border: authUser?.email_verified ? '1px solid rgba(0,168,132,0.3)' : '1px solid rgba(239,68,68,0.3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{authUser?.email_verified ? '✅' : '⚠️'}</span>
                        <div>
                          <div style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>{authUser?.email_verified ? 'Email Doğrulanmış' : 'Email Doğrulanmamış'}</div>
                          <div style={{ color: '#7f8c98', fontSize: 10 }}>{authUser?.email}</div>
                        </div>
                        {!authUser?.email_verified && (
                          <button type="button" onClick={() => { sendVerificationEmail(); setShowVerifyModal(true); }}
                            style={{ marginLeft: 'auto', background: '#00a884', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 10 }}>Doğrula</button>
                        )}
                      </div>
                    </div>
                    <div style={{ marginTop: 12, padding: 12, background: twoFAEnabled ? 'rgba(0,168,132,0.1)' : 'rgba(245,158,11,0.1)', borderRadius: 12, border: twoFAEnabled ? '1px solid rgba(0,168,132,0.3)' : '1px solid rgba(245,158,11,0.3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{twoFAEnabled ? '🔐' : '⚠️'}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>{twoFAEnabled ? '2FA Aktif' : '2FA Devre Dışı'}</div>
                          <div style={{ color: '#7f8c98', fontSize: 10 }}>Google Authenticator ile hesabını koru</div>
                        </div>
                        <button type="button" onClick={twoFAEnabled ? () => { setShow2FAModal(true); setTwoFACode(''); } : setup2FA}
                          style={{ background: twoFAEnabled ? '#ea0038' : '#f59e0b', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 10 }}>
                          {twoFAEnabled ? 'Devre Dışı Bırak' : 'Aktif Et'}
                        </button>
                      </div>
                    </div>
                    <button type="button" onClick={saveProfile} style={{ ...styles.buttonPrimary, width: '100%', marginTop: 12 }}>Profili Kaydet ✓</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Takipçiler Modalı */}
      {showFollowersModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 20000, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowFollowersModal(false)}>
          <div style={{ width: 360, maxHeight: '70vh', background: '#111b21', borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #25313a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900 }}>👤 Takipçiler ({followersList.length})</span>
              <button onClick={() => setShowFollowersModal(false)} style={{ background: 'none', border: 'none', color: '#7f8c98', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              {followersList.length === 0 ? (
                <div style={{ color: '#7f8c98', textAlign: 'center', padding: 20 }}>Henüz takipçin yok.</div>
              ) : followersList.map(u => (
                <div key={u.username} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#0b141a', borderRadius: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: 24 }}>{u.avatar}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>{u.username}</div>
                    {u.bio && <div style={{ color: '#7f8c98', fontSize: 10 }}>{u.bio.slice(0, 50)}</div>}
                  </div>
                  <button type="button" onClick={() => { followUser(u.username); setShowFollowersModal(false); }} style={{ background: '#00a884', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 10 }}>Takip Et</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Takip Edilenler Modalı */}
      {showFollowingModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 20000, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowFollowingModal(false)}>
          <div style={{ width: 360, maxHeight: '70vh', background: '#111b21', borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #25313a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900 }}>👥 Takip Edilen ({followingList.length})</span>
              <button onClick={() => setShowFollowingModal(false)} style={{ background: 'none', border: 'none', color: '#7f8c98', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              {followingList.length === 0 ? (
                <div style={{ color: '#7f8c98', textAlign: 'center', padding: 20 }}>Henüz kimseleri takip etmiyorsun.</div>
              ) : followingList.map(u => (
                <div key={u.username} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#0b141a', borderRadius: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: 24 }}>{u.avatar}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>{u.username}</div>
                    {u.bio && <div style={{ color: '#7f8c98', fontSize: 10 }}>{u.bio.slice(0, 50)}</div>}
                  </div>
                  <button type="button" onClick={() => { unfollowUser(u.username); setShowFollowingModal(false); }} style={{ background: '#ea0038', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 10 }}>Takipten Çık</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bildirim Paneli */}
      {showNotifPanel && (
        <div style={{ position: 'fixed', top: 70, right: 30, zIndex: 21000, width: 360, maxHeight: 500, background: '#111b21', borderRadius: 18, border: '1px solid #25313a', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}>
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
          <div style={{ width: 380, background: '#111b21', borderRadius: 18, padding: 24, border: '1px solid #25313a' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>📧</div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>Email Doğrulama</div>
              <div style={{ color: '#7f8c98', fontSize: 12, marginTop: 6 }}>6 haneli doğrulama kodunu gir</div>
            </div>
            <input value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} placeholder="000000"
              style={{ width: '100%', background: '#1f2c34', border: '1px solid #2a3942', color: '#e9edef', padding: '12px', borderRadius: 12, fontSize: 24, textAlign: 'center', letterSpacing: 8, outline: 'none', marginBottom: 14 }} maxLength={6} />
            <button type="button" onClick={verifyEmailCode} style={{ width: '100%', background: '#00a884', color: '#fff', border: 'none', padding: '12px', borderRadius: 12, fontWeight: 900, cursor: 'pointer', fontSize: 14, marginBottom: 10 }}>Doğrula</button>
            <button type="button" onClick={() => { sendVerificationEmail(); }} style={{ width: '100%', background: 'transparent', color: '#00a884', border: '1px solid #00a884', padding: '10px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>Tekrar Gönder</button>
          </div>
        </div>
      )}

      {/* 2FA Modalı */}
      {show2FAModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 23000, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShow2FAModal(false)}>
          <div style={{ width: 400, background: '#111b21', borderRadius: 18, padding: 24, border: '1px solid #25313a' }} onClick={e => e.stopPropagation()}>
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
            <input value={twoFACode} onChange={(e) => setTwoFACode(e.target.value)} placeholder="6 haneli kod"
              style={{ width: '100%', background: '#1f2c34', border: '1px solid #2a3942', color: '#e9edef', padding: '12px', borderRadius: 12, fontSize: 24, textAlign: 'center', letterSpacing: 8, outline: 'none', marginBottom: 14 }} maxLength={6} />
            <button type="button" onClick={twoFAEnabled ? disable2FA : verify2FASetup}
              style={{ width: '100%', background: twoFAEnabled ? '#ea0038' : '#00a884', color: '#fff', border: 'none', padding: '12px', borderRadius: 12, fontWeight: 900, cursor: 'pointer', fontSize: 14 }}>
              {twoFAEnabled ? 'Devre Dışı Bırak' : 'Doğrula ve Aktif Et'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
