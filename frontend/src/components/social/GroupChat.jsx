import { useState, useEffect, useRef, memo } from 'react';

const GroupChat = memo(function GroupChat({ group, messages, input, setInput, onSend, onBack, authUser }) {
  const endRef = useRef(null);
  const [replyTo, setReplyTo] = useState(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  if (!group) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#7f8c98', fontSize: 13 }}>Bir grup seçin</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div className="cm-social-dm-header" style={{ padding: '10px 14px', borderBottom: '1px solid #25313a', display: 'flex', alignItems: 'center', gap: 10, background: '#111b21' }}>
        <button onClick={() => { setReplyTo(null); onBack(); }} style={{ background: 'none', border: 'none', color: '#53e6bc', cursor: 'pointer', fontSize: 18, fontWeight: 900, padding: '4px 6px' }}>&larr;</button>
        <div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>{group.name}</div>
          <div style={{ color: '#7f8c98', fontSize: 10 }}>{group.members?.length || 0} uye</div>
        </div>
      </div>
      <div className="cm-social-dm-msgs" style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && <div style={{ color: '#7f8c98', textAlign: 'center', fontSize: 12, padding: 20 }}>Henuz mesaj yok.</div>}
        {messages.map((m, i) => {
          const isMe = m.from === authUser?.username;
          return (
            <div key={m.id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: 8 }}>
              {!isMe && <div style={{ fontSize: 18, flexShrink: 0 }}>{m.fromAvatar || '🐱'}</div>}
              <div style={{ background: isMe ? '#005c4b' : '#1f2c34', padding: '7px 10px', borderRadius: 12, maxWidth: '75%', borderBottomRightRadius: isMe ? 4 : 12, borderBottomLeftRadius: isMe ? 12 : 4, position: 'relative' }}>
                {m.replyTo && (
                  <div style={{ background: 'rgba(255,255,255,.06)', borderLeft: '3px solid #53e6bc', padding: '4px 8px', borderRadius: 6, marginBottom: 6, fontSize: 10, color: '#94a3b8' }}>
                    <span style={{ color: '#53e6bc', fontWeight: 800 }}>{m.replyTo.sender}</span><br/>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 200 }}>{m.replyTo.text}</span>
                  </div>
                )}
                {!isMe && <div style={{ fontSize: 10, color: '#53e6bc', fontWeight: 900 }}>{m.from}</div>}
                <div style={{ fontSize: 12, color: '#e9edef', marginTop: isMe ? 0 : 2, wordBreak: 'break-word' }}>{m.text}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                  <div style={{ fontSize: 9, color: '#667781' }}>{m.time}</div>
                  <button onClick={() => setReplyTo({ id: m.id, sender: m.from, text: m.text })} style={{ background: 'none', border: 'none', color: '#667781', cursor: 'pointer', fontSize: 10, padding: '0 4px' }} title="Yanıtla">↩</button>
                </div>
              </div>
              {isMe && <div style={{ fontSize: 18, flexShrink: 0 }}>{m.fromAvatar || '🐱'}</div>}
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

      <form className="cm-social-dm-input" onSubmit={(e) => { e.preventDefault(); if (input.trim()) { onSend(input.trim(), replyTo); setInput(''); setReplyTo(null); } }} style={{ padding: 10, borderTop: replyTo ? 'none' : '1px solid #25313a', display: 'flex', gap: 7, background: '#111b21' }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={replyTo ? 'Yanıt yaz...' : 'Gruba mesaj yaz...'} style={{ flex: 1, background: '#1f2c34', border: '1px solid #2a3942', color: '#e9edef', padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none' }} />
        <button type="submit" className="cm-social-msg-btn" style={{ background: '#00a884', color: '#fff', border: 'none', padding: '9px 14px', borderRadius: 10, fontWeight: 900, cursor: 'pointer' }}>&#10148;</button>
      </form>
    </div>
  );
});

export default GroupChat;
