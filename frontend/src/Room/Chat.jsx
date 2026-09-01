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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 10px',
        display: 'flex', flexDirection: 'column', gap: 8,
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,.08) transparent',
        minHeight: 0
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12,
            color: '#475569', padding: 40
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(124,58,237,.15), rgba(236,72,153,.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
              border: '1px solid rgba(124,58,237,.15)'
            }}>💬</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#64748b' }}>Henüz mesaj yok</div>
            <div style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.5 }}>
              Sohbete ilk sen başla!<br />Mesajlar burada görünecek.
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
                alignItems: 'flex-end', gap: 8,
                maxWidth: '90%',
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                position: 'relative'
              }}
            >
              {/* Avatar */}
              {!isMe ? (
                showAvatar ? (
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}bb)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, boxShadow: `0 4px 12px ${avatarColor}33`,
                    border: `1px solid ${avatarColor}44`
                  }}>
                    {msg.avatar || '🐱'}
                  </div>
                ) : (
                  <div style={{ width: 32, flexShrink: 0 }} />
                )
              ) : null}

              {/* Bubble */}
              <div style={{ maxWidth: 'calc(100% - 44px)' }}>
                {/* Sender name */}
                {!isMe && showAvatar && (
                  <div style={{
                    fontSize: 10, fontWeight: 800, color: avatarColor,
                    marginBottom: 3, paddingLeft: 4,
                    display: 'flex', alignItems: 'center', gap: 4
                  }}>
                    {senderName}
                    <span style={{
                      fontSize: 8, color: '#475569', fontWeight: 600
                    }}>{msg.time}</span>
                  </div>
                )}

                <div style={{
                  background: isMe
                    ? 'linear-gradient(135deg, #00a884, #008f6f)'
                    : 'rgba(255,255,255,.06)',
                  color: isMe ? '#fff' : '#e2e8f0',
                  padding: '8px 12px',
                  borderRadius: isMe ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                  boxShadow: isMe
                    ? `0 2px 12px rgba(0,168,132,.25)`
                    : '0 2px 8px rgba(0,0,0,.15)',
                  border: isMe ? 'none' : '1px solid rgba(255,255,255,.04)',
                  fontSize: 12.5, lineHeight: 1.4, wordBreak: 'break-word',
                  position: 'relative', transition: 'all 0.15s'
                }}>
                  {/* Reply quote */}
                  {msg.replyTo && (
                    <div style={{
                      borderLeft: `3px solid ${isMe ? 'rgba(255,255,255,.4)' : currentTheme.primary}`,
                      paddingLeft: 8, marginBottom: 6, opacity: .8,
                      background: isMe ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.03)',
                      borderRadius: 6, padding: '5px 8px',
                      fontSize: 10.5, lineHeight: 1.3
                    }}>
                      <div style={{
                        fontWeight: 800, color: isMe ? '#fff' : currentTheme.primary,
                        fontSize: 10, marginBottom: 1
                      }}>
                        ↩ {msg.replyToSender || 'Bilinmeyen'}
                      </div>
                      <div style={{
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        maxWidth: 200, color: isMe ? 'rgba(255,255,255,.7)' : '#94a3b8'
                      }}>
                        {msg.replyToText}
                      </div>
                    </div>
                  )}

                  {msg.text}
                </div>

                {/* Time for own messages */}
                {isMe && showAvatar && (
                  <div style={{
                    fontSize: 8, color: '#475569', textAlign: 'right',
                    marginTop: 2, paddingRight: 4
                  }}>
                    {msg.time}
                  </div>
                )}
              </div>

              {/* Reply button on hover */}
              {hoveredMsg === idx && (
                <button
                  onClick={() => setReplyTo(msg)}
                  style={{
                    position: 'absolute', top: showAvatar ? 2 : -4,
                    [isMe ? 'left' : 'right']: isMe ? -4 : -4,
                    background: 'rgba(124,58,237,.9)', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '3px 8px', fontSize: 9, fontWeight: 800,
                    cursor: 'pointer', whiteSpace: 'nowrap', zIndex: 10,
                    boxShadow: '0 4px 12px rgba(124,58,237,.4)',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  ↩ Yanıtla
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
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
          background: 'linear-gradient(135deg, rgba(124,58,237,.1), rgba(0,168,132,.05))',
          borderTop: '1px solid rgba(255,255,255,.06)',
          borderLeft: `3px solid ${currentTheme.primary}`
        }}>
          <span style={{ color: currentTheme.primary, fontWeight: 900, fontSize: 12 }}>↩</span>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: currentTheme.primary }}>{replyTo.sender}</div>
            <div style={{
              fontSize: 11, color: '#94a3b8',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {replyTo.text}
            </div>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            style={{
              background: 'rgba(239,68,68,.15)', border: 'none', color: '#ef4444',
              fontWeight: 900, cursor: 'pointer', fontSize: 11,
              width: 22, height: 22, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >✕</button>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: '10px 10px', borderTop: '1px solid rgba(255,255,255,.06)',
          display: 'flex', gap: 8,
          background: 'rgba(0,0,0,.3)'
        }}
      >
        <input
          type="text"
          placeholder={replyTo ? `${replyTo.sender} yanıtla...` : 'Mesaj yaz...'}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          style={{
            flex: 1, borderRadius: 14,
            background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(255,255,255,.08)',
            color: '#e9edef', padding: '10px 14px', fontSize: 12.5, outline: 'none',
            transition: 'all 0.2s'
          }}
          onFocus={(e) => { e.target.style.borderColor = `${currentTheme.primary}44`; e.target.style.background = 'rgba(255,255,255,.08)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,.08)'; e.target.style.background = 'rgba(255,255,255,.06)'; }}
        />
        <button
          type="submit"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            color: '#fff', border: 'none', borderRadius: 12, width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(124,58,237,.35)',
            transition: 'all 0.2s', flexShrink: 0
          }}
        >
          ➤
        </button>
      </form>
    </div>
  );
}
