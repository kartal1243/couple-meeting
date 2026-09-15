import { memo, useEffect, useRef, useState } from 'react';

const GlobalChatTab = memo(function GlobalChatTab({ globalMessages, globalChatInput, setGlobalChatInput, sendGlobalMessage, styles, authUser }) {
  const listRef = useRef(null);
  const [stickBottom, setStickBottom] = useState(true);
  const myName = authUser?.username || '';

  useEffect(() => {
    if (stickBottom && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [globalMessages, stickBottom]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    setStickBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  };

  const msgs = Array.isArray(globalMessages) ? globalMessages : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ padding: '8px 14px', borderBottom: '1px solid #25313a', display: 'flex', alignItems: 'center', gap: 8, color: '#7f8c98', fontSize: 11 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#25d366', boxShadow: '0 0 6px #25d366' }} />
        Global Sohbet • {msgs.length} mesaj
      </div>
      <div ref={listRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {msgs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#7f8c98', fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
            Henüz mesaj yok.<br />İlk selamı sen ver!
          </div>
        ) : msgs.map((m, i) => {
          const mine = myName && m.username === myName;
          return (
            <div key={m.id || i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', flexDirection: mine ? 'row-reverse' : 'row' }}>
              <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, overflow: 'hidden', display: 'grid', placeItems: 'center', background: '#1a2634' }}>
                {m.avatar && m.avatar.startsWith('data:image') && m.avatar.length > 30 ? <img src={m.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 16 }}>{m.avatar || '🐱'}</span>}
              </div>
              <div style={{ background: mine ? 'rgba(0,168,132,.15)' : '#111b21', border: mine ? '1px solid rgba(0,168,132,.25)' : '1px solid transparent', padding: '8px 10px', borderRadius: 12, maxWidth: '80%', minWidth: 0 }}>
                <div style={{ fontSize: 11, color: mine ? '#00a884' : '#53e6bc', fontWeight: 900 }}>{m.username || 'Misafir'} <span style={{ color: '#63727d', fontWeight: 600 }}>• {m.time || ''}</span></div>
                <div style={{ fontSize: 13, color: '#e9edef', marginTop: 3, wordBreak: 'break-word' }}>{m.text}</div>
              </div>
            </div>
          );
        })}
      </div>
      <form className="cm-social-msg-row" onSubmit={sendGlobalMessage} style={{ padding: 10, borderTop: '1px solid #25313a', display: 'flex', gap: 7, background: '#111b21' }}>
        <input className="cm-social-msg-input" value={globalChatInput} onChange={(e) => setGlobalChatInput(e.target.value)} placeholder="Global sohbete bir sey yaz..." maxLength={500} style={{ ...styles.input, flex: 1 }} />
        <button type="submit" className="cm-social-msg-btn" style={{ ...styles.buttonPrimary, padding: '10px 14px' }}>&#10148;</button>
      </form>
    </div>
  );
});

export default GlobalChatTab;
