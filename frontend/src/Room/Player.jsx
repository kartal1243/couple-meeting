import YouTube from 'react-youtube';
import { useCallback, useEffect, useRef, useState } from 'react';

function extractVideoId(src) {
  if (!src) return null;
  if (src.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(src)) return src;
  const m = src.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : src;
}

export default function Player({
  mediaType, mediaSrc, youtubeError, ytPlayerRef, mediaMeta,
  reactions, openYouTubeExternally, handleMediaEnd, handleYouTubeError,
  screenSharing, setScreenSharing, socket, mySocketId, hostUserId, userId
}) {
  const videoId = extractVideoId(mediaSrc);
  const screenVideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const [remoteScreen, setRemoteScreen] = useState(null);
  const pcRef = useRef(null);

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

  // Screen sharing via simple stream relay
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio: false });
      screenStreamRef.current = stream;
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
      }
      setScreenSharing(true);
      stream.getVideoTracks()[0].onended = () => stopScreenShare();
      if (socket) socket.emit('screen_share_start', { roomId: mediaMeta?.roomId });
    } catch {}
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
    setScreenSharing(false);
    if (socket) socket.emit('screen_share_stop', { roomId: mediaMeta?.roomId });
  };

  useEffect(() => {
    if (!socket) return;
    const onRemoteStart = () => setRemoteScreen(true);
    const onRemoteStop = () => setRemoteScreen(false);
    socket.on('screen_share_started', onRemoteStart);
    socket.on('screen_share_stopped', onRemoteStop);
    return () => { socket.off('screen_share_started', onRemoteStart); socket.off('screen_share_stopped', onRemoteStop); };
  }, [socket]);

  const showPlayer = mediaType !== 'none' && videoId && !youtubeError;
  const isHost = hostUserId === userId;

  return (
    <div className="cm-video-wrap" style={{
      flex: 1, position: 'relative', width: '100%', minHeight: 0,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      background: '#0b141a', overflow: 'hidden'
    }}>

      {mediaType === 'none' && !screenSharing && !remoteScreen && (
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

      {screenSharing && (
        <div style={{ position: 'absolute', inset: 0, background: '#000', zIndex: 20 }}>
          <video ref={screenVideoRef} autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          <button onClick={stopScreenShare} style={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(239,68,68,.9)', color: '#fff', border: 'none',
            padding: '8px 16px', borderRadius: 10, fontWeight: 800, fontSize: 12,
            cursor: 'pointer', zIndex: 21
          }}>⏹ Ekran Paylaşımını Durdur</button>
        </div>
      )}

      {remoteScreen && !screenSharing && (
        <div style={{ position: 'absolute', inset: 0, background: '#000', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🖥️</div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Bir kullanıcı ekranını paylaşıyor</div>
          </div>
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

      {/* Screen share button */}
      {isHost && !screenSharing && (
        <button onClick={startScreenShare} title="Ekran Paylaş"
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 15,
            background: 'rgba(37,99,235,.8)', color: '#fff', border: 'none',
            borderRadius: 10, padding: '7px 12px', fontSize: 11, fontWeight: 800,
            cursor: 'pointer', backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 12px rgba(37,99,235,.4)'
          }}>
          🖥️ Ekran Paylaş
        </button>
      )}
    </div>
  );
}
