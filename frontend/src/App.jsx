import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import io from 'socket.io-client';

// ═══════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════

import { BACKEND_URL, THEMES, GLOBAL_CSS, HOME_CSS } from './constants';
import { getStyles } from './styles';
import { processUrl } from './utils/processUrl';
import { playMessageSound } from './utils/notificationSound';

// Home Components
import Hero from './Home/Hero';
import Features from './Home/Features';
import PublicRooms from './Home/PublicRooms';
import SocialPreview from './Home/SocialPreview';

// Room Components
import Header from './Room/Header';
import SearchBar from './Room/SearchBar';
import Player from './Room/Player';
import Controls from './Room/Controls';
import Chat from './Room/Chat';
import Playlist from './Room/Playlist';

// Modals
import AuthModal from './Modals/AuthModal';
import SocialModal from './Modals/SocialModal';
import FolderModal from './Modals/FolderModal';
import SettingsModal from './Modals/SettingsModal';
import VipModal from './Modals/VipModal';

// ═══════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════

function App() {

  // ──────────────────────────────────────────────────────
  // 1. STATE TANIMLARI
  // ──────────────────────────────────────────────────────

  // Kullanici bilgileri
  const [userId] = useState(() => {
    let id = localStorage.getItem('cm_user_id');
    if (!id) { id = 'usr_' + Math.random().toString(36).substring(2, 9); localStorage.setItem('cm_user_id', id); }
    return id;
  });
  const [username] = useState(() => localStorage.getItem('cm_username') || 'Izleyici');
  const [userCity] = useState(() => localStorage.getItem('cm_user_city') || 'Zonguldak');
  const [myAvatar, setMyAvatar] = useState(() => localStorage.getItem('cm_user_avatar') || '🐱');
  const [mySocketId, setMySocketId] = useState('');

  // Oda durumu
  const [inRoom, setInRoom] = useState(() => !!new URLSearchParams(window.location.search).get('room'));
  const [roomId, setRoomId] = useState(() => new URLSearchParams(window.location.search).get('room') || '');
  const [roomName, setRoomName] = useState('');
  const [hostUserId, setHostUserId] = useState('');
  const [roomTheme, setRoomTheme] = useState('default');
  const [roomType, setRoomType] = useState('video');
  const [roomUsersList, setRoomUsersList] = useState([]);
  const [publicRooms, setPublicRooms] = useState([]);
  const [currentRoomInfo, setCurrentRoomInfo] = useState({ userCount: 1, maxUsers: 2 });

  // Medya durumu
  const [mediaType, setMediaType] = useState('none');
  const [mediaSrc, setMediaSrc] = useState('');
  const [mediaMeta, setMediaMeta] = useState(null);

  // Playlist & kategoriler
  const [playlist, setPlaylist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cm_local_playlist')) || []; } catch { return []; }
  });
  const [categories, setCategories] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cm_local_categories')) || ['Genel']; } catch { return ['Genel']; }
  });
  const [selectedCategory, setSelectedCategory] = useState('Genel');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [playMode, setPlayMode] = useState('sequence');

  // Arama
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Sohbet
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [reactions, setReactions] = useState([]);
  const [replyTo, setReplyTo] = useState(null);

  // Uygulama
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [youtubeError, setYoutubeError] = useState(null);
  const [sidebarTab, setSidebarTab] = useState('chat');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // Modallar
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Oda olusturma
  const [quickRoomName, setQuickRoomName] = useState('');
  const [quickRoomPass, setQuickRoomPass] = useState('');
  const [quickMaxUsers, setQuickMaxUsers] = useState('2');
  const [quickRoomType, setQuickRoomType] = useState('video');
  const [editRoomNameInput, setEditRoomNameInput] = useState('');

  // Odaya katilma
  const [joinRoomTarget, setJoinRoomTarget] = useState(null);
  const [joinModalPass, setJoinModalPass] = useState('');

  // Playlist modal
  const [pendingMediaItem, setPendingMediaItem] = useState(null);
  const [modalTargetCategory, setModalTargetCategory] = useState('Genel');

  // Kimlik dogrulama
  const [authUser, setAuthUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cm_auth_user')) || null; } catch { return null; }
  });
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('cm_auth_token') || '');
  const [authMode, setAuthMode] = useState('login');
  const [authBusy, setAuthBusy] = useState(false);
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '', bio: '', avatar: '🐱' });

  // Sosyal
  const [friendSearch, setFriendSearch] = useState('');
  const [friendSearchResults, setFriendSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendOnlineStatuses, setFriendOnlineStatuses] = useState({});
  const [globalMessages, setGlobalMessages] = useState([]);
  const [globalChatInput, setGlobalChatInput] = useState('');
  const [socialTab, setSocialTab] = useState('global');
  const [profileBioInput, setProfileBioInput] = useState('');
  const [profileStatusInput, setProfileStatusInput] = useState('');

  // ──────────────────────────────────────────────────────
  // 2. SOCKET & REFS
  // ──────────────────────────────────────────────────────

  const ytPlayerRef = useRef(null);
  const musicAudioRef = useRef(null);
  const socketRef = useRef(null);
  const handleMediaEndRef = useRef(null);
  const mySocketIdRef = useRef('');
  const currentRoomIdRef = useRef(roomId);
  const playlistRef = useRef(playlist);
  const playModeRef = useRef(playMode);
  const mediaSrcRef = useRef(mediaSrc);

  if (!socketRef.current) {
    socketRef.current = io(BACKEND_URL, { transports: ['polling', 'websocket'], autoConnect: true });
  }
  const socket = socketRef.current;

  useEffect(() => { currentRoomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { playlistRef.current = playlist; }, [playlist]);
  useEffect(() => { playModeRef.current = playMode; }, [playMode]);
  useEffect(() => { mediaSrcRef.current = mediaSrc; }, [mediaSrc]);
  useEffect(() => { mySocketIdRef.current = mySocketId; }, [mySocketId]);
  useEffect(() => { handleMediaEndRef.current = handleMediaEnd; }, []);

  // ──────────────────────────────────────────────────────
  // 3. YARDIMCI FONKSIYONLAR
  // ──────────────────────────────────────────────────────

  const currentTheme = THEMES[roomTheme] || THEMES.default;
  const cssVars = { '--cm-primary': currentTheme.primary };
  const styles = getStyles(currentTheme);

  const persistAuth = (user, token) => {
    setAuthUser(user);
    setAuthToken(token || '');
    if (user) localStorage.setItem('cm_auth_user', JSON.stringify(user));
    else localStorage.removeItem('cm_auth_user');
    if (token) localStorage.setItem('cm_auth_token', token);
    else localStorage.removeItem('cm_auth_token');
  };

  const showFloatingEmoji = (reaction) => {
    setReactions((prev) => [...prev, reaction]);
    setTimeout(() => setReactions((prev) => prev.filter((r) => r.id !== reaction.id)), 2000);
  };

  const sendAction = (type, payload) => {
    if (socket) socket.emit('room_action', { roomId: currentRoomIdRef.current, type, payload: { ...payload, mediaType } });
  };

  const saveToRecentRooms = (targetRoomId) => {
    if (!targetRoomId) return;
    try {
      const recent = JSON.parse(localStorage.getItem('cm_recent_rooms')) || [];
      localStorage.setItem('cm_recent_rooms', JSON.stringify([targetRoomId, ...recent.filter(r => r !== targetRoomId)].slice(0, 5)));
    } catch {}
  };

  const saveRoomMessages = useCallback((rid, msgs) => {
    try { localStorage.setItem(`cm_room_msgs_${rid}`, JSON.stringify(msgs.slice(-200))); } catch {}
  }, []);

  const loadRoomMessages = useCallback((rid) => {
    try { return JSON.parse(localStorage.getItem(`cm_room_msgs_${rid}`)) || []; } catch { return []; }
  }, []);

  // ──────────────────────────────────────────────────────
  // 4. KIMLIK DOGRULAMA FONKSIYONLARI
  // ──────────────────────────────────────────────────────

  const openAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthForm((prev) => ({ ...prev, password: '' }));
    setShowAuthModal(true);
  };

  const submitAuth = (e) => {
    e.preventDefault();
    if (authBusy) return;
    setAuthBusy(true);
    setErrorMessage('');
    socket.emit(authMode === 'register' ? 'auth_register' : 'auth_login', authForm);
  };

  const handleLogout = () => {
    persistAuth(null, '');
    setFriends([]);
    setFriendRequests([]);
    setFriendSearchResults([]);
    setShowSocialModal(false);
  };

  // ──────────────────────────────────────────────────────
  // 5. SOSYAL FONKSIYONLAR
  // ──────────────────────────────────────────────────────

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

  const unfriendUser = (targetUsername) => {
    socket.emit('unfriend', { targetUsername, token: authToken });
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

  // ──────────────────────────────────────────────────────
  // 6. ODA YONETIM FONKSIYONLARI
  // ──────────────────────────────────────────────────────

  const handleQuickCreateRoom = () => setShowQuickCreate(true);

  const handleQuickCreateSubmit = (e) => {
    e.preventDefault();
    const finalRoomId = quickRoomName.trim().toLowerCase() || 'oda-' + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('cm_saved_pass', quickRoomPass.trim());
    const joinData = { roomId: finalRoomId, password: quickRoomPass.trim(), maxUsers: quickMaxUsers, userId, userCity, username, avatar: myAvatar, roomType: quickRoomType };

    if (socket.connected) {
      socket.emit('join_room', joinData);
    } else {
      socket.once('connect', () => socket.emit('join_room', joinData));
      if (!socket.connected) socket.connect();
    }

    setShowQuickCreate(false);
    setQuickRoomName('');
    setQuickRoomPass('');
    setQuickMaxUsers('2');
  };

  const handleJoinRoomFromModal = (e) => {
    e.preventDefault();
    if (!joinRoomTarget) return;
    localStorage.setItem('cm_saved_pass', joinModalPass.trim());
    socket.emit('join_room', {
      roomId: joinRoomTarget.id, password: joinModalPass.trim(),
      userId, userCity, username, avatar: myAvatar, roomType: 'video'
    });
    setShowJoinModal(false);
    setJoinRoomTarget(null);
    setJoinModalPass('');
  };

  const handleLeaveRoom = () => {
    socket.emit('leave_room');
    setInRoom(false);
    setMediaType('none');
    setMediaSrc('');
    setMessages([]);
    setReplyTo(null);
    localStorage.removeItem('cm_saved_room');
    localStorage.removeItem('cm_saved_pass');
    window.history.replaceState({}, '', window.location.pathname);
  };

  const handleSaveSettings = () => {
    socket.emit('update_room_settings', {
      roomId: currentRoomIdRef.current,
      newName: editRoomNameInput.trim() || roomName,
      newTheme: roomTheme
    });
    setShowSettingsModal(false);
  };

  const handleKickUser = (targetUserId) => socket.emit('kick_user', { roomId: currentRoomIdRef.current, targetUserId });
  const handleTransferAdmin = (targetUserId) => socket.emit('update_room_settings', { roomId: currentRoomIdRef.current, newHostUserId: targetUserId });

  // ──────────────────────────────────────────────────────
  // 7. MEDYA & PLAYLIST FONKSIYONLARI
  // ──────────────────────────────────────────────────────

  const handlePlay = () => {
    if (musicAudioRef.current) { try { musicAudioRef.current.play(); } catch {} }
    if (ytPlayerRef.current) { try { ytPlayerRef.current.playVideo(); } catch {} }
    sendAction('PLAY', { time: 0 });
  };

  const handlePause = () => {
    if (musicAudioRef.current) { try { musicAudioRef.current.pause(); } catch {} }
    if (ytPlayerRef.current) { try { ytPlayerRef.current.pauseVideo(); } catch {} }
    sendAction('PAUSE', {});
  };

  const handleMediaEnd = useCallback(() => {
    const pl = playlistRef.current;
    const pm = playModeRef.current;
    const ms = mediaSrcRef.current;
    if (!pl || pl.length === 0) return;

    let nextTrack;
    if (pm === 'shuffle') {
      nextTrack = pl[Math.floor(Math.random() * pl.length)];
    } else {
      const activeList = pm === 'alphabetical' ? [...pl].sort((a, b) => a.title.localeCompare(b.title, 'tr')) : pl;
      const idx = activeList.findIndex(item => item.src === ms);
      nextTrack = activeList[(idx + 1) % activeList.length];
    }
    if (nextTrack) {
      setMediaType(nextTrack.type);
      setMediaSrc(nextTrack.src);
      sendAction('CHANGE_MEDIA', { type: nextTrack.type, src: nextTrack.src, title: nextTrack.title });
    }
  }, []);

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

  const handleSelectSearchResult = (song, playImmediately = true) => {
    if (!song) return;
    if (playImmediately) {
      setYoutubeError(null);
      if (song.src) {
        const type = roomType === 'music' ? 'music' : 'youtube';
        setMediaType(type);
        setMediaSrc(song.src);
        setMediaMeta({ title: song.title, artist: song.artist, thumbnail: song.thumbnail });
        sendAction('CHANGE_MEDIA', { type, src: song.src, title: song.title });
      } else if (song.youtubeQuery) {
        setSearchInput(song.youtubeQuery);
      }
    } else {
      handleOpenAddModal(song);
    }
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
    socket.emit('add_to_playlist', {
      roomId: currentRoomIdRef.current,
      item: { ...pendingMediaItem, category: modalTargetCategory }
    });
    setShowFolderModal(false);
    setPendingMediaItem(null);
  };

  const handleSelectPlaylistItem = (item) => {
    setYoutubeError(null);
    setMediaType(item.type);
    setMediaSrc(item.src);
    sendAction('CHANGE_MEDIA', { type: item.type, src: item.src, title: item.title });
  };

  const handleRemovePlaylistItem = (itemId, e) => {
    e.stopPropagation();
    socket.emit('remove_from_playlist', { roomId: currentRoomIdRef.current, itemId });
  };

  const handleModeChange = (mode) => {
    setPlayMode(mode);
    socket.emit('change_play_mode', { roomId: currentRoomIdRef.current, mode });
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCategoryInput.trim()) return;
    socket.emit('create_category', { roomId: currentRoomIdRef.current, categoryName: newCategoryInput.trim() });
    setSelectedCategory(newCategoryInput.trim());
    setNewCategoryInput('');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg = {
      senderId: mySocketId, text: chatInput,
      sender: authUser?.username || username || 'Izleyici',
      avatar: authUser?.avatar || myAvatar,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      replyTo: replyTo?.id || null, replyToText: replyTo?.text || null, replyToSender: replyTo?.sender || null
    };
    setMessages((prev) => {
      const updated = [...prev, newMsg];
      saveRoomMessages(currentRoomIdRef.current, updated);
      return updated;
    });
    sendAction('CHAT_MESSAGE', newMsg);
    setChatInput('');
    setReplyTo(null);
  };

  const sendReaction = (emoji) => {
    const reaction = { id: Date.now() + Math.random(), emoji, left: Math.floor(Math.random() * 80) + 10 };
    showFloatingEmoji(reaction);
    sendAction('REACTION', reaction);
  };

  const handleYouTubeError = (event) => {
    const code = event?.data;
    const msgs = {
      2: 'YouTube baglantisi gecersiz.', 5: 'Video HTML5 oynatici hatasi.',
      100: 'Video bulunamadi veya kaldirildi.',
      101: 'Video sahibi bu videonun baska sitelerde oynatilmasina izin vermiyor.',
      150: 'Video sahibi bu videonun baska sitelerde oynatilmasina izin vermiyor.'
    };
    setYoutubeError({ code, message: msgs[code] || 'YouTube videosu bu sitede oynatilamiyor.' });
  };

  const openYouTubeExternally = () => {
    if (mediaSrc) window.open(`https://www.youtube.com/watch?v=${mediaSrc}`, '_blank', 'noopener,noreferrer');
  };

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      alert('Tarayicinizin menusunden "Ana Ekrana Ekle" secenegiyle uygulamayi cihaziniza yukleyebilirsiniz!');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBtn(false);
    setDeferredPrompt(null);
  };

  const filteredPlaylist = useMemo(() => {
    if (!Array.isArray(playlist)) return [];
    let filtered = playlist.filter(item => (item.category || 'Genel') === selectedCategory);
    if (playMode === 'alphabetical') return [...filtered].sort((a, b) => a.title.localeCompare(b.title, 'tr'));
    return filtered;
  }, [playlist, selectedCategory, playMode]);

  // ──────────────────────────────────────────────────────
  // 8. EFFECTS
  // ──────────────────────────────────────────────────────

  // PWA install
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setShowInstallBtn(true); };
    window.addEventListener('beforeinstallprompt', handler);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    return () => { window.removeEventListener('beforeinstallprompt', handler); socketRef.current?.disconnect(); socketRef.current = null; };
  }, []);

  // MediaSession
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', handlePlay);
      navigator.mediaSession.setActionHandler('pause', handlePause);
      navigator.mediaSession.setActionHandler('nexttrack', () => handleMediaEndRef.current?.());
    }
  }, [mediaType]);

  // WakeLock
  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && mediaType !== 'none') {
          wakeLock = await navigator.wakeLock.request('screen');
          wakeLock.addEventListener('release', () => { wakeLock = null; });
        }
      } catch {}
    };
    if (mediaType !== 'none') requestWakeLock();
    return () => { if (wakeLock) wakeLock.release(); };
  }, [mediaType]);

  // URL'den odaya otomatik katil
  useEffect(() => {
    const targetRoom = new URLSearchParams(window.location.search).get('room');
    if (targetRoom && socket) {
      socket.emit('join_room', { roomId: targetRoom, password: '', userId, userCity, username, avatar: myAvatar, roomType: 'video' });
    }
  }, [userId]);

  // Arama debounce
  useEffect(() => {
    if (!searchInput.trim() || searchInput.trim().length < 2 || searchInput.includes('http://') || searchInput.includes('https://')) {
      setSearchResults([]); setIsSearching(false); return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => { if (socket) socket.emit('search_music', { query: searchInput.trim() }); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ──────────────────────────────────────────────────────
  // 9. SOCKET EVENT HANDLER'LARI
  // ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!socket) return;

    // Baglanti
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // Genel
    socket.on('public_rooms_update', (roomsList) => setPublicRooms(Array.isArray(roomsList) ? roomsList : []));
    socket.on('search_results', (results) => { setSearchResults(Array.isArray(results) ? results : []); setIsSearching(false); });

    // Oda
    socket.on('room_joined', (data) => {
      setInRoom(true);
      setErrorMessage('');
      setRoomId(data.roomId);
      setRoomName(data.roomName || data.roomId);
      setHostUserId(data.hostUserId);
      setRoomTheme(data.theme || 'default');
      setRoomType(data.roomType || 'video');
      setMySocketId(data.socketId);
      if (data.users) setRoomUsersList(data.users);
      setCurrentRoomInfo({ userCount: data.userCount, maxUsers: data.maxUsers });

      if (Array.isArray(data.playlist)) { setPlaylist(data.playlist); localStorage.setItem('cm_local_playlist', JSON.stringify(data.playlist)); }
      if (Array.isArray(data.categories)) { setCategories(data.categories); localStorage.setItem('cm_local_categories', JSON.stringify(data.categories)); }
      if (data.playMode) setPlayMode(data.playMode);

      const serverMsgs = Array.isArray(data.messages) ? data.messages : [];
      const localMsgs = loadRoomMessages(data.roomId);
      const mergedMsgs = serverMsgs.length > 0 ? serverMsgs : localMsgs;
      setMessages(mergedMsgs);
      saveRoomMessages(data.roomId, mergedMsgs);

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
            if (data.currentMedia.isPlaying) ytPlayerRef.current.playVideo(); else ytPlayerRef.current.pauseVideo();
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

    socket.on('kicked_from_room', (msg) => { setErrorMessage(msg); handleLeaveRoom(); });

    socket.on('categories_updated', (cats) => { setCategories(cats); localStorage.setItem('cm_local_categories', JSON.stringify(cats)); });
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

    // Oda aksiyonlari
    socket.on('room_action', ({ type, payload }) => {
      if (type === 'PLAY') {
        if (musicAudioRef.current) { try { musicAudioRef.current.play(); } catch {} }
        if (ytPlayerRef.current) { try { ytPlayerRef.current.seekTo(payload.time || 0, true); ytPlayerRef.current.playVideo(); } catch {} }
      } else if (type === 'PAUSE') {
        if (musicAudioRef.current) { try { musicAudioRef.current.pause(); } catch {} }
        if (ytPlayerRef.current) { try { ytPlayerRef.current.pauseVideo(); } catch {} }
      } else if (type === 'SEEK') {
        if (ytPlayerRef.current) { try { ytPlayerRef.current.seekTo(payload.time || 0, true); } catch {} }
      } else if (type === 'CHANGE_MEDIA') {
        setYoutubeError(null);
        setMediaType(payload.type);
        setMediaSrc(payload.src);
      } else if (type === 'CHAT_MESSAGE') {
        setMessages((prev) => {
          const updated = [...prev, payload];
          saveRoomMessages(currentRoomIdRef.current, updated);
          return updated;
        });
        if (payload.senderId !== mySocketIdRef.current) {
          playMessageSound();
          if (document.hidden && Notification.permission === 'granted') {
            try {
              new Notification(`${payload.sender} mesaj gonderdi`, {
                body: payload.text,
                icon: 'https://cdn-icons-png.flaticon.com/512/3076/3076753.png',
                vibrate: [200, 100, 200]
              });
            } catch {}
          }
        }
      } else if (type === 'REACTION') {
        showFloatingEmoji(payload);
      }
    });

    // Global sohbet
    socket.on('global_chat_history', (items) => setGlobalMessages(Array.isArray(items) ? items : []));
    socket.on('global_chat_message', (msg) => setGlobalMessages((prev) => [...prev.slice(-79), msg]));

    // Kimlik dogrulama
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
        setErrorMessage(data?.message || 'Islem basarisiz.');
      }
    });

    // Sosyal
    socket.on('friends_update', (data) => {
      setFriends(Array.isArray(data?.friends) ? data.friends : []);
      setFriendRequests(Array.isArray(data?.requests) ? data.requests : []);
    });
    socket.on('friend_search_results', (items) => setFriendSearchResults(Array.isArray(items) ? items : []));
    socket.on('friend_request_received', (data) => setFriendRequests((prev) => [data, ...prev.filter((x) => x.id !== data.id)]));
    socket.on('friend_request_status', (data) => {
      if (data?.message) setErrorMessage(data.message);
      socket.emit('social_sync', { token: authToken });
    });
    socket.on('friend_online_status', (data) => {
      setFriendOnlineStatuses((prev) => ({ ...prev, [data.username]: { isOnline: data.isOnline, lastSeen: data.lastSeen } }));
    });

    // VIP
    socket.on('vip_activated', (data) => {
      setAuthUser((prev) => {
        const updated = { ...prev, isVip: data.isVip, vipExpiry: data.vipExpiry };
        localStorage.setItem('cm_auth_user', JSON.stringify(updated));
        return updated;
      });
    });

    // Bildirim izni
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();

    // Visibility degisikligi
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && socketRef.current) socketRef.current.connect();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      socket.off('connect'); socket.off('disconnect'); socket.off('public_rooms_update');
      socket.off('search_results'); socket.off('room_joined'); socket.off('room_user_count_update');
      socket.off('room_settings_updated'); socket.off('kicked_from_room'); socket.off('categories_updated');
      socket.off('playlist_updated'); socket.off('play_mode_changed'); socket.off('room_error'); socket.off('room_action');
      socket.off('global_chat_history'); socket.off('global_chat_message'); socket.off('social_profile'); socket.off('auth_result');
      socket.off('friends_update'); socket.off('friend_search_results'); socket.off('friend_request_received');
      socket.off('friend_request_status'); socket.off('friend_online_status'); socket.off('vip_activated');
    };
  }, []);

  // ──────────────────────────────────────────────────────
  // 10. RENDER: ANA SAYFA
  // ──────────────────────────────────────────────────────

  if (!inRoom) {
    return (
      <div style={{ ...styles.app, overflowY: 'auto', ...cssVars }}>
        <style>{GLOBAL_CSS + HOME_CSS}</style>
        <div className="cm-home">
          <div className="cm-orb one" /><div className="cm-orb two" /><div className="cm-orb three" />

          <header className="cm-home-nav">
            <div className="cm-home-brand">
              <div className="cm-nav-soundwave">
                {[10,18,26,14,22,16,24,12,20].map((h, i) => (
                  <div key={i} className="cm-nav-bar" style={{ height: `${h}px`, animation: `cmWaveBar 0.8s ease-in-out infinite ${i * 0.07}s` }} />
                ))}
              </div>
              <div>
                <div style={{ fontWeight: 950, color: '#fff', fontSize: 17, letterSpacing: '-0.5px' }}>Couple Meeting</div>
                <div style={{ fontSize: 10, color: '#a78bfa', fontWeight: 800, letterSpacing: '0.5px' }}>LISTEN • CONNECT • SHARE</div>
              </div>
            </div>
            <div className="cm-nav-actions">
              {authUser ? (
                <button onClick={() => setShowSocialModal(true)} className="cm-nav-btn cm-nav-btn-green">{authUser.avatar || myAvatar} {authUser.username}</button>
              ) : (
                <>
                  <button onClick={() => openAuth('login')} className="cm-nav-btn cm-nav-btn-ghost">Giris Yap</button>
                  <button onClick={() => openAuth('register')} className="cm-nav-btn cm-nav-btn-green">Ucretsiz Katil</button>
                </>
              )}
            </div>
          </header>

          <main className="cm-home-main">
            <Hero authUser={authUser} openAuth={openAuth} handleQuickCreateRoom={handleQuickCreateRoom} />
            <PublicRooms publicRooms={publicRooms} onJoinRoom={(room) => { setJoinRoomTarget(room); setShowJoinModal(true); }} />
            <SocialPreview globalMessages={globalMessages} setShowSocialModal={setShowSocialModal} />
            <Features />
            <div className="cm-footer">
              <div className="cm-footer-text">
                <span style={{ fontWeight: 900, color: '#fff' }}>couple</span>
                <span style={{ fontWeight: 300, color: '#a78bfa' }}>meeting</span>
              </div>
              <div className="cm-footer-slogan">Uzakligi biraz daha kuculten internet. ❤️</div>
            </div>
          </main>

          {showAuthModal && (
            <AuthModal authMode={authMode} setAuthMode={setAuthMode} authForm={authForm} setAuthForm={setAuthForm} authBusy={authBusy} submitAuth={submitAuth} setShowAuthModal={setShowAuthModal} errorMessage={errorMessage} setErrorMessage={setErrorMessage} styles={styles} />
          )}
          {showSocialModal && (
            <SocialModal authUser={authUser} socialTab={socialTab} setSocialTab={setSocialTab} globalMessages={globalMessages} globalChatInput={globalChatInput} setGlobalChatInput={setGlobalChatInput} sendGlobalMessage={sendGlobalMessage} friendSearch={friendSearch} setFriendSearch={setFriendSearch} searchFriends={searchFriends} friendSearchResults={friendSearchResults} sendFriendRequest={sendFriendRequest} friendRequests={friendRequests} respondFriendRequest={respondFriendRequest} friends={friends} friendOnlineStatuses={friendOnlineStatuses} unfriendUser={unfriendUser} profileBioInput={profileBioInput} setProfileBioInput={setProfileBioInput} profileStatusInput={profileStatusInput} setProfileStatusInput={setProfileStatusInput} myAvatar={myAvatar} setMyAvatar={setMyAvatar} saveProfile={saveProfile} openAuth={openAuth} handleLogout={handleLogout} setShowSocialModal={setShowSocialModal} showVipModal={showVipModal} setShowVipModal={setShowVipModal} styles={styles} />
          )}
          {showVipModal && <VipModal authUser={authUser} setShowVipModal={setShowVipModal} setAuthUser={setAuthUser} styles={styles} />}

          {showQuickCreate && (
            <div style={{ position:'fixed', inset:0, zIndex:25000, background:'rgba(0,0,0,.85)', backdropFilter:'blur(20px)', display:'flex', alignItems:'center', justifyContent:'center', padding:14 }}>
              <div style={{ width:'min(420px,100%)', background:'linear-gradient(180deg,#111b21,#0a0f14)', border:'1px solid #2a3942', borderRadius:24, overflow:'hidden', boxShadow:'0 40px 120px rgba(0,0,0,.6)' }}>
                <div style={{ padding:'22px 24px', borderBottom:'1px solid #25313a', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ color:'#a78bfa', fontSize:11, fontWeight:900 }}>🚀 YENI ODA</div>
                    <div style={{ color:'#fff', fontSize:18, fontWeight:950, marginTop:2 }}>Oda Olustur</div>
                  </div>
                  <button onClick={() => setShowQuickCreate(false)} style={{ background:'rgba(255,255,255,.06)', border:'none', color:'#7f8c98', width:32, height:32, borderRadius:10, cursor:'pointer', fontSize:14 }}>✕</button>
                </div>
                <form onSubmit={handleQuickCreateSubmit} style={{ padding:'20px 24px 24px', display:'flex', flexDirection:'column', gap:12 }}>
                  <div>
                    <label style={{ color:'#94a3b8', fontSize:11, fontWeight:800, display:'block', marginBottom:5 }}>Oda Adi</label>
                    <input value={quickRoomName} onChange={(e) => setQuickRoomName(e.target.value)} placeholder="orn: muzik gecesi" style={{ width:'100%', padding:'12px 14px', background:'#0b141a', border:'1px solid #25313a', color:'#e9edef', borderRadius:12, fontSize:13, outline:'none', boxSizing:'border-box' }} />
                  </div>
                  <div>
                    <label style={{ color:'#94a3b8', fontSize:11, fontWeight:800, display:'block', marginBottom:5 }}>Sifre (istege bagli)</label>
                    <input type="password" value={quickRoomPass} onChange={(e) => setQuickRoomPass(e.target.value)} placeholder="Sifre koymak istersen yaz" style={{ width:'100%', padding:'12px 14px', background:'#0b141a', border:'1px solid #25313a', color:'#e9edef', borderRadius:12, fontSize:13, outline:'none', boxSizing:'border-box' }} />
                  </div>
                  <div>
                    <label style={{ color:'#94a3b8', fontSize:11, fontWeight:800, display:'block', marginBottom:5 }}>Maksimum Kisi</label>
                    <select value={quickMaxUsers} onChange={(e) => setQuickMaxUsers(e.target.value)} style={{ width:'100%', padding:'12px 14px', background:'#0b141a', border:'1px solid #25313a', color:'#e9edef', borderRadius:12, fontSize:13, outline:'none', boxSizing:'border-box' }}>
                      <option value="2">2 Kisi 💑</option>
                      <option value="4">4 Kisi 👥</option>
                      <option value="8">8 Kisi 🎉</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color:'#94a3b8', fontSize:11, fontWeight:800, display:'block', marginBottom:5 }}>Oda Tipi</label>
                    <div style={{ display:'flex', gap:8 }}>
                      <button type="button" onClick={() => setQuickRoomType('video')} style={{ flex:1, padding:'10px', borderRadius:10, border: quickRoomType === 'video' ? '2px solid #7c3aed' : '1px solid #25313a', background: quickRoomType === 'video' ? 'rgba(124,58,237,.15)' : '#0b141a', color: quickRoomType === 'video' ? '#a855f7' : '#94a3b8', fontSize:12, fontWeight:700, cursor:'pointer' }}>🎬 Video</button>
                      <button type="button" onClick={() => setQuickRoomType('music')} style={{ flex:1, padding:'10px', borderRadius:10, border: quickRoomType === 'music' ? '2px solid #7c3aed' : '1px solid #25313a', background: quickRoomType === 'music' ? 'rgba(124,58,237,.15)' : '#0b141a', color: quickRoomType === 'music' ? '#a855f7' : '#94a3b8', fontSize:12, fontWeight:700, cursor:'pointer' }}>🎵 Muzik</button>
                    </div>
                  </div>
                  <button type="submit" style={{ padding:'14px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#7c3aed,#a855f7)', color:'#fff', fontSize:15, fontWeight:900, cursor:'pointer', boxShadow:'0 8px 25px rgba(124,58,237,.3)', marginTop:4 }}>🚀 Odayi Baslat</button>
                </form>
              </div>
            </div>
          )}

          {showJoinModal && joinRoomTarget && (
            <div style={{ position:'fixed', inset:0, zIndex:25000, background:'rgba(0,0,0,.85)', backdropFilter:'blur(20px)', display:'flex', alignItems:'center', justifyContent:'center', padding:14 }}>
              <div style={{ width:'min(380px,100%)', background:'linear-gradient(180deg,#111b21,#0a0f14)', border:'1px solid #2a3942', borderRadius:24, overflow:'hidden', boxShadow:'0 40px 120px rgba(0,0,0,.6)' }}>
                <div style={{ padding:'22px 24px', borderBottom:'1px solid #25313a', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ color:'#2563eb', fontSize:11, fontWeight:900 }}>🚪 ODAYA KATIL</div>
                    <div style={{ color:'#fff', fontSize:18, fontWeight:950, marginTop:2 }}>{joinRoomTarget.name}</div>
                  </div>
                  <button onClick={() => { setShowJoinModal(false); setJoinRoomTarget(null); setJoinModalPass(''); }} style={{ background:'rgba(255,255,255,.06)', border:'none', color:'#7f8c98', width:32, height:32, borderRadius:10, cursor:'pointer', fontSize:14 }}>✕</button>
                </div>
                <form onSubmit={handleJoinRoomFromModal} style={{ padding:'20px 24px 24px', display:'flex', flexDirection:'column', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:'rgba(255,255,255,.03)', borderRadius:12, border:'1px solid rgba(255,255,255,.06)' }}>
                    <div style={{ fontSize:24 }}>{joinRoomTarget.hasPassword ? '🔒' : '🎵'}</div>
                    <div>
                      <div style={{ color:'#fff', fontSize:14, fontWeight:900 }}>{joinRoomTarget.name}</div>
                      <div style={{ color:'#64748b', fontSize:11 }}>{joinRoomTarget.userCount}/{joinRoomTarget.maxUsers} kisi • {joinRoomTarget.hasPassword ? 'Sifreli' : 'Acik'}</div>
                    </div>
                  </div>
                  {joinRoomTarget.hasPassword && (
                    <div>
                      <label style={{ color:'#94a3b8', fontSize:11, fontWeight:800, display:'block', marginBottom:5 }}>Oda Sifresi</label>
                      <input type="password" value={joinModalPass} onChange={(e) => setJoinModalPass(e.target.value)} placeholder="Sifreyi girin..." autoFocus style={{ width:'100%', padding:'12px 14px', background:'#0b141a', border:'1px solid #25313a', color:'#e9edef', borderRadius:12, fontSize:13, outline:'none', boxSizing:'border-box' }} />
                    </div>
                  )}
                  <button type="submit" style={{ padding:'14px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#2563eb,#3b82f6)', color:'#fff', fontSize:15, fontWeight:900, cursor:'pointer', boxShadow:'0 8px 25px rgba(37,99,235,.3)', marginTop:4 }}>🚪 Odaya Gir</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────
  // 11. RENDER: ODA
  // ──────────────────────────────────────────────────────

  return (
    <div style={{ ...styles.app, display: 'flex', flexDirection: 'column', ...cssVars }}>
      <style>{GLOBAL_CSS + `\n@keyframes floatUpRoom { 0% { transform: translateY(0) scale(0.8); opacity: 1; } 100% { transform: translateY(-300px) scale(1.6); opacity: 0; }\n`}</style>

      {showFolderModal && (
        <FolderModal pendingMediaItem={pendingMediaItem} modalTargetCategory={modalTargetCategory} setModalTargetCategory={setModalTargetCategory} categories={categories} confirmAddToPlaylist={confirmAddToPlaylist} setShowFolderModal={setShowFolderModal} currentTheme={currentTheme} styles={styles} />
      )}

      {showSettingsModal && (
        <SettingsModal hostUserId={hostUserId} userId={userId} editRoomNameInput={editRoomNameInput} setEditRoomNameInput={setEditRoomNameInput} roomName={roomName} roomTheme={roomTheme} setRoomTheme={setRoomTheme} handleSaveSettings={handleSaveSettings} roomUsersList={roomUsersList} handleTransferAdmin={handleTransferAdmin} handleKickUser={handleKickUser} setShowSettingsModal={setShowSettingsModal} currentTheme={currentTheme} authUser={authUser} styles={styles} />
      )}

      <Header
        roomName={roomName} currentTheme={currentTheme} isConnected={isConnected}
        currentRoomInfo={currentRoomInfo} showInstallBtn={showInstallBtn}
        handleInstallApp={handleInstallApp} setShowSettingsModal={setShowSettingsModal}
        authUser={authUser} myAvatar={myAvatar} handleLeaveRoom={handleLeaveRoom}
      />

      <div className="cm-room-layout" style={{ flex: 1, display: 'flex', width: '100%', height: 'calc(100dvh - 60px)', overflow: 'hidden' }}>
        <div className="cm-player-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000', position: 'relative' }}>
          <SearchBar
            searchInput={searchInput} setSearchInput={setSearchInput}
            searchResults={searchResults} isSearching={isSearching}
            currentTheme={currentTheme} handleDirectPlay={handleDirectPlay}
            handleOpenAddModal={handleOpenAddModal} handleSelectSearchResult={handleSelectSearchResult}
          />
          <Player
            mediaType={mediaType} mediaSrc={mediaSrc} youtubeError={youtubeError} mediaMeta={mediaMeta}
            ytPlayerRef={ytPlayerRef} reactions={reactions} musicAudioRef={musicAudioRef}
            openYouTubeExternally={openYouTubeExternally}
            handleMediaEnd={handleMediaEnd} handleYouTubeError={handleYouTubeError}
          />
          <Controls currentTheme={currentTheme} handlePlay={handlePlay} handlePause={handlePause} sendReaction={sendReaction} />
        </div>

        <div className="cm-sidebar" style={{ width: '380px', maxWidth: '100%', background: currentTheme.cardBg, borderLeft: '1px solid #222d34', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #222d34', background: '#0b141a' }}>
            <button onClick={() => setSidebarTab('chat')} style={{ flex: 1, padding: '12px', border: 'none', background: sidebarTab === 'chat' ? currentTheme.cardBg : 'transparent', color: sidebarTab === 'chat' ? currentTheme.primary : '#8696a0', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>💬 Sohbet</button>
            <button onClick={() => setSidebarTab('playlist')} style={{ flex: 1, padding: '12px', border: 'none', background: sidebarTab === 'playlist' ? currentTheme.cardBg : 'transparent', color: sidebarTab === 'playlist' ? currentTheme.primary : '#8696a0', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>📚 Kitaplik ({playlist ? playlist.length : 0})</button>
          </div>

          {sidebarTab === 'chat' ? (
            <Chat messages={messages} mySocketId={mySocketId} username={authUser?.username || username} chatInput={chatInput} setChatInput={setChatInput} handleSendMessage={handleSendMessage} currentTheme={currentTheme} replyTo={replyTo} setReplyTo={setReplyTo} />
          ) : (
            <Playlist
              categories={categories} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
              newCategoryInput={newCategoryInput} setNewCategoryInput={setNewCategoryInput}
              handleCreateCategory={handleCreateCategory} playMode={playMode}
              handleModeChange={handleModeChange} filteredPlaylist={filteredPlaylist}
              mediaSrc={mediaSrc} handleSelectPlaylistItem={handleSelectPlaylistItem}
              handleRemovePlaylistItem={handleRemovePlaylistItem} currentTheme={currentTheme}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
