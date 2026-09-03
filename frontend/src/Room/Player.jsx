import YouTube from 'react-youtube';
import { useCallback, useEffect, useRef, useState } from 'react';

function extractVideoId(src) {
  if (!src) return null;
  if (src.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(src)) return src;
  const m = src.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : src;
}

export default function Player({
  mediaType, mediaSrc, youtubeError, ytPlayerRef, pendingSyncRef, mediaMeta,
  reactions, openYouTubeExternally, handleMediaEnd, handleYouTubeError,
  screenSharing, setScreenSharing, socket, mySocketId, hostUserId, userId
}) {
  const videoId = extractVideoId(mediaSrc);
  const screenVideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const remoteCanvasRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const [remoteScreen, setRemoteScreen] = useState(false);

  const ytOpts = {
    height: '100%', width: '100%',
    playerVars: { autoplay: 1, controls: 1, playsinline: 1, rel: 0, modestbranding: 1, enablejsapi: 1 }
  };

  const handleYTReady = useCallback((e) => {
    ytPlayerRef.current = e.target;
    if (pendingSyncRef.current) {
      try {
        const sync = pendingSyncRef.current;
        const elapsed = sync.isPlaying ? (Date.now() - (sync.lastUpdated || Date.now())) / 1000 : 0;
        const seekTo = (sync.time || 0) + elapsed;
        e.target.seekTo(seekTo, true);
        if (sync.isPlaying) e.target.playVideo(); else e.target.pauseVideo();
      } catch {}
      pendingSyncRef.current = null;
    }
  }, [ytPlayerRef, pendingSyncRef]);

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

  // Screen sharing - capture and relay frames via Socket.IO
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always', width: 1280, height: 720 }, audio: false });
      screenStreamRef.current = stream;
      setScreenSharing(true);
      if (socket) socket.emit('screen_share_start', { roomId: mediaMeta?.roomId });

      // Create hidden video + canvas for frame capture
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;
      video.style.display = 'none';
      document.body.appendChild(video);

      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        canvas.width = Math.min(video.videoWidth, 640);
        canvas.height = Math.min(video.videoHeight, 360);
      };

      // Send frames every 100ms
      frameIntervalRef.current = setInterval(() => {
        if (video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const data = canvas.toDataURL('image/jpeg', 0.5);
          if (socket) socket.emit('screen_share_frame', { roomId: mediaMeta?.roomId, frame: data });
        }
      }, 100);

      stream.getVideoTracks()[0].onended = () => stopScreenShare();
    } catch {}
  };

  const stopScreenShare = () => {
    if (frameIntervalRef.current) { clearInterval(frameIntervalRef.current); frameIntervalRef.current = null; }
    if (screenStreamRef.current) { screenStreamRef.current.getTracks().forEach(t => t.stop()); screenStreamRef.current = null; }
    setScreenSharing(false);
    if (socket) socket.emit('screen_share_stop', { roomId: mediaMeta?.roomId });
  };

  // Receive screen share frames
  useEffect(() => {
    if (!socket) return;
    const onStart = () => setRemoteScreen(true);
    const onStop = () => { setRemoteScreen(false); if (remoteCanvasRef.current) { const ctx = remoteCanvasRef.current.getContext('2d'); ctx.clearRect(0, 0, remoteCanvasRef.current.width, remoteCanvasRef.current.height); } };
    const onFrame = (data) => {
      if (!remoteCanvasRef.current) return;
      const img = new Image();
      img.onload = () => {
        const ctx = remoteCanvasRef.current.getContext('2d');
        ctx.drawImage(img, 0, 0, remoteCanvasRef.current.width, remoteCanvasRef.current.height);
      };
      img.src = data.frame;
    };
    socket.on('screen_share_started', onStart);
    socket.on('screen_share_stopped', onStop);
    socket.on('screen_share_frame', onFrame);
    return () => { socket.off('screen_share_started', onStart); socket.off('screen_share_stopped', onStop); socket.off('screen_share_frame', onFrame); };
  }, [socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const showPlayer = mediaType !== 'none' && mediaSrc && !youtubeError;
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

      {showPlayer && !screenSharing && !remoteScreen && (
        <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', overflow: 'hidden' }}>
          {mediaType === 'youtube' && (
            <YouTube videoId={videoId} opts={ytOpts}
              style={{ width: '100%', height: '100%', maxWidth: '100%', overflow: 'hidden' }}
              onReady={handleYTReady} onError={handleYouTubeError} onEnd={handleMediaEnd} />
          )}
          {mediaType === 'vimeo' && (
            <iframe
              src={`https://player.vimeo.com/video/${mediaSrc}?autoplay=1&title=0&byline=0&portrait=0`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title="Vimeo Player"
            />
          )}
          {mediaType === 'custom_video' && (
            <video
              src={mediaSrc}
              controls
              autoPlay
              style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
              onEnded={handleMediaEnd}
            />
          )}
          {mediaType === 'iframe' && (
            <iframe
              src={mediaSrc}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen"
              allowFullScreen
              title="Embedded Content"
            />
          )}
        </div>
      )}

      {screenSharing && (
        <div style={{ position: 'absolute', inset: 0, background: '#000', zIndex: 20 }}>
          <video ref={screenVideoRef} autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          <button onClick={stopScreenShare} style={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(239,68,68,.9)', color: '#fff', border: 'none',
            padding: '8px 16px', borderRadius: 10, fontWeight: 800, fontSize: 12,
            cursor: 'pointer', zIndex: 21, boxShadow: '0 4px 12px rgba(0,0,0,.4)'
          }}>⏹ Ekran Paylaşımını Durdur</button>
        </div>
      )}

      {remoteScreen && !screenSharing && (
        <div style={{ position: 'absolute', inset: 0, background: '#000', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <canvas ref={remoteCanvasRef} width={640} height={360} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(239,68,68,.9)', color: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'cmLivePulse 1.5s ease infinite' }} />
            CANLI EKRAN PAYLAŞIMI
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
          }}>▶ {mediaType === 'youtube' ? "YouTube'da Aç" : mediaType === 'vimeo' ? "Vimeo'da Aç" : "Dışarıda Aç"}</button>
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
