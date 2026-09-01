import { useState } from 'react';

export default function Controls({ currentTheme, handlePlay, handlePause, sendReaction }) {
  const [hovered, setHovered] = useState(null);

  const btnBase = (color, hoverColor) => ({
    background: hovered === color ? hoverColor : `linear-gradient(135deg, ${color}, ${color}dd)`,
    color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 12,
    fontWeight: 800, fontSize: 13, cursor: 'pointer', flex: 1,
    boxShadow: hovered === color ? `0 8px 25px ${color}44` : '0 4px 15px rgba(0,0,0,.3)',
    transition: 'all 0.25s ease', transform: hovered === color ? 'translateY(-1px)' : 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
  });

  return (
    <div style={{
      padding: '12px 20px',
      background: 'linear-gradient(180deg, rgba(15,23,42,.95), rgba(30,41,59,.95))',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,.06)',
      display: 'flex', gap: 10, alignItems: 'center'
    }}>
      <button
        onClick={handlePlay}
        onMouseEnter={() => setHovered('green')}
        onMouseLeave={() => setHovered(null)}
        style={btnBase('#00a884', '#00c99b')}
      >
        ▶ Oynat
      </button>
      <button
        onClick={handlePause}
        onMouseEnter={() => setHovered('orange')}
        onMouseLeave={() => setHovered(null)}
        style={btnBase('#f59e0b', '#fbbf24')}
      >
        ⏸ Durdur
      </button>

      <div style={{
        width: 1, height: 28, background: 'rgba(255,255,255,.08)', margin: '0 4px'
      }} />

      <div style={{ display: 'flex', gap: 4 }}>
        {['❤️', '🔥', '😂', '😮', '👏', '😍', '🎉', '💯'].map((emoji) => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            onMouseEnter={() => setHovered(emoji)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: hovered === emoji ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.04)',
              border: hovered === emoji ? '1px solid rgba(255,255,255,.15)' : '1px solid rgba(255,255,255,.06)',
              fontSize: 18, padding: '6px 10px', borderRadius: 10, cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: hovered === emoji ? 'scale(1.2)' : 'scale(1)'
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
