import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import io from 'socket.io-client';

import { BACKEND_URL, THEMES, GLOBAL_CSS, HOME_CSS } from './constants';
import { getStyles } from './styles';
import { processUrl } from './utils/processUrl';

import Hero from './Home/Hero';
import Features from './Home/Features';
import PublicRooms from './Home/PublicRooms';
import SocialPreview from './Home/SocialPreview';
import CreateJoin from './Home/CreateJoin';

import Header from './Room/Header';
import SearchBar from './Room/SearchBar';
import Player from './Room/Player';
import Controls from './Room/Controls';
import Chat from './Room/Chat';
import Playlist from './Room/Playlist';

import AuthModal from './Modals/AuthModal';
import SocialModal from './Modals/SocialModal';
import FolderModal from './Modals/FolderModal';
import SettingsModal from './Modals/SettingsModal';
import VipModal from './Modals/VipModal';

function App() {
  const [userId] = useState(() => {
    let savedId = localStorage.getItem('cm_user_id');
    if (!savedId) { savedId = 'usr_' + Math.random().toString(36).substring(2, 9); localStorage.setItem('cm_user_id', savedId); }
    return savedId;
  });

  const [inRoom, setInRoom] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return !!(urlParams.get('room') || localStorage.getItem('cm_saved_room'));
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
  const [username] = useState(() => localStorage.getItem('cm_username') || 'İzleyici');
  const [userCity] = useState(() => localStorage.getItem('cm_user_city') || 'Zonguldak');
  const [mySocketId, setMySocketId] = useState('');

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
    try { return JSON.parse(localStorage.getItem('cm_local_playlist')) || []; } catch { return []; }
  });
  const [categories, setCategories] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cm_local_categories')) || ['Genel']; } catch { return ['Genel']; }
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

  // --- YENİ: Yanıtlama ---
  const [replyTo, setReplyTo] = useState(null);

  // --- YENİ: Arkada online durumları ---
  const [friendOnlineStatuses, setFriendOnlineStatuses] = useState({});

  const [authUser, setAuthUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cm_auth_user')) || null; } catch { return null; }
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
  const [showVipModal, setShowVipModal] = useState(false);

  const [editRoomNameInput, setEditRoomNameInput] = useState('');

  const ytPlayerRef = useRef(null);
  const customVideoRef = useRef(null);
  const socketRef = useRef(null);
  const currentRoomIdRef = useRef(roomId);

  if (!socketRef.current) {
    socketRef.current = io(BACKEND_URL, { transports: ['polling', 'websocket'], autoConnect: true });
  }
  const socket = socketRef.current;

  useEffect(() => { currentRoomIdRef.current = roomId; }, [roomId]);

  const persistAuth = (user, token) => {
    setAuthUser(user);
    setAuthToken(token || '');
    if (user) localStorage.setItem('cm_auth_user', JSON.stringify(user));
    else localStorage.removeItem('cm_auth_user');
    if (token) localStorage.setItem('cm_auth_token', token);
    else localStorage.removeItem('cm_auth_token');
  };

  const currentTheme = THEMES[roomTheme] || THEMES.default;
  const cssVars = { '--cm-primary': currentTheme.primary };
  const styles = getStyles(currentTheme);

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
      const updated = [targetRoomId, ...recent.filter(r => r !== targetRoomId)].slice(0, 5);
      localStorage.setItem('cm_recent_rooms', JSON.stringify(updated));
    } catch {}
  };

  // --- YENİ: Oda mesajlarını localStorage'a kaydet ---
  const saveRoomMessages = useCallback((rid, msgs) => {
    try { localStorage.setItem(`cm_room_msgs_${rid}`, JSON.stringify(msgs.slice(-200))); } catch {}
  }, []);

  const loadRoomMessages = useCallback((rid) => {
    try { return JSON.parse(localStorage.getItem(`cm_room_msgs_${rid}`)) || []; } catch { return []; }
  }, []);

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

  const sendGlobalMessage = (e) => {
    e.preventDefault();
    const text = globalChatInput.trim();
    if (!text) return;
    socket.emit('global_chat_message', {
      text, username: authUser?.username || username || 'Misafir',
      avatar: authUser?.avatar || myAvatar, token: authToken || ''
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
      token: authToken, bio: profileBioInput.trim().slice(0, 120),
      status: profileStatusInput.trim().slice(0, 80), avatar: myAvatar
    });
  };

  const handleQuickCreateRoom = () => {
    const quickId = 'oda-' + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('cm_saved_pass', '');
    socket.emit('join_room', { roomId: quickId, password: '', maxUsers: '2', userId, userCity, username, avatar: myAvatar });
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
    setReplyTo(null);
    localStorage.removeItem('cm_saved_room');
    localStorage.removeItem('cm_saved_pass');
    window.history.replaceState({}, '', window.location.pathname);
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

  const handleMediaEnd = () => {
    if (!playlist || playlist.length === 0) return;
    let nextTrack;
    if (playMode === 'shuffle') {
      nextTrack = playlist[Math.floor(Math.random() * playlist.length)];
    } else {
      const activeList = playMode === 'alphabetical'
        ? [...playlist].sort((a, b) => a.title.localeCompare(b.title, 'tr'))
        : playlist;
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
    if (item) { setPendingMediaItem(item); setModalTargetCategory(selectedCategory || 'Genel'); setShowFolderModal(true); }
  };

  const confirmAddToPlaylist = () => {
    if (!pendingMediaItem) return;
    socket.emit('add_to_playlist', { roomId: currentRoomIdRef.current, item: { ...pendingMediaItem, category: modalTargetCategory } });
    setShowFolderModal(false);
    setPendingMediaItem(null);
  };

  const handleSelectSearchResult = (song, playImmediately = true) => {
    if (!song) return;
    if (playImmediately) {
      setYoutubeError(null); setMediaType('youtube'); setMediaSrc(song.src);
      sendAction('CHANGE_MEDIA', { type: 'youtube', src: song.src });
    } else { handleOpenAddModal(song); }
  };

  const handleSelectPlaylistItem = (item) => {
    setYoutubeError(null); setMediaType(item.type); setMediaSrc(item.src);
    sendAction('CHANGE_MEDIA', { type: item.type, src: item.src });
  };

  const handleRemovePlaylistItem = (itemId, e) => {
    e.stopPropagation();
    socket.emit('remove_from_playlist', { roomId: currentRoomIdRef.current, itemId });
  };

  const handlePlay = () => {
    let time = 0;
    if (mediaType === 'youtube' && ytPlayerRef.current) {
      time = ytPlayerRef.current.getCurrentTime(); ytPlayerRef.current.playVideo();
    } else if (mediaType === 'custom_video' && customVideoRef.current) {
      time = customVideoRef.current.currentTime; customVideoRef.current.play().catch(() => {});
    } else if (mediaType === 'iframe') return;
    sendAction('PLAY', { time });
  };

  const handlePause = () => {
    if (mediaType === 'youtube') ytPlayerRef.current?.pauseVideo();
    if (mediaType === 'custom_video') customVideoRef.current?.pause();
    sendAction('PAUSE', {});
  };

  // --- YENİ: Mesaj gönderme + yanıtlama ---
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg = {
      senderId: mySocketId, text: chatInput, sender: authUser?.username || username || 'İzleyici',
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

  const handleSaveSettings = () => {
    socket.emit('update_room_settings', {
      roomId: currentRoomIdRef.current, newName: editRoomNameInput.trim() || roomName, newTheme: roomTheme
    });
    setShowSettingsModal(false);
  };

  const handleKickUser = (targetUserId) => socket.emit('kick_user', { roomId: currentRoomIdRef.current, targetUserId });
  const handleTransferAdmin = (targetUserId) => {
    socket.emit('update_room_settings', { roomId: currentRoomIdRef.current, newHostUserId: targetUserId });
  };

  const handleYouTubeError = (event) => {
    const code = event?.data;
    const msgs = {
      2: 'YouTube bağlantısı geçersiz.', 5: 'Video HTML5 oynatıcı hatası verdi.',
      100: 'Video bulunamadı veya kaldırıldı.',
      101: 'Video sahibi bu videonun başka sitelerde oynatılmasına izin vermiyor.',
      150: 'Video sahibi bu videonun başka sitelerde oynatılmasına izin vermiyor.'
    };
    setYoutubeError({ code, message: msgs[code] || 'YouTube videosu bu sitede oynatılamıyor.' });
  };

  const useFallbackSource = () => {
    const url = fallbackUrl.trim();
    if (!url) return;
    const parsed = processUrl(url);
    if (!parsed || !parsed.src) return;
    setYoutubeError(null); setMediaType(parsed.type); setMediaSrc(parsed.src);
    sendAction('CHANGE_MEDIA', { type: parsed.type, src: parsed.src }); setFallbackUrl('');
  };

  const openYouTubeExternally = () => {
    if (mediaSrc) window.open(`https://www.youtube.com/watch?v=${mediaSrc}`, '_blank', 'noopener,noreferrer');
  };

  const filteredPlaylist = useMemo(() => {
    if (!Array.isArray(playlist)) return [];
    let filtered = playlist.filter(item => (item.category || 'Genel') === selectedCategory);
    if (playMode === 'alphabetical') return [...filtered].sort((a, b) => a.title.localeCompare(b.title, 'tr'));
    return filtered;
  }, [playlist, selectedCategory, playMode]);

  // --- Effects ---
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e); setShowInstallBtn(true); };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => { window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt); socketRef.current?.disconnect(); socketRef.current = null; };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) { alert('Tarayıcınızın menüsünden "Ana Ekrana Ekle" seçeneğiyle uygulamayı cihazınıza yükleyebilirsiniz!'); return; }
    deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBtn(false); setDeferredPrompt(null);
  };

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', handlePlay);
      navigator.mediaSession.setActionHandler('pause', handlePause);
      navigator.mediaSession.setActionHandler('nexttrack', handleMediaEnd);
    }
  }, [mediaSrc, mediaType, playMode, playlist]);

  useEffect(() => {
    if ('mediaSession' in navigator && mediaType !== 'none') {
      const title = playlist.find(i => i.src === mediaSrc)?.title || roomName || 'Couple Meeting Medya';
      navigator.mediaSession.metadata = new MediaMetadata({
        title, artist: 'Couple Meeting', album: 'Birlikte Dinleme Odası',
        artwork: [
          { src: 'https://cdn-icons-png.flaticon.com/512/3076/3076753.png', sizes: '96x96', type: 'image/png' },
          { src: 'https://cdn-icons-png.flaticon.com/512/3076/3076753.png', sizes: '512x512', type: 'image/png' },
        ]
      });
    }
  }, [mediaSrc, mediaType, playlist, roomName]);

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
      setSearchResults([]); setIsSearching(false); return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => { if (socket) socket.emit('search_music', { query: searchInput.trim() }); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!socket) return;
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('public_rooms_update', (roomsList) => setPublicRooms(Array.isArray(roomsList) ? roomsList : []));
    socket.on('search_results', (results) => { setSearchResults(Array.isArray(results) ? results : []); setIsSearching(false); });

    socket.on('room_joined', (data) => {
      setInRoom(true); setErrorMessage('');
      setRoomId(data.roomId); setRoomName(data.roomName || data.roomId);
      setHostUserId(data.hostUserId); setRoomTheme(data.theme || 'default');
      setMySocketId(data.socketId);
      if (data.users) setRoomUsersList(data.users);
      setCurrentRoomInfo({ userCount: data.userCount, maxUsers: data.maxUsers });

      if (Array.isArray(data.playlist)) { setPlaylist(data.playlist); localStorage.setItem('cm_local_playlist', JSON.stringify(data.playlist)); }
      if (Array.isArray(data.categories)) { setCategories(data.categories); localStorage.setItem('cm_local_categories', JSON.stringify(data.categories)); }
      if (data.playMode) setPlayMode(data.playMode);

      // --- YENİ: Mesaj geçmişi hem sunucudan hem local'den ---
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
        setYoutubeError(null); setMediaType(data.currentMedia.type); setMediaSrc(data.currentMedia.src);
        setTimeout(() => {
          if (data.currentMedia.type === 'youtube' && ytPlayerRef.current) {
            ytPlayerRef.current.seekTo(data.currentMedia.time || 0, true);
            if (data.currentMedia.isPlaying) ytPlayerRef.current.playVideo(); else ytPlayerRef.current.pauseVideo();
          } else if (data.currentMedia.type === 'custom_video' && customVideoRef.current) {
            customVideoRef.current.currentTime = data.currentMedia.time || 0;
            if (data.currentMedia.isPlaying) customVideoRef.current.play(); else customVideoRef.current.pause();
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
      setPlaylist(newPlaylist); localStorage.setItem('cm_local_playlist', JSON.stringify(newPlaylist));
      if (data && data.playMode) setPlayMode(data.playMode);
    });
    socket.on('play_mode_changed', (mode) => setPlayMode(mode));
    socket.on('room_error', (msg) => {
      setErrorMessage(msg); setInRoom(false);
      localStorage.removeItem('cm_saved_room'); localStorage.removeItem('cm_saved_pass');
    });

    socket.on('room_action', ({ type, payload }) => {
      if (type === 'PLAY') {
        if (payload.mediaType === 'youtube' && ytPlayerRef.current) { ytPlayerRef.current.seekTo(payload.time || 0, true); ytPlayerRef.current.playVideo(); }
        else if (payload.mediaType === 'custom_video' && customVideoRef.current) { customVideoRef.current.currentTime = payload.time || 0; customVideoRef.current.play(); }
      } else if (type === 'PAUSE') {
        if (payload.mediaType === 'youtube') ytPlayerRef.current?.pauseVideo();
        if (payload.mediaType === 'custom_video') customVideoRef.current?.pause();
      } else if (type === 'CHANGE_MEDIA') {
        setYoutubeError(null); setMediaType(payload.type); setMediaSrc(payload.src);
      } else if (type === 'CHAT_MESSAGE') {
        setMessages((prev) => {
          const updated = [...prev, payload];
          saveRoomMessages(currentRoomIdRef.current, updated);
          return updated;
        });
        // --- YENİ: Bildirim (sayfa gizliyse) ---
        if (document.hidden && Notification.permission === 'granted') {
          new Notification(`${payload.sender} mesaj gönderdi`, { body: payload.text, icon: 'https://cdn-icons-png.flaticon.com/512/3076/3076753.png' });
        }
      } else if (type === 'REACTION') {
        showFloatingEmoji(payload);
      }
    });

    socket.on('global_chat_history', (items) => setGlobalMessages(Array.isArray(items) ? items : []));
    socket.on('global_chat_message', (msg) => setGlobalMessages((prev) => [...prev.slice(-79), msg]));
    socket.on('social_profile', (user) => {
      setAuthUser(user); localStorage.setItem('cm_auth_user', JSON.stringify(user));
      setProfileBioInput(user?.bio || ''); setProfileStatusInput(user?.status || '');
    });
    socket.on('auth_result', (data) => {
      setAuthBusy(false);
      if (data?.ok) {
        persistAuth(data.user, data.token);
        setProfileBioInput(data.user?.bio || ''); setProfileStatusInput(data.user?.status || '');
        setAuthForm({ username: '', email: '', password: '', bio: '', avatar: data.user?.avatar || '🐱' });
        setShowAuthModal(false); setShowSocialModal(true); setErrorMessage('');
        socket.emit('social_sync', { token: data.token });
      } else { setErrorMessage(data?.message || 'İşlem başarısız.'); }
    });
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

    // --- YENİ: Arkadaş online durumu ---
    socket.on('friend_online_status', (data) => {
      setFriendOnlineStatuses((prev) => ({ ...prev, [data.username]: { isOnline: data.isOnline, lastSeen: data.lastSeen } }));
    });

    // --- VIP ---
    socket.on('vip_activated', (data) => {
      setAuthUser((prev) => {
        const updated = { ...prev, isVip: data.isVip, vipExpiry: data.vipExpiry };
        localStorage.setItem('cm_auth_user', JSON.stringify(updated));
        return updated;
      });
    });

    // --- YENİ: Bildirim izni ---
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socket.off('connect'); socket.off('disconnect'); socket.off('public_rooms_update');
      socket.off('search_results'); socket.off('room_joined'); socket.off('room_user_count_update');
      socket.off('room_settings_updated'); socket.off('kicked_from_room'); socket.off('categories_updated');
      socket.off('playlist_updated'); socket.off('play_mode_changed'); socket.off('room_error'); socket.off('room_action');
      socket.off('global_chat_history'); socket.off('global_chat_message'); socket.off('social_profile'); socket.off('auth_result');
      socket.off('friends_update'); socket.off('friend_search_results'); socket.off('friend_request_received');
      socket.off('friend_request_status'); socket.off('friend_online_status'); socket.off('vip_activated');
    };
  }, []);

  // --- Render ---
  if (!inRoom) {
    return (
      <div style={{ ...styles.app, overflowY: 'auto', ...cssVars }}>
        <style>{GLOBAL_CSS + HOME_CSS}</style>
        <div className="cm-home">
          <div className="cm-orb one" /><div className="cm-orb two" /><div className="cm-orb three" />

          <header className="cm-home-nav">
            <div className="cm-home-brand">
              <div className="cm-home-logo">❤️⚡</div>
              <div>
                <div style={{ fontWeight: 950, color: '#fff', fontSize: 17 }}>Couple Meeting</div>
                <div style={{ fontSize: 10, color: '#53e6bc', fontWeight: 800 }}>WATCH • LISTEN • CONNECT</div>
              </div>
            </div>
            <div className="cm-nav-actions">
              <button onClick={() => setShowSocialModal(true)} style={{ background: '#111b21', border: '1px solid #25313a', color: '#fff', padding: '10px 13px', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>🌐 Global Chat</button>
              {authUser ? (
                <button onClick={() => setShowSocialModal(true)} style={{ background: '#00a884', border: 'none', color: '#fff', padding: '10px 13px', borderRadius: 12, fontWeight: 900, cursor: 'pointer' }}>{authUser.avatar || myAvatar} {authUser.username}</button>
              ) : (
                <>
                  <button onClick={() => openAuth('login')} style={{ background: '#111b21', border: '1px solid #25313a', color: '#fff', padding: '10px 13px', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>Giriş Yap</button>
                  <button onClick={() => openAuth('register')} style={{ background: '#00a884', border: 'none', color: '#fff', padding: '10px 13px', borderRadius: 12, fontWeight: 900, cursor: 'pointer' }}>Ücretsiz Katıl</button>
                </>
              )}
            </div>
          </header>

          <main className="cm-home-main">
            <Hero authUser={authUser} openAuth={openAuth} handleQuickCreateRoom={handleQuickCreateRoom} />
            <Features />
            <PublicRooms publicRooms={publicRooms} setJoinRoomInput={setJoinRoomInput} setActiveTab={setActiveTab} />
            <SocialPreview globalMessages={globalMessages} setShowSocialModal={setShowSocialModal} />
            <CreateJoin
              activeTab={activeTab} setActiveTab={setActiveTab} errorMessage={errorMessage}
              roomId={roomId} setRoomId={setRoomId} roomPassword={roomPassword} setRoomPassword={setRoomPassword}
              maxUsers={maxUsers} setMaxUsers={setMaxUsers} joinRoomInput={joinRoomInput} setJoinRoomInput={setJoinRoomInput}
              joinPassInput={joinPassInput} setJoinPassInput={setJoinPassInput}
              handleCreateRoomSubmit={handleCreateRoomSubmit} handleJoinRoomSubmit={handleJoinRoomSubmit}
              currentTheme={currentTheme}
            />
            <div className="cm-footer">Couple Meeting • Uzaklığı biraz daha küçük yapan internet. ❤️</div>
          </main>

          {showAuthModal && (
            <AuthModal
              authMode={authMode} setAuthMode={setAuthMode} authForm={authForm}
              setAuthForm={setAuthForm} authBusy={authBusy} submitAuth={submitAuth}
              setShowAuthModal={setShowAuthModal} errorMessage={errorMessage} setErrorMessage={setErrorMessage} styles={styles}
            />
          )}
          {showSocialModal && (
            <SocialModal
              authUser={authUser} socialTab={socialTab} setSocialTab={setSocialTab}
              globalMessages={globalMessages} globalChatInput={globalChatInput}
              setGlobalChatInput={setGlobalChatInput} sendGlobalMessage={sendGlobalMessage}
              friendSearch={friendSearch} setFriendSearch={setFriendSearch} searchFriends={searchFriends}
              friendSearchResults={friendSearchResults} sendFriendRequest={sendFriendRequest}
              friendRequests={friendRequests} respondFriendRequest={respondFriendRequest}
              friends={friends} friendOnlineStatuses={friendOnlineStatuses} unfriendUser={unfriendUser}
              profileBioInput={profileBioInput} setProfileBioInput={setProfileBioInput}
              profileStatusInput={profileStatusInput} setProfileStatusInput={setProfileStatusInput}
              myAvatar={myAvatar} setMyAvatar={setMyAvatar} saveProfile={saveProfile}
              openAuth={openAuth} handleLogout={handleLogout} setShowSocialModal={setShowSocialModal}
              showVipModal={showVipModal} setShowVipModal={setShowVipModal}
              styles={styles}
            />
          )}
          {showVipModal && (
            <VipModal authUser={authUser} setShowVipModal={setShowVipModal} setAuthUser={setAuthUser} styles={styles} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.app, display: 'flex', flexDirection: 'column', ...cssVars }}>
      <style>{GLOBAL_CSS + `\n@keyframes floatUpRoom { 0% { transform: translateY(0) scale(0.8); opacity: 1; } 100% { transform: translateY(-300px) scale(1.6); opacity: 0; }\n`}</style>

      {showFolderModal && (
        <FolderModal
          pendingMediaItem={pendingMediaItem} modalTargetCategory={modalTargetCategory}
          setModalTargetCategory={setModalTargetCategory} categories={categories}
          confirmAddToPlaylist={confirmAddToPlaylist} setShowFolderModal={setShowFolderModal}
          currentTheme={currentTheme} styles={styles}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          hostUserId={hostUserId} userId={userId} editRoomNameInput={editRoomNameInput}
          setEditRoomNameInput={setEditRoomNameInput} roomName={roomName} roomTheme={roomTheme}
          setRoomTheme={setRoomTheme} handleSaveSettings={handleSaveSettings}
          roomUsersList={roomUsersList} handleTransferAdmin={handleTransferAdmin}
          handleKickUser={handleKickUser} setShowSettingsModal={setShowSettingsModal}
          currentTheme={currentTheme} authUser={authUser} styles={styles}
        />
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
            mediaType={mediaType} mediaSrc={mediaSrc} youtubeError={youtubeError}
            customVideoRef={customVideoRef} ytPlayerRef={ytPlayerRef}
            reactions={reactions} fallbackUrl={fallbackUrl} setFallbackUrl={setFallbackUrl}
            useFallbackSource={useFallbackSource} openYouTubeExternally={openYouTubeExternally}
            setYoutubeError={setYoutubeError} setMediaType={setMediaType}
            handleMediaEnd={handleMediaEnd} handleYouTubeError={handleYouTubeError}
          />
          <Controls currentTheme={currentTheme} handlePlay={handlePlay} handlePause={handlePause} sendReaction={sendReaction} />
        </div>

        <div className="cm-sidebar" style={{ width: '380px', maxWidth: '100%', background: currentTheme.cardBg, borderLeft: '1px solid #222d34', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #222d34', background: '#0b141a' }}>
            <button onClick={() => setSidebarTab('chat')} style={{ flex: 1, padding: '12px', border: 'none', background: sidebarTab === 'chat' ? currentTheme.cardBg : 'transparent', color: sidebarTab === 'chat' ? currentTheme.primary : '#8696a0', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>💬 Sohbet</button>
            <button onClick={() => setSidebarTab('playlist')} style={{ flex: 1, padding: '12px', border: 'none', background: sidebarTab === 'playlist' ? currentTheme.cardBg : 'transparent', color: sidebarTab === 'playlist' ? currentTheme.primary : '#8696a0', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>📚 Kitaplık ({playlist ? playlist.length : 0})</button>
          </div>

          {sidebarTab === 'chat' ? (
            <Chat
              messages={messages} mySocketId={mySocketId} username={authUser?.username || username}
              chatInput={chatInput} setChatInput={setChatInput}
              handleSendMessage={handleSendMessage} currentTheme={currentTheme}
              replyTo={replyTo} setReplyTo={setReplyTo}
            />
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
