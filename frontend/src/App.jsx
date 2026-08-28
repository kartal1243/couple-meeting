import { useEffect, useState, useRef, useMemo } from 'react';
import io from 'socket.io-client';
import YouTube from 'react-youtube';

const BACKEND_URL = 'https://couple-meeting.onrender.com';

const AVATARS = ['🐱', '🐶', '🦊', '🐼', '👑', '👸', '🦁', '🐻'];
const CITIES = ['Zonguldak', 'Tokat', 'İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Trabzon', 'Sivas', 'Adana', 'Eskişehir', 'Samsun', 'Kayseri', 'Konya', 'Diyarbakır'];

const THEMES = {
  default: { bg: 'linear-gradient(135deg, #090d16 0%, #05070c 100%)', cardBg: '#111b21', primary: '#00a884' },
  purple: { bg: 'linear-gradient(135deg, #130f40 0%, #000000 100%)', cardBg: '#1e1b4b', primary: '#a855f7' },
  blue: { bg: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)', cardBg: '#1e293b', primary: '#38bdf8' },
  rose: { bg: 'linear-gradient(135deg, #2a0813 0%, #05070c 100%)', cardBg: '#3f0e1e', primary: '#fb7185' }
};

const GLOBAL_CSS = `
  @keyframes floatUp { 0% { transform: translateY(0) scale(0.8); opacity: 1; } 100% { transform: translateY(-300px) scale(1.6); opacity: 0; } }
  @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
  @keyframes pulseDot { 0%, 100% { box-shadow: 0 0 0 0 rgba(0,200,150,.5); } 50% { box-shadow: 0 0 0 6px rgba(0,200,150,0); } }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: #0b141a; }
  ::-webkit-scrollbar-thumb { background: #2a3942; border-radius: 4px; }
  button { transition: transform .15s ease, filter .2s ease, box-shadow .2s ease !important; cursor: pointer; }
  button:hover { filter: brightness(1.12); transform: translateY(-1px); }
  button:active { transform: translateY(0) scale(.98); }
  input, select, textarea { transition: border-color .2s ease, box-shadow .2s ease !important; }
  input:focus, select:focus, textarea:focus { outline: none; border-color: var(--cm-primary, #00a884) !important; box-shadow: 0 0 0 3px rgba(0,168,132,.25); }
  
  html, body { overflow-x: hidden !important; overflow-y: auto !important; max-width: 100vw !important; min-height: 100% !important; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  * { min-width: 0; box-sizing: border-box !important; }

  /* MOBİL VE ODA İÇİ DÜZELTMELERİ */
  .cm-room-container { display: flex; width: 100vw; height: calc(100vh - 60px); overflow: hidden; }
  .cm-player-section { flex: 1; display: flex; flexDirection: column; background: #000; position: relative; min-height: 0; }
  .cm-chat-section { width: 380px; background: var(--cm-card-bg, #111b21); border-left: 1px solid #222d34; display: flex; flex-direction: column; }

  @media (max-width: 768px) {
    .cm-room-container { flex-direction: column !important; height: auto !important; min-height: calc(100vh - 60px); overflow-y: auto !important; }
    .cm-player-section { height: auto !important; flex: none !important; }
    .cm-video-wrapper { height: 260px !important; min-height: 260px !important; }
    .cm-chat-section { width: 100% !important; height: 500px !important; border-left: none !important; border-top: 1px solid #222d34 !important; }
    .cm-controls-bar { flex-wrap: wrap !important; gap: 8px !important; padding: 10px 12px !important; }
    .cm-controls-bar button { flex: 1 1 40% !important; font-size: 11px !important; padding: 8px !important; }
    .cm-reaction-btns { width: 100%; justify-content: center; margin-top: 4px; }
  }
`;

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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [pendingMediaItem, setPendingMediaItem] = useState(null);
  const [modalTargetCategory, setModalTargetCategory] = useState('Genel');
  const [sidebarTab, setSidebarTab] = useState('chat');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

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
    try { return JSON.parse(localStorage.getItem('cm_local_playlist')) || []; } catch (e) { return []; }
  });
  const [categories, setCategories] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cm_local_categories')) || ['Genel']; } catch (e) { return ['Genel']; }
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

  const [authUser, setAuthUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cm_auth_user')) || null; } catch (e) { return null; }
  });
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('cm_auth_token') || '');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authBusy, setAuthBusy] = useState(false);
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '', bio: '', avatar: '🐱' });
  const [friendSearch, setFriendSearch] = useState('');
  const [friendSearchResults, setFriendSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [globalMessages, setGlobalMessages] = useState([]);
  const [globalChatInput, setGlobalChatInput] = useState('');
  const [socialTab, setSocialTab] = useState('global');
  const [profileBioInput, setProfileBioInput] = useState('');
  const [profileStatusInput, setProfileStatusInput] = useState('');
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [editRoomNameInput, setEditRoomNameInput] = useState('');

  const ytPlayerRef = useRef(null);
  const customVideoRef = useRef(null);
  const chatBottomRef = useRef(null);
  const socketRef = useRef(null);

  if (!socketRef.current) {
    socketRef.current = io(BACKEND_URL, { transports: ['polling', 'websocket'], autoConnect: true });
  }
  const socket = socketRef.current;

  const persistAuth = (user, token) => {
    setAuthUser(user);
    setAuthToken(token || '');
    if (user) localStorage.setItem('cm_auth_user', JSON.stringify(user));
    else localStorage.removeItem('cm_auth_user');
    if (token) localStorage.setItem('cm_auth_token', token);
    else localStorage.removeItem('cm_auth_token');
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      alert('Tarayıcınızın menüsünden "Ana Ekrana Ekle" seçeneğini seçebilirsiniz!');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBtn(false);
    setDeferredPrompt(null);
  };

  const currentTheme = THEMES[roomTheme] || THEMES.default;
  const cssVars = { '--cm-primary': currentTheme.primary, '--cm-card-bg': currentTheme.cardBg };
  const leaveRoomRef = useRef(() => { });

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => handlePlay());
      navigator.mediaSession.setActionHandler('pause', () => handlePause());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleMediaEnd());
    }
  }, [mediaSrc, mediaType, playMode, playlist]);

  useEffect(() => {
    if ('mediaSession' in navigator && mediaType !== 'none') {
      const currentTrackTitle = playlist.find(i => i.src === mediaSrc)?.title || roomName || 'Couple Meeting Medya';
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrackTitle,
        artist: 'Couple Meeting',
        album: 'Birlikte Dinleme Odası',
        artwork: [{ src: 'https://cdn-icons-png.flaticon.com/512/3076/3076753.png', sizes: '512x512', type: 'image/png' }]
      });
    }
  }, [mediaSrc, mediaType, playlist, roomName]);

  const saveToRecentRooms = (targetRoomId) => {
    if (!targetRoomId) return;
    const updated = [targetRoomId, ...recentRooms.filter(r => r !== targetRoomId)].slice(0, 5);
    setRecentRooms(updated);
    localStorage.setItem('cm_recent_rooms', JSON.stringify(updated));
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

      if (Array.isArray(data.playlist)) setPlaylist(data.playlist);
      if (Array.isArray(data.categories)) setCategories(data.categories);
      if (data.playMode) setPlayMode(data.playMode);

      localStorage.setItem('cm_saved_room', data.roomId);
      saveToRecentRooms(data.roomId);
      window.history.replaceState({}, '', `?room=${data.roomId}`);

      if (authToken) socket.emit('social_sync', { token: authToken });

      if (data.currentMedia && data.currentMedia.type !== 'none') {
        setMediaType(data.currentMedia.type);
        setMediaSrc(data.currentMedia.src);
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
      leaveRoomRef.current();
    });

    socket.on('categories_updated', (cats) => setCategories(cats));
    socket.on('playlist_updated', (data) => {
      const newPlaylist = Array.isArray(data) ? data : (data.playlist || []);
      setPlaylist(newPlaylist);
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

    socket.on('global_chat_history', (items) => setGlobalMessages(Array.isArray(items) ? items : []));
    socket.on('global_chat_message', (msg) => setGlobalMessages((prev) => [...prev.slice(-79), msg]));
    socket.on('social_profile', (user) => {
      setAuthUser(user);
      localStorage.setItem('cm_auth_user', JSON.stringify(user));
      setProfileBioInput(user?.bio || '');
      setProfileStatusInput(user?.status || '');
    });
    socket.on('auth_result', (data) => {
      setAuthBusy(false);
      if (data?.ok) {
        persistAuth(data.user, data.token);
        setShowAuthModal(false);
        setShowSocialModal(true);
        setErrorMessage('');
      } else {
        setErrorMessage(data?.message || 'İşlem başarısız.');
      }
    });
    socket.on('friends_update', (data) => {
      setFriends(Array.isArray(data?.friends) ? data.friends : []);
      setFriendRequests(Array.isArray(data?.requests) ? data.requests : []);
    });

    return () => {
      socket.off('connect'); socket.off('disconnect'); socket.off('public_rooms_update');
      socket.off('search_results'); socket.off('room_joined'); socket.off('room_user_count_update');
      socket.off('room_settings_updated'); socket.off('kicked_from_room'); socket.off('categories_updated');
      socket.off('playlist_updated'); socket.off('play_mode_changed'); socket.off('room_error'); socket.off('room_action');
      socket.off('global_chat_history'); socket.off('global_chat_message'); socket.off('social_profile'); socket.off('auth_result');
      socket.off('friends_update');
    };
  }, []);

  useEffect(() => {
    if (inRoom && sidebarTab === 'chat') chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, inRoom, sidebarTab]);

  const openAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthForm((prev) => ({ ...prev, password: '' }));
    setShowAuthModal(true);
  };

  const submitAuth = (e) => {
    e.preventDefault();
    if (authBusy) return;
    setAuthBusy(true);
    socket.emit(authMode === 'register' ? 'auth_register' : 'auth_login', authForm);
    setTimeout(() => setAuthBusy(false), 5000);
  };

  const handleLogout = () => {
    persistAuth(null, '');
    setShowSocialModal(false);
  };

  const sendGlobalMessage = (e) => {
    e.preventDefault();
    const text = globalChatInput.trim();
    if (!text) return;
    socket.emit('global_chat_message', { text, username: authUser?.username || username || 'Misafir', avatar: authUser?.avatar || myAvatar, token: authToken || '' });
    setGlobalChatInput('');
  };

  const searchFriends = () => {
    if (!friendSearch.trim()) return setFriendSearchResults([]);
    socket.emit('friend_search', { q: friendSearch.trim(), token: authToken });
  };

  const sendFriendRequest = (targetUsername) => {
    if (!authUser) return openAuth('register');
    socket.emit('friend_request', { targetUsername, token: authToken });
  };

  const respondFriendRequest = (requestId, action) => {
    socket.emit('friend_request_response', { requestId, action, token: authToken });
  };

  const saveProfile = () => {
    if (!authUser) return;
    socket.emit('update_profile', { token: authToken, bio: profileBioInput.trim().slice(0, 120), status: profileStatusInput.trim().slice(0, 80), avatar: myAvatar });
  };

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

  useEffect(() => { leaveRoomRef.current = handleLeaveRoom; }, [handleLeaveRoom]);

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
    let media = searchInput.includes('http://') || searchInput.includes('https://') ? processUrl(searchInput) : (searchResults.length > 0 ? { type: 'youtube', src: searchResults[0].src } : null);
    if (!media) return;
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
        item = { id: Date.now() + Math.random().toString(), title: 'Eklenen Medya', type: media.type, src: media.src, addedBy: username };
      } else if (searchResults.length > 0) {
        item = { id: Date.now() + Math.random().toString(), title: searchResults[0].title, type: 'youtube', src: searchResults[0].src, addedBy: username };
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
    socket.emit('add_to_playlist', { roomId, item: { ...pendingMediaItem, category: modalTargetCategory } });
    setShowFolderModal(false);
    setPendingMediaItem(null);
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
    socket.emit('update_room_settings', { roomId, newName: editRoomNameInput.trim() || roomName, newTheme: roomTheme });
    setShowSettingsModal(false);
  };

  const filteredPlaylist = useMemo(() => {
    if (!Array.isArray(playlist)) return [];
    let filtered = playlist.filter(item => (item.category || 'Genel') === selectedCategory);
    return playMode === 'alphabetical' ? [...filtered].sort((a, b) => a.title.localeCompare(b.title, 'tr')) : filtered;
  }, [playlist, selectedCategory, playMode]);

  const styles = {
    app: {
      background: currentTheme.bg,
      color: '#e9edef',
      width: '100vw',
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    card: { background: currentTheme.cardBg, border: '1px solid #22303a', borderRadius: '20px', padding: '24px' },
    buttonPrimary: { background: `linear-gradient(135deg, ${currentTheme.primary} 0%, #008f6f 100%)`, color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' },
    input: { background: '#111b21', border: '1px solid #222d34', color: '#e9edef', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', outline: 'none' }
  };

  if (!inRoom) {
    return (
      <div style={{ ...styles.app, overflowY: 'auto', ...cssVars }}>
        <style>{GLOBAL_CSS}</style>
        <div className="cm-home">
          <header className="cm-home-nav" style={{ padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(5,7,12,.7)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg,#ff4757,#00a884)', display: 'grid', placeItems: 'center', fontSize: 20 }}>❤️⚡</div>
              <span style={{ fontWeight: 900, color: '#fff', fontSize: 18 }}>Couple Meeting</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowSocialModal(true)} style={{ background: '#111b21', border: '1px solid #25313a', color: '#fff', padding: '8px 12px', borderRadius: 10, fontWeight: 800 }}>🌐 Global Chat</button>
              {authUser ? (
                <button onClick={() => setShowSocialModal(true)} style={{ background: '#00a884', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: 10, fontWeight: 900 }}>{authUser.avatar} {authUser.username}</button>
              ) : (
                <button onClick={() => openAuth('login')} style={{ background: '#00a884', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: 10, fontWeight: 900 }}>Giriş Yap</button>
              )}
            </div>
          </header>

          <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 16px' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', margin: '0 0 12px', color: '#fff', fontWeight: 950 }}>Birlikte İzleyin. <span style={{ color: '#00a884' }}>Birlikte Hissedin.</span></h1>
              <p style={{ color: '#93a1ad', fontSize: 16, maxWidth: 600, margin: '0 auto' }}>Aynı anda senkronize video izleyin, müzik dinleyin ve canlı sohbet edin.</p>
            </div>

            <div style={{ maxWidth: 500, margin: '0 auto', background: '#111b21', padding: 20, borderRadius: 20, border: '1px solid #222d34' }}>
              {errorMessage && <div style={{ background: '#ea0038', color: '#fff', padding: 10, borderRadius: 10, fontSize: 12, marginBottom: 12 }}>{errorMessage}</div>}
              <div style={{ display: 'flex', gap: 6, background: '#0b141a', padding: 4, borderRadius: 10, marginBottom: 14 }}>
                <button onClick={() => setActiveTab('create')} style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, background: activeTab === 'create' ? '#00a884' : 'transparent', color: '#fff', fontWeight: 900 }}>Oda Oluştur</button>
                <button onClick={() => setActiveTab('join')} style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, background: activeTab === 'join' ? '#3742fa' : 'transparent', color: '#fff', fontWeight: 900 }}>Odaya Katıl</button>
              </div>
              {activeTab === 'create' ? (
                <form onSubmit={handleCreateRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input placeholder="Oda ismi (Opsiyonel)" value={roomId} onChange={e => setRoomId(e.target.value)} style={styles.input} />
                  <input type="password" placeholder="Şifre (Opsiyonel)" value={roomPassword} onChange={e => setRoomPassword(e.target.value)} style={styles.input} />
                  <button type="submit" style={styles.buttonPrimary}>Odayı Başlat 🚀</button>
                </form>
              ) : (
                <form onSubmit={handleJoinRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input placeholder="Oda ismi" value={joinRoomInput} onChange={e => setJoinRoomInput(e.target.value)} style={styles.input} />
                  <input type="password" placeholder="Şifre" value={joinPassInput} onChange={e => setJoinPassInput(e.target.value)} style={styles.input} />
                  <button type="submit" style={{ ...styles.buttonPrimary, background: '#3742fa' }}>Odaya Katıl 🚪</button>
                </form>
              )}
            </div>

            <div style={{ marginTop: 40, textAlign: 'center' }}>
              <h3 style={{ color: '#fff', marginBottom: 16 }}>🔥 Aktif Odalar</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {publicRooms.map(r => (
                  <div key={r.id} style={{ background: '#111b21', padding: 14, borderRadius: 14, border: '1px solid #222d34', textAlign: 'left' }}>
                    <div style={{ color: '#fff', fontWeight: 'bold' }}>{r.name}</div>
                    <div style={{ color: '#8696a0', fontSize: 12, marginTop: 4 }}>{r.userCount}/{r.maxUsers} Kişi</div>
                    <button onClick={() => { setJoinRoomInput(r.id); setActiveTab('join'); }} style={{ width: '100%', marginTop: 10, background: '#00a884', color: '#fff', border: 'none', padding: 8, borderRadius: 8, fontWeight: 'bold' }}>Katıl</button>
                  </div>
                ))}
              </div>
            </div>
          </main>

          <footer style={{ borderTop: '1px solid #222d34', padding: 20, textAlign: 'center', color: '#8696a0', fontSize: 12 }}>
            Geliştirici: <b style={{ color: '#00a884' }}>Ömer Yaman</b> © 2026 Couple Meeting.
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.app, display: 'flex', flexDirection: 'column', ...cssVars }}>
      <style>{GLOBAL_CSS}</style>

      {/* HEADER BAR */}
      <header style={{ height: '60px', padding: '0 16px', background: currentTheme.cardBg, borderBottom: '1px solid #222d34', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, width: '100vw' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={handleLeaveRoom}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: currentTheme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>❤️⚡</div>
          <h2 style={{ margin: 0, color: currentTheme.primary, fontSize: '16px', fontWeight: '900' }}>{roomName}</h2>
          <span style={{ fontSize: '11px', background: '#0b141a', color: '#53e6bc', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
            👥 {currentRoomInfo.userCount}/{currentRoomInfo.maxUsers}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setShowSettingsModal(true)} style={{ background: '#202c33', color: '#fff', border: '1px solid #222d34', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>⚙️</button>
          <button onClick={handleLeaveRoom} style={{ background: '#ff4757', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>Çık 🚪</button>
        </div>
      </header>

      {/* ODA ANA İÇERİK (FLEX ESNEK DÜZEN) */}
      <div className="cm-room-container">

        {/* SOL/ÜST: VİDEO OYNATICI VESAİR */}
        <div className="cm-player-section">
          {/* Arama Bar */}
          <div style={{ padding: '8px 12px', background: currentTheme.cardBg, borderBottom: '1px solid #222d34', display: 'flex', gap: '8px', position: 'relative', zIndex: 10 }}>
            <input
              type="text"
              placeholder="🔍 Şarkı/Video aratın veya link yapıştırın..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ ...styles.input, flex: 1, padding: '8px 10px', fontSize: '12px' }}
            />
            <button onClick={handleDirectPlay} style={{ ...styles.buttonPrimary, padding: '8px 12px', fontSize: '12px' }}>▶ Çal</button>
            <button onClick={() => handleOpenAddModal(null)} style={{ ...styles.buttonPrimary, background: '#008f6f', padding: '8px 10px', fontSize: '12px' }}>+ Liste</button>

            {(searchResults.length > 0 || isSearching) && (
              <div style={{ position: 'absolute', top: '48px', left: '10px', right: '10px', background: '#111b21', border: '1px solid #222d34', borderRadius: '12px', padding: '10px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                {isSearching && <div style={{ color: currentTheme.primary, fontSize: '12px' }}>Aranıyor...</div>}
                {searchResults.map((song) => (
                  <div key={song.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#0b141a', padding: '6px 10px', borderRadius: '8px' }}>
                    <img src={song.thumbnail} alt="" style={{ width: '45px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, overflow: 'hidden', fontSize: '11px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{song.title}</div>
                    <button onClick={() => handleSelectSearchResult(song, true)} style={{ ...styles.buttonPrimary, padding: '4px 8px', fontSize: '11px' }}>▶</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Oynatıcı Ekranı */}
          <div className="cm-video-wrapper" style={{ flex: 1, position: 'relative', width: '100%', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {mediaType === 'none' && (
              <div style={{ textAlign: 'center', color: '#8696a0', padding: 20 }}>
                <div style={{ fontSize: '42px', marginBottom: '8px' }}>🎵</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Medya aratın veya kütüphaneden seçin</div>
              </div>
            )}

            {mediaType === 'youtube' && (
              <YouTube videoId={mediaSrc} opts={{ height: '100%', width: '100%', playerVars: { autoplay: 1, controls: 1 } }} style={{ width: '100%', height: '100%' }} onReady={(e) => { ytPlayerRef.current = e.target; }} onEnd={handleMediaEnd} />
            )}

            {mediaType === 'custom_video' && (
              <video ref={customVideoRef} src={mediaSrc} controls onEnded={handleMediaEnd} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            )}

            {reactions.map((r) => (
              <div key={r.id} style={{ position: 'absolute', bottom: '20px', left: `${r.left}%`, fontSize: '36px', pointerEvents: 'none', animation: 'floatUp 2s ease-out forwards', zIndex: 99 }}>
                {r.emoji}
              </div>
            ))}
          </div>

          {/* Kontrol Butonları & Reaksiyonlar */}
          <div className="cm-controls-bar" style={{ padding: '10px 16px', background: currentTheme.cardBg, borderTop: '1px solid #222d34', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
              <button onClick={handlePlay} style={{ ...styles.buttonPrimary, flex: 1, padding: '8px 12px', fontSize: '12px' }}>▶ Ortak Oynat</button>
              <button onClick={handlePause} style={{ ...styles.buttonPrimary, flex: 1, background: '#ffa502', padding: '8px 12px', fontSize: '12px' }}>⏸ Ortak Durdur</button>
            </div>
            <div className="cm-reaction-btns" style={{ display: 'flex', gap: '4px' }}>
              {['❤️', '🔥', '😂', '👏'].map((emoji) => (
                <button key={emoji} onClick={() => sendReaction(emoji)} style={{ background: '#202c33', border: '1px solid #222d34', fontSize: '16px', padding: '6px 10px', borderRadius: '8px' }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SAĞ/ALT: SOHBET VEYA KİTAPLIK */}
        <div className="cm-chat-section">
          <div style={{ display: 'flex', borderBottom: '1px solid #222d34', background: '#0b141a' }}>
            <button onClick={() => setSidebarTab('chat')} style={{ flex: 1, padding: '10px', border: 'none', background: sidebarTab === 'chat' ? currentTheme.cardBg : 'transparent', color: sidebarTab === 'chat' ? currentTheme.primary : '#8696a0', fontWeight: 'bold', fontSize: '12px' }}>💬 Sohbet</button>
            <button onClick={() => setSidebarTab('playlist')} style={{ flex: 1, padding: '10px', border: 'none', background: sidebarTab === 'playlist' ? currentTheme.cardBg : 'transparent', color: sidebarTab === 'playlist' ? currentTheme.primary : '#8696a0', fontWeight: 'bold', fontSize: '12px' }}>📚 Kitaplık ({playlist ? playlist.length : 0})</button>
          </div>

          {sidebarTab === 'chat' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0b141a' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === mySocketId || msg.sender === username;
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '6px', maxWidth: '85%', alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
                      <span style={{ fontSize: '12px' }}>{msg.avatar || '🐱'}</span>
                      <div style={{ background: isMe ? '#005c4b' : '#202c33', color: '#e9edef', padding: '6px 10px', borderRadius: isMe ? '10px 10px 2px 10px' : '10px 10px 10px 2px', fontSize: '12px' }}>
                        <div style={{ fontSize: '9px', fontWeight: 'bold', color: isMe ? '#53bdeb' : '#25d366' }}>{msg.sender}</div>
                        <div>{msg.text}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              <form onSubmit={handleSendMessage} style={{ padding: '8px', borderTop: '1px solid #222d34', display: 'flex', gap: '6px', background: currentTheme.cardBg }}>
                <input type="text" placeholder="Mesaj yazın..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} style={{ ...styles.input, flex: 1, borderRadius: '16px', background: '#202c33', border: 'none', padding: '8px 12px', fontSize: '12px' }} />
                <button type="submit" style={{ ...styles.buttonPrimary, borderRadius: '50%', width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>➤</button>
              </form>
            </div>
          ) : (
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', background: '#0b141a' }}>
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ background: selectedCategory === cat ? currentTheme.primary : '#111b21', color: '#fff', border: '1px solid #222d34', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>📁 {cat}</button>
                ))}
              </div>

              {filteredPlaylist.length === 0 ? (
                <div style={{ color: '#8696a0', fontSize: '12px', textAlign: 'center', marginTop: '10px' }}>Bu klasör boş.</div>
              ) : (
                filteredPlaylist.map((item) => (
                  <div key={item.id} onClick={() => handleSelectPlaylistItem(item)} style={{ background: mediaSrc === item.src ? 'rgba(0, 168, 132, 0.2)' : '#111b21', border: '1px solid #222d34', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.title}</div>
                    <button onClick={(e) => handleRemovePlaylistItem(item.id, e)} style={{ background: 'transparent', border: 'none', color: '#ff4757' }}>🗑️</button>
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