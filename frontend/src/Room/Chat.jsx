import { useEffect, useRef, useState } from 'react';

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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '10px 10px',
        display: 'flex', flexDirection: 'column', gap: 6,
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,.1) transparent'
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            color: '#475569', padding: 40
          }}>
            <span style={{ fontSize: 36 }}>💬</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Henüz mesaj yok</span>
            <span style={{ fontSize: 11, textAlign: 'center' }}>Sohbete ilk sen başla!</span>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === mySocketId || msg.sender === username;
          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredMsg(idx)}
              onMouseLeave={() => setHoveredMsg(null)}
              style={{
                display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row',
                alignItems: 'flex-end', gap: 6, maxWidth: '88%',
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                position: 'relative'
              }}
            >
              {!isMe && (
                <span style={{
                  fontSize: 14, paddingBottom: 1,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.3))'
                }}>{msg.avatar || '🐱'}</span>
              )}
              <div style={{
                background: isMe
                  ? 'linear-gradient(135deg, #005c4b, #004d40)'
                  : 'linear-gradient(135deg, #1e293b, #1a2332)',
                color: '#e9edef',
                padding: '6px 10px',
                borderRadius: isMe ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                boxShadow: '0 2px 8px rgba(0,0,0,.2)',
                border: isMe ? '1px solid rgba(0,168,132,.15)' : '1px solid rgba(255,255,255,.04)',
                minWidth: 50
              }}>
                {msg.replyTo && (
                  <div style={{
                    borderLeft: `2px solid ${isMe ? '#53bdeb' : '#25d366'}`,
                    paddingLeft: 6, marginBottom: 4, opacity: .75,
                    fontSize: 10, color: '#8696a0', lineHeight: 1.3
                  }}>
                    <div style={{ fontWeight: 800, color: isMe ? '#53bdeb' : '#25d366', fontSize: 9 }}>
                      ↩ {msg.replyToSender || 'Bilinmeyen'}
                    </div>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                      {msg.replyToText}
                    </div>
                  </div>
                )}
                <div style={{
                  fontSize: 10, fontWeight: 800,
                  color: isMe ? '#53bdeb' : '#25d366',
                  marginBottom: 1
                }}>
                  {msg.sender}
                </div>
                <div style={{ fontSize: 12, wordBreak: 'break-word', lineHeight: 1.35 }}>
                  {msg.text}
                </div>
                <div style={{ fontSize: 8, color: '#64748b', textAlign: 'right', marginTop: 2 }}>
                  {msg.time}
                </div>
              </div>

              {hoveredMsg === idx && (
                <button
                  onClick={() => setReplyTo(msg)}
                  style={{
                    position: 'absolute', top: -6, [isMe ? 'left' : 'right']: 0,
                    background: currentTheme.primary, color: '#fff', border: 'none',
                    borderRadius: 6, padding: '2px 8px', fontSize: 9, fontWeight: 800,
                    cursor: 'pointer', whiteSpace: 'nowrap', zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,.3)'
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
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
          background: 'linear-gradient(135deg, rgba(124,58,237,.08), rgba(0,168,132,.05))',
          borderTop: '1px solid rgba(255,255,255,.06)', fontSize: 11,
          borderLeft: `3px solid ${currentTheme.primary}`
        }}>
          <span style={{ color: currentTheme.primary, fontWeight: 900 }}>↩ Yanıt:</span>
          <span style={{ color: '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {replyTo.sender}: {replyTo.text}
          </span>
          <button
            onClick={() => setReplyTo(null)}
            style={{
              background: 'rgba(239,68,68,.1)', border: 'none', color: '#ef4444',
              fontWeight: 900, cursor: 'pointer', fontSize: 12,
              width: 20, height: 20, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >✕</button>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: '8px 10px', borderTop: '1px solid rgba(255,255,255,.06)',
          display: 'flex', gap: 6,
          background: 'rgba(0,0,0,.3)'
        }}
      >
        <input
          type="text"
          placeholder={replyTo ? 'Yanıtınızı yazın...' : 'Mesaj yaz...'}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          style={{
            flex: 1, borderRadius: 14,
            background: 'rgba(255,255,255,.05)',
            border: '1px solid rgba(255,255,255,.06)',
            color: '#e9edef', padding: '8px 14px', fontSize: 12, outline: 'none'
          }}
        />
        <button
          type="submit"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            color: '#fff', border: 'none', borderRadius: 12, width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(124,58,237,.3)'
          }}
        >
          ➤
        </button>
      </form>
    </div>
  );
}
