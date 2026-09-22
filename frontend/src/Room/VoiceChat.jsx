import { useEffect, useRef, useState, useCallback, memo } from 'react';

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

function VoiceChat({ socket, roomId, mySocketId, isMuted, setIsMuted, token }) {
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState([]);
  const [voiceError, setVoiceError] = useState('');
  const [camActive, setCamActive] = useState(false);
  const [camUsers, setCamUsers] = useState([]);
  const [camError, setCamError] = useState('');
  const localStreamRef = useRef(null);
  const camStreamRef = useRef(null);
  const peersRef = useRef({});
  const camPeersRef = useRef({});
  const audioContainerRef = useRef(null);
  const camContainerRef = useRef(null);
  const localCamRef = useRef(null);

  const startCam = useCallback(async () => {
    setCamError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      camStreamRef.current = stream;
      if (localCamRef.current) { localCamRef.current.srcObject = stream; try { await localCamRef.current.play(); } catch {} }
      setCamActive(true);
      if (socket) socket.emit('camera_join', { roomId, token });
    } catch (err) {
      if (err.name === 'NotAllowedError') setCamError('Kamera izni reddedildi.');
      else if (err.name === 'NotFoundError') setCamError('Kamera bulunamadı.');
      else setCamError('Kamera erişimi başarısız.');
      setTimeout(() => setCamError(''), 5000);
    }
  }, [socket, roomId]);

  const stopCam = useCallback(() => {
    if (camStreamRef.current) { camStreamRef.current.getTracks().forEach(t => t.stop()); camStreamRef.current = null; }
    Object.values(camPeersRef.current).forEach(pc => { try { pc.close(); } catch {} });
    camPeersRef.current = {};
    setCamActive(false);
    setCamUsers([]);
    if (camContainerRef.current) camContainerRef.current.innerHTML = '';
    if (socket) socket.emit('camera_leave', { roomId, token });
  }, [socket, roomId]);

  const startVoice = useCallback(async () => {
    setVoiceError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setVoiceActive(true);
      if (socket) socket.emit('voice_join', { roomId, token });
    } catch (err) {
      console.error('Mikrofon erişimi reddedildi:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setVoiceError('Mikrofon izni reddedildi. Tarayıcı ayarlarından izin verin.');
      } else if (err.name === 'NotFoundError') {
        setVoiceError('Mikrofon bulunamadı. Cihazda mikrofon olduğundan emin olun.');
      } else if (err.name === 'NotReadableError') {
        setVoiceError('Mikrofon başka bir uygulama tarafından kullanılıyor.');
      } else {
        setVoiceError('Mikrofon erişimi başarısız. Lütfen tekrar deneyin.');
      }
      setTimeout(() => setVoiceError(''), 5000);
    }
  }, [socket, roomId]);

  const stopVoice = useCallback(() => {
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    Object.values(peersRef.current).forEach(pc => { try { pc.close(); } catch {} });
    peersRef.current = {};
    setVoiceActive(false);
    setVoiceUsers([]);
    if (audioContainerRef.current) audioContainerRef.current.innerHTML = '';
    if (socket) socket.emit('voice_leave', { roomId, token });
  }, [socket, roomId]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
        if (socket) socket.emit('voice_mute', { roomId, isMuted: track.enabled === false });
      }
    }
  }, [setIsMuted, socket, roomId]);

  useEffect(() => {
    if (!socket) return;
    const createPeer = (targetId, initiator) => {
      if (peersRef.current[targetId]) return peersRef.current[targetId];
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peersRef.current[targetId] = pc;
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
      pc.onicecandidate = (e) => { if (e.candidate) socket.emit('voice_signal', { targetId, signal: { type: 'ice-candidate', candidate: e.candidate } }); };
      pc.ontrack = (e) => {
        let el = document.getElementById(`v-${targetId}`);
        if (!el) { el = document.createElement('audio'); el.id = `v-${targetId}`; el.autoplay = true; el.style.display = 'none'; if (audioContainerRef.current) audioContainerRef.current.appendChild(el); }
        el.srcObject = e.streams[0];
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') { try { pc.close(); } catch {} delete peersRef.current[targetId]; document.getElementById(`v-${targetId}`)?.remove(); }
      };
      if (initiator) { pc.createOffer().then(o => { pc.setLocalDescription(o); socket.emit('voice_signal', { targetId, signal: o }); }).catch(() => {}); }
      return pc;
    };
    const onJoin = ({ socketId }) => { if (socketId !== mySocketId && localStreamRef.current) createPeer(socketId, true); };
    const onLeave = ({ socketId }) => { try { peersRef.current[socketId]?.close(); } catch {} delete peersRef.current[socketId]; document.getElementById(`v-${socketId}`)?.remove(); };
    const onUsers = ({ users }) => setVoiceUsers(users || []);
    const onSignal = async ({ fromId, signal }) => {
      if (!localStreamRef.current) return;
      if (signal.type === 'offer') {
        const pc = createPeer(fromId, false);
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const ans = await pc.createAnswer(); await pc.setLocalDescription(ans);
        socket.emit('voice_signal', { targetId: fromId, signal: ans });
      } else if (signal.type === 'answer' && peersRef.current[fromId]) {
        await peersRef.current[fromId].setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signal.type === 'ice-candidate' && peersRef.current[fromId] && signal.candidate) {
        await peersRef.current[fromId].addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    };
    socket.on('voice_join', onJoin);
    socket.on('voice_leave', onLeave);
    socket.on('voice_users', onUsers);
    socket.on('voice_signal', onSignal);
    return () => { socket.off('voice_join', onJoin); socket.off('voice_leave', onLeave); socket.off('voice_users', onUsers); socket.off('voice_signal', onSignal); stopVoice(); };
  }, [socket, mySocketId]);

  // Kamera WebRTC (video mesh)
  useEffect(() => {
    if (!socket) return;
    const createCamPeer = (targetId, initiator) => {
      if (camPeersRef.current[targetId]) return camPeersRef.current[targetId];
      const pc = new RTCPeerConnection(ICE_SERVERS);
      camPeersRef.current[targetId] = pc;
      if (camStreamRef.current) camStreamRef.current.getTracks().forEach(t => pc.addTrack(t, camStreamRef.current));
      pc.onicecandidate = (e) => { if (e.candidate) socket.emit('camera_signal', { targetId, signal: { type: 'ice-candidate', candidate: e.candidate } }); };
      pc.ontrack = (e) => {
        let el = document.getElementById(`c-${targetId}`);
        if (!el) {
          el = document.createElement('video');
          el.id = `c-${targetId}`;
          el.autoplay = true; el.playsInline = true; el.muted = true;
          el.style.cssText = 'width:140px;height:105px;border-radius:10px;object-fit:cover;background:#000;border:2px solid rgba(255,255,255,.15)';
          if (camContainerRef.current) camContainerRef.current.appendChild(el);
        }
        el.srcObject = e.streams[0];
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          try { pc.close(); } catch {}
          delete camPeersRef.current[targetId];
          document.getElementById(`c-${targetId}`)?.remove();
        }
      };
      if (initiator) pc.createOffer().then(o => { pc.setLocalDescription(o); socket.emit('camera_signal', { targetId, signal: o }); }).catch(() => {});
      return pc;
    };
    const onCamJoin = ({ socketId }) => { if (socketId !== mySocketId && camStreamRef.current) createCamPeer(socketId, true); };
    const onCamLeave = ({ socketId }) => {
      try { camPeersRef.current[socketId]?.close(); } catch {}
      delete camPeersRef.current[socketId];
      document.getElementById(`c-${socketId}`)?.remove();
    };
    const onCamUsers = ({ users }) => setCamUsers(users || []);
    const onCamSignal = async ({ fromId, signal }) => {
      if (!camStreamRef.current) return;
      if (signal.type === 'offer') {
        const pc = createCamPeer(fromId, false);
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const ans = await pc.createAnswer(); await pc.setLocalDescription(ans);
        socket.emit('camera_signal', { targetId: fromId, signal: ans });
      } else if (signal.type === 'answer' && camPeersRef.current[fromId]) {
        await camPeersRef.current[fromId].setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signal.type === 'ice-candidate' && camPeersRef.current[fromId] && signal.candidate) {
        await camPeersRef.current[fromId].addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    };
    socket.on('camera_join', onCamJoin);
    socket.on('camera_leave', onCamLeave);
    socket.on('camera_users', onCamUsers);
    socket.on('camera_signal', onCamSignal);
    return () => {
      socket.off('camera_join', onCamJoin);
      socket.off('camera_leave', onCamLeave);
      socket.off('camera_users', onCamUsers);
      socket.off('camera_signal', onCamSignal);
      stopCam();
    };
  }, [socket, mySocketId]);

  return (
    <>
      <div ref={audioContainerRef} style={{ display: 'none' }} />
      {camActive && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <video ref={localCamRef} autoPlay playsInline muted style={{
            width: 140, height: 105, borderRadius: 10, objectFit: 'cover',
            background: '#000', border: '2px solid rgba(59,130,246,.5)'
          }} />
        </div>
      )}
      <div ref={camContainerRef} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }} />

      {(voiceError || camError) && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(239,68,68,.95)', color: '#fff', padding: '10px 18px',
          borderRadius: 12, fontSize: 12, fontWeight: 700, zIndex: 9999,
          boxShadow: '0 8px 30px rgba(239,68,68,.4)', maxWidth: 350, textAlign: 'center'
        }}>⚠️ {voiceError || camError}</div>
      )}

      {/* Voice user indicators */}
      {voiceActive && voiceUsers.length > 0 && (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginRight: 6 }}>
          {voiceUsers.map((u, i) => (
            <div key={u.socketId || i} title={u.username} style={{
              width: 28, height: 28, borderRadius: '50%',
              background: `linear-gradient(135deg, ${u.isMuted ? '#475569' : '#22c55e'}, ${u.isMuted ? '#334155' : '#16a34a'})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 900, color: '#fff', border: '2px solid rgba(0,0,0,.4)',
              boxShadow: u.isMuted ? 'none' : '0 0 10px rgba(34,197,94,.5), 0 0 20px rgba(34,197,94,.2)',
              animation: u.isMuted ? 'none' : 'cmVoicePulse 2s ease infinite',
              flexShrink: 0
            }}>
              {u.username?.charAt(0)?.toUpperCase() || '?'}
            </div>
          ))}
          <style>{`
            @keyframes cmVoicePulse {
              0%, 100% { box-shadow: 0 0 8px rgba(34,197,94,.4); }
              50% { box-shadow: 0 0 16px rgba(34,197,94,.7), 0 0 24px rgba(34,197,94,.3); }
            }
          `}</style>
        </div>
      )}

      {/* Camera controls */}
      {!camActive ? (
        <button onClick={startCam} title="Kamera Aç" style={{
          background: 'rgba(37,99,235,.12)', color: '#60a5fa',
          border: '1px solid rgba(37,99,235,.2)', borderRadius: 10,
          padding: '8px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
          transition: 'all 0.2s', minHeight: 36
        }}>📹 Kamera</button>
      ) : (
        <button onClick={stopCam} title="Kamera Kapat" style={{
          background: 'rgba(239,68,68,.12)', color: '#ef4444',
          border: '1px solid rgba(239,68,68,.2)', borderRadius: 8,
          padding: '6px 8px', fontSize: 12, fontWeight: 800, cursor: 'pointer', lineHeight: 1
        }}>📹✕</button>
      )}

      {/* Voice controls */}
      {!voiceActive ? (
        <button onClick={startVoice} title="Sesli Sohbet" style={{
          background: 'rgba(34,197,94,.12)', color: '#22c55e',
          border: '1px solid rgba(34,197,94,.2)', borderRadius: 10,
          padding: '8px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
          transition: 'all 0.2s', minHeight: 36
        }}>🎤 Ses</button>
      ) : (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button onClick={toggleMute} style={{
            background: isMuted ? 'rgba(239,68,68,.15)' : 'rgba(34,197,94,.15)',
            color: isMuted ? '#ef4444' : '#22c55e',
            border: `1px solid ${isMuted ? 'rgba(239,68,68,.3)' : 'rgba(34,197,94,.3)'}`,
            borderRadius: 8, padding: '6px 8px', fontSize: 12, fontWeight: 800,
            cursor: 'pointer', transition: 'all 0.2s', lineHeight: 1
          }}>{isMuted ? '🔇' : '🎤'}</button>
          <button onClick={stopVoice} style={{
            background: 'rgba(239,68,68,.12)', color: '#ef4444',
            border: '1px solid rgba(239,68,68,.2)', borderRadius: 8,
            padding: '6px 8px', fontSize: 12, fontWeight: 800, cursor: 'pointer', lineHeight: 1
          }}>✕</button>
        </div>
      )}
    </>
  );
}

export default memo(VoiceChat);
