import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import YouTube from 'react-youtube';

// Canlı Render Linkini Buraya Yazın
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
  const [username, setUsername] = useState('Ben');
  const [mySocketId, setMySocketId] = useState('');

  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [maxUsers, setMaxUsers] = useState('2');
  const [joinRoomInput, setJoinRoomInput] = useState('');
  const [joinPassInput, setJoinPassInput] = useState('');

  const [publicRooms, setPublicRooms] = useState([]);
  const [currentRoomInfo, setCurrentRoomInfo] = useState({ userCount: 1, maxUsers: 2 });

  // Medya State'leri: 'none' | 'youtube' | 'custom_video' | 'iframe'
  const [mediaType, setMediaType] = useState('none'); 
  const [mediaSrc, setMediaSrc] = useState('');
  const [inputUrl, setInputUrl] = useState('');
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

  // Yazıldığı An Otomatik Arama (Debounce)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      if (socket) {
        socket.emit('search_music', { query: searchQuery.trim() });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
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

  // Yapıştırılan URL Türünü Tespit Etme (YouTube, Direct .MP4, iFrame Embed)
  const processUrl = (url) => {
    const trimmed = url.trim();
    if (trimmed.includes('youtu.be/') || trimmed.includes('watch?v=')) {
      const id = trimmed.includes('youtu.be/') ? trimmed.split('youtu.be/')[1].split('?')[0] : trimmed.split('v=')[1].split('&')[0];
      return { type: 'youtube', src: id };
    } else if (trimmed.endsWith('.mp4') || trimmed.endsWith('.webm') || trimmed.endsWith('.m3u8')) {
      return { type: 'custom_video', src: trimmed };
    } else {
      return { type: 'iframe', src: trimmed };
    }
  };

  const handleDirectUrlSubmit = (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    const media = processUrl(inputUrl);
    setMediaType(media.type);
    setMediaSrc(media.src);
    sendAction('CHANGE_MEDIA', media);
    setInputUrl('');
  };

  const handleSelectSearchResult = (song, playImmediately = true) => {
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
            <h1 style={{ margin: 0, fontSize: '22px', color: '#fff', fontWeight: '900' }}>Couple Meeting</h1>
          </div>
          <span style={{ fontSize: '12px', background: isConnected ? '#f5b04115' : '#ff475715', color: isConnected ? '#f5b041' : '#ff4757', padding: '6px 14px', borderRadius: '20px', border: '1px solid', fontWeight: 'bold' }}>
            {isConnected ? 'Sunucu Aktif 🌐' : 'Bağlanıyor... 🔴'}
          </span>
        </header>

        <div style={{ width: '100%', margin: '40px auto 0 auto', textAlign: 'center', padding: '0 20px', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#fff', marginBottom: '14px' }}>
            Birlikte Sinema ve <span style={{ color: '#f5b041' }}>Müzik Keyfi</span>
          </h2>
          
          {errorMessage && (
            <div style={{ background: '#ff4757', color: '#fff', padding: '12px', borderRadius: '10px', fontWeight: 'bold', marginBottom: '20px', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              {errorMessage}
            </div>
          )}

          <div style={{ background: '#141a23', borderRadius: '20px', padding: '32px', border: '1px solid #2d3748', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label style={{ fontSize: '12px', color: '#a0aec0', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Profil Avatarı Seç:</label>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', background: '#0b0e14', padding: '10px', borderRadius: '12px', border: '1px solid #2d3748' }}>
                {AVATARS.map((emoji) => (
                  <span
                    key={emoji}
                    onClick={() => setMyAvatar(emoji)}
                    style={{
                      fontSize: '24px',
                      padding: '6px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: myAvatar === emoji ? '#f5b041' : 'transparent',
                      transition: '0.2s'
                    }}
                  >
                    {emoji}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <input 
                type="text" 
                placeholder="Takma Adın" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #2d3748', background: '#0b0e14', color: '#fff', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: '#0b0e14', padding: '4px', borderRadius: '10px' }}>
              <button onClick={() => setTab('create')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: tab === 'create' ? '#f5b041' : 'transparent', color: tab === 'create' ? '#0b0e14' : '#a0aec0', fontWeight: 'bold', cursor: 'pointer' }}>Oda Oluştur</button>
              <button onClick={() => setTab('join')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: tab === 'join' ? '#f5b041' : 'transparent', color: tab === 'join' ? '#0b0e14' : '#a0aec0', fontWeight: 'bold', cursor: 'pointer' }}>Odaya Katıl</button>
            </div>

            {tab === 'create' ? (
              <form onSubmit={handleCreateRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input type="text" placeholder="Oda İsmi" value={roomId} onChange={(e) => setRoomId(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #2d3748', background: '#0b0e14', color: '#fff' }} />
                <input type="password" placeholder="Şifre (İsteğe Bağlı)" value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #2d3748', background: '#0b0e14', color: '#fff' }} />
                <button type="submit" style={{ padding: '14px', background: '#f5b041', color: '#0b0e14', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Odayı Başlat 🚀</button>
              </form>
            ) : (
              <form onSubmit={handleJoinRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input type="text" placeholder="Oda İsmi" value={joinRoomInput} onChange={(e) => setJoinRoomInput(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #2d3748', background: '#0b0e14', color: '#fff' }} />
                <input type="password" placeholder="Şifre (Varsa)" value={joinPassInput} onChange={(e) => setJoinPassInput(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #2d3748', background: '#0b0e14', color: '#fff' }} />
                <button type="submit" style={{ padding: '14px', background: '#3742fa', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Odaya Katıl 🚪</button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#06080c', color: '#e0e6ed', height: '100vh', width: '100vw', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      <style>{`@keyframes floatUp { 0% { transform: translateY(0) scale(0.8); opacity: 1; } 100% { transform: translateY(-300px) scale(1.6); opacity: 0; } }`}</style>

      <header style={{ height: '56px', width: '100vw', padding: '0 24px', background: '#0e121a', borderBottom: '1px solid #1a202c', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, boxSizing: 'border-box' }}>
        <h2 style={{ margin: 0, color: '#f5b041', fontSize: '16px', fontWeight: '900' }}>Couple Meeting ❤️ ({roomId})</h2>
        <button onClick={handleLeaveRoom} style={{ background: '#1a202c', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Odadan Ayrıl 🚪</button>
      </header>

      <div style={{ flex: 1, display: 'flex', width: '100vw', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000', position: 'relative' }}>
          
          {/* ÇİFT GİRİŞ BARI: ANLIK ARAMA + HARİCİ FİLM LINK YAPIŞTIRMA */}
          <div style={{ padding: '10px 16px', background: '#0e121a', borderBottom: '1px solid #1a202c', zIndex: 999, display: 'flex', gap: '10px' }}>
            {/* 1. Müzik/Şarkı Otomatik Arama Kutusu */}
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                type="text" 
                placeholder="⚡ Şarkı veya Sanatçı Adı Yaz (Anında Çıkar)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #2d3748', background: '#06080c', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
              {(searchResults.length > 0 || isSearching) && (
                <div style={{ position: 'absolute', top: '48px', left: 0, right: 0, background: '#141a23', border: '1px solid #f5b041', borderRadius: '10px', padding: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 9999 }}>
                  {isSearching && <div style={{ color: '#f5b041', fontSize: '12px' }}>⚡ Aranıyor...</div>}
                  {searchResults.map((song) => (
                    <div key={song.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#0b0e14', padding: '6px 10px', borderRadius: '6px' }}>
                      <img src={song.thumbnail} alt={song.title} style={{ width: '50px', height: '30px', borderRadius: '4px', objectFit: 'cover' }} />
                      <div style={{ flex: 1, overflow: 'hidden', fontSize: '12px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{song.title}</div>
                      <button onClick={() => handleSelectSearchResult(song, true)} style={{ background: '#2ed573', color: '#06080c', border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>▶ Çal</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Harici Film / Embed / Direct Link Formu */}
            <form onSubmit={handleDirectUrlSubmit} style={{ flex: 1, display: 'flex', gap: '6px' }}>
              <input 
                type="text" 
                placeholder="🎬 Film Embed Linki veya .MP4 Adresi Yapıştır..." 
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #2d3748', background: '#06080c', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
              <button type="submit" style={{ padding: '10px 14px', background: '#ff4757', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>Yükle</button>
            </form>
          </div>

          {/* DİNAMİK MEDYA OYNATICI VE EMOJİ EKRANI */}
          <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
            {mediaType === 'none' && (
              <div style={{ textAlign: 'center', color: '#4a5568' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎬</div>
                <div>Şarkı arayın veya film embed linki yapıştırın!</div>
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

            {/* YÜZEN CANLI EMOJİLER */}
            {reactions.map((r) => (
              <div key={r.id} style={{ position: 'absolute', bottom: '30px', left: `${r.left}%`, fontSize: '42px', pointerEvents: 'none', animation: 'floatUp 2s ease-out forwards', zIndex: 99 }}>
                {r.emoji}
              </div>
            ))}
          </div>

          {/* KONTROL VE EMOJİ PANELİ */}
          <div style={{ padding: '12px 20px', background: '#0e121a', borderTop: '1px solid #1a202c', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={handlePlay} style={{ flex: 1, padding: '10px', background: '#2ed573', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>▶ Ortak Oynat</button>
            <button onClick={handlePause} style={{ flex: 1, padding: '10px', background: '#ffa502', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>⏸ Ortak Durdur</button>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['❤️', '🔥', '😂', '😮', '👏', '😍'].map((emoji) => (
                <button key={emoji} onClick={() => sendReaction(emoji)} style={{ background: '#1a202c', border: '1px solid #2d3748', fontSize: '18px', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SAĞ SİDEBAR: SOHBET VEYA ÇALMA LİSTESİ */}
        <div style={{ width: '340px', background: '#0e121a', borderLeft: '1px solid #1a202c', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #1a202c', background: '#06080c' }}>
            <button onClick={() => setSidebarTab('chat')} style={{ flex: 1, padding: '12px', border: 'none', background: sidebarTab === 'chat' ? '#0e121a' : 'transparent', color: sidebarTab === 'chat' ? '#f5b041' : '#718096', fontWeight: 'bold', cursor: 'pointer' }}>💬 Sohbet</button>
            <button onClick={() => setSidebarTab('playlist')} style={{ flex: 1, padding: '12px', border: 'none', background: sidebarTab === 'playlist' ? '#0e121a' : 'transparent', color: sidebarTab === 'playlist' ? '#f5b041' : '#718096', fontWeight: 'bold', cursor: 'pointer' }}>🎵 Liste ({filteredPlaylist.length})</button>
          </div>

          {sidebarTab === 'chat' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.map((msg, idx) => (
                  <div key={idx} style={{ background: '#141a23', padding: '8px 12px', borderRadius: '8px', border: '1px solid #2d3748' }}>
                    <div style={{ fontSize: '11px', color: '#f5b041', fontWeight: 'bold' }}>{msg.avatar} {msg.sender}</div>
                    <div style={{ color: '#e0e6ed', fontSize: '13px', marginTop: '2px' }}>{msg.text}</div>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>
              <form onSubmit={handleSendMessage} style={{ padding: '12px', borderTop: '1px solid #1a202c', display: 'flex', gap: '8px' }}>
                <input type="text" placeholder="Mesaj..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #2d3748', background: '#06080c', color: '#fff' }} />
                <button type="submit" style={{ padding: '10px 14px', background: '#f5b041', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Gönder</button>
              </form>
            </div>
          ) : (
            <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#06080c', color: '#f5b041', border: '1px solid #2d3748', fontWeight: 'bold', marginBottom: '8px' }}>
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              {filteredPlaylist.map((item) => (
                <div key={item.id} onClick={() => handleSelectPlaylistItem(item)} style={{ background: mediaSrc === item.src ? '#f5b0411a' : '#141a23', border: mediaSrc === item.src ? '1px solid #f5b041' : '1px solid #2d3748', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.title}</div>
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