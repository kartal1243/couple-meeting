import { useState } from 'react';

export default function Controls({ currentTheme, handlePlay, handlePause, sendReaction, sendAction, playbackSpeed, setPlaybackSpeed }) {
  const [hovered, setHovered] = useState(null);
  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
  const primary = currentTheme?.primary || '#00a884';

  const btnBase = (color, hoverColor) => ({
    background: hovered === color ? hoverColor : `linear-gradient(135deg, ${color}, ${color}dd)`,
    color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 12,
    fontWeight: 800, fontSize: 13, cursor: 'pointer', flex: 1,
    boxShadow: hovered === color ? `0 8px 25px ${color}44` : '0 4px 15px rgba(0,0,0,.3)',
    transition: 'all 0.25s ease', transform: hovered === color ? 'translateY(-1px)' : 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
  });

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    sendAction('SPEED', { speed });
  };

  return (
    <div style={{
      padding: '12px 20px',
      background: 'linear-gradient(180deg, rgba(15,23,42,.95), rgba(30,41,59,.95))',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,.06)',
      display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap'
    }}>
      <style>{`
        @media (max-width: 600px) {
          .cm-controls-wrap { padding: 8px 10px !important; gap: 6px !important; }
          .cm-controls-wrap button { padding: 7px 12px !important; font-size: 11px !important; }
          .cm-speed-btn { padding: 3px 5px !important; font-size: 9px !important; }
          .cm-speed-label { display: none !important; }
        }
      `}</style>
      <button
        onClick={handlePlay}
        onMouseEnter={() => setHovered('green')}
        onMouseLeave={() => setHovered(null)}
        style={btnBase(primary, `${primary}dd`)}
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

      <div style={{
        width: 1, height: 28, background: 'rgba(255,255,255,.08)', margin: '0 4px'
      }} />

      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        <span className="cm-speed-label" style={{ color: '#64748b', fontSize: 11, fontWeight: 800, marginRight: 4 }}>HIZ</span>
        {speeds.map((s) => (
          <button
            key={s}
            className="cm-speed-btn"
            onClick={() => handleSpeedChange(s)}
            onMouseEnter={() => setHovered('speed_' + s)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: playbackSpeed === s
                ? `linear-gradient(135deg, ${primary}, ${primary}cc)`
                : hovered === 'speed_' + s ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.03)',
              border: playbackSpeed === s
                ? `1px solid ${primary}88`
                : '1px solid rgba(255,255,255,.06)',
              color: playbackSpeed === s ? '#fff' : '#64748b',
              fontSize: 11, fontWeight: 900, padding: '5px 8px', borderRadius: 8,
              cursor: 'pointer', transition: 'all 0.2s ease',
              transform: hovered === 'speed_' + s ? 'scale(1.1)' : 'scale(1)'
            }}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
