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

const AVATARS = ['🐱', '🐶', '🦊', '🐼', '👑', '👸', '🦁', '🐻'];

function App() {
  const [inRoom, setInRoom] = useState(false);
  const [tab, setTab] = useState('create');
  const [sidebarTab, setSidebarTab] = useState('chat');

  const [myAvatar, setMyAvatar] = useState('🐱');
  const [username, setUsername] = useState('İzleyici');
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
  const [playMode, setPlayMode] = useState('sequence');

  const [searchInput, setSearchInput] = useState('');
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

  useEffect(() => {
    if (!searchInput.trim() || searchInput.trim().length < 2 || searchInput.includes('http://') || searchInput.includes('https://')) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      if (socket) {
        socket.emit('search_music', { query: searchInput.trim() });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('public_rooms_update', (roomsList) => {
      setPublicRooms(Array.isArray(roomsList) ? roomsList : []);
    });

    socket.on('search_results', (results) => {
      setSearchResults(Array.isArray(results) ? results : []);
      setIsSearching(false);
    });

    socket.on('room_joined', (data) => {
      setInRoom(true);
      setErrorMessage('');
      setRoomId(data.roomId);
      setMySocketId(data.socketId);
      setCurrentRoomInfo({ userCount: data.userCount, maxUsers: data.maxUsers });
      setPlaylist(Array.isArray(data.playlist) ? data.playlist : []);
      if (data.playMode) setPlayMode(data.playMode);

      if (data.currentMedia && data.currentMedia.type !== 'none') {
        setMediaType(data.currentMedia.type);
        setMediaSrc(data.currentMedia.src);
      }
    });

    socket.on('room_user_count_update', (data) => {
      setCurrentRoomInfo({ userCount: data.userCount, maxUsers: data.maxUsers });
    });

    // DONMA HATASINI ENGELLEYEN GÜVENLİ LİSTE HANDLER'I
    socket.on('playlist_updated', (data) => {
      if (Array.isArray(data)) {
        setPlaylist(data);
      } else if (data && Array.isArray(data.playlist)) {
        setPlaylist(data.playlist);
        if (data.playMode) setPlayMode(data.playMode);
      }
    });

    socket.on('play_mode_changed', (mode) => {
      setPlayMode(mode);
    });

    socket.on('room_error', (msg) => {
      setErrorMessage(msg);
      setInRoom(false);
    });

    socket.on('room_action', ({ type, payload }) => {
      if (type === 'PLAY') {
        if (payload.mediaType === 'youtube') ytPlayerRef.current?.playVideo();
        else if (payload.mediaType === 'custom_video' && customVideoRef.current) customVideoRef.current.play();
      } else if (type === 'PAUSE') {
        if (payload.mediaType === 'youtube') ytPlayerRef.current?.pauseVideo();
        else if (payload.mediaType === 'custom_video' && customVideoRef.current) customVideoRef.current.pause();
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
      socket.off('play_mode_changed');
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

  const handleModeChange = (mode) => {
    setPlayMode(mode);
    socket.emit('change_play_mode', { roomId, mode });
  };

  const handleMediaEnd = () => {
    if (!playlist || playlist.length === 0) return;

    let nextTrack;
    if (playMode === 'shuffle') {
      const randomIndex = Math.floor(Math.random() * playlist.length);
      nextTrack = playlist[randomIndex];
    } else {
      const activeList = playMode === 'alphabetical' 
        ? [...playlist].sort((a, b) => a.title.localeCompare(b.title, 'tr'))
        : playlist;
      
      const currentIndex = activeList.findIndex(item => item.src === mediaSrc);
      const nextIndex = (currentIndex + 1) % activeList.length;
      nextTrack = activeList[nextIndex];
    }

    if (nextTrack) {
      setMediaType(nextTrack.type);
      setMediaSrc(nextTrack.src);
      sendAction('CHANGE_MEDIA', { type: nextTrack.type, src: nextTrack.src });
    }
  };

  const handleDirectPlay = () => {
    if (!searchInput.trim()) return;
    let media;
    if (searchInput.includes('http://') || searchInput.includes('https://')) {
      media = processUrl(searchInput);
    } else if (searchResults.length > 0) {
      media = { type: 'youtube', src: searchResults[0].src };
    } else {
      return;
    }
    setMediaType(media.type);
    setMediaSrc(media.src);
    sendAction('CHANGE_MEDIA', media);
    setSearchInput('');
    setSearchResults([]);
  };

  const handleAddToPlaylist = () => {
    if (!searchInput.trim()) return;
    let item;
    if (searchInput.includes('http://') || searchInput.includes('https://')) {
      const media = processUrl(searchInput);
      item = {
        id: Date.now() + Math.random().toString(),
        title: 'Eklenen Medya Linki',
        type: media.type,
        src: media.src,
        addedBy: username
      };
    } else if (searchResults.length > 0) {
      const song = searchResults[0];
      item = {
        id: Date.now() + Math.random().toString(),
        title: song.title,
        type: 'youtube',
        src: song.src,
        addedBy: username
      };
    } else {
      return;
    }
    socket.emit('add_to_playlist', { roomId, item });
    setSearchInput('');
    setSearchResults([]);
  };

  const handleSelectSearchResult = (song, playImmediately = true) => {
    if (!song) return;
    const trackItem = {
      id: Date.now() + Math.random().toString(),
      title: song.title,
      type: 'youtube',
      src: song.src,
      addedBy: username
    };
    socket.emit('add_to_playlist', { roomId, item: trackItem });
    
    if (playImmediately) {
      setMediaType('youtube');
      setMediaSrc(song.src);
      sendAction('CHANGE_MEDIA', { type: 'youtube', src: song.src });
    }

    setSearchResults([]);
    setSearchInput('');
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
      sender: username || 'İzleyici',
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

  const getSortedPlaylist = () => {
    if (!Array.isArray(playlist)) return [];
    if (playMode === 'alphabetical') {
      return [...playlist].sort((a, b) => a.title.localeCompare(b.title, 'tr'));
    }
    return playlist;
  };

  // %100 TAM EKRAN (FULL BLEED) TASARIM STİLLERİ
  const styles = {
    app: {
      background: 'linear-gradient(135deg, #090d16 0%, #05070c 100%)',
      color: '#f1f5f9',
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    },
    glassCard: {
      background: 'rgba(20, 26, 38, 0.85)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '20px',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
    },
    buttonPrimary: {
      background: 'linear-gradient(135deg, #f5b041 0%, #e67e22 100%)',
      color: '#090d16',
      border: 'none',
      padding: '12px 20px',
      borderRadius: '12px',
      fontWeight: '800',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(245, 176, 65, 0.3)'
    },
    input: {
      background: '#090d16',
      border: '1px solid #232d3f',
      color: '#fff',
      padding: '12px 16px',
      borderRadius: '12px',
      fontSize: '14px',
      outline: 'none'
    }
  };

  if (!inRoom) {
    return (
      <div style={{ ...styles.app, overflowY: 'auto' }}>
        <header style={{ padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', width: '100vw', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setInRoom(false)}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #ff4757, #f5b041)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>❤️</div>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#fff', fontWeight: '900', letterSpacing: '-0.5px' }}>Couple Meeting</h1>
          </div>
          <span style={{ fontSize: '12px', background: isConnected ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)', color: isConnected ? '#2ed573' : '#ff4757', padding: '8px 16px', borderRadius: '30px', border: '1px solid', fontWeight: 'bold' }}>
            {isConnected ? 'Sunucu Aktif 🌐' : 'Bağlanıyor... 🔴'}
          </span>
        </header>

        <div style={{ width: '100%', margin: '40px 0', padding: '0 24px', textAlign: 'center', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: '42px', fontWeight: '900', color: '#fff', marginBottom: '12px', letterSpacing: '-1px' }}>
            Aynı Anda <span style={{ color: '#f5b041' }}>İzle & Dinle</span>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '32px' }}>Aramızdaki mesafeleri unutun. Odaya katılın, müziğinizi ortakça yönetin.</p>

          {errorMessage && (
            <div style={{ background: '#ff4757', color: '#fff', padding: '14px', borderRadius: '12px', fontWeight: 'bold', marginBottom: '20px', maxWidth: '520px', margin: '0 auto 20px auto' }}>
              {errorMessage}
            </div>
          )}

          <div style={{ ...styles.glassCard, padding: '36px', textAlign: 'left', maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>KARAKTER SEÇİMİ</label>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', background: '#090d16', padding: '12px', borderRadius: '16px', border: '1px solid #232d3f' }}>
                {AVATARS.map((emoji) => (
                  <span
                    key={emoji}
                    onClick={() => setMyAvatar(emoji)}
                    style={{
                      fontSize: '26px',
                      padding: '8px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: myAvatar === emoji ? '#f5b041' : 'transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    {emoji}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <input 
                type="text" 
                placeholder="Takma Adınız" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ ...styles.input, width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#090d16', padding: '6px', borderRadius: '14px' }}>
              <button onClick={() => setTab('create')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: tab === 'create' ? '#f5b041' : 'transparent', color: tab === 'create' ? '#090d16' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer' }}>Oda Oluştur</button>
              <button onClick={() => setTab('join')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: tab === 'join' ? '#f5b041' : 'transparent', color: tab === 'join' ? '#090d16' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer' }}>Odaya Katıl</button>
            </div>

            {tab === 'create' ? (
              <form onSubmit={handleCreateRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input type="text" placeholder="Oda İsmi" value={roomId} onChange={(e) => setRoomId(e.target.value)} style={styles.input} />
                <input type="password" placeholder="Şifre (İsteğe Bağlı)" value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)} style={styles.input} />
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#090d16', padding: '12px 16px', borderRadius: '12px', border: '1px solid #232d3f' }}>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Kişi Sınırı:</span>
                  <select value={maxUsers} onChange={(e) => setMaxUsers(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#f5b041', fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}>
                    <option value="2" style={{ background: '#090d16' }}>2 Kişi (Çiftler)</option>
                    <option value="4" style={{ background: '#090d16' }}>4 Kişi (Grup)</option>
                    <option value="8" style={{ background: '#090d16' }}>8 Kişi (Kalabalık)</option>
                    <option value="20" style={{ background: '#090d16' }}>20 Kişi (Parti)</option>
                  </select>
                </div>

                <button type="submit" style={styles.buttonPrimary}>Odayı Başlat 🚀</button>
              </form>
            ) : (
              <form onSubmit={handleJoinRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input type="text" placeholder="Oda İsmi" value={joinRoomInput} onChange={(e) => setJoinRoomInput(e.target.value)} style={styles.input} />
                <input type="password" placeholder="Şifre (Varsa)" value={joinPassInput} onChange={(e) => setJoinPassInput(e.target.value)} style={styles.input} />
                <button type="submit" style={{ ...styles.buttonPrimary, background: 'linear-gradient(135deg, #3742fa 0%, #5352ed 100%)', color: '#fff' }}>Odaya Katıl 🚪</button>
              </form>
            )}
          </div>

          {/* DÜZELTİLMİŞ ŞİFRELİ/ŞİFRESİZ CANLI ODALAR LİSTESİ */}
          {publicRooms.length > 0 && (
            <div style={{ maxWidth: '800px', margin: '40px auto 60px auto', textAlign: 'left' }}>
              <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '16px', fontWeight: '800' }}>🌐 Canlı Aktif Odalar</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
                {publicRooms.map((r) => {
                  const isFull = r.userCount >= r.maxUsers;
                  return (
                    <div key={r.id} style={{ background: '#141a23', padding: '16px', borderRadius: '12px', border: '1px solid #232d3f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>
                          {r.name} {r.hasPassword ? '🔒' : '🔓'}
                        </div>
                        <div style={{ fontSize: '12px', color: isFull ? '#ff4757' : '#2ed573', marginTop: '4px', fontWeight: 'bold' }}>
                          {isFull ? '⚠️ Oda Dolu' : `Kişi: ${r.userCount}/${r.maxUsers}`} {r.hasPassword && '| Şifreli'}
                        </div>
                      </div>
                      <button 
                        disabled={isFull}
                        onClick={() => { setJoinRoomInput(r.id); setTab('join'); }}
                        style={{ background: isFull ? '#2d3748' : '#f5b041', color: isFull ? '#718096' : '#090d16', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: isFull ? 'not-allowed' : 'pointer' }}
                      >
                        {isFull ? 'Dolu' : 'Katıl ➔'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ODA EKRANI (%100 FULLSCREEN EKRAINI DOLDURAN DÜZEN)
  return (
    <div style={{ ...styles.app, display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes floatUp { 0% { transform: translateY(0) scale(0.8); opacity: 1; } 100% { transform: translateY(-300px) scale(1.6); opacity: 0; } }`}</style>

      {/* ÜST LOGO VE NAVIGASYON BARI */}
      <header style={{ height: '60px', padding: '0 28px', background: 'rgba(14, 18, 26, 0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, width: '100vw', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={handleLeaveRoom}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #ff4757, #f5b041)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>❤️</div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: '900' }}>Couple Meeting</h2>
          <span style={{ fontSize: '11px', background: 'rgba(245, 176, 65, 0.15)', color: '#f5b041', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', border: '1px solid rgba(245, 176, 65, 0.3)' }}>
            {roomId} ({currentRoomInfo.userCount}/{currentRoomInfo.maxUsers})
          </span>
        </div>

        <button onClick={handleLeaveRoom} style={{ background: '#1c2433', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
          Ana Sayfa 🚪
        </button>
      </header>

      {/* EKRANI %100 DOLDURAN ANA ALAN */}
      <div style={{ flex: 1, display: 'flex', width: '100vw', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000', position: 'relative' }}>
          
          {/* ARAMA BARI */}
          <div style={{ padding: '12px 20px', background: '#0e121a', borderBottom: '1px solid rgba(255,255,255,0.08)', zIndex: 999, display: 'flex', gap: '10px', position: 'relative' }}>
            <input 
              type="text" 
              placeholder="🔍 Şarkı/Video Adı Yazın veya Link Yapıştırın..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ ...styles.input, flex: 1 }}
            />

            <button onClick={handleDirectPlay} style={{ ...styles.buttonPrimary, background: '#2ed573' }}>▶ Oynat</button>
            <button onClick={handleAddToPlaylist} style={styles.buttonPrimary}>➕ Listeye Ekle</button>

            {/* ARAMA SONUÇLARI */}
            {(searchResults.length > 0 || isSearching) && (
              <div style={{ position: 'absolute', top: '62px', left: '20px', right: '20px', ...styles.glassCard, padding: '14px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {isSearching && <div style={{ color: '#f5b041', fontSize: '13px', fontWeight: 'bold' }}>⚡ YouTube Aranıyor...</div>}
                {searchResults.map((song) => (
                  <div key={song.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#090d16', padding: '8px 12px', borderRadius: '10px', border: '1px solid #232d3f' }}>
                    <img src={song.thumbnail} alt={song.title} style={{ width: '60px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, overflow: 'hidden', fontSize: '13px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{song.title}</div>
                    <button onClick={() => handleSelectSearchResult(song, true)} style={{ ...styles.buttonPrimary, padding: '6px 12px', fontSize: '12px', background: '#2ed573' }}>▶ Çal</button>
                    <button onClick={() => handleSelectSearchResult(song, false)} style={{ ...styles.buttonPrimary, padding: '6px 12px', fontSize: '12px' }}>+ Ekle</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* OYNATICI SAHNESİ */}
          <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#05070c' }}>
            {mediaType === 'none' && (
              <div style={{ textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎵</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Yukarıdan Şarkı Aratın veya Çalma Listesinden Seçin!</div>
              </div>
            )}

            {mediaType === 'youtube' && (
              <YouTube 
                videoId={mediaSrc} 
                opts={{ height: '100%', width: '100%', playerVars: { autoplay: 1, controls: 1 } }} 
                style={{ width: '100%', height: '100%' }} 
                onReady={(e) => { ytPlayerRef.current = e.target; }} 
                onEnd={handleMediaEnd}
              />
            )}

            {mediaType === 'custom_video' && (
              <video ref={customVideoRef} src={mediaSrc} controls onEnded={handleMediaEnd} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            )}

            {reactions.map((r) => (
              <div key={r.id} style={{ position: 'absolute', bottom: '30px', left: `${r.left}%`, fontSize: '42px', pointerEvents: 'none', animation: 'floatUp 2s ease-out forwards', zIndex: 99 }}>
                {r.emoji}
              </div>
            ))}
          </div>

          {/* KONTROL PANELİ */}
          <div style={{ padding: '14px 24px', background: '#0e121a', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '14px', alignItems: 'center' }}>
            <button onClick={handlePlay} style={{ ...styles.buttonPrimary, flex: 1, background: '#2ed573' }}>▶ Ortak Oynat</button>
            <button onClick={handlePause} style={{ ...styles.buttonPrimary, flex: 1, background: '#ffa502' }}>⏸ Ortak Durdur</button>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['❤️', '🔥', '😂', '😮', '👏', '😍'].map((emoji) => (
                <button key={emoji} onClick={() => sendReaction(emoji)} style={{ background: '#1c2433', border: '1px solid rgba(255,255,255,0.1)', fontSize: '20px', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer' }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SAĞ PANEL: SOHBET & CANLI MODLU ÇALMA LİSTESİ */}
        <div style={{ width: '360px', background: '#0e121a', borderLeft: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#090d16' }}>
            <button onClick={() => setSidebarTab('chat')} style={{ flex: 1, padding: '14px', border: 'none', background: sidebarTab === 'chat' ? '#0e121a' : 'transparent', color: sidebarTab === 'chat' ? '#f5b041' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}>💬 Sohbet</button>
            <button onClick={() => setSidebarTab('playlist')} style={{ flex: 1, padding: '14px', border: 'none', background: sidebarTab === 'playlist' ? '#0e121a' : 'transparent', color: sidebarTab === 'playlist' ? '#f5b041' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}>🎵 Liste ({playlist ? playlist.length : 0})</button>
          </div>

          {sidebarTab === 'chat' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.map((msg, idx) => (
                  <div key={idx} style={{ background: '#141a23', padding: '10px 14px', borderRadius: '12px', border: '1px solid #232d3f' }}>
                    <div style={{ fontSize: '11px', color: '#f5b041', fontWeight: 'bold' }}>{msg.avatar} {msg.sender}</div>
                    <div style={{ color: '#f1f5f9', fontSize: '13px', marginTop: '4px' }}>{msg.text}</div>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>
              <form onSubmit={handleSendMessage} style={{ padding: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '8px' }}>
                <input type="text" placeholder="Mesaj..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} style={{ ...styles.input, flex: 1 }} />
                <button type="submit" style={styles.buttonPrimary}>Gönder</button>
              </form>
            </div>
          ) : (
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '6px', background: '#090d16', padding: '4px', borderRadius: '12px', border: '1px solid #232d3f' }}>
                <button 
                  onClick={() => handleModeChange('sequence')} 
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: playMode === 'sequence' ? '#f5b041' : 'transparent', color: playMode === 'sequence' ? '#090d16' : '#64748b', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}
                >
                  ▶ Sırayla
                </button>
                <button 
                  onClick={() => handleModeChange('shuffle')} 
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: playMode === 'shuffle' ? '#f5b041' : 'transparent', color: playMode === 'shuffle' ? '#090d16' : '#64748b', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}
                >
                  🔀 Rastgele
                </button>
                <button 
                  onClick={() => handleModeChange('alphabetical')} 
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: playMode === 'alphabetical' ? '#f5b041' : 'transparent', color: playMode === 'alphabetical' ? '#090d16' : '#64748b', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}
                >
                  🔤 A-Z
                </button>
              </div>

              {getSortedPlaylist().map((item) => (
                <div key={item.id} onClick={() => handleSelectPlaylistItem(item)} style={{ background: mediaSrc === item.src ? 'rgba(245, 176, 65, 0.12)' : '#141a23', border: mediaSrc === item.src ? '1px solid #f5b041' : '1px solid #232d3f', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.title}</div>
                  <button onClick={(e) => handleRemovePlaylistItem(item.id, e)} style={{ background: 'transparent', border: 'none', color: '#ff4757', cursor: 'pointer' }}>🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;