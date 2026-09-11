import { useState, useEffect, useRef, memo } from 'react';

const DmChat = memo(function DmChat({ activeChat, messages, input, setInput, onSend, onBack, typingUsers, sendDmTyping, sendDmStopTyping, followUser, unfollowUser, isFollowingUser }) {
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
  if (!activeChat) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#7f8c98', fontSize: 13 }}>Bir sohbet seçin</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div className="cm-social-dm-header" style={{ padding: '10px 14px', borderBottom: '1px solid #25313a', display: 'flex', alignItems: 'center', gap: 10, background: '#111b21' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#53e6bc', cursor: 'pointer', fontSize: 18, fontWeight: 900, padding: '4px 6px' }}>&larr;</button>
        <div style={{ fontSize: 18, position: 'relative', flexShrink: 0 }}>
          {activeChat.avatar || '🐱'}
          <span style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: activeChat.isOnline ? '#25d366' : '#63727d', border: '2px solid #111b21' }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="cm-social-dm-header-name" style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>{activeChat.username}</div>
          <div style={{ color: activeChat.isOnline ? '#25d366' : '#7f8c98', fontSize: 10 }}>{isTyping ? 'yaziyor...' : (activeChat.isOnline ? 'Cevrimici' : 'Cevrimdisi')}</div>
        </div>
        <button type="button" onClick={() => isFollowingUser ? unfollowUser(activeChat.username) : followUser(activeChat.username)}
          style={{ background: isFollowingUser ? '#ea0038' : '#00a884', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 10, flexShrink: 0 }}>
          {isFollowingUser ? 'Takipten Cik' : 'Takip Et'}
        </button>
      </div>
      <div className="cm-social-dm-msgs" style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && <div style={{ color: '#7f8c98', textAlign: 'center', fontSize: 12, padding: 20 }}>Henuz mesaj yok. Ilk mesaji sen gonder!</div>}
        {messages.map((m, i) => {
          const msgFrom = m.from || m.from_username;
          const isMe = msgFrom !== activeChat.username;
          return (
            <div key={m.id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div className="cm-social-dm-bubble" style={{ maxWidth: '75%', padding: '8px 12px', borderRadius: 14, background: isMe ? '#005c4b' : '#1f2c34', borderBottomRightRadius: isMe ? 4 : 14, borderBottomLeftRadius: isMe ? 14 : 4 }}>
                <div style={{ fontSize: 12, color: '#e9edef', wordBreak: 'break-word' }}>{m.text}{m.edited && <span style={{ fontSize: 9, color: '#667781', marginLeft: 4 }}>(duzenlendi)</span>}</div>
                <div style={{ fontSize: 9, color: '#667781', textAlign: 'right', marginTop: 3 }}>{m.time}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form className="cm-social-dm-input" onSubmit={(e) => { e.preventDefault(); if (input.trim()) { onSend(input.trim()); setInput(''); } }} style={{ padding: 10, borderTop: '1px solid #25313a', display: 'flex', gap: 7, background: '#111b21' }}>
        <input value={input} onChange={handleInputChange} placeholder="Mesaj yaz..." style={{ flex: 1, background: '#1f2c34', border: '1px solid #2a3942', color: '#e9edef', padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none' }} />
        <button type="submit" className="cm-social-msg-btn" style={{ background: '#00a884', color: '#fff', border: 'none', padding: '9px 14px', borderRadius: 10, fontWeight: 900, cursor: 'pointer' }}>&#10148;</button>
      </form>
    </div>
  );
});

export default DmChat;
