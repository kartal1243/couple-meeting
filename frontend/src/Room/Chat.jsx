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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0b141a' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === mySocketId || msg.sender === username;
          const isReplying = hoveredMsg === idx;
          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredMsg(idx)}
              onMouseLeave={() => setHoveredMsg(null)}
              style={{
                display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row',
                alignItems: 'flex-end', gap: '6px', maxWidth: '85%',
                alignSelf: isMe ? 'flex-end' : 'flex-start', position: 'relative'
              }}
            >
              <span style={{ fontSize: '14px', paddingBottom: '1px' }}>{msg.avatar || '🐱'}</span>
              <div style={{
                background: isMe ? '#005c4b' : '#202c33', color: '#e9edef',
                padding: '5px 9px',
                borderRadius: isMe ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.3)', minWidth: '60px'
              }}>
                {/* Yanıtlanan mesaj */}
                {msg.replyTo && (
                  <div style={{
                    borderLeft: `2px solid ${isMe ? '#53bdeb' : '#25d366'}`,
                    paddingLeft: 6, marginBottom: 4, opacity: 0.75,
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
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: isMe ? '#53bdeb' : '#25d366', marginBottom: '1px' }}>
                  {msg.sender}
                </div>
                <div style={{ fontSize: '12px', wordBreak: 'break-word', lineHeight: '1.3' }}>
                  {msg.text}
                </div>
                <div style={{ fontSize: '8px', color: '#8696a0', textAlign: 'right', marginTop: '2px' }}>
                  {msg.time}
                </div>
              </div>

              {/* Yanıtla butonu */}
              {isReplying && (
                <button
                  onClick={() => setReplyTo(msg)}
                  style={{
                    position: 'absolute', top: -8, [isMe ? 'left' : 'right']: 0,
                    background: currentTheme.primary, color: '#fff', border: 'none',
                    borderRadius: 6, padding: '2px 6px', fontSize: 9, fontWeight: 800,
                    cursor: 'pointer', whiteSpace: 'nowrap', zIndex: 10
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

      {/* Yanıt önizleme */}
      {replyTo && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
          background: '#1a2634', borderTop: '1px solid #222d34', fontSize: 11
        }}>
          <span style={{ color: currentTheme.primary, fontWeight: 900 }}>↩ Yanıt:</span>
          <span style={{ color: '#8696a0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {replyTo.sender}: {replyTo.text}
          </span>
          <button
            onClick={() => setReplyTo(null)}
            style={{ background: 'none', border: 'none', color: '#ea0038', fontWeight: 900, cursor: 'pointer', fontSize: 12 }}
          >
            ✕
          </button>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        style={{
          padding: '8px 10px', borderTop: '1px solid #222d34',
          display: 'flex', gap: '6px', background: currentTheme.cardBg
        }}
      >
        <input
          type="text"
          placeholder={replyTo ? 'Yanıtınızı yazın...' : 'Bir mesaj yazın...'}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          style={{
            flex: 1, borderRadius: '16px', background: '#202c33', border: 'none',
            color: '#e9edef', padding: '8px 12px', fontSize: '12px', outline: 'none'
          }}
        />
        <button
          type="submit"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary} 0%, #008f6f 100%)`,
            color: '#fff', border: 'none', borderRadius: '50%', width: '34px', height: '34px',
            padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', cursor: 'pointer'
          }}
        >
          ➤
        </button>
      </form>
    </div>
  );
}
