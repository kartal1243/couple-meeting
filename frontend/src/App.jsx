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

// Tüm sayfalara enjekte edilen global stil: hover/focus animasyonları, cam efektleri, scrollbar
const GLOBAL_CSS = `
  @keyframes floatUp { 0% { transform: translateY(0) scale(0.8); opacity: 1; } 100% { transform: translateY(-300px) scale(1.6); opacity: 0; } }
  @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
  @keyframes pulseDot { 0%, 100% { box-shadow: 0 0 0 0 rgba(0,200,150,.5); } 50% { box-shadow: 0 0 0 6px rgba(0,200,150,0); } }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: #0b141a; }
  ::-webkit-scrollbar-thumb { background: #2a3942; border-radius: 4px; }
  button { transition: transform .15s ease, filter .2s ease, box-shadow .2s ease !important; }
  button:hover { filter: brightness(1.12); transform: translateY(-1px); }
  button:active { transform: translateY(0) scale(.98); }
  input, select { transition: border-color .2s ease, box-shadow .2s ease !important; }
  input:focus, select:focus { outline: none; border-color: var(--cm-primary, #00a884) !important; box-shadow: 0 0 0 3px rgba(0,168,132,.25); }
  .cm-glass {
    background: rgba(17, 27, 33, 0.72) !important;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 24px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06);
  }
  .cm-gradient-text {
    background: linear-gradient(90deg, var(--cm-primary,#00a884), #53bdeb, var(--cm-primary,#00a884));
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
  }
  .cm-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #25d366; display: inline-block; animation: pulseDot 1.6s infinite; }
  /* MOBİL DÜZELTMELER: Yatay kaydırmayı tamamen engelle */
  html, body { overflow-x: hidden !important; max-width: 100vw !important; }
  * { min-width: 0; }
  @media (max-width: 768px) {
    header { padding: 12px 16px !important; flex-direction: column !important; gap: 10px !important; text-align: center; }
    h1 { font-size: 18px !important; }
    section { margin-top: 24px !important; margin-bottom: 20px !important; padding: 0 14px !important; }
    h2 { font-size: 30px !important; letter-spacing: -0.5px !important; }
    p { font-size: 15px !important; padding: 0 6px; }
    .cm-glass { width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; }
    input, select, button { max-width: 100%; box-sizing: border-box !important; }
    .cm-room-layout { flex-direction: column !important; height: auto !important; min-height: calc(100dvh - 70px) !important; overflow: visible !important; }
    .cm-player-column { width: 100% !important; min-height: auto !important; }
    .cm-search-bar { flex-wrap: wrap !important; padding: 10px !important; }
    .cm-search-bar input { flex: 1 1 100% !important; min-width: 0 !important; }
    .cm-search-bar .cm-action-btn { flex: 1 1 calc(50% - 5px) !important; }
    .cm-search-results { left: 10px !important; right: 10px !important; top: 112px !important; }
    .cm-search-result-row { flex-wrap: wrap !important; }
    .cm-search-result-row img { width: 52px !important; height: 32px !important; }
    .cm-search-result-row .cm-result-actions { width: 100% !important; display: grid !important; grid-template-columns: 1fr 1fr !important; }
    .cm-video-wrap { width: 100% !important; aspect-ratio: 16 / 9 !important; height: auto !important; min-height: 220px !important; flex: none !important; }
    .cm-controls { flex-wrap: wrap !important; padding: 10px !important; gap: 8px !important; }
    .cm-controls > button { flex: 1 1 calc(50% - 4px) !important; }
    .cm-reactions { width: 100% !important; display: grid !important; grid-template-columns: repeat(6, 1fr) !important; }
    .cm-reactions button { padding: 8px 2px !important; font-size: 18px !important; }
    .cm-sidebar { width: 100% !important; height: 520px !important; min-height: 420px !important; border-left: none !important; border-top: 1px solid #222d34 !important; }
    .cm-room-header { height: auto !important; min-height: 60px !important; padding: 10px 12px !important; gap: 8px !important; flex-wrap: wrap !important; }
    .cm-room-header-actions { width: 100% !important; justify-content: center !important; flex-wrap: wrap !important; }
    .cm-room-header-actions button { flex: 1 1 auto !important; }
    .cm-fallback-grid { grid-template-columns: 1fr !important; }
  }`;

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

  // PWA Kurulum Butonu State'leri
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
  const [youtubeError, setYoutubeError] = useState(null);
  const [fallbackUrl, setFallbackUrl] = useState('');

  // --- OPSİYONEL ÜYELİK / SOSYAL SİSTEM ---
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

  const currentProfileBio = authUser?.bio || '';
  const currentProfileStatus = authUser?.status || '';

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
      alert('Tarayıcınızın menüsünden (sağ üst üç nokta) "Ana Ekrana Ekle" veya "Uygulamayı Yükle" seçeneğini seçerek siteyi telefonunuza indirebilirsiniz!');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  const currentTheme = THEMES[roomTheme] || THEMES.default;
  const cssVars = { '--cm-primary': currentTheme.primary };
  const leaveRoomRef = useRef(() => { });

  // --- ARKA PLAN SES VE KİLİT EKRANI KONTROLÜ (MEDIA SESSION API) ---
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => { handlePlay(); });
      navigator.mediaSession.setActionHandler('pause', () => { handlePause(); });
      navigator.mediaSession.setActionHandler('nexttrack', () => { handleMediaEnd(); });
    }
  }, [mediaSrc, mediaType, playMode, playlist]);

  useEffect(() => {
    if ('mediaSession' in navigator && mediaType !== 'none') {
      const currentTrackTitle = playlist.find(i => i.src === mediaSrc)?.title || roomName || 'Couple Meeting Medya';
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrackTitle,
        artist: 'Couple Meeting',
        album: 'Birlikte Dinleme Odası',
        artwork: [
          { src: 'https://cdn-icons-png.flaticon.com/512/3076/3076753.png', sizes: '96x96', type: 'image/png' },
          { src: 'https://cdn-icons-png.flaticon.com/512/3076/3076753.png', sizes: '512x512', type: 'image/png' },
        ]
      });
    }
  }, [mediaSrc, mediaType, playlist, roomName]);

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

      if (authToken) socket.emit('social_sync', { token: authToken });

      if (data.currentMedia && data.currentMedia.type !== 'none') {
        setYoutubeError(null);
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
      leaveRoomRef.current();
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
        setYoutubeError(null);
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
        setProfileBioInput(data.user?.bio || '');
        setProfileStatusInput(data.user?.status || '');
        setAuthForm({ username: '', email: '', password: '', bio: '', avatar: data.user?.avatar || '🐱' });
        setShowAuthModal(false);
        setShowSocialModal(true);
        setErrorMessage('');
        socket.emit('social_sync', { token: data.token });
      } else {
        setErrorMessage(data?.message || 'İşlem başarısız.');
      }
    });
    socket.on('friends_update', (data) => {
      setFriends(Array.isArray(data?.friends) ? data.friends : []);
      setFriendRequests(Array.isArray(data?.requests) ? data.requests : []);
    });
    socket.on('friend_search_results', (items) => setFriendSearchResults(Array.isArray(items) ? items : []));
    socket.on('friend_request_received', (data) => {
      setFriendRequests((prev) => [data, ...prev.filter((x) => x.id !== data.id)]);
    });
    socket.on('friend_request_status', (data) => {
      if (data?.message) setErrorMessage(data.message);
      socket.emit('social_sync', { token: authToken });
    });

    return () => {
      socket.off('connect'); socket.off('disconnect'); socket.off('public_rooms_update');
      socket.off('search_results'); socket.off('room_joined'); socket.off('room_user_count_update');
      socket.off('room_settings_updated'); socket.off('kicked_from_room'); socket.off('categories_updated');
      socket.off('playlist_updated'); socket.off('play_mode_changed'); socket.off('room_error'); socket.off('room_action');
      socket.off('global_chat_history'); socket.off('global_chat_message'); socket.off('social_profile'); socket.off('auth_result');
      socket.off('friends_update'); socket.off('friend_search_results'); socket.off('friend_request_received'); socket.off('friend_request_status');
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
  };

  const handleLogout = () => {
    persistAuth(null, '');
    setFriends([]);
    setFriendRequests([]);
    setFriendSearchResults([]);
    setShowSocialModal(false);
  };

  const sendGlobalMessage = (e) => {
    e.preventDefault();
    const text = globalChatInput.trim();
    if (!text) return;
    socket.emit('global_chat_message', {
      text,
      username: authUser?.username || username || 'Misafir',
      avatar: authUser?.avatar || myAvatar,
      token: authToken || ''
    });
    setGlobalChatInput('');
  };

  const searchFriends = () => {
    const q = friendSearch.trim();
    if (!q) return setFriendSearchResults([]);
    socket.emit('friend_search', { q, token: authToken });
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
    socket.emit('update_profile', {
      token: authToken,
      bio: profileBioInput.trim().slice(0, 120),
      status: profileStatusInput.trim().slice(0, 80),
      avatar: myAvatar
    });
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

  useEffect(() => {
    leaveRoomRef.current = handleLeaveRoom;
  }, [handleLeaveRoom]);

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
    setYoutubeError(null);
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
  };

  const handleSelectSearchResult = (song, playImmediately = true) => {
    if (!song) return;
    if (playImmediately) {
      setYoutubeError(null);
      setMediaType('youtube');
      setMediaSrc(song.src);
      sendAction('CHANGE_MEDIA', { type: 'youtube', src: song.src });
    } else {
      handleOpenAddModal(song);
    }
  };

  const handleSelectPlaylistItem = (item) => {
    setYoutubeError(null);
    setMediaType(item.type);
    setMediaSrc(item.src);
    sendAction('CHANGE_MEDIA', { type: item.type, src: item.src });
  };

  const handleRemovePlaylistItem = (itemId, e) => {
    e.stopPropagation();
    socket.emit('remove_from_playlist', { roomId, itemId });
  };

  const handleYouTubeError = (event) => {
    const code = event?.data;
    const messages = {
      2: 'YouTube bağlantısı geçersiz.',
      5: 'Video HTML5 oynatıcı hatası verdi.',
      100: 'Video bulunamadı veya kaldırıldı.',
      101: 'Video sahibi bu videonun başka sitelerde oynatılmasına izin vermiyor.',
      150: 'Video sahibi bu videonun başka sitelerde oynatılmasına izin vermiyor.'
    };
    setYoutubeError({
      code,
      message: messages[code] || 'YouTube videosu bu sitede oynatılamıyor.'
    });
    try {
      navigator.mediaSession?.playbackState && (navigator.mediaSession.playbackState = 'none');
    } catch {}
  };

  const useFallbackSource = () => {
    const url = fallbackUrl.trim();
    if (!url) return;
    const parsed = processUrl(url);
    if (!parsed || !parsed.src) return;
    setYoutubeError(null);
    setMediaType(parsed.type);
    setMediaSrc(parsed.src);
    sendAction('CHANGE_MEDIA', { type: parsed.type, src: parsed.src });
    setFallbackUrl('');
  };

  const openYouTubeExternally = () => {
    if (mediaSrc) {
      window.open(`https://www.youtube.com/watch?v=${mediaSrc}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePlay = () => {
    let time = 0;
    if (mediaType === 'youtube' && ytPlayerRef.current) {
      time = ytPlayerRef.current.getCurrentTime();
      ytPlayerRef.current.playVideo();
    } else if (mediaType === 'custom_video' && customVideoRef.current) {
      time = customVideoRef.current.currentTime;
      customVideoRef.current.play().catch(() => {});
    } else if (mediaType === 'iframe') {
      return;
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
  const filteredPlaylist = useMemo(getFilteredPlaylist, [playlist, selectedCategory, playMode]);

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
      border: '1px solid #22303a',
      borderRadius: '20px',
      padding: '24px'
    },
    buttonPrimary: {
      background: `linear-gradient(135deg, ${currentTheme.primary} 0%, #008f6f 100%)`,
      color: '#ffffff',
      border: 'none',
      padding: '10px 16px',
      borderRadius: '12px',
      fontWeight: '700',
      cursor: 'pointer',
      boxShadow: '0 6px 18px rgba(0,0,0,0.35)'
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
      <div style={{ ...styles.app, overflowY: 'auto', ...cssVars }}>
        <style>{GLOBAL_CSS + `
          .cm-home { min-height: 100%; position: relative; overflow: hidden; }
          .cm-home::before { content:''; position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px); background-size:42px 42px; mask-image:linear-gradient(to bottom,black,transparent 90%); pointer-events:none; }
          .cm-orb { position:absolute; border-radius:50%; filter:blur(10px); opacity:.48; animation:cmFloat 10s ease-in-out infinite; pointer-events:none; }
          .cm-orb.one { width:420px;height:420px; background:#00a884; top:-170px;left:-140px; }
          .cm-orb.two { width:340px;height:340px; background:#7c3aed; right:-120px;top:180px;animation-delay:-3s; }
          .cm-orb.three { width:280px;height:280px; background:#ff4757; left:32%;top:420px;animation-delay:-6s; }
          @keyframes cmFloat { 0%,100%{transform:translate3d(0,0,0)} 50%{transform:translate3d(25px,-22px,0)} }
          .cm-home-nav { position:relative; z-index:5; display:flex; justify-content:space-between; align-items:center; gap:12px; padding:18px 5vw; border-bottom:1px solid rgba(255,255,255,.07); background:rgba(5,7,12,.54); backdrop-filter:blur(18px); position:sticky; top:0; }
          .cm-home-brand { display:flex; align-items:center; gap:11px; }
          .cm-home-logo { width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(135deg,#ff4757,#00a884);font-size:22px;box-shadow:0 12px 35px rgba(0,168,132,.26); }
          .cm-nav-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
          .cm-home-main { position:relative; z-index:2; width:min(1200px,92vw); margin:0 auto; padding:78px 0 70px; }
          .cm-hero { display:grid; grid-template-columns:1.15fr .85fr; gap:34px; align-items:center; }
          .cm-badge { display:inline-flex; align-items:center; gap:8px; padding:8px 13px;border-radius:999px;background:rgba(0,168,132,.1);border:1px solid rgba(0,168,132,.22);color:#63f0c0;font-size:12px;font-weight:800; }
          .cm-hero h1 { margin:16px 0 16px;font-size:clamp(42px,6.2vw,78px);line-height:.98;letter-spacing:-4px;color:#fff;font-weight:950; }
          .cm-hero h1 span { background:linear-gradient(90deg,#fff,#68ffd2 45%,#8bd8ff);-webkit-background-clip:text;background-clip:text;color:transparent; }
          .cm-hero p { margin:0; color:#93a1ad; font-size:18px;line-height:1.65;max-width:690px; }
          .cm-hero-actions { display:flex; gap:12px; margin-top:28px; flex-wrap:wrap; }
          .cm-big-btn { border:none;padding:14px 18px;border-radius:14px;font-weight:900;cursor:pointer;color:white;box-shadow:0 12px 30px rgba(0,0,0,.28); }
          .cm-hero-card { min-height:360px; position:relative; border:1px solid rgba(255,255,255,.08); border-radius:28px; background:linear-gradient(145deg,rgba(17,27,33,.85),rgba(10,14,22,.67)); backdrop-filter:blur(20px); box-shadow:0 30px 80px rgba(0,0,0,.36); overflow:hidden; padding:22px; }
          .cm-now-playing { height:100%; display:flex; flex-direction:column; justify-content:space-between; }
          .cm-mini-top { display:flex;justify-content:space-between;align-items:center;color:#91a0ac;font-size:11px;font-weight:800; }
          .cm-cover { margin:20px auto 14px; width:172px;height:172px;border-radius:28px;background:radial-gradient(circle at 30% 25%,#ff94a1 0 12%,transparent 13%),radial-gradient(circle at 72% 70%,#4be6c0 0 14%,transparent 15%),linear-gradient(135deg,#7c3aed,#00a884); box-shadow:0 22px 45px rgba(0,0,0,.38); animation:cmPulse 3s ease-in-out infinite; }
          @keyframes cmPulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.035)} }
          .cm-wave { display:flex;justify-content:center;align-items:flex-end;gap:4px;height:40px;margin-top:12px; }
          .cm-wave i { width:4px;border-radius:6px;background:linear-gradient(to top,#00a884,#8bd8ff);animation:cmWave 1s ease-in-out infinite; }
          .cm-wave i:nth-child(2){animation-delay:.12s}.cm-wave i:nth-child(3){animation-delay:.22s}.cm-wave i:nth-child(4){animation-delay:.1s}.cm-wave i:nth-child(5){animation-delay:.28s}.cm-wave i:nth-child(6){animation-delay:.18s}.cm-wave i:nth-child(7){animation-delay:.36s}
          @keyframes cmWave {0%,100%{height:10px;opacity:.5}50%{height:36px;opacity:1}}
          .cm-floating-chip { position:absolute; padding:9px 12px;border-radius:14px;background:rgba(9,13,22,.86);border:1px solid rgba(255,255,255,.08);box-shadow:0 12px 30px rgba(0,0,0,.25);font-size:11px;font-weight:800;color:#fff;animation:cmFloat 8s ease-in-out infinite; }
          .cm-chip-a{left:18px;top:96px}.cm-chip-b{right:18px;top:150px;animation-delay:-2s}.cm-chip-c{right:30px;bottom:34px;animation-delay:-4s}
          .cm-section { margin-top:72px; }
          .cm-section-head { display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:18px; }
          .cm-section-head h3 { margin:0;color:#fff;font-size:25px;letter-spacing:-.8px; }
          .cm-section-head p { margin:5px 0 0;color:#7d8b97;font-size:13px; }
          .cm-feature-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:12px; }
          .cm-feature { padding:18px;border-radius:20px;background:rgba(17,27,33,.68);border:1px solid rgba(255,255,255,.06);min-height:145px;transition:.25s; }
          .cm-feature:hover { transform:translateY(-4px);border-color:rgba(0,168,132,.25);box-shadow:0 18px 36px rgba(0,0,0,.22); }
          .cm-feature .ico { font-size:26px; }.cm-feature b{display:block;color:#fff;margin-top:12px}.cm-feature span{display:block;color:#7f8b96;font-size:12px;line-height:1.5;margin-top:6px}
          .cm-room-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:12px; }
          .cm-room { padding:16px;border-radius:18px;background:rgba(17,27,33,.7);border:1px solid rgba(255,255,255,.06); }
          .cm-room-row{display:flex;justify-content:space-between;gap:10px;align-items:center}.cm-room-name{color:#fff;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cm-room-meta{color:#7e8a95;font-size:11px}.cm-room button{margin-top:12px;width:100%;padding:10px;border:1px solid rgba(0,168,132,.22);background:rgba(0,168,132,.08);color:#5de9c0;border-radius:12px;font-weight:800;cursor:pointer}
          .cm-social-card { padding:20px;border-radius:24px;background:linear-gradient(145deg,rgba(17,27,33,.82),rgba(10,14,22,.72));border:1px solid rgba(255,255,255,.07); }
          .cm-social-grid { display:grid;grid-template-columns:1.1fr .9fr;gap:14px; }
          .cm-global-preview { display:flex;flex-direction:column;gap:8px;max-height:230px;overflow:hidden; }
          .cm-preview-msg { display:flex;gap:8px;align-items:flex-start;padding:9px 10px;border-radius:12px;background:#0b141a;border:1px solid rgba(255,255,255,.045); }
          .cm-preview-msg b{font-size:11px;color:#fff}.cm-preview-msg span{font-size:11px;color:#8794a0}
          .cm-footer { padding:35px 0 50px; text-align:center; color:#64717b;font-size:12px; }
          @media(max-width:900px){ .cm-hero{grid-template-columns:1fr}.cm-feature-grid{grid-template-columns:1fr 1fr}.cm-room-grid{grid-template-columns:1fr 1fr}.cm-social-grid{grid-template-columns:1fr}.cm-hero-card{min-height:330px} }
          @media(max-width:600px){ .cm-home-nav{padding:12px 14px}.cm-nav-actions{width:100%}.cm-nav-actions button{flex:1}.cm-home-main{width:min(94vw,560px);padding:42px 0 34px}.cm-hero h1{font-size:48px;letter-spacing:-2.5px}.cm-hero p{font-size:15px}.cm-hero-actions{display:grid;grid-template-columns:1fr}.cm-feature-grid,.cm-room-grid{grid-template-columns:1fr}.cm-cover{width:145px;height:145px}.cm-floating-chip{display:none}.cm-section{margin-top:44px}.cm-section-head{display:block}.cm-section-head h3{font-size:22px} }
        `}</style>
        <div className="cm-home">
          <div className="cm-orb one"/><div className="cm-orb two"/><div className="cm-orb three"/>

          <header className="cm-home-nav">
            <div className="cm-home-brand">
              <div className="cm-home-logo">❤️⚡</div>
              <div><div style={{fontWeight:950,color:'#fff',fontSize:17}}>Couple Meeting</div><div style={{fontSize:10,color:'#53e6bc',fontWeight:800}}>WATCH • LISTEN • CONNECT</div></div>
            </div>
            <div className="cm-nav-actions">
              <button onClick={() => setShowSocialModal(true)} style={{background:'#111b21',border:'1px solid #25313a',color:'#fff',padding:'10px 13px',borderRadius:12,fontWeight:800,cursor:'pointer'}}>🌐 Global Chat</button>
              {authUser ? (
                <button onClick={() => setShowSocialModal(true)} style={{background:'#00a884',border:'none',color:'#fff',padding:'10px 13px',borderRadius:12,fontWeight:900,cursor:'pointer'}}>{authUser.avatar || myAvatar} {authUser.username}</button>
              ) : (
                <>
                  <button onClick={() => openAuth('login')} style={{background:'#111b21',border:'1px solid #25313a',color:'#fff',padding:'10px 13px',borderRadius:12,fontWeight:800,cursor:'pointer'}}>Giriş Yap</button>
                  <button onClick={() => openAuth('register')} style={{background:'#00a884',border:'none',color:'#fff',padding:'10px 13px',borderRadius:12,fontWeight:900,cursor:'pointer'}}>Ücretsiz Katıl</button>
                </>
              )}
            </div>
          </header>

          <main className="cm-home-main">
            <section className="cm-hero">
              <div>
                <div className="cm-badge"><span className="cm-live-dot"/> Uzaklık sadece bir detay.</div>
                <h1>Birlikte izleyin.<br/><span>Birlikte hissedin.</span></h1>
                <p>Sevgilinle, arkadaşınla veya yeni insanlarla aynı videoyu aynı anda izle, müzik dinle ve anlık sohbet et. Hesap açmak zorunda değilsin; ama hesabın olursa profilin, arkadaşların ve sosyal özelliklerin yanında kalır.</p>
                <div className="cm-hero-actions">
                  <button className="cm-big-btn" onClick={() => { setActiveTab('create'); setInRoom(false); document.getElementById('cm-room-box')?.scrollIntoView({behavior:'smooth'}); }} style={{background:'linear-gradient(135deg,#00a884,#008f6f)'}}>🚀 Hemen Oda Oluştur</button>
                  <button className="cm-big-btn" onClick={() => openAuth(authUser ? 'login' : 'register')} style={{background:'#202c33',border:'1px solid #34424c'}}>👤 Hesapla Daha Fazlasını Yap</button>
                </div>
                <div style={{display:'flex',gap:18,flexWrap:'wrap',marginTop:22,color:'#778590',fontSize:11,fontWeight:800}}>
                  <span>✓ Misafir giriş</span><span>✓ Arkadaş sistemi</span><span>✓ Global sohbet</span><span>✓ Profil & durum</span>
                </div>
              </div>

              <div className="cm-hero-card">
                <div className="cm-floating-chip cm-chip-a">💬 “Başlattım, gelsene ❤️”</div>
                <div className="cm-floating-chip cm-chip-b">🟢 2 kişi odada</div>
                <div className="cm-floating-chip cm-chip-c">❤️ birlikte 12:48</div>
                <div className="cm-now-playing">
                  <div className="cm-mini-top"><span>NOW PLAYING</span><span style={{color:'#53e6bc'}}>● LIVE</span></div>
                  <div>
                    <div className="cm-cover"></div>
                    <div style={{textAlign:'center'}}><div style={{color:'#fff',fontSize:18,fontWeight:900}}>Our Little Moment</div><div style={{color:'#778590',fontSize:11,marginTop:5}}>Couple Meeting Radio</div></div>
                    <div className="cm-wave">{Array.from({length:7}).map((_,i)=><i key={i}/>)}</div>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',color:'#7f8c98',fontSize:12}}><span>♡ 248</span><span style={{color:'#53e6bc'}}>◀︎ 2:18 ━━━━━ 4:12 ▶︎</span><span>♡</span></div>
                </div>
              </div>
            </section>

            <section className="cm-section" id="cm-room-box">
              <div className="cm-section-head"><div><h3>İnsanların sevdiği tarafı</h3><p>Oda aç, arkadaşını bul, konuş, müzik ekle. Hepsi tek yerde.</p></div></div>
              <div className="cm-feature-grid">
                <div className="cm-feature"><div className="ico">🎬</div><b>Senkron İzleme</b><span>Aynı videoda aynı saniye. Oynat, durdur ve oda ile eşleştir.</span></div>
                <div className="cm-feature"><div className="ico">🎵</div><b>Ortak Müzik</b><span>Arat, çalma listene ekle ve birlikte dinle.</span></div>
                <div className="cm-feature"><div className="ico">💬</div><b>Global Sohbet</b><span>Odanın dışındaki insanlarla da konuş, keşfet.</span></div>
                <div className="cm-feature"><div className="ico">🤝</div><b>Arkadaşlık</b><span>Profilini oluştur, durumunu yaz ve arkadaş ekle.</span></div>
              </div>
            </section>

            <section className="cm-section">
              <div className="cm-section-head"><div><h3>🔥 Şu an açık odalar</h3><p>Bir odaya katılmak için tek dokunuş yeterli.</p></div></div>
              {publicRooms.length ? (
                <div className="cm-room-grid">{publicRooms.slice(0,6).map((r)=><div className="cm-room" key={r.id}><div className="cm-room-row"><div className="cm-room-name">{r.name}</div><div className="cm-room-meta">{r.userCount}/{r.maxUsers} 👥</div></div><div className="cm-room-meta" style={{marginTop:6}}>{r.hasPassword?'🔒 Şifreli oda':'🌍 Açık oda'}</div><button onClick={()=>{setJoinRoomInput(r.id);setActiveTab('join');document.getElementById('cm-room-box')?.scrollIntoView({behavior:'smooth'});}}>🚪 Katıl</button></div>)}</div>
              ) : <div className="cm-social-card"><div style={{color:'#fff',fontWeight:800}}>Henüz herkese açık oda görünmüyor.</div><div style={{color:'#7f8c98',fontSize:12,marginTop:5}}>İlk odayı sen oluştur ve burayı hareketlendirelim. 🚀</div></div>}
            </section>

            <section className="cm-section">
              <div className="cm-social-card">
                <div className="cm-social-grid">
                  <div><div style={{color:'#53e6bc',fontSize:11,fontWeight:900}}>🌐 GLOBAL TOPLULUK</div><div style={{fontSize:28,color:'#fff',fontWeight:950,letterSpacing:-1,marginTop:7}}>Sadece odada değil, dünyada da bağlan.</div><div style={{color:'#7f8c98',fontSize:13,lineHeight:1.6,marginTop:8}}>Global sohbette konuş, profilini doldur, arkadaşlık isteği gönder. Misafir olarak okuyabilir ve konuşabilirsin; arkadaşlık ve profil özellikleri hesapla açılır.</div><button className="cm-big-btn" onClick={()=>setShowSocialModal(true)} style={{marginTop:18,background:'linear-gradient(135deg,#3742fa,#5352ed)'}}>🌍 Sosyal Alanı Aç</button></div>
                  <div className="cm-global-preview">{globalMessages.slice(-5).reverse().map((m,i)=><div className="cm-preview-msg" key={m.id||i}><div style={{fontSize:19}}>{m.avatar||'🐱'}</div><div><b>{m.username||'Misafir'}</b><div style={{color:'#8d9aa5',fontSize:11,marginTop:2}}>{m.text}</div></div></div>)}{globalMessages.length===0&&<div style={{color:'#75838e',fontSize:12,padding:20,textAlign:'center'}}>Global sohbet burada görünecek. İlk mesajı sen yaz. 👋</div>}</div>
                </div>
              </div>
            </section>

            <section className="cm-section" id="cm-room-box">
              <div style={{maxWidth:650,margin:'0 auto'}}>
                <div className="cm-social-card">
                  {errorMessage && <div style={{background:'#ea0038',color:'#fff',padding:'11px 13px',borderRadius:12,fontWeight:800,fontSize:12,marginBottom:14}}>{errorMessage}</div>}
                  <div style={{display:'flex',gap:6,background:'#0b141a',padding:5,borderRadius:13,marginBottom:16}}>
                    <button onClick={()=>setActiveTab('create')} style={{flex:1,padding:11,border:'none',borderRadius:10,background:activeTab==='create'?'#00a884':'transparent',color:'#fff',fontWeight:900}}>🚀 Oda Oluştur</button>
                    <button onClick={()=>setActiveTab('join')} style={{flex:1,padding:11,border:'none',borderRadius:10,background:activeTab==='join'?'#3742fa':'transparent',color:'#fff',fontWeight:900}}>🚪 Odaya Katıl</button>
                  </div>
                  {activeTab==='create'?<form onSubmit={handleCreateRoomSubmit} style={{display:'flex',flexDirection:'column',gap:10}}><input placeholder="Oda ismi (boş bırakırsan otomatik)" value={roomId} onChange={e=>setRoomId(e.target.value)} style={styles.input}/><input type="password" placeholder="Şifre (isteğe bağlı)" value={roomPassword} onChange={e=>setRoomPassword(e.target.value)} style={styles.input}/><div style={{display:'flex',gap:10}}><select value={maxUsers} onChange={e=>setMaxUsers(e.target.value)} style={{...styles.input,flex:1}}><option value="2">2 Kişi</option><option value="4">4 Kişi</option><option value="8">8 Kişi</option></select><button type="submit" style={{...styles.buttonPrimary,flex:1}}>Odayı Başlat 🚀</button></div></form>:<form onSubmit={handleJoinRoomSubmit} style={{display:'flex',flexDirection:'column',gap:10}}><input placeholder="Oda ismi" value={joinRoomInput} onChange={e=>setJoinRoomInput(e.target.value)} style={styles.input}/><input type="password" placeholder="Şifre (varsa)" value={joinPassInput} onChange={e=>setJoinPassInput(e.target.value)} style={styles.input}/><button type="submit" style={{...styles.buttonPrimary,background:'linear-gradient(135deg,#3742fa,#5352ed)'}}>Odaya Giriş Yap 🚪</button></form>}
                  <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:16,color:'#6f7d88',fontSize:11,fontWeight:800,flexWrap:'wrap'}}><span>👤 Hesapsız giriş</span><span>🔒 Oda şifresi</span><span>⚡ Anında senkron</span></div>
                </div>
              </div>
            </section>
            <div className="cm-footer">Couple Meeting • Uzaklığı biraz daha küçük yapan internet. ❤️</div>
          </main>

          {showAuthModal && (
            <div style={{position:'fixed',inset:0,zIndex:20000,background:'rgba(0,0,0,.78)',backdropFilter:'blur(16px)',display:'flex',alignItems:'center',justifyContent:'center',padding:18}}>
              <div style={{width:'min(460px,100%)',background:'#111b21',border:'1px solid #2a3942',borderRadius:24,padding:22,boxShadow:'0 35px 100px rgba(0,0,0,.5)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{color:'#53e6bc',fontSize:11,fontWeight:900}}>{authMode==='register'?'HESAP OLUŞTUR':'TEKRAR HOŞ GELDİN'}</div>
                    <h3 style={{margin:'6px 0 0',color:'#fff',fontSize:24}}>{authMode==='register'?'Profilini yanında taşı':'Hesabına giriş yap'}</h3>
                  </div>
                  <button type="button" onClick={()=>setShowAuthModal(false)} style={{background:'#202c33',border:'none',color:'#fff',width:34,height:34,borderRadius:10}}>✕</button>
                </div>
                <form onSubmit={submitAuth} style={{display:'flex',flexDirection:'column',gap:10,marginTop:18}}>
                  {authMode==='register' && <input placeholder="Kullanıcı adı" value={authForm.username} onChange={e=>setAuthForm({...authForm,username:e.target.value})} style={styles.input}/>} 
                  <input type="email" placeholder="E-posta" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} style={styles.input}/>
                  <input type="password" placeholder="Şifre (en az 6 karakter)" value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} style={styles.input}/>
                  {authMode==='register' && (
                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                      <textarea placeholder="Kendini anlat (opsiyonel)" value={authForm.bio} onChange={e=>setAuthForm({...authForm,bio:e.target.value})} style={{...styles.input,minHeight:80,resize:'vertical'}}/>
                      <select value={authForm.avatar} onChange={e=>setAuthForm({...authForm,avatar:e.target.value})} style={styles.input}>
                        {AVATARS.map(a=><option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  )}
                  <button type="submit" disabled={authBusy} style={{...styles.buttonPrimary,width:'100%',marginTop:4}}>{authBusy?'İşleniyor...':(authMode==='register'?'Hesabı Oluştur ✨':'Giriş Yap 🚀')}</button>
                </form>
                <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:14,fontSize:12,color:'#778590'}}>
                  {authMode==='register' ? (
                    <div>Zaten hesabın var mı? <button type="button" onClick={()=>setAuthMode('login')} style={{background:'none',border:'none',color:'#53e6bc',fontWeight:900}}>Giriş yap</button></div>
                  ) : (
                    <div>Hesabın yok mu? <button type="button" onClick={()=>setAuthMode('register')} style={{background:'none',border:'none',color:'#53e6bc',fontWeight:900}}>Kayıt ol</button></div>
                  )}
                </div>
              </div>
            </div>
          )}

          {showSocialModal && (
            <div style={{position:'fixed',inset:0,zIndex:19000,background:'rgba(0,0,0,.78)',backdropFilter:'blur(16px)',display:'flex',alignItems:'center',justifyContent:'center',padding:14}}>
              <div style={{width:'min(900px,100%)',height:'min(760px,94vh)',background:'#0f171d',border:'1px solid #2a3942',borderRadius:24,display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 35px 100px rgba(0,0,0,.5)'}}>
                <div style={{padding:'14px 16px',background:'#111b21',borderBottom:'1px solid #25313a',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div><div style={{color:'#53e6bc',fontSize:10,fontWeight:900}}>COUPLE MEETING SOCIAL</div><div style={{color:'#fff',fontSize:18,fontWeight:900}}>🌍 Topluluk</div></div>
                  <div style={{display:'flex',gap:7,alignItems:'center'}}>
                    {authUser ? <button type="button" onClick={handleLogout} style={{background:'#202c33',color:'#fff',border:'1px solid #2c3b44',padding:'8px 10px',borderRadius:10,fontWeight:800}}>Çıkış</button> : <button type="button" onClick={()=>openAuth('login')} style={{background:'#00a884',color:'#fff',border:'none',padding:'8px 10px',borderRadius:10,fontWeight:900}}>Giriş</button>}
                    <button type="button" onClick={()=>setShowSocialModal(false)} style={{background:'#202c33',color:'#fff',border:'none',width:34,height:34,borderRadius:10}}>✕</button>
                  </div>
                </div>
                <div style={{display:'flex',flex:1,minHeight:0}}>
                  <div style={{width:220,borderRight:'1px solid #25313a',background:'#0b141a',padding:10,display:'flex',flexDirection:'column',gap:8}}>
                    <button type="button" onClick={()=>setSocialTab('global')} style={{padding:11,border:'none',borderRadius:11,textAlign:'left',background:socialTab==='global'?'#00a884':'#111b21',color:'#fff',fontWeight:900}}>🌐 Global Sohbet</button>
                    <button type="button" onClick={()=>setSocialTab('friends')} style={{padding:11,border:'none',borderRadius:11,textAlign:'left',background:socialTab==='friends'?'#00a884':'#111b21',color:'#fff',fontWeight:900}}>🤝 Arkadaşlar {friendRequests.length?`(${friendRequests.length})`:''}</button>
                    <button type="button" onClick={()=>setSocialTab('profile')} style={{padding:11,border:'none',borderRadius:11,textAlign:'left',background:socialTab==='profile'?'#00a884':'#111b21',color:'#fff',fontWeight:900}}>👤 Profilim</button>
                    <div style={{marginTop:'auto',padding:10,borderRadius:12,background:'#111b21',color:'#7f8c98',fontSize:11,lineHeight:1.5}}>{authUser?'Hesabın aktif. Profil ve arkadaşlıkların bu cihazdaki oturumunda tutulur.':'Misafir olarak sohbet edebilirsin. Arkadaşlık ve profil için ücretsiz hesap aç.'}</div>
                  </div>
                  <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column'}}>
                    {socialTab==='global' && (
                      <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0}}>
                        <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:8}}>
                          {globalMessages.map((m,i)=>(
                            <div key={m.id||i} style={{display:'flex',gap:9,alignItems:'flex-start'}}>
                              <div style={{fontSize:22}}>{m.avatar||'🐱'}</div>
                              <div style={{background:'#111b21',padding:'8px 10px',borderRadius:12,maxWidth:'80%'}}>
                                <div style={{fontSize:11,color:'#53e6bc',fontWeight:900}}>{m.username||'Misafir'} <span style={{color:'#63727d',fontWeight:600}}>• {m.time||''}</span></div>
                                <div style={{fontSize:13,color:'#e9edef',marginTop:3,wordBreak:'break-word'}}>{m.text}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <form onSubmit={sendGlobalMessage} style={{padding:10,borderTop:'1px solid #25313a',display:'flex',gap:7,background:'#111b21'}}>
                          <input value={globalChatInput} onChange={e=>setGlobalChatInput(e.target.value)} placeholder="Global sohbete bir şey yaz..." style={{...styles.input,flex:1}}/>
                          <button type="submit" style={{...styles.buttonPrimary,padding:'10px 14px'}}>➤</button>
                        </form>
                      </div>
                    )}
                    {socialTab==='friends' && (
                      <div style={{padding:16,overflowY:'auto'}}>
                        {!authUser ? (
                          <div style={{padding:30,textAlign:'center',color:'#7f8c98'}}>Arkadaşlık sistemi için önce hesap açmalısın.<br/><button type="button" onClick={()=>openAuth('register')} style={{...styles.buttonPrimary,marginTop:12}}>Ücretsiz Hesap Aç</button></div>
                        ) : (
                          <div>
                            <div style={{display:'flex',gap:7}}><input value={friendSearch} onChange={e=>setFriendSearch(e.target.value)} placeholder="Kullanıcı adı ara..." style={{...styles.input,flex:1}}/><button type="button" onClick={searchFriends} style={styles.buttonPrimary}>Ara</button></div>
                            <div style={{marginTop:16}}>
                              {friendSearchResults.map(u=>(
                                <div key={u.username} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,padding:10,background:'#111b21',borderRadius:12,marginBottom:7}}>
                                  <div><div style={{color:'#fff',fontWeight:900}}>{u.avatar} {u.username}</div><div style={{color:'#7f8c98',fontSize:11}}>{u.status||u.bio||'Henüz bir durum yazılmadı.'}</div></div>
                                  <button type="button" onClick={()=>sendFriendRequest(u.username)} style={{...styles.buttonPrimary,padding:'7px 10px',fontSize:11}}>➕ Ekle</button>
                                </div>
                              ))}
                            </div>
                            {friendRequests.length>0 && (
                              <div>
                                <div style={{color:'#fff',fontWeight:900,margin:'18px 0 8px'}}>Gelen istekler</div>
                                {friendRequests.map(r=>(
                                  <div key={r.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:10,background:'#111b21',borderRadius:12,marginBottom:7}}>
                                    <span style={{color:'#fff',fontWeight:800}}>{r.avatar||'🐱'} {r.fromUsername}</span>
                                    <div style={{display:'flex',gap:6}}><button type="button" onClick={()=>respondFriendRequest(r.id,'accept')} style={{...styles.buttonPrimary,padding:'7px 10px',fontSize:11}}>Kabul</button><button type="button" onClick={()=>respondFriendRequest(r.id,'reject')} style={{background:'#202c33',color:'#fff',border:'1px solid #2d3b44',padding:'7px 10px',borderRadius:10,fontWeight:800}}>Sil</button></div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {friends.length>0 && (
                              <div>
                                <div style={{color:'#fff',fontWeight:900,margin:'18px 0 8px'}}>Arkadaşların</div>
                                {friends.map(f=>(
                                  <div key={f.username} style={{display:'flex',justifyContent:'space-between',padding:10,background:'#111b21',borderRadius:12,marginBottom:7}}><span style={{color:'#fff',fontWeight:800}}>{f.avatar} {f.username}</span><span style={{color:'#53e6bc',fontSize:11}}>{f.status||'Çevrimiçi'}</span></div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {socialTab==='profile' && (
                      <div style={{padding:16,overflowY:'auto'}}>
                        {!authUser ? <div style={{padding:30,textAlign:'center',color:'#7f8c98'}}>Profilini kaydetmek için hesap açman yeterli.</div> : (
                          <div style={{maxWidth:520}}>
                            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}><div style={{fontSize:44,width:66,height:66,borderRadius:18,display:'grid',placeItems:'center',background:'#111b21',border:'1px solid #2a3942'}}>{authUser.avatar}</div><div><div style={{fontSize:20,color:'#fff',fontWeight:900}}>{authUser.username}</div><div style={{fontSize:11,color:'#53e6bc'}}>{authUser.email}</div></div></div>
                            <label style={{fontSize:11,color:'#7f8c98',fontWeight:900}}>DURUM</label>
                            <input value={profileStatusInput} onChange={e=>setProfileStatusInput(e.target.value)} placeholder="Şu an ne yapıyorsun?" style={{...styles.input,width:'100%',margin:'6px 0 12px'}}/>
                            <label style={{fontSize:11,color:'#7f8c98',fontWeight:900}}>HAKKINDA</label>
                            <textarea value={profileBioInput} onChange={e=>setProfileBioInput(e.target.value)} placeholder="Kendinden biraz bahset..." style={{...styles.input,width:'100%',minHeight:100,resize:'vertical',margin:'6px 0 12px'}}/>
                            <select value={myAvatar} onChange={e=>{setMyAvatar(e.target.value);localStorage.setItem('cm_user_avatar',e.target.value)}} style={{...styles.input,width:'100%',marginBottom:12}}>{AVATARS.map(a=><option key={a} value={a}>{a}</option>)}</select>
                            <button type="button" onClick={saveProfile} style={{...styles.buttonPrimary,width:'100%'}}>Profili Kaydet ✓</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Misafir hesabı için global chat modal açıldığında default global sekme */}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.app, display: 'flex', flexDirection: 'column', ...cssVars }}>
      <style>{GLOBAL_CSS + `\n        @keyframes floatUpRoom { 0% { transform: translateY(0) scale(0.8); opacity: 1; } 100% { transform: translateY(-300px) scale(1.6); opacity: 0; }\n      `}</style>

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
      <header className="cm-room-header" style={{ height: '60px', padding: '0 28px', background: currentTheme.cardBg, borderBottom: '1px solid #222d34', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, width: '100vw', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={handleLeaveRoom}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: currentTheme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>❤️⚡</div>
          <h2 style={{ margin: 0, color: currentTheme.primary, fontSize: '18px', fontWeight: '900' }}>{roomName}</h2>

          <span style={{ fontSize: '11px', background: currentTheme.cardBg, color: currentTheme.primary, padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.08)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span className="cm-live-dot" style={{ opacity: isConnected ? 1 : 0.35 }} /> Kişi: {currentRoomInfo.userCount}/{currentRoomInfo.maxUsers}
          </span>
        </div>

        <div className="cm-room-header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {showInstallBtn && (
            <button onClick={handleInstallApp} style={{ background: '#25d366', color: '#000', border: 'none', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '900', fontSize: '12px' }}>
              📲 Uygulamayı İndir
            </button>
          )}
          <button onClick={() => setShowSettingsModal(true)} style={{ background: '#202c33', color: '#e9edef', border: '1px solid #222d34', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            ⚙️ Oda Ayarları
          </button>
          {authUser && <span style={{ background: '#0d201d', color: '#53e6bc', border: '1px solid #1c4a41', padding: '8px 10px', borderRadius: '10px', fontWeight: '800', fontSize: '11px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{authUser.avatar} {authUser.username}</span>}
          <button onClick={handleLeaveRoom} style={{ background: '#202c33', color: '#e9edef', border: '1px solid #222d34', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            Ana Sayfa 🚪
          </button>
        </div>
      </header>

      <div className="cm-room-layout" style={{ flex: 1, display: 'flex', width: '100vw', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>

        {/* SOL: PLAYER EKRANI */}
        <div className="cm-player-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000', position: 'relative' }}>

          {/* ARAMA BAR */}
          <div className="cm-search-bar" style={{ padding: '12px 20px', background: currentTheme.cardBg, borderBottom: '1px solid #222d34', zIndex: 999, display: 'flex', gap: '10px', alignItems: 'center', position: 'relative' }}>
            <input
              type="text"
              placeholder="🔍 Şarkı/Dizi Adı Yazın veya Link Yapıştırın..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ ...styles.input, flex: 1 }}
            />

            <button className="cm-action-btn" onClick={handleDirectPlay} style={{ ...styles.buttonPrimary, background: currentTheme.primary }}>▶ Oynat</button>
            <button className="cm-action-btn" onClick={() => handleOpenAddModal(null)} style={{ ...styles.buttonPrimary, background: '#008f6f' }}>➕ Listeye Ekle</button>

            {(searchResults.length > 0 || isSearching) && (
              <div className="cm-search-results" style={{ position: 'absolute', top: '62px', left: '20px', right: '20px', ...styles.card, padding: '14px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {isSearching && <div style={{ color: currentTheme.primary, fontSize: '13px', fontWeight: 'bold' }}>⚡ YouTube Aranıyor...</div>}
                {searchResults.map((song) => (
                  <div key={song.id} className="cm-search-result-row" style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#111b21', padding: '8px 12px', borderRadius: '10px', border: '1px solid #222d34' }}>
                    <img src={song.thumbnail} alt={song.title} style={{ width: '60px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, overflow: 'hidden', fontSize: '13px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{song.title}</div>
                    <div className="cm-result-actions" style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleSelectSearchResult(song, true)} style={{ ...styles.buttonPrimary, padding: '6px 12px', fontSize: '12px' }}>▶ Çal</button>
                    <button onClick={() => handleSelectSearchResult(song, false)} style={{ ...styles.buttonPrimary, padding: '6px 12px', fontSize: '12px', background: '#008f6f' }}>+ Klasöre Ekle</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="cm-video-wrap" style={{ flex: 1, position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0b141a' }}>
            {mediaType === 'none' && (
              <div style={{ textAlign: 'center', color: '#8696a0' }}>
                <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎵</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Yukarıdan Medya Aratın veya Kitaplıktan Seçin!</div>
              </div>
            )}

            {mediaType === 'youtube' && !youtubeError && (
              <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
                <YouTube
                  videoId={mediaSrc}
                  opts={{
                    height: '100%',
                    width: '100%',
                    playerVars: { autoplay: 1, controls: 1, playsinline: 1, rel: 0, modestbranding: 1, origin: window.location.origin }
                  }}
                  style={{ width: '100%', height: '100%', maxWidth: '100%' }}
                  onReady={(e) => { ytPlayerRef.current = e.target; }}
                  onError={handleYouTubeError}
                  onEnd={handleMediaEnd}
                />
              </div>
            )}

            {mediaType === 'youtube' && youtubeError && (
              <div style={{ width: 'min(760px, 92%)', padding: '28px', borderRadius: '24px', background: 'linear-gradient(145deg,#151b23,#0a0e14)', border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 30px 80px rgba(0,0,0,.55)', textAlign: 'center' }}>
                <div style={{ fontSize: '46px', marginBottom: '12px' }}>⚠️</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: '20px', marginBottom: '8px' }}>Bu YouTube videosu burada oynatılamıyor</div>
                <div style={{ color: '#9aa7b3', fontSize: '13px', lineHeight: 1.6, maxWidth: '620px', margin: '0 auto 18px' }}>
                  {youtubeError.message} Bu genellikle video sahibinin harici oynatmayı kapatmasından kaynaklanır.
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '18px' }}>
                  <button onClick={openYouTubeExternally} style={{ ...styles.buttonPrimary, background: '#ff0033' }}>▶ YouTube'da Aç</button>
                  <button onClick={() => { setYoutubeError(null); setMediaType('none'); setTimeout(() => { setMediaType('youtube'); }, 50); }} style={{ ...styles.buttonPrimary, background: '#25313b' }}>🔄 Tekrar Dene</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', maxWidth: '620px', margin: '0 auto' }}>
                  <input
                    value={fallbackUrl}
                    onChange={(e) => setFallbackUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') useFallbackSource(); }}
                    placeholder="Alternatif MP4 / WebM / iframe bağlantısı..."
                    style={{ ...styles.input, width: '100%', boxSizing: 'border-box' }}
                  />
                  <button onClick={useFallbackSource} style={{ ...styles.buttonPrimary, whiteSpace: 'nowrap' }}>Kaynağı Kullan</button>
                </div>
                <div style={{ color: '#6f7d89', fontSize: '11px', marginTop: '9px' }}>MP4/WebM bağlantıları tam senkron kontrolleri destekler. Harici iframe kaynaklarında oynat/durdur senkronu kaynağın API'sine bağlıdır.</div>
              </div>
            )}

            {mediaType === 'custom_video' && (
              <video ref={customVideoRef} src={mediaSrc} controls playsInline preload="metadata" onEnded={handleMediaEnd} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />
            )}

            {mediaType === 'iframe' && (
              <iframe
                src={mediaSrc}
                title="Couple Meeting Harici Medya"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: '0', background: '#000' }}
              />
            )}

            {reactions.map((r) => (
              <div key={r.id} style={{ position: 'absolute', bottom: '30px', left: `${r.left}%`, fontSize: '42px', pointerEvents: 'none', animation: 'floatUp 2s ease-out forwards', zIndex: 99 }}>
                {r.emoji}
              </div>
            ))}
          </div>

          <div className="cm-controls" style={{ padding: '14px 24px', background: currentTheme.cardBg, borderTop: '1px solid #222d34', display: 'flex', gap: '14px', alignItems: 'center' }}>
            <button onClick={handlePlay} style={{ ...styles.buttonPrimary, flex: 1 }}>▶ Ortak Oynat</button>
            <button onClick={handlePause} style={{ ...styles.buttonPrimary, flex: 1, background: '#ffa502' }}>⏸ Ortak Durdur</button>
            <div className="cm-reactions" style={{ display: 'flex', gap: '6px' }}>
              {['❤️', '🔥', '😂', '😮', '👏', '😍'].map((emoji) => (
                <button key={emoji} onClick={() => sendReaction(emoji)} style={{ background: '#202c33', border: '1px solid #222d34', fontSize: '20px', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer' }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SAĞ: SOHBET */}
        <div className="cm-sidebar" style={{ width: '380px', background: currentTheme.cardBg, borderLeft: '1px solid #222d34', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #222d34', background: '#0b141a' }}>
            <button onClick={() => setSidebarTab('chat')} style={{ flex: 1, padding: '12px', border: 'none', background: sidebarTab === 'chat' ? currentTheme.cardBg : 'transparent', color: sidebarTab === 'chat' ? currentTheme.primary : '#8696a0', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>💬 Sohbet</button>
            <button onClick={() => setSidebarTab('playlist')} style={{ flex: 1, padding: '12px', border: 'none', background: sidebarTab === 'playlist' ? currentTheme.cardBg : 'transparent', color: sidebarTab === 'playlist' ? currentTheme.primary : '#8696a0', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>📚 Kitaplık ({playlist ? playlist.length : 0})</button>
          </div>

          {sidebarTab === 'chat' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0b141a' }}>
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

              {filteredPlaylist.length === 0 ? (
                <div style={{ color: '#8696a0', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>Bu klasör henüz boş.</div>
              ) : (
                filteredPlaylist.map((item) => (
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