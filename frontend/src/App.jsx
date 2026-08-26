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

const THEMES = {
  default: { bg: 'linear-gradient(135deg, #090d16 0%, #05070c 100%)', cardBg: '#111b21', primary: '#00a884' },
  purple: { bg: 'linear-gradient(135deg, #130f40 0%, #000000 100%)', cardBg: '#1e1b4b', primary: '#a855f7' },
  blue: { bg: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)', cardBg: '#1e293b', primary: '#38bdf8' },
  rose: { bg: 'linear-gradient(135deg, #2a0813 0%, #05070c 100%)', cardBg: '#3f0e1e', primary: '#fb7185' }
};

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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [pendingMediaItem, setPendingMediaItem] = useState(null);
  const [modalTargetCategory, setModalTargetCategory] = useState('Genel');

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
  const [roomName, setRoomName] = useState('');
  const [hostUserId, setHostUserId] = useState('');
  const [roomTheme, setRoomTheme] = useState('default');
  const [roomUsersList, setRoomUsersList] = useState([]);

  const [roomPassword, setRoomPassword] = useState('');
  const [maxUsers, setMaxUsers] = useState('2');
  const [joinRoomInput, setJoinRoomInput] = useState('');
  const [joinPassInput, setJoinPassInput] = useState('');

  const [publicRooms, setPublicRooms] = useState([]);
  const [currentRoomInfo, setCurrentRoomInfo] = useState({ userCount: 1, maxUsers: 2 });

  const [mediaType, setMediaType] = useState('none'); 
  const [mediaSrc, setMediaSrc] = useState('');
  
  const [playlist, setPlaylist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cm_local_playlist')) || []; } catch(e) { return []; }
  });
  const [categories, setCategories] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cm_local_categories')) || ['Genel']; } catch(e) { return ['Genel']; }
  });

  const [selectedCategory, setSelectedCategory] = useState('Genel');
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

  // Ayarlar Formu State'leri
  const [editRoomNameInput, setEditRoomNameInput] = useState('');

  const ytPlayerRef = useRef(null);
  const customVideoRef = useRef(null);
  const chatBottomRef = useRef(null);

  const currentTheme = THEMES[roomTheme] || THEMES.default;

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
      socket.emit('join_room', { roomId: targetRoom, password: savedPass, userId, userCity, username, avatar: myAvatar });
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
      setRoomName(data.roomName || data.roomId);
      setHostUserId(data.hostUserId);
      setRoomTheme(data.theme || 'default');
      setMySocketId(data.socketId);
      if (data.users) setRoomUsersList(data.users);
      setCurrentRoomInfo({ userCount: data.userCount, maxUsers: data.maxUsers });

      if (Array.isArray(data.playlist)) {
        setPlaylist(data.playlist);
        localStorage.setItem('cm_local_playlist', JSON.stringify(data.playlist));
      }
      if (Array.isArray(data.categories)) {
        setCategories(data.categories);
        localStorage.setItem('cm_local_categories', JSON.stringify(data.categories));
      }
      if (data.playMode) setPlayMode(data.playMode);

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

    socket.on('room_user_count_update', (data) => {
      setCurrentRoomInfo({ userCount: data.userCount, maxUsers: data.maxUsers });
      if (data.users) setRoomUsersList(data.users);
      if (data.hostUserId) setHostUserId(data.hostUserId);
      if (data.roomName) setRoomName(data.roomName);
      if (data.theme) setRoomTheme(data.theme);
    });

    socket.on('room_settings_updated', (data) => {
      if (data.roomName) setRoomName(data.roomName);
      if (data.theme) setRoomTheme(data.theme);
      if (data.hostUserId) setHostUserId(data.hostUserId);
    });

    socket.on('kicked_from_room', (msg) => {
      setErrorMessage(msg);
      handleLeaveRoom();
    });

    socket.on('categories_updated', (cats) => {
      setCategories(cats);
      localStorage.setItem('cm_local_categories', JSON.stringify(cats));
    });

    socket.on('playlist_updated', (data) => {
      const newPlaylist = Array.isArray(data) ? data : (data.playlist || []);
      setPlaylist(newPlaylist);
      localStorage.setItem('cm_local_playlist', JSON.stringify(newPlaylist));
      if (data && data.playMode) setPlayMode(data.playMode);
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
      socket.off('room_settings_updated'); socket.off('kicked_from_room'); socket.off('categories_updated');
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
    socket.emit('join_room', { roomId: finalRoomId, password: roomPassword.trim(), maxUsers, userId, userCity, username, avatar: myAvatar });
  };

  const handleJoinRoomSubmit = (e) => {
    e.preventDefault();
    if (!joinRoomInput.trim()) return;
    localStorage.setItem('cm_saved_pass', joinPassInput.trim());
    socket.emit('join_room', { roomId: joinRoomInput.trim().toLowerCase(), password: joinPassInput.trim(), userId, userCity, username, avatar: myAvatar });
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
    setSelectedCategory(newCategoryInput.trim());
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
  };

  const handleOpenAddModal = (song = null) => {
    let item;
    if (song) {
      item = { id: Date.now() + Math.random().toString(), title: song.title, type: 'youtube', src: song.src, addedBy: username };
    } else if (searchInput.trim()) {
      if (searchInput.includes('http://') || searchInput.includes('https://')) {
        const media = processUrl(searchInput);
        item = { id: Date.now() + Math.random().toString(), title: 'Eklenen Medya / Dizi Linki', type: media.type, src: media.src, addedBy: username };
      } else if (searchResults.length > 0) {
        const s = searchResults[0];
        item = { id: Date.now() + Math.random().toString(), title: s.title, type: 'youtube', src: s.src, addedBy: username };
      }
    }

    if (item) {
      setPendingMediaItem(item);
      setModalTargetCategory(selectedCategory || 'Genel');
      setShowFolderModal(true);
    }
  };

  const confirmAddToPlaylist = () => {
    if (!pendingMediaItem) return;
    const finalItem = { ...pendingMediaItem, category: modalTargetCategory };
    socket.emit('add_to_playlist', { roomId, item: finalItem });
    setShowFolderModal(false);
    setPendingMediaItem(null);
    // ARAMA ÇUBUĞU SIFIRLANMIYOR: Kullanıcı üst üste ekleyebilsin
  };

  const handleSelectSearchResult = (song, playImmediately = true) => {
    if (!song) return;
    if (playImmediately) {
      setMediaType('youtube');
      setMediaSrc(song.src);
      sendAction('CHANGE_MEDIA', { type: 'youtube', src: song.src });
    } else {
      handleOpenAddModal(song);
    }
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

  const handleSaveSettings = () => {
    socket.emit('update_room_settings', {
      roomId,
      newName: editRoomNameInput.trim() || roomName,
      newTheme: roomTheme
    });
    setShowSettingsModal(false);
  };

  const handleKickUser = (targetUserId) => {
    socket.emit('kick_user', { roomId, targetUserId });
  };

  const handleTransferAdmin = (targetUserId) => {
    socket.emit('update_room_settings', { roomId, newHostUserId: targetUserId });
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
      background: currentTheme.bg,
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
      background: currentTheme.cardBg,
      border: '1px solid #222d34',
      borderRadius: '16px',
      padding: '24px'
    },
    buttonPrimary: {
      background: `linear-gradient(135deg, ${currentTheme.primary} 0%, #008f6f 100%)`,
      color: '#ffffff',
      border: 'none',
      padding: '10px 16px',
      borderRadius: '10px',
      fontWeight: '700',
      cursor: 'pointer'
    },
    input: {
      background: '#111b21',
      border: '1px solid #222d34',
      color: '#e9edef',
      padding: '10px 14px',
      borderRadius: '10px',
      fontSize: '13px',
      outline: 'none'
    }
  };

  if (!inRoom) {
    return (
      <div style={{ ...styles.app, overflowY: 'auto' }}>
        <header style={{ padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#090d16' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setInRoom(false)}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #ff4757, #00a884)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>❤️⚡</div>
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
            ✨ Uzak Mesafeleri Yakınlaştıran Canlı Birlikte İzleme Platformu
          </span>

          <h2 style={{ fontSize: '52px', fontWeight: '900', color: '#fff', margin: '20px 0 16px 0', letterSpacing: '-1.5px', lineHeight: '1.2' }}>
            Aynı Anda İzleyin & Dinleyin,<br />
            <span style={{ color: '#00a884' }}>Aramızdaki Mesafeleri Unutun.</span>
          </h2>

          <p style={{ color: '#8696a0', fontSize: '18px', maxWidth: '720px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
            Sevgilinizle veya arkadaşlarınızla YouTube videolarını, dizileri ve müzikleri kalıcı listeler halinde düzenleyin.
          </p>

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
                <span style={{ fontSize: '11px', color: '#8696a0', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>SON GİRDİĞİN ODALAR</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {recentRooms.map((rId) => (
                    <button key={rId} onClick={() => socket.emit('join_room', { roomId: rId, password: '', userId, userCity, username, avatar: myAvatar })} style={{ background: '#202c33', color: '#00a884', border: '1px solid #00a88433', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                      🚪 {rId}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div style={{ ...styles.app, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes floatUp { 0% { transform: translateY(0) scale(0.8); opacity: 1; } 100% { transform: translateY(-300px) scale(1.6); opacity: 0; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0b141a; }
        ::-webkit-scrollbar-thumb { background: #222d34; border-radius: 4px; }
      `}</style>

      {/* KLASÖR POP-UP */}
      {showFolderModal && pendingMediaItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ ...styles.card, width: '400px', textAlign: 'left' }}>
            <h3 style={{ margin: '0 0 12px 0', color: currentTheme.primary, fontSize: '18px', fontWeight: '800' }}>📁 Hangi Klasöre Eklensin?</h3>
            <p style={{ fontSize: '13px', color: '#8696a0', marginBottom: '16px' }}>
              <strong>{pendingMediaItem.title}</strong> öğesini eklemek istediğiniz klasörü seçin:
            </p>

            <div style={{ marginBottom: '20px' }}>
              <select value={modalTargetCategory} onChange={(e) => setModalTargetCategory(e.target.value)} style={{ ...styles.input, width: '100%', boxSizing: 'border-box', fontWeight: 'bold', color: currentTheme.primary, cursor: 'pointer' }}>
                {categories.map(cat => <option key={cat} value={cat} style={{ background: '#111b21', color: '#fff' }}>📁 {cat}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowFolderModal(false)} style={{ flex: 1, padding: '10px', background: '#202c33', color: '#fff', border: '1px solid #222d34', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>İptal</button>
              <button onClick={confirmAddToPlaylist} style={{ flex: 1, ...styles.buttonPrimary }}>Listeye Kaydet ➕</button>
            </div>
          </div>
        </div>
      )}

      {/* SAĞ ÜST ODA AYARLARI MODALI */}
      {showSettingsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ ...styles.card, width: '460px', textAlign: 'left' }}>
            <h3 style={{ margin: '0 0 16px 0', color: currentTheme.primary, fontSize: '18px', fontWeight: '800' }}>⚙️ Oda Ayarları & Kişiler</h3>

            {/* ODA ADI VE TEMA DEĞİŞTİRME (Sadece Admin Yapabilir) */}
            {hostUserId === userId ? (
              <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#8696a0', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>ODA İSMİ DEĞİŞTİR</label>
                  <input type="text" value={editRoomNameInput || roomName} onChange={(e) => setEditRoomNameInput(e.target.value)} style={{ ...styles.input, width: '100%', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#8696a0', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>ODA TEMASI SEÇ</label>
                  <select value={roomTheme} onChange={(e) => setRoomTheme(e.target.value)} style={{ ...styles.input, width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}>
                    <option value="default" style={{ background: '#111b21' }}>Koyu Yeşil (Varsayılan)</option>
                    <option value="purple" style={{ background: '#111b21' }}>Gece Moru</option>
                    <option value="blue" style={{ background: '#111b21' }}>Okyanus Mavisi</option>
                    <option value="rose" style={{ background: '#111b21' }}>Romantik Kırmızı</option>
                  </select>
                </div>

                <button onClick={handleSaveSettings} style={{ ...styles.buttonPrimary, width: '100%' }}>Ayarları Kaydet</button>
              </div>
            ) : (
              <div style={{ background: '#202c33', padding: '10px', borderRadius: '10px', fontSize: '12px', color: '#8696a0', marginBottom: '16px' }}>
                ℹ️ Oda adını ve temasını sadece oda yöneticisi değiştirebilir.
              </div>
            )}

            {/* AKTİF KİŞİ LİSTESİ VE KICK/DEVİR İŞLEMLERİ */}
            <div>
              <label style={{ fontSize: '11px', color: '#8696a0', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>ODADAKİ KİŞİLER ({roomUsersList.length})</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {roomUsersList.map(u => (
                  <div key={u.userId} style={{ background: '#0b141a', padding: '8px 12px', borderRadius: '10px', border: '1px solid #222d34', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>
                      {u.avatar} {u.username} {u.userId === hostUserId && '👑 (Admin)'}
                    </span>
                    {hostUserId === userId && u.userId !== userId && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleTransferAdmin(u.userId)} style={{ background: '#ffa502', border: 'none', color: '#000', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>👑 Admin Yap</button>
                        <button onClick={() => handleKickUser(u.userId)} style={{ background: '#ff4757', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>🚫 At</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setShowSettingsModal(false)} style={{ background: '#202c33', color: '#fff', border: '1px solid #222d34', width: '100%', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', marginTop: '16px' }}>Kapat</button>
          </div>
        </div>
      )}

      {/* HEADER BAR */}
      <header style={{ height: '60px', padding: '0 28px', background: currentTheme.cardBg, borderBottom: '1px solid #222d34', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, width: '100vw', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={handleLeaveRoom}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: currentTheme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>❤️⚡</div>
          <h2 style={{ margin: 0, color: currentTheme.primary, fontSize: '18px', fontWeight: '900' }}>{roomName}</h2>
          
          <span style={{ fontSize: '11px', background: 'rgba(0, 168, 132, 0.15)', color: currentTheme.primary, padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', border: '1px solid rgba(0, 168, 132, 0.3)' }}>
            Kişi: {currentRoomInfo.userCount}/{currentRoomInfo.maxUsers}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={() => setShowSettingsModal(true)} style={{ background: '#202c33', color: '#e9edef', border: '1px solid #222d34', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            ⚙️ Oda Ayarları
          </button>
          <button onClick={handleLeaveRoom} style={{ background: '#202c33', color: '#e9edef', border: '1px solid #222d34', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            Ana Sayfa 🚪
          </button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', width: '100vw', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
        
        {/* SOL: PLAYER EKRANI */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000', position: 'relative' }}>
          
          {/* ARAMA BAR */}
          <div style={{ padding: '12px 20px', background: currentTheme.cardBg, borderBottom: '1px solid #222d34', zIndex: 999, display: 'flex', gap: '10px', alignItems: 'center', position: 'relative' }}>
            <input 
              type="text" 
              placeholder="🔍 Şarkı/Dizi Adı Yazın veya Link Yapıştırın..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ ...styles.input, flex: 1 }}
            />

            <button onClick={handleDirectPlay} style={{ ...styles.buttonPrimary, background: currentTheme.primary }}>▶ Oynat</button>
            <button onClick={() => handleOpenAddModal(null)} style={{ ...styles.buttonPrimary, background: '#008f6f' }}>➕ Listeye Ekle</button>

            {(searchResults.length > 0 || isSearching) && (
              <div style={{ position: 'absolute', top: '62px', left: '20px', right: '20px', ...styles.card, padding: '14px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {isSearching && <div style={{ color: currentTheme.primary, fontSize: '13px', fontWeight: 'bold' }}>⚡ YouTube Aranıyor...</div>}
                {searchResults.map((song) => (
                  <div key={song.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#111b21', padding: '8px 12px', borderRadius: '10px', border: '1px solid #222d34' }}>
                    <img src={song.thumbnail} alt={song.title} style={{ width: '60px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, overflow: 'hidden', fontSize: '13px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{song.title}</div>
                    <button onClick={() => handleSelectSearchResult(song, true)} style={{ ...styles.buttonPrimary, padding: '6px 12px', fontSize: '12px' }}>▶ Çal</button>
                    <button onClick={() => handleSelectSearchResult(song, false)} style={{ ...styles.buttonPrimary, padding: '6px 12px', fontSize: '12px', background: '#008f6f' }}>+ Klasöre Ekle</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0b141a' }}>
            {mediaType === 'none' && (
              <div style={{ textAlign: 'center', color: '#8696a0' }}>
                <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎵</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Yukarıdan Medya Aratın veya Kitaplıktan Seçin!</div>
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

          <div style={{ padding: '14px 24px', background: currentTheme.cardBg, borderTop: '1px solid #222d34', display: 'flex', gap: '14px', alignItems: 'center' }}>
            <button onClick={handlePlay} style={{ ...styles.buttonPrimary, flex: 1 }}>▶ Ortak Oynat</button>
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

        {/* SAĞ: SOHBET (MESAJ BOYUTLARI KÜÇÜLTÜLDÜ) */}
        <div style={{ width: '380px', background: currentTheme.cardBg, borderLeft: '1px solid #222d34', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #222d34', background: '#0b141a' }}>
            <button onClick={() => setSidebarTab('chat')} style={{ flex: 1, padding: '12px', border: 'none', background: sidebarTab === 'chat' ? currentTheme.cardBg : 'transparent', color: sidebarTab === 'chat' ? currentTheme.primary : '#8696a0', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>💬 Sohbet</button>
            <button onClick={() => setSidebarTab('playlist')} style={{ flex: 1, padding: '12px', border: 'none', background: sidebarTab === 'playlist' ? currentTheme.cardBg : 'transparent', color: sidebarTab === 'playlist' ? currentTheme.primary : '#8696a0', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>📚 Kitaplık ({playlist ? playlist.length : 0})</button>
          </div>

          {sidebarTab === 'chat' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0b141a' }}>
              
              {/* KÜÇÜLTÜLMÜŞ SIKI SOHBET BALONCUKLARI */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === mySocketId || msg.sender === username;
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: isMe ? 'row-reverse' : 'row',
                        alignItems: 'flex-end',
                        gap: '6px',
                        maxWidth: '85%',
                        alignSelf: isMe ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <span style={{ fontSize: '14px', paddingBottom: '1px' }}>{msg.avatar || '🐱'}</span>
                      <div 
                        style={{ 
                          background: isMe ? '#005c4b' : '#202c33', 
                          color: '#e9edef', 
                          padding: '5px 9px', 
                          borderRadius: isMe ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                          minWidth: '60px'
                        }}
                      >
                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: isMe ? '#53bdeb' : '#25d366', marginBottom: '1px' }}>
                          {msg.sender}
                        </div>
                        <div style={{ fontSize: '12px', wordBreak: 'break-word', lineHeight: '1.3' }}>
                          {msg.text}
                        </div>
                        <div style={{ fontSize: '8px', color: '#8696a0', textAlign: 'right', marginTop: '2px' }}>
                          {msg.time}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              <form onSubmit={handleSendMessage} style={{ padding: '8px 10px', borderTop: '1px solid #222d34', display: 'flex', gap: '6px', background: currentTheme.cardBg }}>
                <input type="text" placeholder="Bir mesaj yazın..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} style={{ ...styles.input, flex: 1, borderRadius: '16px', background: '#202c33', border: 'none', padding: '8px 12px', fontSize: '12px' }} />
                <button type="submit" style={{ ...styles.buttonPrimary, borderRadius: '50%', width: '34px', height: '34px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>➤</button>
              </form>
            </div>
          ) : (
            <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', background: '#0b141a' }}>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {categories.map((cat) => (
                  <button 
                    key={cat} 
                    onClick={() => setSelectedCategory(cat)}
                    style={{ background: selectedCategory === cat ? currentTheme.primary : '#111b21', color: selectedCategory === cat ? '#fff' : '#8696a0', border: '1px solid #222d34', padding: '5px 10px', borderRadius: '16px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                  >
                    📁 {cat}
                  </button>
                ))}
              </div>

              <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '6px' }}>
                <input type="text" placeholder="+ Yeni Klasör..." value={newCategoryInput} onChange={(e) => setNewCategoryInput(e.target.value)} style={{ ...styles.input, flex: 1, padding: '6px 10px', fontSize: '11px' }} />
                <button type="submit" style={{ ...styles.buttonPrimary, padding: '6px 10px', fontSize: '11px' }}>Aç</button>
              </form>

              <div style={{ display: 'flex', gap: '4px', background: '#111b21', padding: '3px', borderRadius: '10px', border: '1px solid #222d34' }}>
                <button onClick={() => handleModeChange('sequence')} style={{ flex: 1, padding: '5px', borderRadius: '6px', border: 'none', background: playMode === 'sequence' ? currentTheme.primary : 'transparent', color: playMode === 'sequence' ? '#fff' : '#8696a0', fontWeight: 'bold', cursor: 'pointer', fontSize: '10px' }}>▶ Sırayla</button>
                <button onClick={() => handleModeChange('shuffle')} style={{ flex: 1, padding: '5px', borderRadius: '6px', border: 'none', background: playMode === 'shuffle' ? currentTheme.primary : 'transparent', color: playMode === 'shuffle' ? '#fff' : '#8696a0', fontWeight: 'bold', cursor: 'pointer', fontSize: '10px' }}>🔀 Rastgele</button>
                <button onClick={() => handleModeChange('alphabetical')} style={{ flex: 1, padding: '5px', borderRadius: '6px', border: 'none', background: playMode === 'alphabetical' ? currentTheme.primary : 'transparent', color: playMode === 'alphabetical' ? '#fff' : '#8696a0', fontWeight: 'bold', cursor: 'pointer', fontSize: '10px' }}>🔤 A-Z</button>
              </div>

              {getFilteredPlaylist().length === 0 ? (
                <div style={{ color: '#8696a0', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>Bu klasör henüz boş.</div>
              ) : (
                getFilteredPlaylist().map((item) => (
                  <div key={item.id} onClick={() => handleSelectPlaylistItem(item)} style={{ background: mediaSrc === item.src ? 'rgba(0, 168, 132, 0.15)' : '#111b21', border: mediaSrc === item.src ? `1px solid ${currentTheme.primary}` : '1px solid #222d34', padding: '10px', borderRadius: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.title}</div>
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