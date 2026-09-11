import { memo } from 'react';

const GlobalChatTab = memo(function GlobalChatTab({ globalMessages, globalChatInput, setGlobalChatInput, sendGlobalMessage, styles }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {globalMessages.map((m, i) => (
          <div key={m.id || i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, overflow: 'hidden', display: 'grid', placeItems: 'center', background: '#1a2634' }}>
              {m.avatar && m.avatar.startsWith('data:image') && m.avatar.length > 30 ? <img src={m.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 16 }}>{m.avatar || '🐱'}</span>}
            </div>
            <div style={{ background: '#111b21', padding: '8px 10px', borderRadius: 12, maxWidth: '80%', minWidth: 0 }}>
              <div style={{ fontSize: 11, color: '#53e6bc', fontWeight: 900 }}>{m.username || 'Misafir'} <span style={{ color: '#63727d', fontWeight: 600 }}>• {m.time || ''}</span></div>
              <div style={{ fontSize: 13, color: '#e9edef', marginTop: 3, wordBreak: 'break-word' }}>{m.text}</div>
            </div>
          </div>
        ))}
      </div>
      <form className="cm-social-msg-row" onSubmit={sendGlobalMessage} style={{ padding: 10, borderTop: '1px solid #25313a', display: 'flex', gap: 7, background: '#111b21' }}>
        <input className="cm-social-msg-input" value={globalChatInput} onChange={(e) => setGlobalChatInput(e.target.value)} placeholder="Global sohbete bir sey yaz..." style={{ ...styles.input, flex: 1 }} />
        <button type="submit" className="cm-social-msg-btn" style={{ ...styles.buttonPrimary, padding: '10px 14px' }}>&#10148;</button>
      </form>
    </div>
  );
});

export default GlobalChatTab;
