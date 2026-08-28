import { useEffect, useRef } from 'react';

export default function Chat({
  messages, mySocketId, username, chatInput, setChatInput,
  handleSendMessage, currentTheme
}) {
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0b141a' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === mySocketId || msg.sender === username;
          return (
            <div
              key={idx}
              style={{
                display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row',
                alignItems: 'flex-end', gap: '6px', maxWidth: '85%',
                alignSelf: isMe ? 'flex-end' : 'flex-start'
              }}
            >
              <span style={{ fontSize: '14px', paddingBottom: '1px' }}>{msg.avatar || '🐱'}</span>
              <div style={{
                background: isMe ? '#005c4b' : '#202c33', color: '#e9edef',
                padding: '5px 9px',
                borderRadius: isMe ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.3)', minWidth: '60px'
              }}>
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
            </div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        style={{
          padding: '8px 10px', borderTop: '1px solid #222d34',
          display: 'flex', gap: '6px', background: currentTheme.cardBg
        }}
      >
        <input
          type="text"
          placeholder="Bir mesaj yazın..."
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
