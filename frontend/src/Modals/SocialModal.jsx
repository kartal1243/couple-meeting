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

function DmChat({ activeChat, messages, input, setInput, onSend, onBack }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
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
          <div style={{ color: activeChat.isOnline ? '#25d366' : '#7f8c98', fontSize: 10 }}>{activeChat.isOnline ? '🟢 Çevrimiçi' : 'Çevrimdışı'}</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && <div style={{ color: '#7f8c98', textAlign: 'center', fontSize: 12, padding: 20 }}>Henüz mesaj yok. İlk mesajı sen gönder!</div>}
        {messages.map((m, i) => {
          const isMe = m.from !== activeChat.username;
          return (
            <div key={m.id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '75%', padding: '8px 12px', borderRadius: 14, background: isMe ? '#005c4b' : '#1f2c34', borderBottomRightRadius: isMe ? 4 : 14, borderBottomLeftRadius: isMe ? 14 : 4 }}>
                <div style={{ fontSize: 12, color: '#e9edef', wordBreak: 'break-word' }}>{m.text}</div>
                <div style={{ fontSize: 9, color: '#667781', textAlign: 'right', marginTop: 3 }}>{m.time}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) { onSend(input.trim()); setInput(''); } }} style={{ padding: 10, borderTop: '1px solid #25313a', display: 'flex', gap: 7, background: '#111b21' }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Mesaj yaz..." style={{ flex: 1, background: '#1f2c34', border: '1px solid #2a3942', color: '#e9edef', padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none' }} />
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
  groupMemberInput, setGroupMemberInput, createGroup, openGroup, sendGroupMessage, loadGroups
}) {
  useEffect(() => { if (authUser && socialTab === 'dm') loadDmList(); }, [socialTab, authUser]);
  useEffect(() => { if (authUser && socialTab === 'groups') loadGroups(); }, [socialTab, authUser]);

  const tabs = [
    { tab: 'global', label: '🌐 Global' },
    { tab: 'dm', label: '💬 Mesajlar' },
    { tab: 'groups', label: '👥 Gruplar' },
    { tab: 'friends', label: `🤝 Arkadaşlar${friendRequests.length ? ` (${friendRequests.length})` : ''}` },
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
              <DmChat activeChat={dmActiveChat} messages={dmMessages} input={dmInput} setInput={setDmInput} onSend={(text) => sendDm(dmActiveChat.username, text)} onBack={() => { setDmActiveChat(null); setDmMessages([]); }} />
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

            {/* Profile */}
            {socialTab === 'profile' && (
              <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
                {!authUser ? (
                  <div style={{ padding: 30, textAlign: 'center', color: '#7f8c98' }}>Profilini kaydetmek için hesap açman yeterli.</div>
                ) : (
                  <div style={{ maxWidth: 520 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                      <div style={{ fontSize: 44, width: 66, height: 66, borderRadius: 18, display: 'grid', placeItems: 'center', background: '#111b21', border: '1px solid #2a3942' }}>{authUser.avatar}</div>
                      <div><div style={{ fontSize: 20, color: '#fff', fontWeight: 900 }}>{authUser.username}</div><div style={{ fontSize: 11, color: '#53e6bc' }}>{authUser.email}</div></div>
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
                    <button type="button" onClick={saveProfile} style={{ ...styles.buttonPrimary, width: '100%' }}>Profili Kaydet ✓</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
