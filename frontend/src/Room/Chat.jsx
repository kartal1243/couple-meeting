import { useEffect, useRef, useState } from 'react';

const AVATAR_COLORS = ['#7c3aed', '#2563eb', '#00a884', '#f59e0b', '#ec4899', '#ef4444', '#06b6d4', '#8b5cf6'];
function getAvatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default function Chat({
  messages, mySocketId, username, chatInput, setChatInput,
  handleSendMessage, currentTheme, replyTo, setReplyTo
}) {
  const chatBottomRef = useRef(null);
  const [hoveredMsg, setHoveredMsg] = useState(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', minHeight: 0 }}>
      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '10px',
        display: 'flex', flexDirection: 'column', gap: 6,
        minHeight: 0
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10,
            color: '#475569', padding: 30
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(124,58,237,.15), rgba(236,72,153,.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              border: '1px solid rgba(124,58,237,.15)'
            }}>💬</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#64748b' }}>Henüz mesaj yok</div>
            <div style={{ fontSize: 11, textAlign: 'center', lineHeight: 1.4 }}>
              Sohbete ilk sen başla!
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.senderId === mySocketId || msg.sender === username;
          const senderName = msg.sender || 'Bilinmeyen';
          const avatarColor = getAvatarColor(senderName);
          const showAvatar = idx === 0 || messages[idx - 1]?.sender !== msg.sender;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredMsg(idx)}
              onMouseLeave={() => setHoveredMsg(null)}
              style={{
                display: 'flex',
                flexDirection: isMe ? 'row-reverse' : 'row',
                alignItems: 'flex-end', gap: 6,
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                position: 'relative'
              }}
            >
              {/* Avatar */}
              {!isMe && (
                showAvatar ? (
                  <div style={{
                    width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                    background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}bb)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14
                  }}>
                    {msg.avatar || '🐱'}
                  </div>
                ) : <div style={{ width: 30, flexShrink: 0 }} />
              )}

              <div style={{ maxWidth: isMe ? '75%' : '70%' }}>
                {/* Sender name */}
                {!isMe && showAvatar && (
                  <div style={{
                    fontSize: 10, fontWeight: 800, color: avatarColor,
                    marginBottom: 2, paddingLeft: 2
                  }}>
                    {senderName}
                  </div>
                )}

                {/* Bubble */}
                <div style={{
                  background: isMe
                    ? 'linear-gradient(135deg, #00a884, #008f6f)'
                    : 'rgba(255,255,255,.06)',
                  color: isMe ? '#fff' : '#e2e8f0',
                  padding: '7px 10px',
                  borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  boxShadow: isMe ? '0 2px 8px rgba(0,168,132,.2)' : '0 1px 4px rgba(0,0,0,.15)',
                  border: isMe ? 'none' : '1px solid rgba(255,255,255,.04)',
                  fontSize: 12, lineHeight: 1.4,
                  wordBreak: 'break-word', overflowWrap: 'break-word',
                  maxWidth: '100%', boxSizing: 'border-box'
                }}>
                  {msg.replyTo && (
                    <div style={{
                      borderLeft: `3px solid ${isMe ? 'rgba(255,255,255,.35)' : currentTheme.primary}`,
                      paddingLeft: 6, marginBottom: 4,
                      background: isMe ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.03)',
                      borderRadius: 4, padding: '4px 6px', marginBottom: 5,
                      fontSize: 10, lineHeight: 1.3
                    }}>
                      <div style={{ fontWeight: 800, color: isMe ? '#fff' : currentTheme.primary, fontSize: 9 }}>
                        ↩ {msg.replyToSender}
                      </div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                        {msg.replyToText}
                      </div>
                    </div>
                  )}
                  {msg.text}
                </div>

                {/* Time */}
                {(!isMe && !showAvatar) || isMe ? (
                  <div style={{
                    fontSize: 8, color: '#475569',
                    textAlign: isMe ? 'right' : 'left',
                    marginTop: 2, paddingLeft: isMe ? 0 : 2, paddingRight: isMe ? 2 : 0
                  }}>
                    {msg.time}
                  </div>
                ) : null}
              </div>

              {hoveredMsg === idx && (
                <button
                  onClick={() => setReplyTo(msg)}
                  style={{
                    position: 'absolute', top: 0,
                    [isMe ? 'left' : 'right']: -2,
                    background: '#7c3aed', color: '#fff', border: 'none',
                    borderRadius: 6, padding: '2px 6px', fontSize: 9, fontWeight: 800,
                    cursor: 'pointer', whiteSpace: 'nowrap', zIndex: 10,
                    boxShadow: '0 4px 12px rgba(124,58,237,.4)'
                  }}
                >
                  ↩
                </button>
              )}
            </div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px',
          background: 'rgba(124,58,237,.08)',
          borderTop: '1px solid rgba(255,255,255,.06)',
          borderLeft: `3px solid ${currentTheme.primary}`
        }}>
          <span style={{ color: currentTheme.primary, fontWeight: 900, fontSize: 11 }}>↩</span>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: currentTheme.primary }}>{replyTo.sender}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {replyTo.text}
            </div>
          </div>
          <button onClick={() => setReplyTo(null)} style={{
            background: 'rgba(239,68,68,.15)', border: 'none', color: '#ef4444',
            width: 20, height: 20, borderRadius: 6, cursor: 'pointer', fontSize: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900
          }}>✕</button>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: '8px 10px', borderTop: '1px solid rgba(255,255,255,.06)',
          display: 'flex', gap: 6, background: 'rgba(0,0,0,.3)'
        }}
      >
        <input
          type="text"
          placeholder={replyTo ? `${replyTo.sender} yanıtla...` : 'Mesaj yaz...'}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          style={{
            flex: 1, borderRadius: 12, minWidth: 0,
            background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(255,255,255,.08)',
            color: '#e9edef', padding: '8px 12px', fontSize: 12, outline: 'none'
          }}
        />
        <button type="submit" style={{
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          color: '#fff', border: 'none', borderRadius: 10, width: 36, height: 36, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, cursor: 'pointer'
        }}>➤</button>
      </form>
    </div>
  );
}
