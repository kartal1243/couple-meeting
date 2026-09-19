import YouTube from 'react-youtube';
import { useCallback, useEffect, useRef, useState, memo } from 'react';

// WebRTC STUN sunucuları (NAT arkasındaki kullanıcılar için)
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

function extractVideoId(src) {
  if (!src) return null;
  if (src.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(src)) return src;
  const m = src.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : src;
}

function Player({
  mediaType, mediaSrc, youtubeError, ytPlayerRef, pendingSyncRef, mediaMeta,
  reactions, openYouTubeExternally, handleMediaEnd, handleYouTubeError,
  screenSharing, setScreenSharing, socket, mySocketId, hostUserId, userId, token, authUser, username
}) {
  const videoId = extractVideoId(mediaSrc);

  // ── EKRAN PAYLAŞIMI REFS (WebRTC) ─
  const screenVideoRef = useRef(null);         // Yerel önizleme (paylaşan taraf)
  const remoteScreenVideoRef = useRef(null);   // Uzak yayın (izleyen taraf)
  const screenStreamRef = useRef(null);        // Yerel display MediaStream
  const screenPeersRef = useRef({});           // Paylaşan: targetId -> RTCPeerConnection
  const viewerPeerRef = useRef(null);          // İzleyen: RTCPeerConnection
  const sharerIdRef = useRef(null);            // İzleyen: paylaşanın socket id'si
  const pendingCandidatesRef = useRef({});     // Geç gelen ICE adayları için tampon
  const pendingRemoteStreamRef = useRef(null); // Video elementi mount olmadan gelen akış
  const stopScreenShareRef = useRef(null);

  const [remoteScreen, setRemoteScreen] = useState(false);
  const [remoteScreenName, setRemoteScreenName] = useState('');
  const [screenShareError, setScreenShareError] = useState('');

  // Paylaşım yapılan oda id'si (stabil bağımlılık için)
  const shareRoomId = mediaMeta?.roomId;

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

  // ═══ EKRAN PAYLAŞIMI (WebRTC) — Socket.IO sadece sinyal taşır ═══

  // İzleyen taraf temizliği
  const cleanupViewer = useCallback(() => {
    if (viewerPeerRef.current) { try { viewerPeerRef.current.close(); } catch {} viewerPeerRef.current = null; }
    if (remoteScreenVideoRef.current) remoteScreenVideoRef.current.srcObject = null;
    sharerIdRef.current = null;
    setRemoteScreen(false);
    setRemoteScreenName('');
  }, []);

  // Paylaşımı durdur
  const stopScreenShare = useCallback(() => {
    const wasSharing = !!screenStreamRef.current;
    if (wasSharing && socket) socket.emit('screen_share_stop', { roomId: shareRoomId });
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    Object.values(screenPeersRef.current).forEach(pc => { try { pc.close(); } catch {} });
    screenPeersRef.current = {};
    pendingCandidatesRef.current = {};
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
    setScreenSharing(false);
  }, [socket, shareRoomId, setScreenSharing]);
  useEffect(() => { stopScreenShareRef.current = stopScreenShare; }, [stopScreenShare]);

  // Paylaşımı başlat (getDisplayMedia)
  const startScreenShare = useCallback(async () => {
    setScreenShareError('');
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setScreenShareError('Tarayıcınız ekran paylaşımını desteklemiyor.');
      setTimeout(() => setScreenShareError(''), 5000);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30, max: 30 } },
        audio: true
      });
      screenStreamRef.current = stream;
      if (screenVideoRef.current) screenVideoRef.current.srcObject = stream;
      setScreenSharing(true);
      socket?.emit('screen_share_start', { roomId: shareRoomId, token });

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) videoTrack.onended = () => stopScreenShareRef.current?.();
    } catch (err) {
      console.error('Ekran paylaşımı hatası:', err);
      let msg = 'Ekran paylaşımı başarısız.';
      if (err?.name === 'NotAllowedError') msg = 'Ekran paylaşımı izni reddedildi.';
      else if (err?.name === 'NotFoundError') msg = 'Paylaşılacak ekran bulunamadı.';
      else if (err?.name === 'NotReadableError') msg = 'Ekran kaynağı kullanılamıyor.';
      setScreenShareError(msg);
      setTimeout(() => setScreenShareError(''), 5000);
    }
  }, [socket, shareRoomId, token, setScreenSharing]);

  // ── TEK SOCKET DİNLEYİCİSİ: WebRTC sinyalleşmesi ─
  useEffect(() => {
    if (!socket) return;

    // Geç gelen ICE adaylarını uygula
    const flushCandidates = async (pc, key) => {
      const list = pendingCandidatesRef.current[key];
      if (!list || list.length === 0) return;
      delete pendingCandidatesRef.current[key];
      for (const c of list) {
        try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
      }
    };

    // Paylaşan taraf: yeni izleyiciye offer üret
    const offerToPeer = async (targetId) => {
      const stream = screenStreamRef.current;
      if (!stream || !targetId) return;
      const old = screenPeersRef.current[targetId];
      if (old) { try { old.close(); } catch {} }
      const pc = new RTCPeerConnection(ICE_SERVERS);
      screenPeersRef.current[targetId] = pc;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('screen_signal', { targetId, signal: { type: 'ice-candidate', candidate: e.candidate } });
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          try { pc.close(); } catch {}
          delete screenPeersRef.current[targetId];
        }
      };
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('screen_signal', { targetId, signal: offer });
      } catch {}
    };

    const onSignal = async ({ fromId, signal } = {}) => {
      if (!signal || !fromId) return;

      // ── BEN PAYLAŞIYORUM (offerer) ──
      if (screenStreamRef.current) {
        if (signal.type === 'screen-request') { offerToPeer(fromId); return; }
        const pc = screenPeersRef.current[fromId];
        if (!pc) return;
        if (signal.type === 'answer') {
          try { await pc.setRemoteDescription(new RTCSessionDescription(signal)); await flushCandidates(pc, fromId); } catch {}
        } else if (signal.type === 'ice-candidate' && signal.candidate) {
          if (pc.remoteDescription) { try { await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)); } catch {} }
          else { (pendingCandidatesRef.current[fromId] ||= []).push(signal.candidate); }
        }
        return;
      }

      // ── BEN İZLİYORUM (answerer) ──
      const key = 'viewer:' + fromId;
      if (signal.type === 'offer') {
        if (viewerPeerRef.current) { try { viewerPeerRef.current.close(); } catch {} }
        const pc = new RTCPeerConnection(ICE_SERVERS);
        viewerPeerRef.current = pc;
        sharerIdRef.current = fromId;
        pc.onicecandidate = (e) => {
          if (e.candidate) socket.emit('screen_signal', { targetId: fromId, signal: { type: 'ice-candidate', candidate: e.candidate } });
        };
        pc.ontrack = (e) => {
          if (remoteScreenVideoRef.current && e.streams?.[0]) {
            remoteScreenVideoRef.current.srcObject = e.streams[0];
          }
        };
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          await flushCandidates(pc, key);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('screen_signal', { targetId: fromId, signal: answer });
        } catch {}
        setRemoteScreen(true);
      } else if (signal.type === 'ice-candidate' && signal.candidate) {
        const pc = viewerPeerRef.current;
        if (!pc) return;
        if (pc.remoteDescription) { try { await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)); } catch {} }
        else { (pendingCandidatesRef.current[key] ||= []).push(signal.candidate); }
      }
    };

    // Biri paylaşmaya başladı → akış iste
    const onStarted = ({ socketId, username: sharerName } = {}) => {
      if (!socketId || socketId === mySocketId) return;
      setRemoteScreenName(sharerName || '');
      sharerIdRef.current = socketId;
      setRemoteScreen(true);
      socket.emit('screen_signal', { targetId: socketId, signal: { type: 'screen-request' } });
    };

    const onStopped = ({ socketId } = {}) => {
      if (!socketId || socketId === sharerIdRef.current) cleanupViewer();
    };

    socket.on('screen_signal', onSignal);
    socket.on('screen_share_started', onStarted);
    socket.on('screen_share_stopped', onStopped);
    return () => {
      socket.off('screen_signal', onSignal);
      socket.off('screen_share_started', onStarted);
      socket.off('screen_share_stopped', onStopped);
    };
  }, [socket, mySocketId, cleanupViewer]);

  // Ayrılırken temizlik
  useEffect(() => {
    return () => {
      stopScreenShareRef.current?.();
      if (viewerPeerRef.current) { try { viewerPeerRef.current.close(); } catch {} }
      viewerPeerRef.current = null;
    };
  }, []);

  const showPlayer = mediaType !== 'none' && mediaSrc && !youtubeError;
  const isHost = hostUserId === (authUser?.username || username);

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
          <video ref={screenVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(37,99,235,.9)', color: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', animation: 'cmLivePulse 1.5s ease infinite' }} />
            EKRANINI PAYLAŞIYORSUN
          </div>
          <button onClick={stopScreenShare} style={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(239,68,68,.9)', color: '#fff', border: 'none',
            padding: '10px 18px', borderRadius: 10, fontWeight: 800, fontSize: 12,
            cursor: 'pointer', zIndex: 21, boxShadow: '0 4px 12px rgba(0,0,0,.4)'
          }}>⏹ Paylaşımı Durdur</button>
        </div>
      )}

      {remoteScreen && !screenSharing && (
        <div style={{ position: 'absolute', inset: 0, background: '#000', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <video
            ref={remoteScreenVideoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
          />
          <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(239,68,68,.9)', color: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'cmLivePulse 1.5s ease infinite' }} />
            CANLI EKRAN PAYLAŞIMI{remoteScreenName ? ` · ${remoteScreenName}` : ''}
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

      {/* Ekran Paylaş Butonu */}
      {!screenSharing && !remoteScreen && (
        <button onClick={startScreenShare} title="Ekranını odadaki herkesle paylaş"
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 15,
            background: 'linear-gradient(135deg, rgba(37,99,235,.9), rgba(59,130,246,.9))',
            color: '#fff', border: 'none',
            borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 800,
            cursor: 'pointer', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', gap: 5,
            boxShadow: '0 4px 12px rgba(37,99,235,.4)'
          }}>
          🖥️ {isHost ? 'Ekran Paylaş' : 'Ekranımı Paylaş'}
        </button>
      )}
      {/* İzleyici göstergesi */}
      {remoteScreen && !screenSharing && (
        <button onClick={cleanupViewer} title="İzlemeyi bırak"
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 25,
            background: 'rgba(239,68,68,.85)', color: '#fff', border: 'none',
            borderRadius: 10, padding: '7px 12px', fontSize: 11, fontWeight: 800,
            cursor: 'pointer', backdropFilter: 'blur(8px)'
          }}>
          ✕ İzlemeyi Bırak
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
