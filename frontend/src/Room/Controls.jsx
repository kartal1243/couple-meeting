import { useState, memo } from 'react';

function Controls({ currentTheme, handlePlay, handlePause, sendReaction, sendAction, playbackSpeed, setPlaybackSpeed, ytPlayerRef, voiceChat }) {
  const [hovered, setHovered] = useState(null);
  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
  const primary = currentTheme?.primary || '#00a884';

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    sendAction('SPEED', { speed });
    if (ytPlayerRef?.current) { try { ytPlayerRef.current.setPlaybackRate(speed); } catch {} }
  };

  return (
    <div className="cm-controls-wrap" style={{
      padding: '12px 16px',
      background: 'linear-gradient(180deg, rgba(15,23,42,.95), rgba(30,41,59,.95))',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,.06)'
    }}>
      {/* Row 1: Play/Pause + Voice */}
      <div className="cm-controls-row">
        <button
          className="cm-play-btn"
          onClick={handlePlay}
          style={{ background: `linear-gradient(135deg, ${primary}, ${primary}dd)`, boxShadow: '0 4px 15px rgba(0,0,0,.3)' }}
        >▶ Oynat</button>
        <button
          className="cm-play-btn"
          onClick={handlePause}
          style={{ background: 'linear-gradient(135deg, #f59e0b, #f59e0bdd)', boxShadow: '0 4px 15px rgba(0,0,0,.3)' }}
        >⏸ Durdur</button>
        {voiceChat && (
          <div style={{ flexShrink: 0 }}>{voiceChat}</div>
        )}
      </div>

      {/* Row 2: Emojis + Speed */}
      <div className="cm-controls-row-center">
        {['❤️', '🔥', '😂', '😮', '👏', '😍', '🎉', '💯'].map((emoji) => (
          <button
            key={emoji}
            className="cm-emoji-btn"
            onClick={() => sendReaction(emoji)}
            style={hovered === emoji ? { background: 'rgba(255,255,255,.1)', borderColor: 'rgba(255,255,255,.15)', transform: 'scale(1.2)' } : {}}
            onMouseEnter={() => setHovered(emoji)}
            onMouseLeave={() => setHovered(null)}
          >{emoji}</button>
        ))}

        <div className="cm-divider" />

        <span className="cm-speed-label">HIZ</span>
        {speeds.map((s) => (
          <button
            key={s}
            className="cm-speed-btn"
            onClick={() => handleSpeedChange(s)}
            style={playbackSpeed === s ? {
              background: `linear-gradient(135deg, ${primary}, ${primary}cc)`,
              borderColor: `${primary}88`, color: '#fff'
            } : hovered === 'speed_' + s ? { background: 'rgba(255,255,255,.08)' } : {}}
            onMouseEnter={() => setHovered('speed_' + s)}
            onMouseLeave={() => setHovered(null)}
          >{s}x</button>
        ))}
      </div>
    </div>
  );
}

export default memo(Controls);
