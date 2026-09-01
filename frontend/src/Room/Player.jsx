import YouTube from 'react-youtube';
import { useCallback, useEffect, useRef } from 'react';

function extractVideoId(src) {
  if (!src) return null;
  if (src.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(src)) return src;
  const m = src.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : src;
}

export default function Player({
  mediaType, mediaSrc, youtubeError, ytPlayerRef, mediaMeta,
  reactions, openYouTubeExternally, handleMediaEnd, handleYouTubeError
}) {
  const videoId = extractVideoId(mediaSrc);

  const ytOpts = {
    height: '100%', width: '100%',
    playerVars: { autoplay: 1, controls: 1, playsinline: 1, rel: 0, modestbranding: 1, enablejsapi: 1 }
  };

  const handleYTReady = useCallback((e) => {
    ytPlayerRef.current = e.target;
  }, [ytPlayerRef]);

  const endedRef = useRef(false);

  useEffect(() => {
    endedRef.current = false;
    if (!videoId || mediaType === 'none') return;
    const interval = setInterval(() => {
      const player = ytPlayerRef.current;
      if (!player || endedRef.current) return;
      try {
        const state = player.getPlayerState?.();
        if (state === 0) {
          endedRef.current = true;
          handleMediaEnd();
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [videoId, mediaType]);

  const showPlayer = mediaType !== 'none' && videoId && !youtubeError;

  return (
    <div className="cm-video-wrap" style={{
      flex: 1, position: 'relative', width: '100%', minHeight: 0,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      background: '#0b141a', overflow: 'hidden'
    }}>

      {mediaType === 'none' && (
        <div style={{ textAlign: 'center', color: '#8696a0' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎬</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Yukarıdan Şarkı veya Video Aratın!</div>
        </div>
      )}

      {showPlayer && (
        <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', overflow: 'hidden' }}>
          <YouTube videoId={videoId} opts={ytOpts}
            style={{ width: '100%', height: '100%', maxWidth: '100%', overflow: 'hidden' }}
            onReady={handleYTReady} onError={handleYouTubeError} onEnd={handleMediaEnd} />
        </div>
      )}

      {mediaType !== 'none' && youtubeError && (
        <div style={{
          width: 'min(760px, 92%)', padding: '28px', borderRadius: '24px',
          background: 'linear-gradient(145deg,#151b23,#0a0e14)',
          border: '1px solid rgba(255,255,255,.08)',
          boxShadow: '0 30px 80px rgba(0,0,0,.55)', textAlign: 'center'
        }}>
          <div style={{ fontSize: '46px', marginBottom: '12px' }}>⚠️</div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: '20px', marginBottom: '8px' }}>Bu video oynatılamıyor</div>
          <div style={{ color: '#9aa7b3', fontSize: '13px', lineHeight: 1.6, maxWidth: '620px', margin: '0 auto 18px' }}>{youtubeError.message}</div>
          <button onClick={openYouTubeExternally} style={{
            background: 'linear-gradient(135deg, #ff0033 0%, #cc0000 100%)',
            color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer'
          }}>▶ YouTube'da Aç</button>
        </div>
      )}

      {Array.isArray(reactions) && reactions.map((r) => (
        <div
          key={r.id}
          style={{
            position: 'absolute', bottom: 20, left: `${r.left}%`,
            fontSize: '36px', pointerEvents: 'none', zIndex: 100,
            animation: 'floatUp 2s ease-out forwards'
          }}
        >
          {r.emoji}
        </div>
      ))}
    </div>
  );
}
