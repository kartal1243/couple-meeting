import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import YouTube from 'react-youtube';

const BACKEND_URL = 'https://couple-meeting.onrender.com/';
let socket;

try {
  socket = io(BACKEND_URL, { transports: ['polling', 'websocket'], autoConnect: true });
} catch (err) {
  console.error("Socket hatası:", err);
}

const AVATARS = ['🐱', '🐶', '🦊', '🐼', '👑', '👸', '🦁', '🐻'];

function App() {
  const [inRoom, setInRoom] = useState(false);
  const [tab, setTab] = useState('create');
  const [sidebarTab, setSidebarTab] = useState('chat');

  const [myAvatar, setMyAvatar] = useState('🐱');
  const [username, setUsername] = useState('Ben');
  const [mySocketId, setMySocketId] = useState('');

  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [maxUsers, setMaxUsers] = useState('2');
  const [joinRoomInput, setJoinRoomInput] = useState('');
  const [joinPassInput, setJoinPassInput] = useState('');

  const [publicRooms, setPublicRooms] = useState([]);
  const [currentRoomInfo, setCurrentRoomInfo] = useState({ userCount: 1, maxUsers: 2 });

  const [mediaType, setMediaType] = useState('none'); 
  const [mediaSrc, setMediaSrc] = useState('');
  const [playlist, setPlaylist] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Tümü');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [reactions, setReactions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
    if (!socket) return;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('public_rooms_update', (roomsList) => {
      setPublicRooms(roomsList);
    });

    socket.on('search_results', (results) => {
      const hdResults = results.map(song => ({
        ...song,
        thumbnail: `https://img.youtube.com/vi/${song.src}/hqdefault.jpg`
      }));
      setSearchResults(hdResults);
      setIsSearching(false);
    });

    socket.on('room_joined', (data) => {
      setInRoom(true);
      setErrorMessage('');
      setRoomId(data.roomId);
      setMySocketId(data.socketId);
      setCurrentRoomInfo({ userCount: data.userCount, maxUsers: data.maxUsers });
      if (data.playlist) setPlaylist(data.playlist);

      if (data.currentMedia && data.currentMedia.type !== 'none') {
        setMediaType(data.currentMedia.type);
        setMediaSrc(data.currentMedia.src);
      }
    });

    socket.on('room_user_count_update', (data) => {
      setCurrentRoomInfo({ userCount: data.userCount, maxUsers: data.maxUsers });
    });

    socket.on('playlist_updated', (updatedPlaylist) => {
      setPlaylist(updatedPlaylist);
    });

    socket.on('room_action', ({ type, payload }) => {
      if (type === 'PLAY') {
        if (payload.mediaType === 'youtube') ytPlayerRef.current?.playVideo();
        else if (payload.mediaType === 'custom_video') customVideoRef.current?.play();
      } else if (type === 'PAUSE') {
        if (payload.mediaType === 'youtube') ytPlayerRef.current?.pauseVideo();
        else if (payload.mediaType === 'custom_video') customVideoRef.current?.pause();
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
      socket.off('search_results');
      socket.off('room_joined');
      socket.off('room_user_count_update');
      socket.off('playlist_updated');
      socket.off('room_action');
    };
  }, []);

  const handleCreateRoomSubmit = (e) => {
    e.preventDefault();
    const finalRoomId = roomId.trim().toLowerCase() || 'oda-' + Math.floor(1000 + Math.random() * 9000);
    socket.emit('join_room', { roomId: finalRoomId, password: roomPassword.trim(), maxUsers });
  };

  const handleJoinRoomSubmit = (e) => {
    e.preventDefault();
    if (!joinRoomInput.trim()) return;
    socket.emit('join_room', { roomId: joinRoomInput.trim().toLowerCase(), password: joinPassInput.trim() });
  };

  const handleLeaveRoom = () => {
    socket.emit('leave_room');
    setInRoom(false);
    setMediaType('none');
    setMediaSrc('');
    setMessages([]);
  };

  const sendAction = (type, payload) => {
    if (socket) {
      socket.emit('room_action', { roomId, type, payload: { ...payload, mediaType } });
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    socket.emit('search_music', { query: searchQuery.trim() });
  };

  const handleSelectSearchResult = (song, playImmediately = false) => {
    const trackItem = {
      id: Date.now() + Math.random().toString(),
      title: song.title,
      type: 'youtube',
      src: song.src,
      category: 'Arama Sonuçları',
      addedBy: username
    };
    socket.emit('add_to_playlist', { roomId, item: trackItem });
    
    if (playImmediately) {
      setMediaType('youtube');
      setMediaSrc(song.src);
      sendAction('CHANGE_MEDIA', { type: 'youtube', src: song.src });
    }

    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSelectPlaylistItem = (item) => {
    setMediaType(item.type);
    setMediaSrc(item.src);
    sendAction('CHANGE_MEDIA', { type: item.type, src: item.src });
  };

  const handlePlay = () => {
    if (mediaType === 'youtube') ytPlayerRef.current?.playVideo();
    else if (mediaType === 'custom_video') customVideoRef.current?.play();
    sendAction('PLAY', {});
  };

  const handlePause = () => {
    if (mediaType === 'youtube') ytPlayerRef.current?.pauseVideo();
    else if (mediaType === 'custom_video') customVideoRef.current?.pause();
    sendAction('PAUSE', {});
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg = { 
      senderId: mySocketId,
      text: chatInput, 
      sender: username || 'Ben',
      avatar: myAvatar,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    setMessages((prev) => [...prev, newMsg]);
    sendAction('CHAT_MESSAGE', newMsg);
    setChatInput('');
  };

  const categories = ['Tümü', ...new Set(playlist.map(i => i.category || 'Diğer'))];
  const filteredPlaylist = playlist.filter(item => selectedCategory === 'Tümü' || item.category === selectedCategory);

  if (!inRoom) {
    return (
      <div style={{ backgroundColor: '#0b0e14', color: '#e0e6ed', minHeight: '100vh', width: '100vw', margin: 0, padding: 0, fontFamily: "'Inter', sans-serif" }}>
        <header style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1a202c', width: '100vw', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>❤️</span>
            <h1 style={{ margin: 0, fontSize: '22px', color: '#fff', fontWeight: '900' }}>Couple Meeting</h1>
          </div>
          <span style={{ fontSize: '12px', background: isConnected ? '#f5b04115' : '#ff475715', color: isConnected ? '#f5b041' : '#ff4757', padding: '6px 14px', borderRadius: '20px', border: '1px solid', fontWeight: 'bold' }}>
            {isConnected ? 'Sunucu Aktif 🌐' : 'Bağlanıyor... 🔴'}
          </span>
        </header>

        <div style={{ width: '100%', margin: '40px auto 0 auto', textAlign: 'center', padding: '0 20px', boxSizing: 'border-box' }}>
          <div style={{ background: '#141a23', borderRadius: '20px', padding: '32px', border: '1px solid #2d3748', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px' }}>
              <input 
                type="text" 
                placeholder="Takma Adın" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #2d3748', background: '#0b0e14', color: '#fff' }}
              />
            </div>
            <form onSubmit={handleCreateRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                type="text" 
                placeholder="Oda İsmi" 
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                style={{ padding: '14px', borderRadius: '10px', border: '1px solid #2d3748', background: '#0b0e14', color: '#fff' }}
              />
              <button type="submit" style={{ padding: '14px', background: '#f5b041', color: '#0b0e14', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>
                Odayı Başlat 🚀
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#06080c', color: '#e0e6ed', height: '100vh', width: '100vw', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      <header style={{ height: '56px', width: '100vw', padding: '0 24px', background: '#0e121a', borderBottom: '1px solid #1a202c', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, boxSizing: 'border-box' }}>
        <h2 style={{ margin: 0, color: '#f5b041', fontSize: '16px', fontWeight: '900' }}>Couple Meeting ❤️</h2>
        <button onClick={handleLeaveRoom} style={{ background: '#1a202c', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          Odadan Ayrıl 🚪
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex', width: '100vw', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000', position: 'relative' }}>
          <div style={{ padding: '10px 16px', background: '#0e121a', borderBottom: '1px solid #1a202c', zIndex: 10 }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="🔍 Şarkı veya Sanatçı Adı Yaz..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #2d3748', background: '#06080c', color: '#fff' }}
              />
              <button type="submit" style={{ padding: '10px 18px', background: '#f5b041', color: '#06080c', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {isSearching ? 'Aranıyor...' : 'Şarkı Ara 🔎'}
              </button>
            </form>

            {searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: '56px', left: '16px', right: '16px', background: '#141a23', border: '1px solid #f5b041', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 99 }}>
                {searchResults.map((song) => (
                  <div key={song.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#0b0e14', padding: '8px 12px', borderRadius: '8px' }}>
                    <img src={song.thumbnail} alt={song.title} style={{ width: '80px', height: '45px', borderRadius: '6px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{song.title}</div>
                    </div>
                    <button onClick={() => handleSelectSearchResult(song, true)} style={{ background: '#2ed573', color: '#06080c', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>▶ Hemen Çal</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
            {mediaType === 'youtube' && (
              <YouTube videoId={mediaSrc} opts={{ height: '100%', width: '100%', playerVars: { autoplay: 1, controls: 1 } }} style={{ width: '100%', height: '100%' }} onReady={(e) => { ytPlayerRef.current = e.target; }} />
            )}
          </div>

          <div style={{ padding: '12px 20px', background: '#0e121a', borderTop: '1px solid #1a202c', display: 'flex', gap: '12px' }}>
            <button onClick={handlePlay} style={{ flex: 1, padding: '10px', background: '#2ed573', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>▶ Ortak Oynat</button>
            <button onClick={handlePause} style={{ flex: 1, padding: '10px', background: '#ffa502', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>⏸ Ortak Durdur</button>
          </div>
        </div>

        <div style={{ width: '340px', background: '#0e121a', borderLeft: '1px solid #1a202c', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map((msg, idx) => (
                <div key={idx} style={{ background: '#141a23', padding: '8px 12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#f5b041', fontWeight: 'bold' }}>{msg.sender}</div>
                  <div style={{ color: '#e0e6ed', fontSize: '13px' }}>{msg.text}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} style={{ padding: '12px', borderTop: '1px solid #1a202c', display: 'flex', gap: '8px' }}>
              <input type="text" placeholder="Mesaj..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #2d3748', background: '#06080c', color: '#fff' }} />
              <button type="submit" style={{ padding: '10px 14px', background: '#f5b041', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Gönder</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;