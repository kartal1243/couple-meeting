import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import YouTube from 'react-youtube';

// Render üzerindeki backend linkini buraya yaz (sonunda / olmasın)
const SOCKET_URL = 'https://SENIN-RENDER-LINKIN.onrender.com';
const socket = io(SOCKET_URL, { transports: ['polling', 'websocket'] });

function App() {
  const getInitialRoom = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || 'oda-' + Math.floor(1000 + Math.random() * 9000);
  };

  const [roomId, setRoomId] = useState(getInitialRoom);
  const [newRoomInput, setNewRoomInput] = useState('');
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ');
  const [inputUrl, setInputUrl] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [playlist, setPlaylist] = useState([
    { id: 'dQw4w9WgXcQ', title: 'Örnek Başlangıç Videosu' }
  ]);
  const [copied, setCopied] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const playerRef = useRef(null);

  const showFloatingEmoji = (reaction) => {
    setReactions((prev) => [...prev, reaction]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
    }, 2000);
  };

  useEffect(() => {
    const newUrl = `${window.location.pathname}?room=${roomId}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.emit('join_room', roomId);

    socket.on('room_action', ({ type, payload }) => {
      if (type === 'PLAY') {
        playerRef.current?.seekTo(payload.time || 0, true);
        playerRef.current?.playVideo();
      } else if (type === 'PAUSE') {
        playerRef.current?.pauseVideo();
      } else if (type === 'CHANGE_VIDEO') {
        setVideoId(payload.videoId);
      } else if (type === 'CHAT_MESSAGE') {
        setMessages((prev) => [...prev, payload]);
      } else if (type === 'UPDATE_PLAYLIST') {
        setPlaylist(payload);
      } else if (type === 'REACTION') {
        showFloatingEmoji(payload);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room_action');
    };
  }, [roomId]);

  const sendAction = (type, payload) => {
    socket.emit('room_action', { roomId, type, payload });
  };

  const onPlayerReady = (event) => { playerRef.current = event.target; };

  const extractVideoId = (url) => {
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
    if (url.includes('watch?v=')) return url.split('v=')[1].split('&')[0];
    return url.trim();
  };

  const handleJoinOrCreateRoom = (e) => {
    e.preventDefault();
    if (!newRoomInput.trim()) return;
    setRoomId(newRoomInput.trim().toLowerCase());
    setNewRoomInput('');
    setMessages([]);
  };

  const handleDirectPlay = (e) => {
    e.preventDefault();
    const id = extractVideoId(inputUrl);
    if (id) {
      setVideoId(id);
      sendAction('CHANGE_VIDEO', { videoId: id });
      setInputUrl('');
    }
  };

  const handleAddToPlaylist = () => {
    const id = extractVideoId(inputUrl);
    if (!id) return;
    const newItem = { id, title: `Video (${id})` };
    const updatedList = [...playlist, newItem];
    setPlaylist(updatedList);
    sendAction('UPDATE_PLAYLIST', updatedList);
    setInputUrl('');
  };

  const handleSelectFromPlaylist = (id) => {
    setVideoId(id);
    sendAction('CHANGE_VIDEO', { videoId: id });
  };

  const handleRemoveFromPlaylist = (indexToRemove) => {
    const updatedList = playlist.filter((_, idx) => idx !== indexToRemove);
    setPlaylist(updatedList);
    sendAction('UPDATE_PLAYLIST', updatedList);
  };

  const handlePlay = () => {
    if (!playerRef.current) return;
    const time = playerRef.current.getCurrentTime();
    playerRef.current.playVideo();
    sendAction('PLAY', { time });
  };

  const handlePause = () => {
    if (!playerRef.current) return;
    playerRef.current.pauseVideo();
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
    const reaction = {
      id: Date.now() + Math.random(),
      emoji,
      left: Math.floor(Math.random() * 80) + 10
    };
    showFloatingEmoji(reaction);
    sendAction('REACTION', reaction);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const opts = { height: '420', width: '100%', playerVars: { autoplay: 0, controls: 1 } };

  return (
    <div style={{ backgroundColor: '#0b0b10', color: '#fff', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
      
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.8); opacity: 1; }
          100% { transform: translateY(-300px) scale(1.6); opacity: 0; }
        }
      `}</style>

      {/* Header */}
      <header style={{ padding: '16px 36px', background: '#14141d', borderBottom: '1px solid #232333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ margin: 0, color: '#ff4757' }}>Couple Meeting ❤️</h2>
          <span style={{ fontSize: '12px', background: isConnected ? '#2ed57322' : '#ff475722', color: isConnected ? '#2ed573' : '#ff4757', padding: '4px 10px', borderRadius: '12px', border: '1px solid', fontWeight: 'bold' }}>
            {isConnected ? 'Küresel Canlı Bağlantı 🌐' : 'Sunucu Koptu 🔴'}
          </span>
          <span style={{ fontSize: '12px', background: '#3742fa22', color: '#3742fa', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
            Oda: {roomId}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <form onSubmit={handleJoinOrCreateRoom} style={{ display: 'flex', gap: '6px' }}>
            <input 
              type="text" 
              placeholder="Oda Kodu..." 
              value={newRoomInput}
              onChange={(e) => setNewRoomInput(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #29293d', background: '#0b0b10', color: '#fff', fontSize: '13px' }}
            />
            <button type="submit" style={{ padding: '8px 14px', background: '#3742fa', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              Odaya Geç 🚪
            </button>
          </form>

          <button 
            onClick={handleCopyLink}
            style={{ background: copied ? '#2ed573' : '#ff4757', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
          >
            {copied ? 'Link Kopyalandı! 🔗' : 'Oda Linkini Kopyala 🔗'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ display: 'flex', padding: '24px', gap: '24px', maxWidth: '1440px', margin: '0 auto' }}>
        
        {/* Left Side */}
        <div style={{ flex: '3' }}>
          <form onSubmit={handleDirectPlay} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <input 
              type="text" 
              placeholder="YouTube URL yapıştır..." 
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #29293d', background: '#14141d', color: '#fff' }}
            />
            <button type="submit" style={{ padding: '12px 20px', background: '#ff4757', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              Anında Aç 🎬
            </button>
            <button type="button" onClick={handleAddToPlaylist} style={{ padding: '12px 20px', background: '#3742fa', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              Sıraya Ekle ➕
            </button>
          </form>

          <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#000', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
            <YouTube videoId={videoId} opts={opts} onReady={onPlayerReady} />

            {reactions.map((r) => (
              <div 
                key={r.id} 
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: `${r.left}%`,
                  fontSize: '36px',
                  pointerEvents: 'none',
                  animation: 'floatUp 2s ease-out forwards',
                  zIndex: 99
                }}
              >
                {r.emoji}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handlePlay} style={{ flex: 1, padding: '14px', background: '#2ed573', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                ▶ Ortak Oynat
              </button>
              <button onClick={handlePause} style={{ flex: 1, padding: '14px', background: '#ffa502', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                ⏸ Ortak Durdur
              </button>
            </div>

            <div style={{ background: '#14141d', padding: '10px', borderRadius: '8px', border: '1px solid #232333', display: 'flex', justifyContent: 'center', gap: '15px' }}>
              {['❤️', '🔥', '😂', '😮', '👏', '😍'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  style={{ background: '#1c1c2b', border: '1px solid #29293d', fontSize: '22px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '24px', background: '#14141d', padding: '18px', borderRadius: '12px', border: '1px solid #232333' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#ff793f' }}>📜 Ortak Oynatma Listesi</h3>
            {playlist.length === 0 ? (
              <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>Sırada henüz video yok.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {playlist.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: item.id === videoId ? '#252538' : '#0b0b10', padding: '10px 14px', borderRadius: '8px', border: item.id === videoId ? '1px solid #ff4757' : '1px solid transparent' }}>
                    <span onClick={() => handleSelectFromPlaylist(item.id)} style={{ cursor: 'pointer', fontWeight: item.id === videoId ? 'bold' : 'normal', color: item.id === videoId ? '#ff4757' : '#fff' }}>
                      {idx + 1}. {item.title} {item.id === videoId && ' (Çalıyor 🎵)'}
                    </span>
                    <button onClick={() => handleRemoveFromPlaylist(idx)} style={{ background: 'transparent', border: 'none', color: '#ff4757', cursor: 'pointer' }}>🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Chat */}
        <div style={{ flex: '1.2', background: '#14141d', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', height: '780px', border: '1px solid #232333' }}>
          <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid #232333', paddingBottom: '12px', fontSize: '16px' }}>💬 Canlı Sohbet</h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.length === 0 ? (
              <p style={{ color: '#666', fontSize: '13px', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>Henüz mesaj yok. 🥰</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} style={{ background: '#1c1c2b', padding: '10px 14px', borderRadius: '8px', fontSize: '14px' }}>
                  <div style={{ color: '#fff', wordBreak: 'break-word' }}>{msg.text}</div>
                  <div style={{ fontSize: '10px', color: '#888', textAlign: 'right', marginTop: '4px' }}>{msg.time}</div>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <input 
              type="text" 
              placeholder="Mesaj yaz..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #29293d', background: '#0b0b10', color: '#fff', fontSize: '14px' }}
            />
            <button type="submit" style={{ padding: '10px 16px', background: '#ff4757', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Gönder
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default App;