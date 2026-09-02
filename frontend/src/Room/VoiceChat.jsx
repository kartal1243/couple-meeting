import { useEffect, useRef, useState, useCallback } from 'react';

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

export default function VoiceChat({ socket, roomId, mySocketId, isMuted, setIsMuted }) {
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceCount, setVoiceCount] = useState(0);
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const audioContainerRef = useRef(null);

  const startVoice = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setVoiceActive(true);
      if (socket) socket.emit('voice_join', { roomId });
    } catch (err) { console.error('Mikrofon erişimi reddedildi:', err); }
  }, [socket, roomId]);

  const stopVoice = useCallback(() => {
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    Object.values(peersRef.current).forEach(pc => { try { pc.close(); } catch {} });
    peersRef.current = {};
    setVoiceActive(false);
    setVoiceCount(0);
    if (audioContainerRef.current) audioContainerRef.current.innerHTML = '';
    if (socket) socket.emit('voice_leave', { roomId });
  }, [socket, roomId]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled); }
    }
  }, [setIsMuted]);

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
    const onUsers = ({ users }) => setVoiceCount((users || []).length);
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

  return (
    <>
      <div ref={audioContainerRef} style={{ display: 'none' }} />
      {!voiceActive ? (
        <button onClick={startVoice} title="Sesli Sohbet" style={{
          background: 'rgba(34,197,94,.12)', color: '#22c55e',
          border: '1px solid rgba(34,197,94,.2)', borderRadius: 10,
          padding: '7px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
          transition: 'all 0.2s'
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
          {voiceCount > 0 && <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 800 }}>+{voiceCount}</span>}
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
