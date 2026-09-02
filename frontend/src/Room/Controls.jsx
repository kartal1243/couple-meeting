import { useState } from 'react';

export default function Controls({ currentTheme, handlePlay, handlePause, sendReaction, sendAction, playbackSpeed, setPlaybackSpeed, ytPlayerRef, voiceChat }) {
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
      <style>{`
        .cm-controls-wrap { display: flex; flex-direction: column; gap: 8px; }
        .cm-controls-row { display: flex; gap: 8px; align-items: center; }
        .cm-controls-row-center { display: flex; gap: 6px; align-items: center; justify-content: center; flex-wrap: wrap; }
        .cm-play-btn {
          flex: 1; min-width: 0; padding: 10px 0; border: none; border-radius: 12px;
          font-weight: 800; font-size: 13px; cursor: pointer; color: #fff;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          transition: all 0.2s ease;
        }
        .cm-play-btn:active { transform: scale(0.96); }
        .cm-emoji-btn {
          background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.06);
          font-size: 16px; padding: 5px 7px; border-radius: 8px; cursor: pointer;
          transition: all 0.2s ease; line-height: 1;
        }
        .cm-emoji-btn:active { transform: scale(1.2); }
        .cm-speed-label { color: #64748b; font-size: 10px; font-weight: 800; margin-right: 2px; white-space: nowrap; }
        .cm-speed-btn {
          background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06);
          color: #64748b; font-size: 11px; font-weight: 900; padding: 4px 6px;
          border-radius: 6px; cursor: pointer; transition: all 0.2s ease; line-height: 1;
        }
        .cm-speed-btn:active { transform: scale(1.1); }
        .cm-divider { width: 1px; height: 24px; background: rgba(255,255,255,.08); flex-shrink: 0; }
        @media (max-width: 480px) {
          .cm-controls-wrap { padding: 8px 10px !important; gap: 6px !important; }
          .cm-play-btn { padding: 9px 0 !important; font-size: 12px !important; border-radius: 10px !important; }
          .cm-emoji-btn { font-size: 14px !important; padding: 4px 5px !important; border-radius: 6px !important; }
          .cm-speed-btn { font-size: 10px !important; padding: 3px 5px !important; border-radius: 5px !important; }
          .cm-speed-label { display: none !important; }
          .cm-divider { height: 20px !important; }
        }
      `}</style>

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
