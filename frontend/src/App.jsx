import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import YouTube from 'react-youtube';

const BACKEND_URL = 'https://RENDER_LINKINIZ.onrender.com';
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

  // Arama State'leri
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

    socket.on('search_results', (results) => {
      setSearchResults(results);
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

        setTimeout(() => {
          if (data.currentMedia.type === 'youtube' && ytPlayerRef.current) {
            ytPlayerRef.current.seekTo(data.currentMedia.time || 0, true);
            if (data.currentMedia.isPlaying) ytPlayerRef.current.playVideo();
          } else if (data.currentMedia.type === 'custom_video' && customVideoRef.current) {
            customVideoRef.current.currentTime = data.currentMedia.time || 0;
            if (data.currentMedia.isPlaying) customVideoRef.current.play();
          }
        }, 800);
      }
    });

    socket.on('room_user_count_update', (data) => {
      setCurrentRoomInfo({ userCount: data.userCount, maxUsers: data.maxUsers });
    });

    socket.on('playlist_updated', (updatedPlaylist) => {
      setPlaylist(updatedPlaylist);
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
      socket.off('search_results');
      socket.off('room_joined');
      socket.off('room_user_count_update');
      socket.off('playlist_updated');
      socket.off('room_error');
      socket.off('room_action');
    };
  }, []);

  useEffect(() => {
    if (inRoom && sidebarTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, inRoom, sidebarTab]);

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
    setMediaType('none');
    setMediaSrc('');
    setMessages([]);
    window.history.pushState({}, '', window.location.pathname);
  };

  const sendAction = (type, payload) => {
    if (socket) {
      socket.emit('room_action', { roomId, type, payload: { ...payload, mediaType } });
    }
  };

  // Şarkı Arama İşlemi
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    socket.emit('search_music', { query: searchQuery.trim() });
  };

  // Aramadan Şarkıyı Listeye Ekleme ve Çalma
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

  const handleRemovePlaylistItem = (itemId, e) => {
    e.stopPropagation();
    socket.emit('remove_from_playlist', { roomId, itemId });
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

  const sendReaction = (emoji) => {
    const reaction = { id: Date.now() + Math.random(), emoji, left: Math.floor(Math.random() * 80) + 10 };
    showFloatingEmoji(reaction);
    sendAction('REACTION', reaction);
  };

  const categories = ['Tümü', ...new Set(playlist.map(i => i.category || 'Diğer'))];
  const filteredPlaylist = playlist
    .filter(item => selectedCategory === 'Tümü' || item.category === selectedCategory)
    .sort((a, b) => a.title.localeCompare(b.title, 'tr'));

  if (!inRoom) {
    return (
      <div style={{ backgroundColor: '#0b0e14', color: '#e0e6ed', minHeight: '100vh', width: '100vw', margin: 0, padding: 0, fontFamily: "'Inter', sans-serif" }}>
        <header style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1a202c', width: '100vw', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>❤️</span>
            <h1 style={{ margin: 0, fontSize: '22px', color: '#fff', fontWeight: '900', letterSpacing: '-0.5px' }}>Couple Meeting</h1>
          </div>
          <span style={{ fontSize: '12px', background: isConnected ? '#f5b04115' : '#ff475715', color: isConnected ? '#f5b041' : '#ff4757', padding: '6px 14px', borderRadius: '20px', border: '1px solid', fontWeight: 'bold' }}>
            {isConnected ? 'Sunucu Aktif 🌐' : 'Bağlanıyor... 🔴'}
          </span>
        </header>

        <div style={{ width: '100%', margin: '40px auto 0 auto', textAlign: 'center', padding: '0 20px', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: '44px', fontWeight: '900', color: '#fff', marginBottom: '14px', letterSpacing: '-1px' }}>
            birlikte sinema ve <span style={{ color: '#f5b041' }}>müzik keyfi</span>
          </h2>
          <p style={{ fontSize: '15px', color: '#718096', marginBottom: '32px' }}>
            Karakterini seç, odanı kur veya müzik/film listelerinden seçim yaparak birlikte eğlenin!
          </p>

          {errorMessage && (
            <div style={{ background: '#ff4757', color: '#fff', padding: '14px', borderRadius: '12px', fontWeight: 'bold', marginBottom: '24px', fontSize: '14px' }}>
              {errorMessage}
            </div>
          )}

          <div style={{ background: '#141a23', borderRadius: '20px', padding: '32px', border: '1px solid #2d3748', boxShadow: '0 25px 60px rgba(0,0,0,0.6)', maxWidth: '500px', margin: '0 auto' }}>
            
            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <label style={{ fontSize: '12px', color: '#a0aec0', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Karakter / Profilini Seç:</label>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', background: '#0b0e14', padding: '10px', borderRadius: '12px', border: '1px solid #2d3748' }}>
                {AVATARS.map((emoji) => (
                  <span
                    key={emoji}
                    onClick={() => setMyAvatar(emoji)}
                    style={{
                      fontSize: '24px',
                      padding: '6px 10px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: myAvatar === emoji ? '#f5b041' : 'transparent',
                      transform: myAvatar === emoji ? 'scale(1.15)' : 'scale(1)',
                      transition: '0.2s'
                    }}
                  >
                    {emoji}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <input 
                type="text" 
                placeholder="Takma Adın (Örn: Ömer / Ahsen)" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #2d3748', background: '#0b0e14', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#0b0e14', padding: '4px', borderRadius: '10px' }}>
              <button 
                onClick={() => setTab('create')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: tab === 'create' ? '#f5b041' : 'transparent', color: tab === 'create' ? '#0b0e14' : '#a0aec0', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Oda Oluştur
              </button>
              <button 
                onClick={() => setTab('join')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: tab === 'join' ? '#f5b041' : 'transparent', color: tab === 'join' ? '#0b0e14' : '#a0aec0', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Odaya Katıl
              </button>
            </div>

            {tab === 'create' && (
              <form onSubmit={handleCreateRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input 
                  type="text" 
                  placeholder="Oda İsmi (Örn: Muzik-Keyfi)" 
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  style={{ padding: '14px', borderRadius: '10px', border: '1px solid #2d3748', background: '#0b0e14', color: '#fff', fontSize: '14px' }}
                />
                <input 
                  type="password" 
                  placeholder="Oda Şifresi (İsteğe Bağlı)" 
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  style={{ padding: '14px', borderRadius: '10px', border: '1px solid #2d3748', background: '#0b0e14', color: '#fff', fontSize: '14px' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0b0e14', padding: '10px 14px', borderRadius: '10px', border: '1px solid #2d3748' }}>
                  <span style={{ fontSize: '13px', color: '#a0aec0' }}>Kişi Sınırı:</span>
                  <select 
                    value={maxUsers} 
                    onChange={(e) => setMaxUsers(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: '#f5b041', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', outline: 'none' }}
                  >
                    <option value="2" style={{ background: '#0b0e14' }}>2 Kişi (Çiftler)</option>
                    <option value="4" style={{ background: '#0b0e14' }}>4 Kişi</option>
                    <option value="8" style={{ background: '#0b0e14' }}>8 Kişi</option>
                  </select>
                </div>
                <button type="submit" style={{ padding: '14px', background: '#f5b041', color: '#0b0e14', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', marginTop: '10px' }}>
                  Odayı Başlat 🚀
                </button>
              </form>
            )}

            {tab === 'join' && (
              <form onSubmit={handleJoinRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input 
                  type="text" 
                  placeholder="Oda İsmi veya Davet Linki..." 
                  value={joinRoomInput}
                  onChange={(e) => setJoinRoomInput(e.target.value)}
                  style={{ padding: '14px', borderRadius: '10px', border: '1px solid #2d3748', background: '#0b0e14', color: '#fff', fontSize: '14px' }}
                />
                <input 
                  type="password" 
                  placeholder="Oda Şifresi (Varsa)" 
                  value={joinPassInput}
                  onChange={(e) => setJoinPassInput(e.target.value)}
                  style={{ padding: '14px', borderRadius: '10px', border: '1px solid #2d3748', background: '#0b0e14', color: '#fff', fontSize: '14px' }}
                />
                <button type="submit" style={{ padding: '14px', background: '#3742fa', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', marginTop: '10px' }}>
                  Odaya Gir 🚪
                </button>
              </form>
            )}
          </div>

          {publicRooms.length > 0 && (
            <div style={{ marginTop: '40px', textAlign: 'left', marginBottom: '60px' }}>
              <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '14px' }}>🌐 Canlı Odalar</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {publicRooms.map((r) => (
                  <div key={r.id} style={{ background: '#141a23', padding: '12px 16px', borderRadius: '10px', border: '1px solid #2d3748', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#fff' }}>{r.name} {r.hasPassword && '🔒'}</div>
                      <div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>İzleyici: {r.userCount}/{r.maxUsers}</div>
                    </div>
                    <button 
                      onClick={() => { setJoinRoomInput(r.id); setTab('join'); }}
                      style={{ background: '#f5b041', color: '#0b0e14', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
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

  return (
    <div style={{ backgroundColor: '#06080c', color: '#e0e6ed', height: '100vh', width: '100vw', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      <style>{`
        @keyframes floatUp { 0% { transform: translateY(0) scale(0.8); opacity: 1; } 100% { transform: translateY(-300px) scale(1.6); opacity: 0; } }
        @media (max-width: 900px) {
          .room-layout { flex-direction: column !important; overflow-y: auto !important; }
          .video-stage { height: 50vh !important; min-height: 300px !important; }
          .chat-sidebar { width: 100% !important; height: 50vh !important; }
        }
      `}</style>
      
      <header style={{ height: '56px', width: '100vw', padding: '0 24px', background: '#0e121a', borderBottom: '1px solid #1a202c', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, boxSizing: 'border-box', margin: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ margin: 0, color: '#f5b041', fontSize: '16px', fontWeight: '900' }}>Couple Meeting ❤️</h2>
          <span style={{ fontSize: '11px', background: '#f5b04115', color: '#f5b041', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold', border: '1px solid #f5b04144' }}>
            Oda: {roomId} ({currentRoomInfo.userCount}/{currentRoomInfo.maxUsers} Kişi)
          </span>
        </div>

        <button 
          onClick={handleLeaveRoom}
          style={{ background: '#1a202c', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
        >
          Odadan Ayrıl 🚪
        </button>
      </header>

      <div className="room-layout" style={{ flex: 1, display: 'flex', width: '100vw', height: 'calc(100vh - 56px)', overflow: 'hidden', margin: 0, padding: 0 }}>
        
        <div className="video-stage" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000', position: 'relative' }}>
          
          {/* ARAMA VE LINK GIRIŞ BARI */}
          <div style={{ padding: '10px 16px', background: '#0e121a', borderBottom: '1px solid #1a202c', position: 'relative', zIndex: 10 }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="🔍 Şarkı veya Sanatçı Adı Yaz (Örn: Tarkan Yolla)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #2d3748', background: '#06080c', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
              <button type="submit" style={{ padding: '10px 18px', background: '#f5b041', color: '#06080c', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                {isSearching ? 'Aranıyor...' : 'Şarkı Ara 🔎'}
              </button>
            </form>

            {/* ARAMA SONUÇLARI KART LİSTESİ */}
            {searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: '56px', left: '16px', right: '16px', background: '#141a23', border: '1px solid #f5b041', borderRadius: '10px', padding: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 99 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#f5b041', fontWeight: 'bold' }}>Arama Sonuçları:</span>
                  <button onClick={() => setSearchResults([])} style={{ background: 'transparent', border: 'none', color: '#718096', cursor: 'pointer', fontSize: '12px' }}>Kapat ✖</button>
                </div>
                {searchResults.map((song) => (
                  <div key={song.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#0b0e14', padding: '8px 12px', borderRadius: '8px', border: '1px solid #2d3748' }}>
                    <img src={song.thumbnail} alt={song.title} style={{ width: '45px', height: '45px', borderRadius: '6px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                      <div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>Süre: {song.timestamp}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleSelectSearchResult(song, true)} style={{ background: '#2ed573', color: '#06080c', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>▶ Hemen Çal</button>
                      <button onClick={() => handleSelectSearchResult(song, false)} style={{ background: '#f5b041', color: '#06080c', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>+ Listeye Ekle</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
            {mediaType === 'none' && (
              <div style={{ textAlign: 'center', color: '#4a5568', padding: '20px' }}>
                <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎵</div>
                <h3 style={{ color: '#a0aec0', margin: '0 0 8px 0', fontSize: '18px' }}>Müzik & Sinema Ekranı Hazır</h3>
                <p style={{ fontSize: '13px', margin: 0 }}>Yukarıya şarkı adı yazıp aratın veya sağdaki <b>🎵 Çalma Listesi</b> sekmesinden seçim yapın!</p>
              </div>
            )}

            {mediaType === 'youtube' && (
              <YouTube videoId={mediaSrc} opts={{ height: '100%', width: '100%', playerVars: { autoplay: 1, controls: 1 } }} style={{ width: '100%', height: '100%' }} onReady={(e) => { ytPlayerRef.current = e.target; }} />
            )}

            {mediaType === 'custom_video' && (
              <video ref={customVideoRef} src={mediaSrc} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            )}

            {mediaType === 'iframe' && (
              <iframe src={mediaSrc} title="Movie Stream" width="100%" height="100%" frameBorder="0" allowFullScreen allow="autoplay; encrypted-media"></iframe>
            )}

            {reactions.map((r) => (
              <div key={r.id} style={{ position: 'absolute', bottom: '30px', left: `${r.left}%`, fontSize: '42px', pointerEvents: 'none', animation: 'floatUp 2s ease-out forwards', zIndex: 99 }}>
                {r.emoji}
              </div>
            ))}
          </div>

          <div style={{ padding: '12px 20px', background: '#0e121a', borderTop: '1px solid #1a202c', display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
            <button onClick={handlePlay} style={{ flex: 1, padding: '10px', background: '#2ed573', color: '#06080c', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '14px' }}>
              ▶ Ortak Oynat
            </button>
            <button onClick={handlePause} style={{ flex: 1, padding: '10px', background: '#ffa502', color: '#06080c', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '14px' }}>
              ⏸ Ortak Durdur
            </button>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['❤️', '🔥', '😂', '😮', '👏', '😍'].map((emoji) => (
                <button key={emoji} onClick={() => sendReaction(emoji)} style={{ background: '#1a202c', border: '1px solid #2d3748', fontSize: '16px', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="chat-sidebar" style={{ width: '340px', background: '#0e121a', borderLeft: '1px solid #1a202c', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          
          <div style={{ display: 'flex', borderBottom: '1px solid #1a202c', background: '#06080c' }}>
            <button 
              onClick={() => setSidebarTab('chat')}
              style={{ flex: 1, padding: '12px', border: 'none', background: sidebarTab === 'chat' ? '#0e121a' : 'transparent', color: sidebarTab === 'chat' ? '#f5b041' : '#718096', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
            >
              💬 Sohbet
            </button>
            <button 
              onClick={() => setSidebarTab('playlist')}
              style={{ flex: 1, padding: '12px', border: 'none', background: sidebarTab === 'playlist' ? '#0e121a' : 'transparent', color: sidebarTab === 'playlist' ? '#f5b041' : '#718096', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
            >
              🎵 Çalma Listesi ({filteredPlaylist.length})
            </button>
          </div>

          {sidebarTab === 'chat' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.length === 0 ? (
                  <p style={{ color: '#4a5568', fontSize: '12px', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>Sohbet henüz boş. Keyifli dinlemeler! 🥰</p>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderId === mySocketId || msg.sender === username;
                    return (
                      <div 
                        key={idx} 
                        style={{ 
                          display: 'flex', 
                          gap: '8px', 
                          alignItems: 'flex-start',
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          flexDirection: isMe ? 'row-reverse' : 'row',
                          maxWidth: '85%'
                        }}
                      >
                        <div style={{ fontSize: '20px', background: '#1a202c', padding: '4px', borderRadius: '50%', border: '1px solid #2d3748', lineHeight: 1, flexShrink: 0 }}>
                          {msg.avatar || '🐱'}
                        </div>

                        <div 
                          style={{ 
                            background: isMe ? '#f5b0411a' : '#141a23', 
                            border: isMe ? '1px solid #f5b04155' : '1px solid #2d3748', 
                            padding: '8px 12px', 
                            borderRadius: isMe ? '10px 2px 10px 10px' : '2px 10px 10px 10px',
                            textAlign: isMe ? 'right' : 'left'
                          }}
                        >
                          <div style={{ fontSize: '11px', color: isMe ? '#f5b041' : '#70a1ff', fontWeight: 'bold', marginBottom: '2px' }}>
                            {msg.sender}
                          </div>
                          <div style={{ color: '#e0e6ed', fontSize: '13px', wordBreak: 'break-word', lineHeight: '1.4' }}>
                            {msg.text}
                          </div>
                          <div style={{ fontSize: '9px', color: '#718096', marginTop: '4px' }}>
                            {msg.time}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              <form onSubmit={handleSendMessage} style={{ padding: '12px', borderTop: '1px solid #1a202c', display: 'flex', gap: '8px', background: '#0e121a' }}>
                <input 
                  type="text" 
                  placeholder="Mesaj yaz..." 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} 
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #2d3748', background: '#06080c', color: '#fff', fontSize: '13px', outline: 'none' }} 
                />
                <button type="submit" style={{ padding: '10px 14px', background: '#f5b041', color: '#06080c', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>Gönder</button>
              </form>
            </div>
          )}

          {sidebarTab === 'playlist' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', color: '#718096', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Kategori Seçin (A-Z Sıralı):</label>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #2d3748', background: '#06080c', color: '#f5b041', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', outline: 'none' }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} style={{ background: '#0e121a', color: '#fff' }}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {filteredPlaylist.length === 0 ? (
                <p style={{ color: '#4a5568', fontSize: '12px', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>Bu kategoride henüz şarkı yok.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredPlaylist.map((item) => {
                    const isCurrent = mediaSrc === item.src;
                    return (
                      <div 
                        key={item.id}
                        onClick={() => handleSelectPlaylistItem(item)}
                        style={{ 
                          background: isCurrent ? '#f5b0411a' : '#141a23', 
                          border: isCurrent ? '1px solid #f5b041' : '1px solid #2d3748', 
                          padding: '10px 12px', 
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifySpaceBetween: 'space-between',
                          transition: '0.2s'
                        }}
                      >
                        <div style={{ flex: 1, overflow: 'hidden', paddingRight: '8px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: isCurrent ? '#f5b041' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {isCurrent && '🎵 '} {item.title}
                          </div>
                          <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>
                            Tür: {item.category || 'Genel'} | Ekleyen: {item.addedBy || 'Kullanıcı'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleSelectPlaylistItem(item); }}
                            style={{ background: isCurrent ? '#f5b041' : '#2d3748', color: isCurrent ? '#06080c' : '#fff', border: 'none', padding: '5px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            {isCurrent ? 'Çalıyor' : 'Çal'}
                          </button>
                          <button 
                            onClick={(e) => handleRemovePlaylistItem(item.id, e)}
                            style={{ background: 'transparent', color: '#ff4757', border: 'none', padding: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default App;