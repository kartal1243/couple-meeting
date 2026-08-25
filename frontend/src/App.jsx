import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import YouTube from 'react-youtube';

const BACKEND_URL = 'https://couple-meeting.onrender.com';
let socket;

try {
  socket = io(BACKEND_URL, { transports: ['polling', 'websocket'], autoConnect: true });
} catch (err) {
  console.error("Socket hatası:", err);
}

function App() {
  const [inRoom, setInRoom] = useState(false);
  const [tab, setTab] = useState('create'); // 'create' | 'join'

  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [maxUsers, setMaxUsers] = useState('2');

  const [joinRoomInput, setJoinRoomInput] = useState('');
  const [joinPassInput, setJoinPassInput] = useState('');

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
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinRoomInput(roomParam);
      setTab('join');
    }

    if (!socket) return;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('public_rooms_update', (roomsList) => {
      setPublicRooms(roomsList);
    });

    socket.on('room_joined', (data) => {
      setInRoom(true);
      setErrorMessage('');
      setRoomId(data.roomId);
      setCurrentRoomInfo({ userCount: data.userCount, maxUsers: data.maxUsers });
    });

    socket.on('room_error', (msg) => {
      setErrorMessage(msg);
      setInRoom(false);
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
      socket.off('connect');
      socket.off('disconnect');
      socket.off('public_rooms_update');
      socket.off('room_joined');
      socket.off('room_error');
      socket.off('room_action');
    };
  }, []);

  useEffect(() => {
    if (inRoom) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, inRoom]);

  const handleCreateRoomSubmit = (e) => {
    e.preventDefault();
    const finalRoomId = roomId.trim().toLowerCase() || 'oda-' + Math.floor(1000 + Math.random() * 9000);
    socket.emit('join_room', { roomId: finalRoomId, password: roomPassword.trim(), maxUsers, isCreating: true });
  };

  const handleJoinRoomSubmit = (e) => {
    e.preventDefault();
    if (!joinRoomInput.trim()) return;
    let targetRoom = joinRoomInput.trim();
    if (targetRoom.includes('room=')) {
      targetRoom = targetRoom.split('room=')[1].split('&')[0];
    }
    socket.emit('join_room', { roomId: targetRoom.toLowerCase(), password: joinPassInput.trim(), isCreating: false });
  };

  const handleLeaveRoom = () => {
    socket.emit('leave_room');
    setInRoom(false);
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendAction = (type, payload) => {
    if (socket) {
      socket.emit('room_action', { roomId, type, payload: { ...payload, mediaType } });
    }
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

  // =========================================================================
  // 1. ANA SAYFA / LANDING PAGE EKRANI
  // =========================================================================
  if (!inRoom) {
    return (
      <div style={{ backgroundColor: '#131822', color: '#e0e6ed', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        {/* Navigation Bar */}
        <header style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e2638' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>❤️</span>
            <h1 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: '800', letterSpacing: '-0.5px' }}>Couple Meeting</h1>
          </div>
          <span style={{ fontSize: '12px', background: isConnected ? '#f5b04115' : '#ff475715', color: isConnected ? '#f5b041' : '#ff4757', padding: '6px 14px', borderRadius: '20px', border: '1px solid', fontWeight: 'bold' }}>
            {isConnected ? 'Sunucu Aktif 🌐' : 'Bağlanıyor... 🔴'}
          </span>
        </header>

        {/* Hero Section */}
        <div style={{ maxWidth: '900px', margin: '60px auto 0 auto', textAlign: 'center', padding: '0 20px' }}>
          <h2 style={{ fontSize: '48px', fontWeight: '900', color: '#fff', marginBottom: '16px', letterSpacing: '-1px' }}>
            birlikte vakit <span style={{ color: '#f5b041' }}>geçirin</span>
          </h2>
          <p style={{ fontSize: '16px', color: '#8c9ba5', marginBottom: '40px' }}>
            YouTube, film ve videoları eş zamanlı izleyin. Mesafe tanımayan canlı sohbet odanızı hemen oluşturun.
          </p>

          {/* Error Message Warning */}
          {errorMessage && (
            <div style={{ background: '#ff4757', color: '#fff', padding: '14px', borderRadius: '12px', fontWeight: 'bold', marginBottom: '24px', fontSize: '14px' }}>
              {errorMessage}
            </div>
          )}

          {/* Main Card (Create or Join Tabs) */}
          <div style={{ background: '#1c2333', borderRadius: '16px', padding: '32px', border: '1px solid #2a344a', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', maxWidth: '520px', margin: '0 auto' }}>
            
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', background: '#131822', padding: '6px', borderRadius: '10px' }}>
              <button 
                onClick={() => setTab('create')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: tab === 'create' ? '#f5b041' : 'transparent', color: tab === 'create' ? '#131822' : '#8c9ba5', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
              >
                Oda Oluştur
              </button>
              <button 
                onClick={() => setTab('join')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: tab === 'join' ? '#f5b041' : 'transparent', color: tab === 'join' ? '#131822' : '#8c9ba5', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
              >
                Odaya Katıl
              </button>
            </div>

            {/* Tab 1: Oda Oluştur */}
            {tab === 'create' && (
              <form onSubmit={handleCreateRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input 
                  type="text" 
                  placeholder="Oda İsmi (Örn: Sinema-Gecesi)" 
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  style={{ padding: '14px', borderRadius: '10px', border: '1px solid #2a344a', background: '#131822', color: '#fff', fontSize: '14px' }}
                />
                <input 
                  type="password" 
                  placeholder="Şifre Oluştur (İsteğe bağlı)" 
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  style={{ padding: '14px', borderRadius: '10px', border: '1px solid #2a344a', background: '#131822', color: '#fff', fontSize: '14px' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#131822', padding: '10px 14px', borderRadius: '10px', border: '1px solid #2a344a' }}>
                  <span style={{ fontSize: '13px', color: '#8c9ba5' }}>Kişi Sınırı:</span>
                  <select 
                    value={maxUsers} 
                    onChange={(e) => setMaxUsers(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: '#f5b041', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', outline: 'none' }}
                  >
                    <option value="2" style={{ background: '#131822' }}>2 Kişi (Çiftler)</option>
                    <option value="4" style={{ background: '#131822' }}>4 Kişi (Grup)</option>
                    <option value="8" style={{ background: '#131822' }}>8 Kişi (Kalabalık)</option>
                    <option value="20" style={{ background: '#131822' }}>20 Kişi (Parti)</option>
                  </select>
                </div>
                <button type="submit" style={{ padding: '14px', background: '#f5b041', color: '#131822', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', marginTop: '10px' }}>
                  Kendi Odanızı Oluşturun 🚀
                </button>
              </form>
            )}

            {/* Tab 2: Odaya Katıl */}
            {tab === 'join' && (
              <form onSubmit={handleJoinRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input 
                  type="text" 
                  placeholder="Oda İsmi veya Davet Linki Yapıştır..." 
                  value={joinRoomInput}
                  onChange={(e) => setJoinRoomInput(e.target.value)}
                  style={{ padding: '14px', borderRadius: '10px', border: '1px solid #2a344a', background: '#131822', color: '#fff', fontSize: '14px' }}
                />
                <input 
                  type="password" 
                  placeholder="Oda Şifresi (Varsa)" 
                  value={joinPassInput}
                  onChange={(e) => setJoinPassInput(e.target.value)}
                  style={{ padding: '14px', borderRadius: '10px', border: '1px solid #2a344a', background: '#131822', color: '#fff', fontSize: '14px' }}
                />
                <button type="submit" style={{ padding: '14px', background: '#3742fa', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', marginTop: '10px' }}>
                  Odaya Katıl 🚪
                </button>
              </form>
            )}

          </div>

          {/* Features Section */}
          <div style={{ marginTop: '70px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', textAlign: 'left' }}>
            <div style={{ background: '#1c2333', padding: '20px', borderRadius: '12px', border: '1px solid #2a344a' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>🎬</div>
              <h4 style={{ margin: '0 0 6px 0', color: '#fff' }}>Eş Zamanlı Oynatıcı</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#8c9ba5' }}>Videoları ve filmleri aynı anda kesintisiz durdurup oynatın.</p>
            </div>
            <div style={{ background: '#1c2333', padding: '20px', borderRadius: '12px', border: '1px solid #2a344a' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔒</div>
              <h4 style={{ margin: '0 0 6px 0', color: '#fff' }}>Şifreli Özel Odalar</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#8c9ba5' }}>Sadece şifreyi paylaştığınız kişilerin katılabileceği gizli odalar.</p>
            </div>
            <div style={{ background: '#1c2333', padding: '20px', borderRadius: '12px', border: '1px solid #2a344a' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>💬</div>
              <h4 style={{ margin: '0 0 6px 0', color: '#fff' }}>Canlı Sohbet & Tepkiler</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#8c9ba5' }}>Mesajlaşın ve ekranda uçuşan canlı emojiler gönderin.</p>
            </div>
            <div style={{ background: '#1c2333', padding: '20px', borderRadius: '12px', border: '1px solid #2a344a' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>🍿</div>
              <h4 style={{ margin: '0 0 6px 0', color: '#fff' }}>Geniş Medya Desteği</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#8c9ba5' }}>YouTube, kaçak dizi/film embed linkleri veya direkt MP4 desteği.</p>
            </div>
          </div>

          {/* Active Public Rooms Section */}
          {publicRooms.length > 0 && (
            <div style={{ marginTop: '50px', textAlign: 'left', marginBottom: '60px' }}>
              <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '16px' }}>🌐 Açık Odalar</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                {publicRooms.map((r) => (
                  <div key={r.id} style={{ background: '#1c2333', padding: '14px 18px', borderRadius: '10px', border: '1px solid #2a344a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>{r.name} {r.hasPassword && '🔒'}</div>
                      <div style={{ fontSize: '12px', color: '#8c9ba5', marginTop: '2px' }}>Kişi: {r.userCount}/{r.maxUsers}</div>
                    </div>
                    <button 
                      onClick={() => { setJoinRoomInput(r.id); setTab('join'); }}
                      style={{ background: '#f5b041', color: '#131822', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Katıl ➔
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. ODA / WATCH PARTY EKRANI
  // =========================================================================
  return (
    <div style={{ backgroundColor: '#131822', color: '#e0e6ed', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <style>{`@keyframes floatUp { 0% { transform: translateY(0) scale(0.8); opacity: 1; } 100% { transform: translateY(-300px) scale(1.6); opacity: 0; } }`}</style>
      
      {/* Clean Room Header */}
      <header style={{ padding: '16px 32px', background: '#1c2333', borderBottom: '1px solid #2a344a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ margin: 0, color: '#f5b041', fontSize: '18px', fontWeight: '800' }}>Couple Meeting ❤️</h2>
          <span style={{ fontSize: '12px', background: '#f5b04115', color: '#f5b041', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', border: '1px solid #f5b04144' }}>
            Oda: {roomId} ({currentRoomInfo.userCount}/{currentRoomInfo.maxUsers} İzleyici)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleCopyLink}
            style={{ background: copied ? '#2ed573' : '#f5b041', color: '#131822', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
          >
            {copied ? 'Link Kopyalandı! 🔗' : 'Oda Linkini Kopyala 🔗'}
          </button>
          <button 
            onClick={handleLeaveRoom}
            style={{ background: '#2a344a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
          >
            Odadan Ayrıl 🚪
          </button>
        </div>
      </header>

      {/* Main Watch Party Grid */}
      <div style={{ display: 'flex', padding: '24px', gap: '24px', maxWidth: '1440px', margin: '0 auto', flexWrap: 'wrap' }}>
        
        {/* Left Side: Video Player & Controls */}
        <div style={{ flex: '3', minWidth: '320px' }}>
          <form onSubmit={handleMediaSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <input 
              type="text" 
              placeholder="YouTube URL, Film iFrame Embed Linki veya .MP4 Adresi Yapıştır..." 
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid #2a344a', background: '#1c2333', color: '#fff', fontSize: '13px' }}
            />
            <button type="submit" style={{ padding: '12px 20px', background: '#f5b041', color: '#131822', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              Medyayı Yükle 🎬
            </button>
          </form>

          {/* Video Container */}
          <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', background: '#000', minHeight: '420px', border: '1px solid #2a344a', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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

          {/* Controls */}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handlePlay} style={{ flex: 1, padding: '14px', background: '#2ed573', color: '#131822', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '15px' }}>
                ▶ Ortak Oynat
              </button>
              <button onClick={handlePause} style={{ flex: 1, padding: '14px', background: '#ffa502', color: '#131822', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '15px' }}>
                ⏸ Ortak Durdur
              </button>
            </div>

            <div style={{ background: '#1c2333', padding: '10px', borderRadius: '10px', border: '1px solid #2a344a', display: 'flex', justifyContent: 'center', gap: '12px' }}>
              {['❤️', '🔥', '😂', '😮', '👏', '😍'].map((emoji) => (
                <button key={emoji} onClick={() => sendReaction(emoji)} style={{ background: '#131822', border: '1px solid #2a344a', fontSize: '20px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Chat Box */}
        <div style={{ flex: '1.2', minWidth: '300px', background: '#1c2333', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', height: '600px', border: '1px solid #2a344a' }}>
          <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid #2a344a', paddingBottom: '12px', fontSize: '15px', color: '#f5b041' }}>💬 Canlı Sohbet</h3>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
            {messages.length === 0 ? (
              <p style={{ color: '#8c9ba5', fontSize: '13px', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>Sohbet henüz boş. 🥰</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} style={{ alignSelf: 'flex-start', maxWidth: '85%', background: '#131822', border: '1px solid #2a344a', padding: '10px 14px', borderRadius: '12px 12px 12px 2px', textAlign: 'left' }}>
                  <div style={{ color: '#e0e6ed', fontSize: '13px', wordBreak: 'break-word', lineHeight: '1.4' }}>{msg.text}</div>
                  <div style={{ fontSize: '9px', color: '#8c9ba5', marginTop: '4px', textAlign: 'right' }}>{msg.time}</div>
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
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #2a344a', background: '#131822', color: '#fff', fontSize: '13px' }} 
            />
            <button type="submit" style={{ padding: '12px 18px', background: '#f5b041', color: '#131822', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Gönder</button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default App;