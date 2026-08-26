import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import YouTube from 'react-youtube';

const BACKEND_URL = 'http://localhost:3001';
let socket;

try {
  socket = io(BACKEND_URL, { transports: ['polling', 'websocket'], autoConnect: true });
} catch (err) {
  console.error("Socket hatası:", err);
}

const AVATARS = ['🐱', '🐶', '🦊', '🐼', '👑', '👸', '🦁', '🐻'];
const CITIES = ['Zonguldak', 'Tokat', 'İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Trabzon', 'Sivas', 'Adana', 'Eskişehir', 'Samsun', 'Kayseri', 'Konya', 'Diyarbakır'];

function App() {
  const [userId] = useState(() => {
    let savedId = localStorage.getItem('cm_user_id');
    if (!savedId) {
      savedId = 'usr_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('cm_user_id', savedId);
    }
    return savedId;
  });

  const [inRoom, setInRoom] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlRoom = urlParams.get('room');
    const savedRoom = localStorage.getItem('cm_saved_room');
    return !!(urlRoom || savedRoom);
  });

  const [activeTab, setActiveTab] = useState('create');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('chat');

  const [myAvatar, setMyAvatar] = useState(() => localStorage.getItem('cm_user_avatar') || '🐱');
  const [username, setUsername] = useState(() => localStorage.getItem('cm_username') || 'İzleyici');
  const [userCity, setUserCity] = useState(() => localStorage.getItem('cm_user_city') || 'Zonguldak');
  const [mySocketId, setMySocketId] = useState('');

  const [recentRooms, setRecentRooms] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cm_recent_rooms')) || []; } catch (e) { return []; }
  });

  const [roomId, setRoomId] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('room') || localStorage.getItem('cm_saved_room') || '';
  });
  const [roomPassword, setRoomPassword] = useState('');
  const [maxUsers, setMaxUsers] = useState('2');
  const [joinRoomInput, setJoinRoomInput] = useState('');
  const [joinPassInput, setJoinPassInput] = useState('');

  const [publicRooms, setPublicRooms] = useState([]);
  const [currentRoomInfo, setCurrentRoomInfo] = useState({ userCount: 1, maxUsers: 2 });
  const [distanceKm, setDistanceKm] = useState(null);

  // MEDYA VE KLASÖRLÜ ÇALMA LİSTESİ
  const [mediaType, setMediaType] = useState('none'); 
  const [mediaSrc, setMediaSrc] = useState('');
  const [playlist, setPlaylist] = useState([]);
  const [categories, setCategories] = useState(['Genel', 'Türk Pop', 'Rap', 'Arabesk']);
  const [selectedCategory, setSelectedCategory] = useState('Genel');
  const [targetAddCategory, setTargetAddCategory] = useState('Genel');
  const [newCategoryInput, setNewCategoryInput] = useState('');
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

  const saveToRecentRooms = (targetRoomId) => {
    if (!targetRoomId) return;
    const updated = [targetRoomId, ...recentRooms.filter(r => r !== targetRoomId)].slice(0, 5);
    setRecentRooms(updated);
    localStorage.setItem('cm_recent_rooms', JSON.stringify(updated));
  };

  const handleAvatarSelect = (emoji) => {
    setMyAvatar(emoji);
    localStorage.setItem('cm_user_avatar', emoji);
  };

  const handleUsernameChange = (val) => {
    setUsername(val);
    localStorage.setItem('cm_username', val);
  };

  const handleCityChange = (val) => {
    setUserCity(val);
    localStorage.setItem('cm_user_city', val);
  };

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
    const urlParams = new URLSearchParams(window.location.search);
    const targetRoom = urlParams.get('room') || localStorage.getItem('cm_saved_room');
    if (targetRoom && socket) {
      const savedPass = localStorage.getItem('cm_saved_pass') || '';
      socket.emit('join_room', { roomId: targetRoom, password: savedPass, userId, userCity });
    }
  }, [userId]);

  useEffect(() => {
    if (!searchInput.trim() || searchInput.trim().length < 2 || searchInput.includes('http://') || searchInput.includes('https://')) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => {
      if (socket) socket.emit('search_music', { query: searchInput.trim() });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!socket) return;
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('public_rooms_update', (roomsList) => setPublicRooms(Array.isArray(roomsList) ? roomsList : []));
    socket.on('search_results', (results) => { setSearchResults(Array.isArray(results) ? results : []); setIsSearching(false); });

    socket.on('room_joined', (data) => {
      setInRoom(true);
      setErrorMessage('');
      setRoomId(data.roomId);
      setMySocketId(data.socketId);
      setCurrentRoomInfo({ userCount: data.userCount, maxUsers: data.maxUsers });
      setPlaylist(Array.isArray(data.playlist) ? data.playlist : []);
      if (data.categories) setCategories(data.categories);
      if (data.playMode) setPlayMode(data.playMode);
      if (data.distanceKm) setDistanceKm(data.distanceKm);

      localStorage.setItem('cm_saved_room', data.roomId);
      saveToRecentRooms(data.roomId);
      window.history.replaceState({}, '', `?room=${data.roomId}`);

      if (data.currentMedia && data.currentMedia.type !== 'none') {
        setMediaType(data.currentMedia.type);
        setMediaSrc(data.currentMedia.src);
        setTimeout(() => {
          if (data.currentMedia.type === 'youtube' && ytPlayerRef.current) {
            ytPlayerRef.current.seekTo(data.currentMedia.time || 0, true);
            if (data.currentMedia.isPlaying) ytPlayerRef.current.playVideo();
            else ytPlayerRef.current.pauseVideo();
          } else if (data.currentMedia.type === 'custom_video' && customVideoRef.current) {
            customVideoRef.current.currentTime = data.currentMedia.time || 0;
            if (data.currentMedia.isPlaying) customVideoRef.current.play();
            else customVideoRef.current.pause();
          }
        }, 800);
      }
    });

    socket.on('room_user_count_update', (data) => setCurrentRoomInfo({ userCount: data.userCount, maxUsers: data.maxUsers }));
    socket.on('location_updated', (data) => { if (data.distanceKm) setDistanceKm(data.distanceKm); });
    socket.on('categories_updated', (cats) => setCategories(cats));
    socket.on('playlist_updated', (data) => {
      if (Array.isArray(data)) setPlaylist(data);
      else if (data && Array.isArray(data.playlist)) {
        setPlaylist(data.playlist);
        if (data.playMode) setPlayMode(data.playMode);
      }
    });
    socket.on('play_mode_changed', (mode) => setPlayMode(mode));
    socket.on('room_error', (msg) => {
      setErrorMessage(msg);
      setInRoom(false);
      localStorage.removeItem('cm_saved_room');
      localStorage.removeItem('cm_saved_pass');
    });

    socket.on('room_action', ({ type, payload }) => {
      if (type === 'PLAY') {
        if (payload.mediaType === 'youtube' && ytPlayerRef.current) {
          ytPlayerRef.current.seekTo(payload.time || 0, true);
          ytPlayerRef.current.playVideo();
        } else if (payload.mediaType === 'custom_video' && customVideoRef.current) {
          customVideoRef.current.currentTime = payload.time || 0;
          customVideoRef.current.play();
        }
      } else if (type === 'PAUSE') {
        if (payload.mediaType === 'youtube') ytPlayerRef.current?.pauseVideo();
        if (payload.mediaType === 'custom_video') customVideoRef.current?.pause();
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
      socket.off('connect'); socket.off('disconnect'); socket.off('public_rooms_update');
      socket.off('search_results'); socket.off('room_joined'); socket.off('room_user_count_update');
      socket.off('location_updated'); socket.off('categories_updated');
      socket.off('playlist_updated'); socket.off('play_mode_changed'); socket.off('room_error'); socket.off('room_action');
    };
  }, []);

  useEffect(() => {
    if (inRoom && sidebarTab === 'chat') chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, inRoom, sidebarTab]);

  const handleCreateRoomSubmit = (e) => {
    e.preventDefault();
    const finalRoomId = roomId.trim().toLowerCase() || 'oda-' + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('cm_saved_pass', roomPassword.trim());
    socket.emit('join_room', { roomId: finalRoomId, password: roomPassword.trim(), maxUsers, userId, userCity });
  };

  const handleJoinRoomSubmit = (e) => {
    e.preventDefault();
    if (!joinRoomInput.trim()) return;
    localStorage.setItem('cm_saved_pass', joinPassInput.trim());
    socket.emit('join_room', { roomId: joinRoomInput.trim().toLowerCase(), password: joinPassInput.trim(), userId, userCity });
  };

  const handleLeaveRoom = () => {
    socket.emit('leave_room');
    setInRoom(false);
    setMediaType('none');
    setMediaSrc('');
    setMessages([]);
    localStorage.removeItem('cm_saved_room');
    localStorage.removeItem('cm_saved_pass');
    window.history.replaceState({}, '', window.location.pathname);
  };

  const sendAction = (type, payload) => {
    if (socket) socket.emit('room_action', { roomId, type, payload: { ...payload, mediaType } });
  };

  const handleModeChange = (mode) => { setPlayMode(mode); socket.emit('change_play_mode', { roomId, mode }); };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCategoryInput.trim()) return;
    socket.emit('create_category', { roomId, categoryName: newCategoryInput.trim() });
    setNewCategoryInput('');
  };

  const handleMediaEnd = () => {
    if (!playlist || playlist.length === 0) return;
    let nextTrack;
    if (playMode === 'shuffle') {
      nextTrack = playlist[Math.floor(Math.random() * playlist.length)];
    } else {
      const activeList = playMode === 'alphabetical' ? [...playlist].sort((a, b) => a.title.localeCompare(b.title, 'tr')) : playlist;
      const currentIndex = activeList.findIndex(item => item.src === mediaSrc);
      nextTrack = activeList[(currentIndex + 1) % activeList.length];
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
    if (searchInput.includes('http://') || searchInput.includes('https://')) media = processUrl(searchInput);
    else if (searchResults.length > 0) media = { type: 'youtube', src: searchResults[0].src };
    else return;
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
      item = { id: Date.now() + Math.random().toString(), title: 'Eklenen Medya Linki', type: media.type, src: media.src, addedBy: username, category: targetAddCategory };
    } else if (searchResults.length > 0) {
      const song = searchResults[0];
      item = { id: Date.now() + Math.random().toString(), title: song.title, type: 'youtube', src: song.src, addedBy: username, category: targetAddCategory };
    } else return;
    socket.emit('add_to_playlist', { roomId, item });
    setSearchInput('');
    setSearchResults([]);
  };

  const handleSelectSearchResult = (song, playImmediately = true) => {
    if (!song) return;
    const trackItem = { id: Date.now() + Math.random().toString(), title: song.title, type: 'youtube', src: song.src, addedBy: username, category: targetAddCategory };
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
    const newMsg = { senderId: mySocketId, text: chatInput, sender: username || 'İzleyici', avatar: myAvatar, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, newMsg]);
    sendAction('CHAT_MESSAGE', newMsg);
    setChatInput('');
  };

  const sendReaction = (emoji) => {
    const reaction = { id: Date.now() + Math.random(), emoji, left: Math.floor(Math.random() * 80) + 10 };
    showFloatingEmoji(reaction);
    sendAction('REACTION', reaction);
  };

  const getFilteredPlaylist = () => {
    if (!Array.isArray(playlist)) return [];
    let filtered = playlist.filter(item => (item.category || 'Genel') === selectedCategory);
    if (playMode === 'alphabetical') {
      return [...filtered].sort((a, b) => a.title.localeCompare(b.title, 'tr'));
    }
    return filtered;
  };

  const styles = {
    app: {
      background: 'linear-gradient(135deg, #090d16 0%, #05070c 100%)',
      color: '#e9edef',
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
      overflow: 'hidden',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    card: {
      background: '#111b21',
      border: '1px solid #222d34',
      borderRadius: '16px',
      padding: '24px'
    },
    buttonPrimary: {
      background: 'linear-gradient(135deg, #00a884 0%, #008f6f 100%)',
      color: '#ffffff',
      border: 'none',
      padding: '12px 20px',
      borderRadius: '12px',
      fontWeight: '700',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(0, 168, 132, 0.3)'
    },
    input: {
      background: '#111b21',
      border: '1px solid #222d34',
      color: '#e9edef',
      padding: '12px 16px',
      borderRadius: '12px',
      fontSize: '14px',
      outline: 'none'
    }
  };

  // 1. ANA SAYFA (LANDING PAGE)
  if (!inRoom) {
    return (
      <div style={{ ...styles.app, overflowY: 'auto' }}>
        <header style={{ padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#090d16' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setInRoom(false)}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #ff4757, #00a884)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>❤️</div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', color: '#fff', fontWeight: '900', letterSpacing: '-0.5px' }}>Couple Meeting</h1>
              <span style={{ fontSize: '11px', color: '#00a884', fontWeight: 'bold' }}>Aynı Anda İzle & Dinle</span>
            </div>
          </div>

          <button onClick={() => setShowProfileModal(true)} style={{ background: '#111b21', color: '#e9edef', border: '1px solid #222d34', padding: '10px 18px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{myAvatar} {username} ({userCity})</span>
            <span>⚙️ Profil Düzenle</span>
          </button>
        </header>

        {showProfileModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ ...styles.card, width: '420px', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#00a884', fontSize: '20px', fontWeight: '800' }}>👤 Çift Profil Kartı</h3>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#8696a0', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>AVATAR SEÇİN</label>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', background: '#0b141a', padding: '12px', borderRadius: '14px', border: '1px solid #222d34' }}>
                  {AVATARS.map((emoji) => (
                    <span key={emoji} onClick={() => handleAvatarSelect(emoji)} style={{ fontSize: '26px', padding: '6px', borderRadius: '10px', cursor: 'pointer', background: myAvatar === emoji ? '#00a884' : 'transparent' }}>
                      {emoji}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                <label style={{ fontSize: '12px', color: '#8696a0', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>TAKMA AD</label>
                <input type="text" placeholder="Adınız" value={username} onChange={(e) => handleUsernameChange(e.target.value)} style={{ ...styles.input, width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                <label style={{ fontSize: '12px', color: '#8696a0', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>YAŞADIĞINIZ ŞEHİR</label>
                <select value={userCity} onChange={(e) => handleCityChange(e.target.value)} style={{ ...styles.input, width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}>
                  {CITIES.map(c => <option key={c} value={c} style={{ background: '#111b21' }}>{c}</option>)}
                </select>
              </div>
              <button onClick={() => setShowProfileModal(false)} style={{ ...styles.buttonPrimary, width: '100%' }}>Kaydet & Kapat</button>
            </div>
          </div>
        )}

        <section style={{ maxWidth: '1100px', margin: '50px auto 40px auto', padding: '0 24px', textAlign: 'center' }}>
          <span style={{ background: 'rgba(0, 168, 132, 0.15)', color: '#00a884', padding: '6px 18px', borderRadius: '30px', border: '1px solid rgba(0, 168, 132, 0.3)', fontWeight: 'bold', fontSize: '13px' }}>
            ✨ Uzak Mesafeleri Yakınlaştıran Ortak Müzik Platformu
          </span>

          <h2 style={{ fontSize: '48px', fontWeight: '900', color: '#fff', margin: '20px 0 16px 0', letterSpacing: '-1.5px', lineHeight: '1.2' }}>
            Aynı Anda Dinleyin,<br />
            <span style={{ color: '#00a884' }}>Aramızdaki Mesafeleri Unutun.</span>
          </h2>

          <div style={{ ...styles.card, maxWidth: '560px', margin: '0 auto 60px auto', textAlign: 'left', border: '1px solid #00a88444', boxShadow: '0 30px 60px rgba(0,0,0,0.8)' }}>
            {errorMessage && (
              <div style={{ background: '#ea0038', color: '#fff', padding: '12px 16px', borderRadius: '12px', fontWeight: 'bold', marginBottom: '20px', fontSize: '14px' }}>
                {errorMessage}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#0b141a', padding: '6px', borderRadius: '14px', border: '1px solid #222d34' }}>
              <button onClick={() => setActiveTab('create')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: activeTab === 'create' ? '#00a884' : 'transparent', color: activeTab === 'create' ? '#fff' : '#8696a0', fontWeight: 'bold', cursor: 'pointer' }}>
                🚀 Oda Oluştur
              </button>
              <button onClick={() => setActiveTab('join')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: activeTab === 'join' ? '#00a884' : 'transparent', color: activeTab === 'join' ? '#fff' : '#8696a0', fontWeight: 'bold', cursor: 'pointer' }}>
                🚪 Odaya Katıl
              </button>
            </div>

            {activeTab === 'create' ? (
              <form onSubmit={handleCreateRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input type="text" placeholder="Oda İsmi Belirleyin" value={roomId} onChange={(e) => setRoomId(e.target.value)} style={styles.input} />
                <input type="password" placeholder="Şifre (İsteğe Bağlı)" value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)} style={styles.input} />
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0b141a', padding: '12px 16px', borderRadius: '12px', border: '1px solid #222d34' }}>
                  <span style={{ fontSize: '13px', color: '#8696a0' }}>Kişi Sınırı:</span>
                  <select value={maxUsers} onChange={(e) => setMaxUsers(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#00a884', fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}>
                    <option value="2" style={{ background: '#111b21' }}>2 Kişi (Çiftler)</option>
                    <option value="4" style={{ background: '#111b21' }}>4 Kişi (Grup)</option>
                    <option value="8" style={{ background: '#111b21' }}>8 Kişi (Kalabalık)</option>
                  </select>
                </div>

                <button type="submit" style={styles.buttonPrimary}>Odayı Başlat ve Bağlan 🚀</button>
              </form>
            ) : (
              <form onSubmit={handleJoinRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input type="text" placeholder="Oda İsmi Girin" value={joinRoomInput} onChange={(e) => setJoinRoomInput(e.target.value)} style={styles.input} />
                <input type="password" placeholder="Şifre (Varsa)" value={joinPassInput} onChange={(e) => setJoinPassInput(e.target.value)} style={styles.input} />
                <button type="submit" style={{ ...styles.buttonPrimary, background: 'linear-gradient(135deg, #3742fa 0%, #5352ed 100%)' }}>Odaya Giriş Yap 🚪</button>
              </form>
            )}

            {recentRooms.length > 0 && (
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #222d34' }}>
                <span style={{ fontSize: '11px', color: '#8696a0', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>KAYITLI ODALARIN</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {recentRooms.map((rId) => (
                    <button key={rId} onClick={() => socket.emit('join_room', { roomId: rId, password: '', userId, userCity })} style={{ background: '#202c33', color: '#00a884', border: '1px solid #00a88433', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                      🚪 {rId}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
        
        {/* FOOTER STATUS */}
        <footer style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', color: '#8696a0' }}>
          <span style={{ color: isConnected ? '#00a884' : '#ff4757', fontWeight: 'bold' }}>
            ● Sunucu Durumu: {isConnected ? 'Aktif (Bağlandı)' : 'Bağlanıyor...'}
          </span>
        </footer>
      </div>
    );
  }

  // 2. ODA EKRANI (KLASÖRLÜ ÇALMA LİSTESİ VE MESAFE SAYAÇLARI)
  return (
    <div style={{ ...styles.app, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes floatUp { 0% { transform: translateY(0) scale(0.8); opacity: 1; } 100% { transform: translateY(-300px) scale(1.6); opacity: 0; } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0b141a; }
        ::-webkit-scrollbar-thumb { background: #222d34; border-radius: 4px; }
      `}</style>

      {/* HEADER BAR */}
      <header style={{ height: '60px', padding: '0 28px', background: '#111b21', borderBottom: '1px solid #222d34', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, width: '100vw', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={handleLeaveRoom}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>❤️</div>
          <h2 style={{ margin: 0, color: '#00a884', fontSize: '18px', fontWeight: '900' }}>Couple Meeting</h2>
          
          <span style={{ fontSize: '11px', background: 'rgba(0, 168, 132, 0.15)', color: '#00a884', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', border: '1px solid rgba(0, 168, 132, 0.3)' }}>
            Oda: {roomId} ({currentRoomInfo.userCount}/{currentRoomInfo.maxUsers})
          </span>

          {distanceKm && (
            <span style={{ fontSize: '11px', background: 'rgba(245, 176, 65, 0.15)', color: '#f5b041', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', border: '1px solid rgba(245, 176, 65, 0.3)' }}>
              📍 Mesafe: {distanceKm} km | ❤️ Birlikte Dinleme: Bugün
            </span>
          )}
        </div>

        <button onClick={handleLeaveRoom} style={{ background: '#202c33', color: '#e9edef', border: '1px solid #222d34', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
          Ana Sayfa 🚪
        </button>
      </header>

      {/* MAIN VIEWPORT */}
      <div style={{ flex: 1, display: 'flex', width: '100vw', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
        
        {/* SOL: PLAYER EKRANI */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000', position: 'relative' }}>
          
          {/* ARAMA VE LINK BAR */}
          <div style={{ padding: '12px 20px', background: '#111b21', borderBottom: '1px solid #222d34', zIndex: 999, display: 'flex', gap: '10px', alignItems: 'center', position: 'relative' }}>
            <input 
              type="text" 
              placeholder="🔍 Şarkı/Video Adı Yazın veya Link Yapıştırın..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ ...styles.input, flex: 1 }}
            />

            {/* HEDEF KLASÖR SEÇİMİ */}
            <select value={targetAddCategory} onChange={(e) => setTargetAddCategory(e.target.value)} style={{ ...styles.input, background: '#202c33', color: '#00a884', fontWeight: 'bold', cursor: 'pointer' }}>
              {categories.map(cat => <option key={cat} value={cat} style={{ background: '#111b21', color: '#fff' }}>📁 {cat}</option>)}
            </select>

            <button onClick={handleDirectPlay} style={{ ...styles.buttonPrimary, background: '#00a884' }}>▶ Oynat</button>
            <button onClick={handleAddToPlaylist} style={{ ...styles.buttonPrimary, background: '#008f6f' }}>➕ Listeye Ekle</button>

            {/* CANLI ARAMA DROPDOWN */}
            {(searchResults.length > 0 || isSearching) && (
              <div style={{ position: 'absolute', top: '62px', left: '20px', right: '20px', ...styles.card, padding: '14px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {isSearching && <div style={{ color: '#00a884', fontSize: '13px', fontWeight: 'bold' }}>⚡ YouTube Aranıyor...</div>}
                {searchResults.map((song) => (
                  <div key={song.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#111b21', padding: '8px 12px', borderRadius: '10px', border: '1px solid #222d34' }}>
                    <img src={song.thumbnail} alt={song.title} style={{ width: '60px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, overflow: 'hidden', fontSize: '13px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{song.title}</div>
                    <button onClick={() => handleSelectSearchResult(song, true)} style={{ ...styles.buttonPrimary, padding: '6px 12px', fontSize: '12px', background: '#00a884' }}>▶ Çal</button>
                    <button onClick={() => handleSelectSearchResult(song, false)} style={{ ...styles.buttonPrimary, padding: '6px 12px', fontSize: '12px', background: '#008f6f' }}>+ Klasöre Ekle</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SAHNE */}
          <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0b141a' }}>
            {mediaType === 'none' && (
              <div style={{ textAlign: 'center', color: '#8696a0' }}>
                <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎵</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Yukarıdan Şarkı Aratın veya Kitaplık Klasörlerinden Seçin!</div>
              </div>
            )}

            {mediaType === 'youtube' && (
              <YouTube videoId={mediaSrc} opts={{ height: '100%', width: '100%', playerVars: { autoplay: 1, controls: 1 } }} style={{ width: '100%', height: '100%' }} onReady={(e) => { ytPlayerRef.current = e.target; }} onEnd={handleMediaEnd} />
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

          {/* KONTROLLER */}
          <div style={{ padding: '14px 24px', background: '#111b21', borderTop: '1px solid #222d34', display: 'flex', gap: '14px', alignItems: 'center' }}>
            <button onClick={handlePlay} style={{ ...styles.buttonPrimary, flex: 1, background: '#00a884' }}>▶ Ortak Oynat</button>
            <button onClick={handlePause} style={{ ...styles.buttonPrimary, flex: 1, background: '#ffa502' }}>⏸ Ortak Durdur</button>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['❤️', '🔥', '😂', '😮', '👏', '😍'].map((emoji) => (
                <button key={emoji} onClick={() => sendReaction(emoji)} style={{ background: '#202c33', border: '1px solid #222d34', fontSize: '20px', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer' }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SAĞ: WHATSAPP SOHBET VE KLASÖRLÜ ÇALMA LİSTESİ */}
        <div style={{ width: '380px', background: '#111b21', borderLeft: '1px solid #222d34', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #222d34', background: '#0b141a' }}>
            <button onClick={() => setSidebarTab('chat')} style={{ flex: 1, padding: '14px', border: 'none', background: sidebarTab === 'chat' ? '#111b21' : 'transparent', color: sidebarTab === 'chat' ? '#00a884' : '#8696a0', fontWeight: 'bold', cursor: 'pointer' }}>💬 Sohbet</button>
            <button onClick={() => setSidebarTab('playlist')} style={{ flex: 1, padding: '14px', border: 'none', background: sidebarTab === 'playlist' ? '#111b21' : 'transparent', color: sidebarTab === 'playlist' ? '#00a884' : '#8696a0', fontWeight: 'bold', cursor: 'pointer' }}>📚 Kitaplık ({playlist ? playlist.length : 0})</button>
          </div>

          {sidebarTab === 'chat' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0b141a' }}>
              {/* WHATSAPP SOHBET AKIŞI */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === mySocketId || msg.sender === username;
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: isMe ? 'row-reverse' : 'row',
                        alignItems: 'flex-end',
                        gap: '8px',
                        maxWidth: '85%',
                        alignSelf: isMe ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <span style={{ fontSize: '18px', paddingBottom: '2px' }}>{msg.avatar || '🐱'}</span>
                      <div 
                        style={{ 
                          background: isMe ? '#005c4b' : '#202c33', 
                          color: '#e9edef', 
                          padding: '8px 12px', 
                          borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                          minWidth: '80px'
                        }}
                      >
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: isMe ? '#53bdeb' : '#25d366', marginBottom: '2px' }}>
                          {msg.sender}
                        </div>
                        <div style={{ fontSize: '13px', wordBreak: 'break-word', lineHeight: '1.4' }}>
                          {msg.text}
                        </div>
                        <div style={{ fontSize: '9px', color: '#8696a0', textAlign: 'right', marginTop: '4px' }}>
                          {msg.time}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              <form onSubmit={handleSendMessage} style={{ padding: '12px', borderTop: '1px solid #222d34', display: 'flex', gap: '8px', background: '#111b21' }}>
                <input type="text" placeholder="Bir mesaj yazın..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} style={{ ...styles.input, flex: 1, borderRadius: '20px', background: '#202c33', border: 'none', padding: '10px 16px' }} />
                <button type="submit" style={{ ...styles.buttonPrimary, borderRadius: '50%', width: '42px', height: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>➤</button>
              </form>
            </div>
          ) : (
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: '#0b141a' }}>
              
              {/* KLASÖR / KİTAPLIK SEÇİMİ */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {categories.map((cat) => (
                  <button 
                    key={cat} 
                    onClick={() => setSelectedCategory(cat)}
                    style={{ background: selectedCategory === cat ? '#00a884' : '#111b21', color: selectedCategory === cat ? '#fff' : '#8696a0', border: '1px solid #222d34', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                  >
                    📁 {cat}
                  </button>
                ))}
              </div>

              {/* YENİ KLASÖR OLUŞTURMA */}
              <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '6px' }}>
                <input type="text" placeholder="+ Yeni Klasör Aç..." value={newCategoryInput} onChange={(e) => setNewCategoryInput(e.target.value)} style={{ ...styles.input, flex: 1, padding: '8px 12px', fontSize: '12px' }} />
                <button type="submit" style={{ ...styles.buttonPrimary, padding: '8px 12px', fontSize: '12px' }}>Ekle</button>
              </form>

              {/* MOD BUTONLARI */}
              <div style={{ display: 'flex', gap: '6px', background: '#111b21', padding: '4px', borderRadius: '12px', border: '1px solid #222d34' }}>
                <button onClick={() => handleModeChange('sequence')} style={{ flex: 1, padding: '6px', borderRadius: '8px', border: 'none', background: playMode === 'sequence' ? '#00a884' : 'transparent', color: playMode === 'sequence' ? '#fff' : '#8696a0', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>▶ Sırayla</button>
                <button onClick={() => handleModeChange('shuffle')} style={{ flex: 1, padding: '6px', borderRadius: '8px', border: 'none', background: playMode === 'shuffle' ? '#00a884' : 'transparent', color: playMode === 'shuffle' ? '#fff' : '#8696a0', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>🔀 Rastgele</button>
                <button onClick={() => handleModeChange('alphabetical')} style={{ flex: 1, padding: '6px', borderRadius: '8px', border: 'none', background: playMode === 'alphabetical' ? '#00a884' : 'transparent', color: playMode === 'alphabetical' ? '#fff' : '#8696a0', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>🔤 A-Z</button>
              </div>

              {/* KLASÖR İÇERİĞİ */}
              {getFilteredPlaylist().length === 0 ? (
                <div style={{ color: '#8696a0', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>Bu klasör henüz boş. Arama yaparak ekleyebilirsiniz!</div>
              ) : (
                getFilteredPlaylist().map((item) => (
                  <div key={item.id} onClick={() => handleSelectPlaylistItem(item)} style={{ background: mediaSrc === item.src ? 'rgba(0, 168, 132, 0.15)' : '#111b21', border: mediaSrc === item.src ? '1px solid #00a884' : '1px solid #222d34', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.title}</div>
                    <button onClick={(e) => handleRemovePlaylistItem(item.id, e)} style={{ background: 'transparent', border: 'none', color: '#ff4757', cursor: 'pointer' }}>🗑️</button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;