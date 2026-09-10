import { useEffect, useRef, memo } from 'react';

const GroupChat = memo(function GroupChat({ group, messages, input, setInput, onSend, onBack }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div className="cm-social-dm-header" style={{ padding: '10px 14px', borderBottom: '1px solid #25313a', display: 'flex', alignItems: 'center', gap: 10, background: '#111b21' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#53e6bc', cursor: 'pointer', fontSize: 18, fontWeight: 900, padding: '4px 6px' }}>&larr;</button>
        <div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>{group.name}</div>
          <div style={{ color: '#7f8c98', fontSize: 10 }}>{group.members?.length || 0} uye</div>
        </div>
      </div>
      <div className="cm-social-dm-msgs" style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && <div style={{ color: '#7f8c98', textAlign: 'center', fontSize: 12, padding: 20 }}>Henuz mesaj yok.</div>}
        {messages.map((m, i) => (
          <div key={m.id || i} style={{ display: 'flex', gap: 8 }}>
            <div style={{ fontSize: 18, flexShrink: 0 }}>{m.fromAvatar || '🐱'}</div>
            <div style={{ background: '#1f2c34', padding: '7px 10px', borderRadius: 12, maxWidth: '75%' }}>
              <div style={{ fontSize: 10, color: '#53e6bc', fontWeight: 900 }}>{m.from} <span style={{ color: '#667781', fontWeight: 600 }}>• {m.time}</span></div>
              <div style={{ fontSize: 12, color: '#e9edef', marginTop: 2, wordBreak: 'break-word' }}>{m.text}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form className="cm-social-dm-input" onSubmit={(e) => { e.preventDefault(); if (input.trim()) { onSend(input.trim()); setInput(''); } }} style={{ padding: 10, borderTop: '1px solid #25313a', display: 'flex', gap: 7, background: '#111b21' }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Gruba mesaj yaz..." style={{ flex: 1, background: '#1f2c34', border: '1px solid #2a3942', color: '#e9edef', padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none' }} />
        <button type="submit" className="cm-social-msg-btn" style={{ background: '#00a884', color: '#fff', border: 'none', padding: '9px 14px', borderRadius: 10, fontWeight: 900, cursor: 'pointer' }}>&#10148;</button>
      </form>
    </div>
  );
});

export default GroupChat;
