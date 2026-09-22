import YouTube from 'react-youtube';
import { useCallback, useEffect, useRef, useState, memo } from 'react';

function extractVideoId(src) {
  if (!src) return null;
  if (src.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(src)) return src;
  const m = src.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : src;
}

function Player({
  mediaType, mediaSrc, youtubeError, ytPlayerRef, pendingSyncRef, mediaMeta,
  reactions, openYouTubeExternally, handleMediaEnd, handleYouTubeError,
  screenSharing, setScreenSharing, socket, mySocketId, hostUserId, userId, token, authUser, username, currentRoomType
}) {
  const playType = mediaType === 'music' ? 'youtube' : mediaType;
  const videoId = extractVideoId(mediaSrc);
  const screenVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const remoteCanvasRef = useRef(null);
  const [remoteScreen, setRemoteScreen] = useState(false);
  const [screenShareError, setScreenShareError] = useState('');

  const ytOpts = {
    height: '100%', width: '100%',
    host: 'https://www.youtube-nocookie.com',
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

  // WebRTC screen share (P2P) — socket only for signaling
  const screenPcRef = useRef(null);
  const remotePeersRef = useRef({});
  const localStreamRef = useRef(null);
  const [rtcReady, setRtcReady] = useState(false);

  const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always', width: 1280, height: 720 }, audio: false });
      localStreamRef.current = stream;
      screenStreamRef.current = stream;
      setScreenSharing(true);
      const roomId = mediaMeta?.roomId;
      if (socket) socket.emit('screen_share_start', { roomId, token });
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
        try { await screenVideoRef.current.play(); } catch {}
      }
      stream.getVideoTracks()[0].onended = () => stopScreenShare();
    } catch (err) {
      let msg = 'Ekran paylaşımı başarısız.';
      if (err.name === 'NotAllowedError') msg = 'Ekran paylaşımı izni reddedildi.';
      else if (err.name === 'NotFoundError') msg = 'Paylaşılacak ekran bulunamadı.';
      setScreenShareError(msg);
      setTimeout(() => setScreenShareError(''), 5000);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) { screenStreamRef.current.getTracks().forEach(t => t.stop()); screenStreamRef.current = null; }
    Object.values(remotePeersRef.current).forEach(pc => { try { pc.close(); } catch {} });
    remotePeersRef.current = {};
    if (screenPcRef.current) { try { screenPcRef.current.close(); } catch {} screenPcRef.current = null; }
    setScreenSharing(false);
    setRtcReady(false);
    if (socket) socket.emit('screen_share_stop', { roomId: mediaMeta?.roomId });
  };

  // Signaling: create/receive offers for screen share
  useEffect(() => {
    if (!socket) return;
    const onSignal = async ({ fromId, signal }) => {
      try {
        if (signal.type === 'offer') {
          let pc = remotePeersRef.current[fromId];
          if (!pc) { pc = new RTCPeerConnection(ICE); remotePeersRef.current[fromId] = pc; }
          pc.ontrack = (e) => {
            if (remoteVideoRef.current) { remoteVideoRef.current.srcObject = e.streams[0]; remoteVideoRef.current.play().catch(() => {}); }
          };
          pc.onicecandidate = (e) => { if (e.candidate) socket.emit('screen_signal', { targetId: fromId, signal: { type: 'ice-candidate', candidate: e.candidate } }); };
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const ans = await pc.createAnswer();
          await pc.setLocalDescription(ans);
          socket.emit('screen_signal', { targetId: fromId, signal: ans });
        } else if (signal.type === 'answer' && screenPcRef.current) {
          await screenPcRef.current.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.type === 'ice-candidate') {
          const pc = remotePeersRef.current[fromId] || screenPcRef.current;
          if (pc && signal.candidate) await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch {}
    };
    const onStarted = async ({ socketId }) => {
      setRemoteScreen(true);
      if (!localStreamRef.current || !socketId) return;
      const pc = new RTCPeerConnection(ICE);
      screenPcRef.current = pc;
      localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
      pc.onicecandidate = (e) => { if (e.candidate) socket.emit('screen_signal', { targetId: socketId, signal: { type: 'ice-candidate', candidate: e.candidate } }); };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('screen_signal', { targetId: socketId, signal: offer });
      setRtcReady(true);
    };
    const onStop = () => { setRemoteScreen(false); setRtcReady(false); };
    socket.on('screen_signal', onSignal);
    socket.on('screen_share_started', onStarted);
    socket.on('screen_share_stopped', onStop);
    return () => {
      socket.off('screen_signal', onSignal);
      socket.off('screen_share_started', onStarted);
      socket.off('screen_share_stopped', onStop);
    };
  }, [socket, mediaMeta?.roomId, token]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(t => t.stop());
      if (screenPcRef.current) { try { screenPcRef.current.close(); } catch {} }
      Object.values(remotePeersRef.current).forEach(pc => { try { pc.close(); } catch {} });
    };
  }, []);

  const showPlayer = mediaType !== 'none' && mediaSrc && !youtubeError;
  const isHost = hostUserId === authUser?.username || (userId && hostUserId === userId) || (username && hostUserId === username);

  return (
    <div className="cm-video-wrap" style={{
      flex: 1, position: 'relative', width: '100%', minHeight: 0,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      background: '#0b141a', overflow: 'hidden'
    }}>

      {mediaType === 'none' && !screenSharing && !remoteScreen && (
        <div style={{ textAlign: 'center', color: '#8696a0' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>{currentRoomType === 'music' ? '🎵' : '🎬'}</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {currentRoomType === 'music' ? 'Yukarıdan şarkı arayın ve seçin!' : 'Yukarıdan Şarkı veya Video Aratın!'}
          </div>
        </div>
      )}

      {showPlayer && !screenSharing && !remoteScreen && (
        <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', overflow: 'hidden' }}>
          {playType === 'youtube' && (
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
          {mediaType === 'iframe' && /^https:\/\//i.test(mediaSrc || '') && (
            <iframe
              src={mediaSrc}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen"
              allowFullScreen
              sandbox="allow-scripts allow-presentation"
              referrerPolicy="no-referrer"
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
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(239,68,68,.9)', color: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'cmLivePulse 1.5s ease infinite' }} />
            CANLI EKRAN PAYLAŞIMI {rtcReady ? '(P2P)' : '...'}
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

      {/* Ekran paylaşımı - WebRTC P2P */}
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
      {screenShareError && (
        <div style={{
          position: 'absolute', top: 50, right: 12, zIndex: 15,
          background: 'rgba(239,68,68,.95)', color: '#fff', padding: '8px 14px',
          borderRadius: 10, fontSize: 11, fontWeight: 700, maxWidth: 280,
          boxShadow: '0 4px 15px rgba(239,68,68,.4)'
        }}>⚠️ {screenShareError}</div>
      )}
    </div>
  );
}

export default memo(Player);
