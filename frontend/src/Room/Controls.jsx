export default function Controls({ currentTheme, handlePlay, handlePause, sendReaction }) {
  return (
    <div
      className="cm-controls"
      style={{
        padding: '14px 24px', background: currentTheme.cardBg,
        borderTop: '1px solid #222d34', display: 'flex', gap: '14px', alignItems: 'center'
      }}
    >
      <button
        onClick={handlePlay}
        style={{
          background: `linear-gradient(135deg, ${currentTheme.primary} 0%, #008f6f 100%)`,
          color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '12px',
          fontWeight: '700', cursor: 'pointer', boxShadow: '0 6px 18px rgba(0,0,0,0.35)', flex: 1
        }}
      >
        ▶ Ortak Oynat
      </button>
      <button
        onClick={handlePause}
        style={{
          background: '#ffa502', color: '#fff', border: 'none', padding: '10px 16px',
          borderRadius: '12px', fontWeight: '700', cursor: 'pointer', flex: 1
        }}
      >
        ⏸ Ortak Durdur
      </button>
      <div className="cm-reactions" style={{ display: 'flex', gap: '6px' }}>
        {['❤️', '🔥', '😂', '😮', '👏', '😍'].map((emoji) => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            style={{
              background: '#202c33', border: '1px solid #222d34',
              fontSize: '20px', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer'
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
