import { useEffect, useRef, useState, useCallback } from 'react';

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

export default function VoiceChat({ socket, roomId, mySocketId, roomUsersList, isMuted, setIsMuted }) {
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState([]);
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const audioContainerRef = useRef(null);

  const startVoice = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setVoiceActive(true);
      if (socket) socket.emit('voice_join', { roomId });
    } catch (err) {
      console.error('Mikrofon erişimi reddedildi:', err);
    }
  }, [socket, roomId]);

  const stopVoice = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    Object.values(peersRef.current).forEach(pc => { try { pc.close(); } catch {} });
    peersRef.current = {};
    setVoiceActive(false);
    setVoiceUsers([]);
    if (audioContainerRef.current) audioContainerRef.current.innerHTML = '';
    if (socket) socket.emit('voice_leave', { roomId });
  }, [socket, roomId]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) { audioTrack.enabled = !audioTrack.enabled; setIsMuted(!audioTrack.enabled); }
    }
  }, [setIsMuted]);

  useEffect(() => {
    if (!socket) return;

    const createPeer = (targetSocketId, isInitiator) => {
      if (peersRef.current[targetSocketId]) return peersRef.current[targetSocketId];
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peersRef.current[targetSocketId] = pc;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('voice_signal', { targetId: targetSocketId, signal: { type: 'ice-candidate', candidate: e.candidate } });
      };

      pc.ontrack = (e) => {
        let audioEl = document.getElementById(`voice-${targetSocketId}`);
        if (!audioEl) {
          audioEl = document.createElement('audio');
          audioEl.id = `voice-${targetSocketId}`;
          audioEl.autoplay = true;
          audioEl.style.display = 'none';
          if (audioContainerRef.current) audioContainerRef.current.appendChild(audioEl);
        }
        audioEl.srcObject = e.streams[0];
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          try { pc.close(); } catch {}
          delete peersRef.current[targetSocketId];
          const el = document.getElementById(`voice-${targetSocketId}`);
          if (el) el.remove();
        }
      };

      if (isInitiator) {
        pc.createOffer().then(offer => {
          pc.setLocalDescription(offer);
          socket.emit('voice_signal', { targetId: targetSocketId, signal: offer });
        }).catch(() => {});
      }

      return pc;
    };

    const onVoiceJoin = ({ socketId }) => {
      if (socketId !== mySocketId && localStreamRef.current) {
        createPeer(socketId, true);
      }
    };

    const onVoiceLeave = ({ socketId }) => {
      if (peersRef.current[socketId]) { try { peersRef.current[socketId].close(); } catch {} delete peersRef.current[socketId]; }
      const el = document.getElementById(`voice-${socketId}`);
      if (el) el.remove();
    };

    const onVoiceUsers = ({ users }) => setVoiceUsers(users || []);

    const onVoiceSignal = async ({ fromId, signal }) => {
      if (!localStreamRef.current) return;
      let pc = peersRef.current[fromId];
      if (signal.type === 'offer') {
        pc = createPeer(fromId, false);
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('voice_signal', { targetId: fromId, signal: answer });
      } else if (signal.type === 'answer' && pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signal.type === 'ice-candidate' && pc && signal.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    };

    socket.on('voice_join', onVoiceJoin);
    socket.on('voice_leave', onVoiceLeave);
    socket.on('voice_users', onVoiceUsers);
    socket.on('voice_signal', onVoiceSignal);

    return () => {
      socket.off('voice_join', onVoiceJoin);
      socket.off('voice_leave', onVoiceLeave);
      socket.off('voice_users', onVoiceUsers);
      socket.off('voice_signal', onVoiceSignal);
      stopVoice();
    };
  }, [socket, mySocketId]);

  return (
    <>
      <div ref={audioContainerRef} style={{ display: 'none' }} />
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {!voiceActive ? (
          <button onClick={startVoice} title="Sesli Sohbete Katıl" style={{
            background: 'rgba(34,197,94,.12)', color: '#22c55e',
            border: '1px solid rgba(34,197,94,.2)', borderRadius: 8,
            padding: '5px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 4
          }}>🎤 Sesli Sohbet</button>
        ) : (
          <>
            <button onClick={toggleMute} style={{
              background: isMuted ? 'rgba(239,68,68,.15)' : 'rgba(34,197,94,.15)',
              color: isMuted ? '#ef4444' : '#22c55e',
              border: `1px solid ${isMuted ? 'rgba(239,68,68,.3)' : 'rgba(34,197,94,.3)'}`,
              borderRadius: 8, padding: '5px 8px', fontSize: 11, fontWeight: 800,
              cursor: 'pointer', transition: 'all 0.2s'
            }}>{isMuted ? '🔇' : '🎤'}</button>
            <button onClick={stopVoice} style={{
              background: 'rgba(239,68,68,.12)', color: '#ef4444',
              border: '1px solid rgba(239,68,68,.2)', borderRadius: 8,
              padding: '5px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer'
            }}>⏹</button>
          </>
        )}
        {voiceActive && voiceUsers.length > 0 && (
          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {voiceUsers.map(uid => (
              <div key={uid} style={{
                width: 6, height: 6, borderRadius: '50%', background: '#22c55e',
                boxShadow: '0 0 4px rgba(34,197,94,.6)'
              }} title={uid} />
            ))}
            <span style={{ fontSize: 9, color: '#64748b', fontWeight: 700 }}>{voiceUsers.length}🎤</span>
          </div>
        )}
      </div>
    </>
  );
}
