import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import YouTube from 'react-youtube';

const BACKEND_URL = 'https://couple-meeting.onrender.com';
let socket;

try {
  socket = io(BACKEND_URL, { transports: ['polling', 'websocket'], autoConnect: true });
} catch (err) {
  console.error("Socket baglanti hatasi:", err);
}

function App() {
  const getParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      room: params.get('room') || 'oda-' + Math.floor(1000 + Math.random() * 9000),
      pass: params.get('pass') || '',
      max: params.get('max') || '2'
    };
  };

  const initial = getParams();
  const [roomId, setRoomId] = useState(initial.room);
  const [roomPassword, setRoomPassword] = useState(initial.pass);
  const [maxUsers, setMaxUsers] = useState(initial.max);

  const [inputRoom, setInputRoom] = useState('');
  const [inputPass, setInputPass] = useState('');
  const [inputMaxUsers, setInputMaxUsers] = useState('2');

  const [publicRooms, setPublicRooms] = useState([]);
  const [currentRoomInfo, setCurrentRoomInfo] = useState({ userCount: 1, maxUsers: 2 });

  const [mediaType, setMediaType] = useState('youtube');
  const [mediaSrc, setMediaSrc] = useState('dQw4w9WgXcQ');
  const [inputUrl, setInputUrl] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [reactions, setReactions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const ytPlayerRef = useRef(null);
  const customVideoRef = useRef(null);
  const chatBottomRef = useRef(null);

  const showFloatingEmoji = (reaction) => {
    setReactions((prev) => [...prev, reaction]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
    }, 2000);
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const newUrl = `${window.location.pathname}?room=${roomId}${roomPassword ? `&pass=${roomPassword}` : ''}&max=${maxUsers}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    if (!socket) return;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.emit('join_room', { roomId, password: roomPassword, maxUsers });

    socket.on('public_rooms_update', (roomsList) => {
      setPublicRooms(roomsList);
    });

    socket.on('room_joined', (data) => {
      setErrorMessage('');
      setCurrentRoomInfo({ userCount: data.userCount, maxUsers: data.maxUsers });
    });

    socket.on('room_error', (msg) => {
      setErrorMessage(msg);
    });

    socket.on('room_action', ({ type, payload }) => {
      if (type === 'PLAY') {
        if (payload.mediaType === 'youtube') {
          ytPlayerRef.current?.seekTo(payload.time || 0, true);
          ytPlayerRef.current?.playVideo();
        } else if (payload.mediaType === 'custom_video' && customVideoRef.current) {
          customVideoRef.current.currentTime = payload.time || 0;
          customVideoRef.current.play();
        }
      } else if (type === 'PAUSE') {
        if (payload.mediaType === 'youtube') ytPlayerRef.current?.pauseVideo();
        if (payload.mediaType === 'custom_video' && customVideoRef.current) customVideoRef.current.pause();
      } else if (type === 'CHANGE_MEDIA') {
        setMediaType(payload.type);
        setMediaSrc(payload.src);
      } else if (type === 'CHAT_MESSAGE') {
        setMessages((prev) => [...prev, payload]);
      } else if (type === 'REACTION') {
        showFloatingEmoji(payload);
      }
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('public_rooms_update');
      socket.off('room_joined');
      socket.off('room_error');
      socket.off('room_action');
    };
  }, [roomId, roomPassword, maxUsers]);

  const sendAction = (type, payload) => {
    if (socket && !errorMessage) {
      socket.emit('room_action', { roomId, type, payload: { ...payload, mediaType } });
    }
  };

  const handleCreateOrJoinRoom = (e) => {
    e.preventDefault();
    if (!inputRoom.trim()) return;
    setRoomId(inputRoom.trim().toLowerCase());
    setRoomPassword(inputPass.trim());
    setMaxUsers(inputMaxUsers);
    setInputRoom('');
    setInputPass('');
  };

  const handleQuickJoin = (room) => {
    setRoomId(room.id);
    setRoomPassword('');
    setMaxUsers(room.maxUsers);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const processUrl = (url) => {
    const trimmed = url.trim();
    if (trimmed.includes('youtu.be/') || trimmed.includes('watch?v=')) {
      const id = trimmed.includes('youtu.be/') ? trimmed.split('youtu.be/')[1].split('?')[0] : trimmed.split('v=')[1].split('&')[0];
      return { type: 'youtube', src: id };
    } else if (trimmed.endsWith('.mp4') || trimmed.endsWith('.webm')) {
      return { type: 'custom_video', src: trimmed };
    } else {
      return { type: 'iframe', src: trimmed };
    }
  };

  const handleMediaSubmit = (e) => {
    e.preventDefault();
    if (!inputUrl) return;
    const media = processUrl(inputUrl);
    setMediaType(media.type);
    setMediaSrc(media.src);
    sendAction('CHANGE_MEDIA', media);
    setInputUrl('');
  };

  const handlePlay = () => {
    let time = 0;
    if (mediaType === 'youtube' && ytPlayerRef.current) {
      time = ytPlayerRef.current.getCurrentTime();
      ytPlayerRef.current.playVideo();
    } else if (mediaType === 'custom_video' && customVideoRef.current) {
      time = customVideoRef.current.currentTime;
      customVideoRef.current.play();
    }
    sendAction('PLAY', { time });
  };

  const handlePause = () => {
    if (mediaType === 'youtube') ytPlayerRef.current?.pauseVideo();
    if (mediaType === 'custom_video') customVideoRef.current?.pause();
    sendAction('PAUSE', {});
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg = { text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, newMsg]);
    sendAction('CHAT_MESSAGE', newMsg);
    setChatInput('');
  };

  const sendReaction = (emoji) => {
    const reaction = { id: Date.now() + Math.random(), emoji, left: Math.floor(Math.random() * 80) + 10 };
    showFloatingEmoji(reaction);
    sendAction('REACTION', reaction);
  };

  return (
    <div style={{ backgroundColor: '#090a0f', color: '#e0e6ed', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes floatUp { 0% { transform: translateY(0) scale(0.8); opacity: 1; } 100% { transform: translateY(-300px) scale(1.6); opacity: 0; } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #12141d; }
        ::-webkit-scrollbar-thumb { background: #2b2e3e; borderRadius: 4px; }
      `}</style>
      
      {/* Dynamic Header & Room Management Bar */}
      <header style={{ padding: '16px 32px', background: '#12141d', borderBottom: '1px solid #1f2333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ margin: 0, color: '#ff4757', fontWeight: '800', letterSpacing: '-0.5px' }}>Couple Meeting ❤️</h2>
          <span style={{ fontSize: '11px', background: isConnected ? '#2ed57315' : '#ff475715', color: isConnected ? '#2ed573' : '#ff4757', padding: '5px 12px', borderRadius: '20px', border: '1px solid', fontWeight: 'bold' }}>
            {isConnected ? 'Küresel Canlı 🌐' : 'Bağlanıyor... 🔴'}
          </span>
          <span style={{ fontSize: '11px', background: '#3742fa15', color: '#70a1ff', padding: '5px 12px', borderRadius: '20px', fontWeight: 'bold', border: '1px solid #3742fa44' }}>
            Oda: {roomId} ({currentRoomInfo.userCount}/{currentRoomInfo.maxUsers} Kişi) {roomPassword && '🔒'}
          </span>
        </div>

        {/* Create Room Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <form onSubmit={handleCreateOrJoinRoom} style={{ display: 'flex', gap: '6px' }}>
            <input 
              type="text" 
              placeholder="Oda İsmi..." 
              value={inputRoom}
              onChange={(e) => setInputRoom(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #232738', background: '#090a0f', color: '#fff', fontSize: '12px' }}
            />
            <input 
              type="password" 
              placeholder="Şifre" 
              value={inputPass}
              onChange={(e) => setInputPass(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #232738', background: '#090a0f', color: '#fff', fontSize: '12px', width: '90px' }}
            />
            <select 
              value={inputMaxUsers} 
              onChange={(e) => setInputMaxUsers(e.target.value)}
              style={{ padding: '8px', borderRadius: '8px', border: '1px solid #232738', background: '#090a0f', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
            >
              <option value="2">2 Kişilik</option>
              <option value="4">4 Kişilik</option>
              <option value="8">8 Kişilik</option>
              <option value="20">20 Kişilik</option>
            </select>
            <button type="submit" style={{ padding: '8px 14px', background: '#3742fa', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
              Oda Kur/Geç 🚪
            </button>
          </form>

          <button 
            onClick={handleCopyLink}
            style={{ background: copied ? '#2ed573' : '#ff4757', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', transition: '0.2s' }}
          >
            {copied ? 'Link Kopyalandı! 🔗' : 'Oda Linkini Kopyala 🔗'}
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {errorMessage && (
        <div style={{ background: '#ff4757', color: '#fff', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>
          {errorMessage}
        </div>
      )}

      {/* Main Grid View */}
      <div style={{ display: 'flex', padding: '24px', gap: '24px', maxWidth: '1440px', margin: '0 auto', flexWrap: 'wrap' }}>
        
        {/* Left Column: Player & Active Public Rooms */}
        <div style={{ flex: '3', minWidth: '320px' }}>
          
          {/* Media Player URL Bar */}
          <form onSubmit={handleMediaSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <input 
              type="text" 
              placeholder="YouTube URL, Film iFrame Embed Linki veya .MP4 Adresi Yapıştır..." 
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid #232738', background: '#12141d', color: '#fff', fontSize: '13px' }}
            />
            <button type="submit" style={{ padding: '12px 20px', background: '#ff4757', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              Medyayı Yükle 🎬
            </button>
          </form>

          {/* Video Container Screen */}
          <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', background: '#000', minHeight: '420px', border: '1px solid #1f2333', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {mediaType === 'youtube' && (
              <YouTube videoId={mediaSrc} opts={{ height: '420', width: '100%', playerVars: { autoplay: 0, controls: 1 } }} onReady={(e) => { ytPlayerRef.current = e.target; }} />
            )}
            {mediaType === 'custom_video' && (
              <video ref={customVideoRef} src={mediaSrc} controls style={{ width: '100%', maxHeight: '420px' }} />
            )}
            {mediaType === 'iframe' && (
              <iframe src={mediaSrc} title="Movie Stream" width="100%" height="420" frameBorder="0" allowFullScreen allow="autoplay; encrypted-media"></iframe>
            )}

            {reactions.map((r) => (
              <div key={r.id} style={{ position: 'absolute', bottom: '20px', left: `${r.left}%`, fontSize: '36px', pointerEvents: 'none', animation: 'floatUp 2s ease-out forwards', zIndex: 99 }}>
                {r.emoji}
              </div>
            ))}
          </div>

          {/* Synchronized Playback Controls */}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handlePlay} style={{ flex: 1, padding: '14px', background: '#2ed573', color: '#090a0f', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '15px' }}>
                ▶ Ortak Oynat
              </button>
              <button onClick={handlePause} style={{ flex: 1, padding: '14px', background: '#ffa502', color: '#090a0f', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '15px' }}>
                ⏸ Ortak Durdur
              </button>
            </div>

            <div style={{ background: '#12141d', padding: '10px', borderRadius: '10px', border: '1px solid #1f2333', display: 'flex', justifyContent: 'center', gap: '12px' }}>
              {['❤️', '🔥', '😂', '😮', '👏', '😍'].map((emoji) => (
                <button key={emoji} onClick={() => sendReaction(emoji)} style={{ background: '#1a1d2b', border: '1px solid #232738', fontSize: '20px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Live Active Public Rooms List */}
          <div style={{ marginTop: '24px', background: '#12141d', padding: '20px', borderRadius: '14px', border: '1px solid #1f2333' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', color: '#70a1ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🌐 Canlı Odalar ve Doluluk Oranları
            </h3>
            {publicRooms.length === 0 ? (
              <p style={{ color: '#57606f', fontSize: '13px', margin: 0 }}>Henüz aktif başka oda yok.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {publicRooms.map((room) => (
                  <div 
                    key={room.id}
                    onClick={() => handleQuickJoin(room)}
                    style={{ 
                      background: room.id === roomId ? '#1e2338' : '#090a0f', 
                      padding: '12px 14px', 
                      borderRadius: '10px', 
                      border: room.id === roomId ? '1px solid #3742fa' : '1px solid #1f2333',
                      cursor: 'pointer',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', color: room.id === roomId ? '#70a1ff' : '#fff' }}>
                        {room.name} {room.hasPassword && '🔒'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#a4b0be', marginTop: '3px' }}>
                        Doluluk: <b style={{ color: room.userCount >= room.maxUsers ? '#ff4757' : '#2ed573' }}>{room.userCount}/{room.maxUsers} Kişi</b>
                      </div>
                    </div>
                    {room.id === roomId ? (
                      <span style={{ fontSize: '10px', background: '#3742fa', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>Buradasın</span>
                    ) : (
                      <button style={{ background: '#1e1e2e', border: 'none', color: '#fff', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>Katıl ➔</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Left-Aligned Clean Chat */}
        <div style={{ flex: '1.2', minWidth: '300px', background: '#12141d', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', height: '650px', border: '1px solid #1f2333' }}>
          <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid #1f2333', paddingBottom: '12px', fontSize: '15px', color: '#ff4757' }}>💬 Canlı Sohbet</h3>
          
          {/* Chat Messages List (Fixed Left Alignment) */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
            {messages.length === 0 ? (
              <p style={{ color: '#57606f', fontSize: '13px', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>Sohbet henüz boş. 🥰</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} style={{ alignSelf: 'flex-start', maxWidth: '85%', background: '#1a1d2b', border: '1px solid #232738', padding: '10px 14px', borderRadius: '12px 12px 12px 2px', textAlign: 'left' }}>
                  <div style={{ color: '#e0e6ed', fontSize: '13px', wordBreak: 'break-word', lineHeight: '1.4' }}>{msg.text}</div>
                  <div style={{ fontSize: '9px', color: '#747d8c', marginTop: '4px', textAlign: 'right' }}>{msg.time}</div>
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <input 
              type="text" 
              placeholder="Mesaj yaz..." 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)} 
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #232738', background: '#090a0f', color: '#fff', fontSize: '13px' }} 
            />
            <button type="submit" style={{ padding: '12px 18px', background: '#ff4757', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Gönder</button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default App;