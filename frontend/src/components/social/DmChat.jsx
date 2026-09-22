import { useState, useEffect, useRef, memo } from 'react';
import VipBadge from './VipBadge';

const REACTION_EMOJIS = ['❤️','😂','😮','🔥','👍','😢'];

const DmChat = memo(function DmChat({ authUser, dmConversations, dmActiveChat, setDmActiveChat, dmMessages, dmInput, setDmInput, sendDm, openDm, typingUsers, sendDmTyping, sendDmStopTyping, followUser, unfollowUser, isFollowingUser, styles, messageReactions, addReaction, removeReaction, editDm, deleteDm, authToken }) {
  const endRef = useRef(null);
  const typingTimeout = useRef(null);
  const [replyTo, setReplyTo] = useState(null);
  const [reactPicker, setReactPicker] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const chat = typeof dmActiveChat === 'string' ? { username: dmActiveChat } : dmActiveChat;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [dmMessages, dmActiveChat]);

  const handleInputChange = (e) => {
    setDmInput(e.target.value);
    if (sendDmTyping && chat?.username) {
      sendDmTyping(chat.username);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => { if (sendDmStopTyping) sendDmStopTyping(chat.username); }, 2000);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!dmInput.trim() || !dmActiveChat) return;
    sendDm(chat.username, dmInput.trim(), replyTo);
    setDmInput('');
    setReplyTo(null);
  };

  const toggleReact = (msgId, emoji) => {
    if (!authToken || !addReaction) return;
    const current = messageReactions?.[msgId]?.[emoji] || [];
    const me = authUser?.username;
    if (!me) return;
    if (current.includes(me)) removeReaction?.(msgId, emoji, 'dm');
    else addReaction(msgId, emoji, 'dm');
    setReactPicker(null);
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setEditText(m.text || '');
  };

  const submitEdit = (msgId) => {
    const t = editText.trim();
    if (t && editDm && chat?.username) editDm(msgId, chat.username, t);
    setEditingId(null);
    setEditText('');
  };

  if (!dmActiveChat) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #25313a', background: '#111b21' }}>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>💬 Mesajlar</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {(!dmConversations || dmConversations.length === 0) ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#7f8c98', fontSize: 12 }}>
              Henüz konuşmanız yok.<br/>Arkadaşlar sekmesinden mesaj başlatabilirsiniz.
            </div>
          ) : dmConversations.map(conv => {
            const lastMsg = conv.lastMessage || '';
            const unread = conv.unread || 0;
            return (
              <div key={conv.username} onClick={() => {
                if (openDm) openDm({ username: conv.username, avatar: conv.avatar || '🐱', isOnline: conv.isOnline });
                else setDmActiveChat({ username: conv.username, avatar: conv.avatar || '🐱', isOnline: conv.isOnline });
              }} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 10, cursor: 'pointer', marginBottom: 4,
                background: 'rgba(255,255,255,.03)', transition: 'background .15s'
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'}
              >
                <div style={{ fontSize: 22, flexShrink: 0 }}>{conv.avatar || '🐱'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{conv.username}</div>
                  <div style={{ color: '#7f8c98', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastMsg || 'Sohbete başla...'}</div>
                </div>
                {unread > 0 && (
                  <span style={{ background: '#00a884', color: '#fff', borderRadius: 10, padding: '2px 7px', fontSize: 10, fontWeight: 900, flexShrink: 0 }}>{unread}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const activeMessages = dmMessages?.[chat?.username] || [];
  const isTyping = typingUsers && typingUsers[chat?.username];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div className="cm-social-dm-header" style={{ padding: '10px 14px', borderBottom: '1px solid #25313a', display: 'flex', alignItems: 'center', gap: 10, background: '#111b21' }}>
        <button onClick={() => { setDmActiveChat(null); setReplyTo(null); }} style={{ background: 'none', border: 'none', color: '#53e6bc', cursor: 'pointer', fontSize: 18, fontWeight: 900, padding: '4px 6px' }}>&larr;</button>
        <div style={{ fontSize: 18, position: 'relative', flexShrink: 0 }}>
          {chat.avatar || '🐱'}
          <span style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: chat.isOnline ? '#25d366' : '#63727d', border: '2px solid #111b21' }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="cm-social-dm-header-name" style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>{chat.username}<VipBadge level={chat.vipLevel || (chat.isVip ? 1 : 0)} /></div>
          <div style={{ color: chat.isOnline ? '#25d366' : '#7f8c98', fontSize: 10 }}>{isTyping ? 'yaziyor...' : (chat.isOnline ? 'Cevrimici' : 'Cevrimdisi')}</div>
        </div>
        {followUser && unfollowUser && (
          <button type="button" onClick={() => isFollowingUser ? unfollowUser(chat.username) : followUser(chat.username)}
            style={{ background: isFollowingUser ? '#ea0038' : '#00a884', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 10, flexShrink: 0 }}>
            {isFollowingUser ? 'Takipten Cik' : 'Takip Et'}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="cm-social-dm-msgs" style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {activeMessages.length === 0 && <div style={{ color: '#7f8c98', textAlign: 'center', fontSize: 12, padding: 20 }}>Henuz mesaj yok. Ilk mesaji sen gonder!</div>}
        {activeMessages.map((m, i) => {
          const msgFrom = m.from || m.from_username || m.sender;
          const isMe = msgFrom === authUser?.username;
          return (
            <div key={m.id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', position: 'relative' }}>
              <div className="cm-social-dm-bubble" style={{ maxWidth: '75%', padding: '8px 12px', borderRadius: 14, background: isMe ? '#005c4b' : '#1f2c34', borderBottomRightRadius: isMe ? 4 : 14, borderBottomLeftRadius: isMe ? 14 : 4, position: 'relative' }}>
                {m.replyTo && (
                  <div style={{ background: 'rgba(255,255,255,.06)', borderLeft: '3px solid #53e6bc', padding: '4px 8px', borderRadius: 6, marginBottom: 6, fontSize: 10, color: '#94a3b8' }}>
                    <span style={{ color: '#53e6bc', fontWeight: 800 }}>{m.replyTo.sender}</span><br/>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 200 }}>{m.replyTo.text}</span>
                  </div>
                )}
                {editingId === m.id ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') submitEdit(m.id); if (e.key === 'Escape') setEditingId(null); }}
                      autoFocus
                      style={{ flex: 1, minWidth: 0, background: 'rgba(0,0,0,.35)', border: '1px solid #53e6bc', color: '#fff', borderRadius: 8, padding: '5px 8px', fontSize: 12, outline: 'none' }}
                    />
                    <button onClick={() => submitEdit(m.id)} style={{ background: '#00a884', border: 'none', color: '#fff', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>✓</button>
                    <button onClick={() => setEditingId(null)} style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#94a3b8', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>✕</button>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#e9edef', wordBreak: 'break-word' }}>{m.text}{m.edited && <span style={{ fontSize: 9, color: '#667781', marginLeft: 4 }}>(duzenlendi)</span>}</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3, gap: 4 }}>
                  <div style={{ fontSize: 9, color: '#667781' }}>{m.time}{!isMe && (m.fromVipLevel || m.fromVip) ? <VipBadge level={m.fromVipLevel || 1} size={8} /> : null}</div>
                  <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <button onClick={() => setReactPicker(reactPicker === (m.id || i) ? null : (m.id || i))} style={{ background: 'none', border: 'none', color: '#667781', cursor: 'pointer', fontSize: 11, padding: '0 3px' }} title="Tepki">☺</button>
                    <button onClick={() => setReplyTo({ id: m.id, sender: msgFrom, text: m.text })} style={{ background: 'none', border: 'none', color: '#667781', cursor: 'pointer', fontSize: 10, padding: '0 4px' }} title="Yanıtla">↩</button>
                    {isMe && m.text && editDm && (
                      <button onClick={() => startEdit(m)} style={{ background: 'none', border: 'none', color: '#667781', cursor: 'pointer', fontSize: 10, padding: '0 3px' }} title="Düzenle">✏</button>
                    )}
                    {isMe && deleteDm && m.id && (
                      <button onClick={() => deleteDm(m.id, chat?.username)} style={{ background: 'none', border: 'none', color: '#667781', cursor: 'pointer', fontSize: 10, padding: '0 3px' }} title="Sil">🗑</button>
                    )}
                  </div>
                </div>
                {reactPicker === (m.id || i) && (
                  <div style={{
                    display: 'flex', gap: 4, position: 'absolute', top: -28, zIndex: 20,
                    background: '#111b21', border: '1px solid #2a3942', borderRadius: 12, padding: '4px 6px',
                    boxShadow: '0 6px 18px rgba(0,0,0,.4)', [isMe ? 'right' : 'left']: 0
                  }}>
                    {REACTION_EMOJIS.map((em) => (
                      <button key={em} onClick={(e) => { e.stopPropagation(); if (m.id) toggleReact(m.id, em); }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 15, padding: 2 }}>{em}</button>
                    ))}
                  </div>
                )}
                {Object.keys(messageReactions?.[m.id] || {}).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    {Object.entries(messageReactions[m.id]).map(([emoji, users]) => (
                      <button
                        key={emoji}
                        onClick={() => { if (m.id) toggleReact(m.id, emoji); }}
                        style={{
                          background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)',
                          borderRadius: 10, padding: '1px 6px', fontSize: 11, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 3, lineHeight: 1.4
                        }}
                        title={(users || []).join(', ')}
                      >{emoji} <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 800 }}>{(users || []).length}</span></button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Reply Preview */}
      {replyTo && (
        <div style={{ padding: '8px 14px', borderTop: '1px solid #25313a', background: '#0d1b24', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, borderLeft: '3px solid #53e6bc', paddingLeft: 8 }}>
            <div style={{ fontSize: 10, color: '#53e6bc', fontWeight: 800 }}>{replyTo.sender}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{replyTo.text}</div>
          </div>
          <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14, fontWeight: 900 }}>✕</button>
        </div>
      )}

      {/* Input */}
      <form className="cm-social-dm-input" onSubmit={handleSend} style={{ padding: 10, borderTop: replyTo ? 'none' : '1px solid #25313a', display: 'flex', gap: 7, background: '#111b21' }}>
        <input value={dmInput} onChange={handleInputChange} placeholder={replyTo ? 'Yanıt yaz...' : 'Mesaj yaz...'} style={{ flex: 1, background: '#1f2c34', border: '1px solid #2a3942', color: '#e9edef', padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none' }} />
        <button type="submit" className="cm-social-msg-btn" style={{ background: '#00a884', color: '#fff', border: 'none', padding: '9px 14px', borderRadius: 10, fontWeight: 900, cursor: 'pointer' }}>&#10148;</button>
      </form>
    </div>
  );
});

export default DmChat;
