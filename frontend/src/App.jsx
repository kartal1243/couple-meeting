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

// Tüm sayfalara enjekte edilen global stil ve kusursuz boyutlandırma / responsive kuralları
const GLOBAL_CSS = `
  @keyframes floatUp { 0% { transform: translateY(0) scale(0.8); opacity: 1; } 100% { transform: translateY(-300px) scale(1.6); opacity: 0; } }
  @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
  @keyframes pulseDot { 0%, 100% { box-shadow: 0 0 0 0 rgba(0,200,150,.5); } 50% { box-shadow: 0 0 0 6px rgba(0,200,150,0); } }
  
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: #0b141a; }
  ::-webkit-scrollbar-thumb { background: #2a3942; border-radius: 4px; }

  html, body {
    overflow-x: hidden !important;
    max-width: 100vw !important;
    height: 100% !important;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
  }

  * {
    box-sizing: border-box !important;
    min-width: 0;
  }

  button { transition: transform .15s ease, filter .2s ease, box-shadow .2s ease !important; cursor: pointer; }
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
  
  @keyframes cmFloat { 0%,100% { transform: translate3d(0,0,0) rotate(0deg); } 50% { transform: translate3d(0,-18px,0) rotate(2deg); } }
  @keyframes cmPulse { 0%,100% { transform: scale(1); opacity:.65; } 50% { transform: scale(1.08); opacity:.95; } }
  @keyframes cmOrb { 0% { transform: translate3d(-8%, 2%, 0) scale(1); } 50% { transform: translate3d(7%, -6%, 0) scale(1.08); } 100% { transform: translate3d(-8%, 2%, 0) scale(1); } }
  @keyframes cmReveal { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  
  .cm-landing { position:relative; overflow:hidden; background:#060810; min-height:100vh; }
  .cm-landing::before { content:''; position:absolute; inset:0; background: radial-gradient(circle at 20% 10%, rgba(0,168,132,.15), transparent 26%), radial-gradient(circle at 85% 15%, rgba(111,76,255,.16), transparent 24%), radial-gradient(circle at 50% 85%, rgba(0,168,132,.08), transparent 28%); pointer-events:none; }
  .cm-grid { position:absolute; inset:0; opacity:.18; background-image: linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px); background-size: 42px 42px; mask-image: linear-gradient(to bottom, black, transparent 90%); pointer-events:none; }
  .cm-orb { position:absolute; border-radius:999px; filter: blur(12px); pointer-events:none; animation: cmOrb 14s ease-in-out infinite; }
  .cm-orb.one { width:360px; height:360px; left:-110px; top:90px; background: radial-gradient(circle, rgba(0,168,132,.2), rgba(0,168,132,0)); }
  .cm-orb.two { width:420px; height:420px; right:-160px; top:180px; background: radial-gradient(circle, rgba(122,92,255,.22), rgba(122,92,255,0)); animation-delay:-4s; }
  .cm-orb.three { width:300px; height:300px; left:35%; bottom:-140px; background: radial-gradient(circle, rgba(255,71,87,.12), rgba(255,71,87,0)); animation-delay:-8s; }
  .cm-landing-nav { position:relative; z-index:4; max-width:1240px; margin:0 auto; padding:20px 26px; display:flex; justify-content:space-between; align-items:center; gap:16px; }
  .cm-brand { display:flex; align-items:center; gap:12px; }
  .cm-brand-mark { width:46px; height:46px; border-radius:15px; display:grid; place-items:center; font-size:22px; background:linear-gradient(135deg,#ff4757,#00a884 55%,#6c5ce7); box-shadow:0 10px 35px rgba(0,168,132,.24); animation:cmPulse 3s ease-in-out infinite; }
  .cm-hero { position:relative; z-index:2; max-width:1180px; margin:0 auto; padding:62px 26px 34px; display:grid; grid-template-columns:1.15fr .85fr; align-items:center; gap:34px; }
  .cm-hero-copy { animation:cmReveal .7s ease both; }
  .cm-eyebrow { display:inline-flex; align-items:center; gap:8px; padding:8px 13px; border:1px solid rgba(0,168,132,.25); background:rgba(0,168,132,.08); color:#6ee7c2; border-radius:999px; font-size:12px; font-weight:800; letter-spacing:.3px; }
  .cm-hero h2 { font-size:clamp(42px,6vw,82px); line-height:1.02; margin:20px 0 20px; letter-spacing:-2.8px; color:#fff; max-width:800px; }
  .cm-hero-sub { font-size:18px; line-height:1.7; color:#aab5c2; max-width:650px; margin:0 0 28px; }
  .cm-hero-actions { display:flex; flex-wrap:wrap; gap:12px; }
  .cm-hero-primary { border:none; color:#fff; font-weight:900; padding:15px 20px; border-radius:15px; cursor:pointer; background:linear-gradient(135deg,#00a884,#0fd3a5); box-shadow:0 16px 36px rgba(0,168,132,.28); }
  .cm-hero-secondary { border:1px solid #2a3942; color:#eaf2f6; font-weight:800; padding:15px 20px; border-radius:15px; cursor:pointer; background:rgba(17,27,33,.58); backdrop-filter:blur(12px); }
  .cm-proof-row { display:flex; flex-wrap:wrap; gap:16px; margin-top:24px; color:#84909d; font-size:12px; }
  .cm-proof-item { display:flex; gap:7px; align-items:center; }
  .cm-demo-wrap { position:relative; min-height:470px; display:flex; align-items:center; justify-content:center; animation:cmReveal .9s .12s ease both; }
  .cm-demo-card { width:min(100%,430px); border:1px solid rgba(255,255,255,.09); border-radius:28px; padding:14px; background:linear-gradient(180deg,rgba(20,29,36,.88),rgba(8,14,20,.88)); box-shadow:0 35px 90px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.06); backdrop-filter:blur(20px); transform:rotate(2deg); }
  .cm-demo-player { height:236px; border-radius:20px; background: radial-gradient(circle at 45% 35%, rgba(0,168,132,.26), transparent 28%), linear-gradient(135deg,#111827,#071116 55%,#15102b); position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center; }
  .cm-demo-play { width:68px; height:68px; border-radius:50%; display:grid; place-items:center; font-size:27px; color:#fff; background:rgba(255,255,255,.11); border:1px solid rgba(255,255,255,.15); box-shadow:0 16px 35px rgba(0,0,0,.3); }
  .cm-wave { position:absolute; left:14px; right:14px; bottom:16px; display:flex; align-items:flex-end; gap:4px; height:32px; }
  .cm-wave span { flex:1; border-radius:99px; background:linear-gradient(to top,rgba(0,168,132,.35),rgba(83,189,235,.8)); animation:cmPulse 1.4s ease-in-out infinite; }
  .cm-wave span:nth-child(2n){animation-delay:-.35s}.cm-wave span:nth-child(3n){animation-delay:-.7s}.cm-wave span:nth-child(4n){animation-delay:-1.05s}
  .cm-demo-users { display:flex; align-items:center; justify-content:space-between; padding:15px 4px 4px; }
  .cm-avatar-stack { display:flex; padding-left:8px; }
  .cm-avatar { width:34px; height:34px; margin-left:-8px; border-radius:50%; display:grid; place-items:center; border:2px solid #0d151b; background:#22303a; font-size:17px; }
  .cm-live-pill { padding:7px 10px; border-radius:999px; font-size:10px; font-weight:900; background:rgba(37,211,102,.1); color:#6ee7c2; border:1px solid rgba(37,211,102,.16); }
  .cm-float { position:absolute; padding:11px 13px; border-radius:15px; background:rgba(18,27,33,.84); border:1px solid rgba(255,255,255,.08); box-shadow:0 20px 45px rgba(0,0,0,.35); backdrop-filter:blur(15px); font-size:12px; color:#eaf2f6; animation:cmFloat 4.8s ease-in-out infinite; }
  .cm-float.a { top:40px; right:0; } .cm-float.b { bottom:34px; left:0; animation-delay:-2.2s; }
  .cm-section { position:relative; z-index:2; max-width:1180px; margin:0 auto; padding:45px 26px 70px; }
  .cm-section-title { color:#fff; font-size:32px; margin:0 0 10px; letter-spacing:-1px; }
  .cm-section-sub { color:#7f8b99; margin:0 0 24px; }
  .cm-feature-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:15px; }
  .cm-feature { padding:20px; border-radius:22px; border:1px solid rgba(255,255,255,.07); background:rgba(14,22,28,.72); box-shadow:inset 0 1px 0 rgba(255,255,255,.03); transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease; }
  .cm-feature:hover { transform:translateY(-6px); border-color:rgba(0,168,132,.28); box-shadow:0 24px 50px rgba(0,0,0,.28); }
  .cm-feature-icon { width:44px; height:44px; border-radius:13px; display:grid; place-items:center; font-size:20px; background:rgba(0,168,132,.1); margin-bottom:14px; }
  .cm-feature h3 { margin:0 0 8px; color:#fff; font-size:16px; }
  .cm-feature p { margin:0; color:#84909d; font-size:13px; line-height:1.65; }

  /* KESİN MOBİL BOYUTLANDIRMA VE DÜZEN REFAKTÖRÜ (Oda İçi & Landing) */
  @media (max-width: 900px) { 
    .cm-hero { grid-template-columns:1fr; padding-top:35px; }
    .cm-demo-wrap { min-height:390px; }
    .cm-feature-grid { grid-template-columns:1fr 1fr; }
    .cm-float.a { right:8px; }
    .cm-float.b { left:8px; } 
  }

  @media (max-width: 768px) {
    /* Oda içi ekran düzenini alt alta kaydırılabilir esnek yapıya çevir */
    .cm-room-container {
      height: 100vh !important;
      height: 100dvh !important;
      overflow-y: auto !important;
      display: flex !important;
      flex-direction: column !important;
    }
    .cm-room-layout {
      flex-direction: column !important;
      height: auto !important;
      flex: 1 !important;
      overflow-y: visible !important;
    }
    .cm-player-pane {
      width: 100% !important;
      min-height: 300px !important;
      max-height: 45vh !important;
    }
    .cm-sidebar-pane {
      width: 100% !important;
      height: 460px !important;
      border-left: none !important;
      border-top: 1px solid #222d34 !important;
    }
    .cm-header-bar {
      padding: 10px 14px !important;
      flex-wrap: wrap !important;
      height: auto !important;
      gap: 8px !important;
    }
    .cm-search-bar {
      flex-wrap: wrap !important;
      gap: 8px !important;
      padding: 10px 12px !important;
    }
    .cm-search-bar input {
      width: 100% !important;
    }
    .cm-search-bar button {
      flex: 1 !important;
    }
  }

  @media (max-width: 620px) { 
    .cm-landing-nav { padding:14px 16px; }
    .cm-brand-mark { width:40px; height:40px; }
    .cm-hero { padding:30px 16px 20px; }
    .cm-hero h2 { font-size:38px; letter-spacing:-1.8px; }
    .cm-hero-sub { font-size:15px; }
    .cm-hero-actions { display:grid; grid-template-columns:1fr; }
    .cm-hero-actions button { width:100%; }
    .cm-proof-row { gap:10px 14px; }
    .cm-demo-wrap { min-height:350px; }
    .cm-demo-card { transform:none; border-radius:22px; padding:10px; }
    .cm-demo-player { height:190px; }
    .cm-float { display:none; }
    .cm-section { padding:25px 16px 55px; }
    .cm-feature-grid { grid-template-columns:1fr; }
    .cm-section-title { font-size:27px; } 
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

  const [editRoomNameInput, setEditRoomNameInput] = useState('');

  const ytPlayerRef = useRef(null);
  const customVideoRef = useRef(null);
  const chatBottomRef = useRef(null);
  const socketRef = useRef(null);

  if (!socketRef.current) {
    socketRef.current = io(BACKEND_URL, { transports: ['polling', 'websocket'], autoConnect: true });
  }
  const socket = socketRef.current;

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
      <div className="cm-landing" style={{ ...cssVars }}>
        <style>{GLOBAL_CSS}</style>
        <div className="cm-grid" />
        <div className="cm-orb one" />
        <div className="cm-orb two" />
        <div className="cm-orb three" />

        <header className="cm-landing-nav">
          <div className="cm-brand">
            <div className="cm-brand-mark">❤️⚡</div>
            <div>
              <div style={{ color:'#fff', fontWeight:900, fontSize:'18px', letterSpacing:'-.5px' }}>Couple Meeting</div>
              <div style={{ color:'#63d9bd', fontSize:'10px', fontWeight:800, marginTop:'2px' }}>MESAFELERİ YAKINLAŞTIR</div>
            </div>
          </div>

          <div style={{ display:'flex', gap:'9px', alignItems:'center' }}>
            {showInstallBtn && (
              <button onClick={handleInstallApp} style={{ background:'#25d366', color:'#06130e', border:'none', padding:'9px 13px', borderRadius:'12px', fontWeight:900, cursor:'pointer', boxShadow:'0 8px 20px rgba(37,211,102,.18)' }}>📲 Yükle</button>
            )}
            <button onClick={() => setShowProfileModal(true)} style={{ background:'rgba(17,27,33,.7)', color:'#eef5f8', border:'1px solid rgba(255,255,255,.08)', padding:'9px 13px', borderRadius:'12px', fontWeight:800, cursor:'pointer' }}>👤 {username}</button>
          </div>
        </header>

        {showProfileModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.86)', backdropFilter:'blur(10px)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ ...styles.card, width:'420px', maxWidth:'100%', textAlign:'center' }}>
              <h3 style={{ margin:'0 0 16px', color:'#00a884', fontSize:'20px', fontWeight:800 }}>👤 Çift Profil Kartı</h3>
              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:12, color:'#8696a0', fontWeight:'bold', display:'block', marginBottom:10 }}>AVATAR SEÇİN</label>
                <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap', background:'#0b141a', padding:12, borderRadius:14, border:'1px solid #222d34' }}>
                  {AVATARS.map((emoji) => (
                    <span key={emoji} onClick={() => handleAvatarSelect(emoji)} style={{ fontSize:26, padding:6, borderRadius:10, cursor:'pointer', background:myAvatar === emoji ? '#00a884' : 'transparent' }}>{emoji}</span>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:16, textAlign:'left' }}>
                <label style={{ fontSize:12, color:'#8696a0', fontWeight:'bold', display:'block', marginBottom:8 }}>TAKMA AD</label>
                <input type="text" placeholder="Adınız" value={username} onChange={(e) => handleUsernameChange(e.target.value)} style={{ ...styles.input, width:'100%', boxSizing:'border-box' }} />
              </div>
              <div style={{ marginBottom:24, textAlign:'left' }}>
                <label style={{ fontSize:12, color:'#8696a0', fontWeight:'bold', display:'block', marginBottom:8 }}>YAŞADIĞINIZ ŞEHİR</label>
                <select value={userCity} onChange={(e) => handleCityChange(e.target.value)} style={{ ...styles.input, width:'100%', boxSizing:'border-box', cursor:'pointer' }}>
                  {CITIES.map(c => <option key={c} value={c} style={{ background:'#111b21' }}>{c}</option>)}
                </select>
              </div>
              <button onClick={() => setShowProfileModal(false)} style={{ ...styles.buttonPrimary, width:'100%' }}>Kaydet & Kapat</button>
            </div>
          </div>
        )}

        <main className="cm-hero">
          <div className="cm-hero-copy">
            <div className="cm-eyebrow"><span className="cm-live-dot" /> UZAKTA OLSANIZ DA AYNI ANDA</div>
            <h2>Birlikte izle.<br /><span className="cm-gradient-text">Birlikte dinle.</span><br />Birlikte hisset.</h2>
            <p className="cm-hero-sub">Sevgilinle ya da arkadaşlarınla tek bir odada buluş. YouTube videoları, müzikler, sohbet, reaksiyonlar ve ortak oynatma deneyimi tek yerde.</p>
            <div className="cm-hero-actions">
              <button className="cm-hero-primary" onClick={() => setActiveTab('create')}>🚀 Hemen Oda Oluştur</button>
              <button className="cm-hero-secondary" onClick={() => setActiveTab('join')}>🚪 Odaya Katıl</button>
            </div>
            <div className="cm-proof-row">
              <span className="cm-proof-item">✓ Ücretsiz kullanım</span>
              <span className="cm-proof-item">✓ Anlık senkron</span>
              <span className="cm-proof-item">✓ Mobil uyumlu</span>
            </div>
          </div>

          <div className="cm-demo-wrap">
            <div className="cm-float a">💬 “Başlattım, gel ❤️”</div>
            <div className="cm-float b">🎵 Şarkı birlikte çalıyor</div>
            <div className="cm-demo-card">
              <div className="cm-demo-player">
                <div className="cm-demo-play">▶</div>
                <div style={{ position:'absolute', top:14, left:14, padding:'6px 9px', borderRadius:999, background:'rgba(0,0,0,.32)', border:'1px solid rgba(255,255,255,.09)', color:'#b7c3cc', fontSize:10, fontWeight:800 }}>🔴 CANLI ODA</div>
                <div className="cm-wave">
                  {[18,28,22,34,14,26,38,20,30,17,25,12,28,21,33].map((h,i)=><span key={i} style={{height:`${h}px`}} />)}
                </div>
              </div>
              <div className="cm-demo-users">
                <div className="cm-avatar-stack">
                  {['🐱','👸','🐼','🦊'].map((a,i)=><div key={i} className="cm-avatar">{a}</div>)}
                </div>
                <div className="cm-live-pill">● 2 kişi birlikte</div>
              </div>
            </div>
          </div>
        </main>

        {errorMessage && (
          <div style={{ position:'relative', zIndex:3, maxWidth:700, margin:'0 auto 15px', padding:'0 16px' }}>
            <div style={{ background:'#ea0038', color:'#fff', padding:'12px 16px', borderRadius:14, fontWeight:'bold', textAlign:'center', fontSize:13 }}>{errorMessage}</div>
          </div>
        )}

        <section className="cm-section">
          <div style={{ display:'flex', alignItems:'end', justifyContent:'space-between', gap:15, flexWrap:'wrap', marginBottom:22 }}>
            <div>
              <div style={{ color:'#64dfc1', fontSize:11, fontWeight:900, letterSpacing:'.8px', marginBottom:7 }}>NEDEN COUPLE MEETING?</div>
              <h3 className="cm-section-title">Sıradan bir görüntülü konuşmadan fazlası.</h3>
              <p className="cm-section-sub">Birlikte zaman geçirmenin daha eğlenceli, daha canlı ve daha akıcı yolu.</p>
            </div>
          </div>
          <div className="cm-feature-grid">
            <div className="cm-feature"><div className="cm-feature-icon">🎬</div><h3>Aynı anda izle</h3><p>Oynat, durdur ve medya değiştir. Oda içindeki herkes aynı akışı takip etsin.</p></div>
            <div className="cm-feature"><div className="cm-feature-icon">🎵</div><h3>Müzik & kitaplık</h3><p>Favori içeriklerini klasörlere ayır, sıraya koy ve ortak çalma deneyimini sürdür.</p></div>
            <div className="cm-feature"><div className="cm-feature-icon">💬</div><h3>Canlı sohbet</h3><p>İzlerken mesajlaş, reaksiyon gönder ve odadaki enerjiyi canlı tut.</p></div>
          </div>
        </section>

        <section style={{ position:'relative', zIndex:2, maxWidth:1180, margin:'0 auto', padding:'10px 26px 65px' }}>
          <div className="cm-glass" style={{ borderRadius:28, padding:'28px', border:'1px solid rgba(0,168,132,.18)', display:'grid', gridTemplateColumns:'1fr auto', gap:20, alignItems:'center', background:'linear-gradient(135deg,rgba(13,23,29,.82),rgba(10,15,22,.72))' }}>
            <div>
              <div style={{ color:'#fff', fontSize:22, fontWeight:900, marginBottom:7 }}>Hazırsan kendi odanı oluştur. 💚</div>
              <div style={{ color:'#7f8b99', fontSize:13 }}>Oda adını belirle, arkadaşını/sevgilini davet et ve birlikte eğlenmeye başla.</div>
            </div>
            <button className="cm-hero-primary" onClick={() => setActiveTab('create')}>Odamı Oluştur →</button>
          </div>
        </section>

        <section style={{ position:'relative', zIndex:3, maxWidth:660, margin:'0 auto', padding:'0 16px 80px' }}>
          <div className="cm-glass" style={{ ...styles.card, borderRadius:24, border:'1px solid rgba(255,255,255,.08)' }}>
            <div style={{ display:'flex', gap:7, background:'#0b141a', padding:5, borderRadius:13, border:'1px solid #222d34', marginBottom:20 }}>
              <button onClick={() => setActiveTab('create')} style={{ flex:1, padding:12, borderRadius:10, border:'none', background:activeTab === 'create' ? '#00a884' : 'transparent', color:activeTab === 'create' ? '#fff' : '#8696a0', fontWeight:'bold', cursor:'pointer' }}>🚀 Oda Oluştur</button>
              <button onClick={() => setActiveTab('join')} style={{ flex:1, padding:12, borderRadius:10, border:'none', background:activeTab === 'join' ? '#6c5ce7' : 'transparent', color:'#fff', fontWeight:'bold', cursor:'pointer' }}>🚪 Odaya Katıl</button>
            </div>
            {activeTab === 'create' ? (
              <form onSubmit={handleCreateRoomSubmit} style={{ display:'grid', gap:12 }}>
                <input type="text" placeholder="Oda ismi (ör. askimiz)" value={roomId} onChange={(e) => setRoomId(e.target.value)} style={{ ...styles.input, padding:'13px 14px' }} />
                <input type="password" placeholder="Şifre (isteğe bağlı)" value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)} style={{ ...styles.input, padding:'13px 14px' }} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:12, alignItems:'center', background:'#0b141a', padding:'12px 14px', borderRadius:13, border:'1px solid #222d34' }}>
                  <span style={{ color:'#8696a0', fontSize:12 }}>Kişi sınırı</span>
                  <select value={maxUsers} onChange={(e) => setMaxUsers(e.target.value)} style={{ background:'transparent', border:'none', color:'#67dfc1', fontWeight:800, outline:'none' }}>
                    <option value="2" style={{ background:'#111b21' }}>2 Kişi</option>
                    <option value="4" style={{ background:'#111b21' }}>4 Kişi</option>
                    <option value="8" style={{ background:'#111b21' }}>8 Kişi</option>
                  </select>
                </div>
                <button type="submit" className="cm-hero-primary" style={{ width:'100%' }}>Odayı Başlat ve Bağlan 🚀</button>
              </form>
            ) : (
              <form onSubmit={handleJoinRoomSubmit} style={{ display:'grid', gap:12 }}>
                <input type="text" placeholder="Oda ismini gir" value={joinRoomInput} onChange={(e) => setJoinRoomInput(e.target.value)} style={{ ...styles.input, padding:'13px 14px' }} />
                <input type="password" placeholder="Şifre (varsa)" value={joinPassInput} onChange={(e) => setJoinPassInput(e.target.value)} style={{ ...styles.input, padding:'13px 14px' }} />
                <button type="submit" style={{ ...styles.buttonPrimary, width:'100%', padding:'14px', background:'linear-gradient(135deg,#6c5ce7,#8f7cff)' }}>Odaya Giriş Yap 🚪</button>
              </form>
            )}
            {recentRooms.length > 0 && (
              <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid #222d34' }}>
                <div style={{ fontSize:10, color:'#8696a0', fontWeight:'bold', marginBottom:8 }}>SON GİRDİĞİN ODALAR</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {recentRooms.map((rId) => <button key={rId} onClick={() => socket.emit('join_room', { roomId:rId, password:'', userId, userCity, username, avatar:myAvatar })} style={{ background:'#202c33', color:'#63d9bd', border:'1px solid rgba(0,168,132,.2)', padding:'7px 11px', borderRadius:9, cursor:'pointer', fontWeight:'bold', fontSize:11 }}>🚪 {rId}</button>)}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="cm-room-container" style={{ ...styles.app, display: 'flex', flexDirection: 'column', ...cssVars }}>
      <style>{GLOBAL_CSS + `\n        @keyframes floatUpRoom { 0% { transform: translateY(0) scale(0.8); opacity: 1; } 100% { transform: translateY(-300px) scale(1.6); opacity: 0; } }\n      `}</style>

      {/* KLASÖR POP-UP */}
      {showFolderModal && pendingMediaItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ ...styles.card, width: '100%', maxWidth: '380px', textAlign: 'left' }}>
            <h3 style={{ margin: '0 0 12px 0', color: currentTheme.primary, fontSize: '18px', fontWeight: '800' }}>📁 Hangi Klasöre Eklensin?</h3>
            <p style={{ fontSize: '13px', color: '#8696a0', marginBottom: '16px', wordBreak: 'break-word' }}>
              <strong>{pendingMediaItem.title}</strong> öğesini eklemek istediğiniz klasörü seçin:
            </p>

            <div style={{ marginBottom: '20px' }}>
              <select value={modalTargetCategory} onChange={(e) => setModalTargetCategory(e.target.value)} style={{ ...styles.input, width: '100%', fontWeight: 'bold', color: currentTheme.primary, cursor: 'pointer' }}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ ...styles.card, width: '100%', maxWidth: '440px', textAlign: 'left' }}>
            <h3 style={{ margin: '0 0 16px 0', color: currentTheme.primary, fontSize: '18px', fontWeight: '800' }}>⚙️ Oda Ayarları & Kişiler</h3>

            {hostUserId === userId ? (
              <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#8696a0', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>ODA İSMİ DEĞİŞTİR</label>
                  <input type="text" value={editRoomNameInput || roomName} onChange={(e) => setEditRoomNameInput(e.target.value)} style={{ ...styles.input, width: '100%' }} />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#8696a0', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>ODA TEMASI SEÇ</label>
                  <select value={roomTheme} onChange={(e) => setRoomTheme(e.target.value)} style={{ ...styles.input, width: '100%', cursor: 'pointer' }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                {roomUsersList.map(u => (
                  <div key={u.userId} style={{ background: '#0b141a', padding: '8px 12px', borderRadius: '10px', border: '1px solid #222d34', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold', wordBreak: 'break-word' }}>
                      {u.avatar} {u.username} {u.userId === hostUserId && '👑'}
                    </span>
                    {hostUserId === userId && u.userId !== userId && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleTransferAdmin(u.userId)} style={{ background: '#ffa502', border: 'none', color: '#000', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>👑 Admin</button>
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
      <header className="cm-header-bar" style={{ height: '60px', padding: '0 24px', background: currentTheme.cardBg, borderBottom: '1px solid #222d34', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, width: '100vw' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', overflow: 'hidden' }} onClick={handleLeaveRoom}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: currentTheme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>❤️⚡</div>
          <h2 style={{ margin: 0, color: currentTheme.primary, fontSize: '16px', fontWeight: '900', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{roomName}</h2>

          <span style={{ fontSize: '10px', background: currentTheme.cardBg, color: currentTheme.primary, padding: '3px 8px', borderRadius: '20px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.08)', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <span className="cm-live-dot" style={{ opacity: isConnected ? 1 : 0.35 }} /> {currentRoomInfo.userCount}/{currentRoomInfo.maxUsers}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {showInstallBtn && (
            <button onClick={handleInstallApp} style={{ background: '#25d366', color: '#000', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '900', fontSize: '11px' }}>
              📲 İndir
            </button>
          )}
          <button onClick={() => setShowSettingsModal(true)} style={{ background: '#202c33', color: '#e9edef', border: '1px solid #222d34', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>
            ⚙️ Ayarlar
          </button>
          <button onClick={handleLeaveRoom} style={{ background: '#202c33', color: '#e9edef', border: '1px solid #222d34', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>
            Çıkış 🚪
          </button>
        </div>
      </header>

      {/* ANA ODA DÜZENİ (MOBİL UYUMLU ESNEK YAPI) */}
      <div className="cm-room-layout" style={{ flex: 1, display: 'flex', width: '100vw', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>

        {/* SOL: PLAYER EKRANI */}
        <div className="cm-player-pane" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000', position: 'relative', overflow: 'hidden' }}>

          {/* ARAMA BAR */}
          <div className="cm-search-bar" style={{ padding: '10px 16px', background: currentTheme.cardBg, borderBottom: '1px solid #222d34', zIndex: 999, display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
            <input
              type="text"
              placeholder="🔍 Şarkı/Dizi Adı veya Link Yazın..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ ...styles.input, flex: 1 }}
            />

            <button onClick={handleDirectPlay} style={{ ...styles.buttonPrimary, background: currentTheme.primary, padding: '8px 12px', fontSize: '12px' }}>▶ Çal</button>
            <button onClick={() => handleOpenAddModal(null)} style={{ ...styles.buttonPrimary, background: '#008f6f', padding: '8px 12px', fontSize: '12px' }}>+ Ekle</button>

            {(searchResults.length > 0 || isSearching) && (
              <div style={{ position: 'absolute', top: '56px', left: '12px', right: '12px', ...styles.card, padding: '12px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                {isSearching && <div style={{ color: currentTheme.primary, fontSize: '12px', fontWeight: 'bold' }}>⚡ YouTube Aranıyor...</div>}
                {searchResults.map((song) => (
                  <div key={song.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#111b21', padding: '6px 10px', borderRadius: '8px', border: '1px solid #222d34' }}>
                    <img src={song.thumbnail} alt={song.title} style={{ width: '50px', height: '30px', borderRadius: '4px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, overflow: 'hidden', fontSize: '12px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{song.title}</div>
                    <button onClick={() => handleSelectSearchResult(song, true)} style={{ ...styles.buttonPrimary, padding: '4px 10px', fontSize: '11px' }}>▶</button>
                    <button onClick={() => handleSelectSearchResult(song, false)} style={{ ...styles.buttonPrimary, padding: '4px 10px', fontSize: '11px', background: '#008f6f' }}>+</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: 1, position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0b141a', minHeight: '220px' }}>
            {mediaType === 'none' && (
              <div style={{ textAlign: 'center', color: '#8696a0', padding: '20px' }}>
                <div style={{ fontSize: '42px', marginBottom: '8px' }}>🎵</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Yukarıdan Medya Aratın veya Kitaplıktan Seçin!</div>
              </div>
            )}

            {mediaType === 'youtube' && (
              <YouTube videoId={mediaSrc} opts={{ height: '100%', width: '100%', playerVars: { autoplay: 1, controls: 1 } }} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} onReady={(e) => { ytPlayerRef.current = e.target; }} onEnd={handleMediaEnd} />
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

          <div style={{ padding: '10px 16px', background: currentTheme.cardBg, borderTop: '1px solid #222d34', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={handlePlay} style={{ ...styles.buttonPrimary, flex: 1, padding: '8px 10px', fontSize: '12px' }}>▶ Oynat</button>
            <button onClick={handlePause} style={{ ...styles.buttonPrimary, flex: 1, background: '#ffa502', padding: '8px 10px', fontSize: '12px' }}>⏸ Durdur</button>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['❤️', '🔥', '😂', '👏'].map((emoji) => (
                <button key={emoji} onClick={() => sendReaction(emoji)} style={{ background: '#202c33', border: '1px solid #222d34', fontSize: '16px', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SAĞ: SOHBET */}
        <div className="cm-sidebar-pane" style={{ width: '380px', background: currentTheme.cardBg, borderLeft: '1px solid #222d34', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #222d34', background: '#0b141a', flexShrink: 0 }}>
            <button onClick={() => setSidebarTab('chat')} style={{ flex: 1, padding: '10px', border: 'none', background: sidebarTab === 'chat' ? currentTheme.cardBg : 'transparent', color: sidebarTab === 'chat' ? currentTheme.primary : '#8696a0', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>💬 Sohbet</button>
            <button onClick={() => setSidebarTab('playlist')} style={{ flex: 1, padding: '10px', border: 'none', background: sidebarTab === 'playlist' ? currentTheme.cardBg : 'transparent', color: sidebarTab === 'playlist' ? currentTheme.primary : '#8696a0', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>📚 Kitaplık ({playlist ? playlist.length : 0})</button>
          </div>

          {sidebarTab === 'chat' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0b141a' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === mySocketId || msg.sender === username;
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '6px', maxWidth: '85%', alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
                      <span style={{ fontSize: '13px' }}>{msg.avatar || '🐱'}</span>
                      <div style={{ background: isMe ? '#005c4b' : '#202c33', color: '#e9edef', padding: '6px 10px', borderRadius: isMe ? '8px 8px 2px 8px' : '8px 8px 8px 2px', boxShadow: '0 1px 2px rgba(0,0,0,0.3)', minWidth: '50px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: isMe ? '#53bdeb' : '#25d366', marginBottom: '1px' }}>{msg.sender}</div>
                        <div style={{ fontSize: '12px', wordBreak: 'break-word', lineHeight: '1.3' }}>{msg.text}</div>
                        <div style={{ fontSize: '8px', color: '#8696a0', textAlign: 'right', marginTop: '2px' }}>{msg.time}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              <form onSubmit={handleSendMessage} style={{ padding: '8px 10px', borderTop: '1px solid #222d34', display: 'flex', gap: '6px', background: currentTheme.cardBg, flexShrink: 0 }}>
                <input type="text" placeholder="Bir mesaj yazın..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} style={{ ...styles.input, flex: 1, borderRadius: '16px', background: '#202c33', border: 'none', padding: '8px 12px', fontSize: '12px' }} />
                <button type="submit" style={{ ...styles.buttonPrimary, borderRadius: '50%', width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>➤</button>
              </form>
            </div>
          ) : (
            <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', background: '#0b141a' }}>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', flexShrink: 0 }}>
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ background: selectedCategory === cat ? currentTheme.primary : '#111b21', color: selectedCategory === cat ? '#fff' : '#8696a0', border: '1px solid #222d34', padding: '4px 10px', borderRadius: '16px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    📁 {cat}
                  </button>
                ))}
              </div>

              <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <input type="text" placeholder="+ Yeni Klasör..." value={newCategoryInput} onChange={(e) => setNewCategoryInput(e.target.value)} style={{ ...styles.input, flex: 1, padding: '6px 10px', fontSize: '11px' }} />
                <button type="submit" style={{ ...styles.buttonPrimary, padding: '6px 10px', fontSize: '11px' }}>Aç</button>
              </form>

              <div style={{ display: 'flex', gap: '4px', background: '#111b21', padding: '3px', borderRadius: '10px', border: '1px solid #222d34', flexShrink: 0 }}>
                <button onClick={() => handleModeChange('sequence')} style={{ flex: 1, padding: '4px', borderRadius: '6px', border: 'none', background: playMode === 'sequence' ? currentTheme.primary : 'transparent', color: playMode === 'sequence' ? '#fff' : '#8696a0', fontWeight: 'bold', cursor: 'pointer', fontSize: '10px' }}>▶ Sıra</button>
                <button onClick={() => handleModeChange('shuffle')} style={{ flex: 1, padding: '4px', borderRadius: '6px', border: 'none', background: playMode === 'shuffle' ? currentTheme.primary : 'transparent', color: playMode === 'shuffle' ? '#fff' : '#8696a0', fontWeight: 'bold', cursor: 'pointer', fontSize: '10px' }}>🔀 Karıştır</button>
                <button onClick={() => handleModeChange('alphabetical')} style={{ flex: 1, padding: '4px', borderRadius: '6px', border: 'none', background: playMode === 'alphabetical' ? currentTheme.primary : 'transparent', color: playMode === 'alphabetical' ? '#fff' : '#8696a0', fontWeight: 'bold', cursor: 'pointer', fontSize: '10px' }}>🔤 A-Z</button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {filteredPlaylist.length === 0 ? (
                  <div style={{ color: '#8696a0', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>Bu klasör henüz boş.</div>
                ) : (
                  filteredPlaylist.map((item) => (
                    <div key={item.id} onClick={() => handleSelectPlaylistItem(item)} style={{ background: mediaSrc === item.src ? 'rgba(0, 168, 132, 0.15)' : '#111b21', border: mediaSrc === item.src ? `1px solid ${currentTheme.primary}` : '1px solid #222d34', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '8px' }}>{item.title}</div>
                      <button onClick={(e) => handleRemovePlaylistItem(item.id, e)} style={{ background: 'transparent', border: 'none', color: '#ff4757', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;