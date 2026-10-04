import { useEffect, useRef, useState, useCallback, memo } from 'react';

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#22c55e,#16a34a)',
  'linear-gradient(135deg,#7c3aed,#ec4899)',
  'linear-gradient(135deg,#2563eb,#06b6d4)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#06b6d4,#22c55e)',
];

function VoiceChat({ socket, roomId, mySocketId, isMuted, setIsMuted, token }) {
  const [voiceActive, setVoiceActive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState([]);
  const [voiceError, setVoiceError] = useState('');
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const audioContainerRef = useRef(null);

  const startVoice = useCallback(async () => {
    setVoiceError('');
    setConnecting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false
      });
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
    } finally {
      setConnecting(false);
    }
  }, [socket, roomId, token]);

  const stopVoice = useCallback(() => {
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    Object.values(peersRef.current).forEach(pc => { try { pc.close(); } catch {} });
    peersRef.current = {};
    setVoiceActive(false);
    setVoiceUsers([]);
    if (audioContainerRef.current) audioContainerRef.current.innerHTML = '';
    if (socket) socket.emit('voice_leave', { roomId, token });
  }, [socket, roomId, token]);

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
    return () => { socket.off('voice_join', onJoin); socket.off('voice_leave', onLeave); socket.off('voice_users', onUsers); socket.off('voice_signal', onSignal); };
  }, [socket, mySocketId]);

  // Odadan çıkınca / component kapanınca mikrofonu temizle
  useEffect(() => {
    return () => {
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      Object.values(peersRef.current).forEach(pc => { try { pc.close(); } catch {} });
    };
  }, []);

  const visibleUsers = voiceUsers.slice(0, 5);
  const extraCount = Math.max(0, voiceUsers.length - visibleUsers.length);

  return (
    <>
      <div ref={audioContainerRef} style={{ display: 'none' }} />

      {voiceError && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(239,68,68,.95)', color: '#fff', padding: '10px 18px',
          borderRadius: 12, fontSize: 12, fontWeight: 700, zIndex: 9999,
          boxShadow: '0 8px 30px rgba(239,68,68,.4)', maxWidth: 350, textAlign: 'center'
        }}>⚠️ {voiceError}</div>
      )}

      {!voiceActive ? (
        <button onClick={startVoice} disabled={connecting} title="Sesli sohbeti başlat" style={{
          background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff',
          border: 'none', borderRadius: 12,
          padding: '10px 16px', fontSize: 13, fontWeight: 800, cursor: connecting ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
          boxShadow: '0 4px 15px rgba(34,197,94,.35)', minHeight: 38, opacity: connecting ? 0.75 : 1
        }}>
          <span style={{ fontSize: 15 }}>{connecting ? '⏳' : '🎤'}</span>
          {connecting ? 'Bağlanıyor…' : 'Sesli Katıl'}
        </button>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg,rgba(34,197,94,.16),rgba(22,163,74,.08))',
          border: '1px solid rgba(34,197,94,.35)', borderRadius: 12,
          padding: '5px 6px 5px 10px', minHeight: 38
        }}>
          {/* Katılımcılar */}
          <div style={{ display: 'flex', alignItems: 'center' }} title={`${voiceUsers.length} kişi seste`}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#22c55e',
              boxShadow: '0 0 8px rgba(34,197,94,.8)', marginRight: 7, flexShrink: 0,
              animation: 'cmVoiceLive 1.6s ease-in-out infinite'
            }} />
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {visibleUsers.map((u, i) => (
                <div key={u.socketId || i} title={`${u.username || 'Dinleyici'}${u.isMuted ? ' (sessiz)' : ''}`} style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: u.isMuted ? '#475569' : AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 900, color: '#fff',
                  border: '2px solid #0b141a', marginLeft: i === 0 ? 0 : -8,
                  opacity: u.isMuted ? 0.65 : 1, flexShrink: 0
                }}>
                  {u.isMuted ? '🔇' : (u.username?.charAt(0)?.toUpperCase() || '?')}
                </div>
              ))}
              {extraCount > 0 && (
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', background: '#1e293b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: '#94a3b8',
                  border: '2px solid #0b141a', marginLeft: -8, flexShrink: 0
                }}>+{extraCount}</div>
              )}
            </div>
            <span style={{ color: '#86efac', fontSize: 11, fontWeight: 800, marginLeft: 7, whiteSpace: 'nowrap' }}>
              {voiceUsers.length || 1}
            </span>
          </div>

          <div style={{ width: 1, height: 22, background: 'rgba(34,197,94,.25)', flexShrink: 0 }} />

          {/* Mikrofon aç/kapat */}
          <button onClick={toggleMute} title={isMuted ? 'Mikrofonu aç' : 'Mikrofonu kapat'} style={{
            background: isMuted ? 'rgba(239,68,68,.2)' : 'rgba(255,255,255,.08)',
            color: isMuted ? '#fca5a5' : '#fff',
            border: `1px solid ${isMuted ? 'rgba(239,68,68,.4)' : 'rgba(255,255,255,.12)'}`,
            borderRadius: 9, width: 32, height: 30, fontSize: 14,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>{isMuted ? '🔇' : '🎤'}</button>

          {/* Ayrıl */}
          <button onClick={stopVoice} title="Sesten ayrıl" style={{
            background: 'rgba(239,68,68,.9)', color: '#fff',
            border: 'none', borderRadius: 9, width: 32, height: 30, fontSize: 13, fontWeight: 800,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>✕</button>

          <style>{`
            @keyframes cmVoiceLive {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: .5; transform: scale(.8); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}

export default memo(VoiceChat);
