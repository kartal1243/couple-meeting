import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import YouTube from 'react-youtube';

const SOCKET_URL = 'https://couple-meeting.onrender.com'; // Render linkini koru
const socket = io(SOCKET_URL, { transports: ['polling', 'websocket'] });

function App() {
  const getInitialRoom = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || 'oda-' + Math.floor(1000 + Math.random() * 9000);
  };

  const [roomId, setRoomId] = useState(getInitialRoom);
  const [newRoomInput, setNewRoomInput] = useState('');
  
  // Medya Türü: 'youtube' | 'custom_video' | 'iframe'
  const [mediaType, setMediaType] = useState('youtube');
  const [mediaSrc, setMediaSrc] = useState('dQw4w9WgXcQ'); // Video ID veya URL
  const [inputUrl, setInputUrl] = useState('');
  
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [playlist, setPlaylist] = useState([]);
  const [copied, setCopied] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const ytPlayerRef = useRef(null);
  const customVideoRef = useRef(null);

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
      socket.off('room_action');
    };
  }, [roomId]);

  const sendAction = (type, payload) => {
    socket.emit('room_action', { roomId, type, payload: { ...payload, mediaType } });
  };

  // URL Türünü Tespit Etme (YouTube, Direct Video, Embed)
  const processUrl = (url) => {
    const trimmed = url.trim();
    if (trimmed.includes('youtu.be/') || trimmed.includes('watch?v=')) {
      const id = trimmed.includes('youtu.be/') ? trimmed.split('youtu.be/')[1].split('?')[0] : trimmed.split('v=')[1].split('&')[0];
      return { type: 'youtube', src: id };
    } else if (trimmed.endsWith('.mp4') || trimmed.endsWith('.webm') || trimmed.endsWith('.m3u8')) {
      return { type: 'custom_video', src: trimmed };
    } else {
      // Film sitelerindeki Embed / iFrame kaynakları
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
    <div style={{ backgroundColor: '#0b0b10', color: '#fff', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
      <style>{`@keyframes floatUp { 0% { transform: translateY(0) scale(0.8); opacity: 1; } 100% { transform: translateY(-300px) scale(1.6); opacity: 0; } }`}</style>
      
      {/* Header */}
      <header style={{ padding: '16px 36px', background: '#14141d', borderBottom: '1px solid #232333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#ff4757' }}>Couple Meeting ❤️</h2>
        <span style={{ fontSize: '12px', background: isConnected ? '#2ed57322' : '#ff475722', color: isConnected ? '#2ed573' : '#ff4757', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
          {isConnected ? 'Küresel Canlı Bağlantı 🌐' : 'Bağlanıyor... 🔴'}
        </span>
      </header>

      {/* Main Container */}
      <div style={{ display: 'flex', padding: '24px', gap: '24px', maxWidth: '1440px', margin: '0 auto' }}>
        <div style={{ flex: '3' }}>
          
          {/* URL Giriş Formu */}
          <form onSubmit={handleMediaSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <input 
              type="text" 
              placeholder="YouTube URL, Film iFrame Embed Linki veya .MP4 Adresi Yapıştır..." 
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #29293d', background: '#14141d', color: '#fff' }}
            />
            <button type="submit" style={{ padding: '12px 20px', background: '#ff4757', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              Medyayı Yükle 🎬
            </button>
          </form>

          {/* Dinamik Medya Ekranı */}
          <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#000', minHeight: '420px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            
            {mediaType === 'youtube' && (
              <YouTube videoId={mediaSrc} opts={{ height: '420', width: '100%', playerVars: { autoplay: 0, controls: 1 } }} onReady={(e) => { ytPlayerRef.current = e.target; }} />
            )}

            {mediaType === 'custom_video' && (
              <video ref={customVideoRef} src={mediaSrc} controls style={{ width: '100%', maxHeight: '420px' }} />
            )}

            {mediaType === 'iframe' && (
              <iframe src={mediaSrc} title="Movie Stream" width="100%" height="420" frameBorder="0" allowFullScreen allow="autoplay; encrypted-media"></iframe>
            )}

            {/* Yüzen Emojiler */}
            {reactions.map((r) => (
              <div key={r.id} style={{ position: 'absolute', bottom: '20px', left: `${r.left}%`, fontSize: '36px', pointerEvents: 'none', animation: 'floatUp 2s ease-out forwards', zIndex: 99 }}>
                {r.emoji}
              </div>
            ))}
          </div>

          {/* Kontroller */}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handlePlay} style={{ flex: 1, padding: '14px', background: '#2ed573', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                ▶ Ortak Oynat
              </button>
              <button onClick={handlePause} style={{ flex: 1, padding: '14px', background: '#ffa502', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                ⏸ Ortak Durdur
              </button>
            </div>

            <div style={{ background: '#14141d', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
              {['❤️', '🔥', '😂', '😮', '👏', '😍'].map((emoji) => (
                <button key={emoji} onClick={() => sendReaction(emoji)} style={{ background: '#1c1c2b', border: '1px solid #29293d', fontSize: '22px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Canlı Sohbet */}
        <div style={{ flex: '1.2', background: '#14141d', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', height: '600px' }}>
          <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid #232333', paddingBottom: '12px' }}>💬 Canlı Sohbet</h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ background: '#1c1c2b', padding: '10px 14px', borderRadius: '8px', fontSize: '14px' }}>
                <div>{msg.text}</div>
                <div style={{ fontSize: '10px', color: '#888', textAlign: 'right' }}>{msg.time}</div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <input type="text" placeholder="Mesaj yaz..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #29293d', background: '#0b0b10', color: '#fff' }} />
            <button type="submit" style={{ padding: '10px 16px', background: '#ff4757', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Gönder</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;