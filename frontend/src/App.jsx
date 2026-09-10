import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';

import { BACKEND_URL, THEMES } from './constants';
import { HOME_CSS } from './styles/homeCss';
import { getStyles } from './styles';
import { processUrl } from './utils/processUrl';
import { playMessageSound } from './utils/notificationSound';
import { isApp } from './utils/platform';
import { useSocketEvents } from './hooks/useSocketEvents';
import AppContext from './contexts/AppContext';
import OnboardingScreen from './components/mobile/OnboardingScreen';
import AboutPage from './components/mobile/AboutPage';
import ProfilePage from './components/mobile/ProfilePage';
import MobileHomePage from './components/mobile/MobileHomePage';
import MobileHomeCenter from './components/mobile/MobileHomeCenter';
import RoomsPage from './components/mobile/RoomsPage';
import ChatPage from './components/mobile/ChatPage';
import FriendsPage from './components/mobile/FriendsPage';
import BottomNavBar from './components/mobile/BottomNavBar';

import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';
import NotFoundPage from './pages/NotFoundPage';
import LandingPage from './pages/LandingPage';
import AdminPage from './pages/AdminPage';
import Communities from './pages/Communities';
import Events from './pages/Events';
import BlogPage from './pages/BlogPage';
import AdsPage from './pages/AdsPage';

import AuthModal from './Modals/AuthModal';
import SocialModal from './Modals/SocialModal';
import FolderModal from './Modals/FolderModal';
import SettingsModal from './Modals/SettingsModal';
import ProfileModal from './Modals/ProfileModal';
import VipModal from './Modals/VipModal';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // ── 1. STATE ──
  const [userId] = useState(() => {
    let id = localStorage.getItem('cm_user_id');
    if (!id) { id = 'usr_' + Math.random().toString(36).substring(2, 9); localStorage.setItem('cm_user_id', id); }
    return id;
  });
  
  const [tabUserId] = useState(() => 'tab_' + Math.random().toString(36).substring(2, 9));
  const [username, setUsername] = useState(() => {
    try { const u = JSON.parse(localStorage.getItem('cm_auth_user')); if (u?.username) return u.username; } catch {}
    return localStorage.getItem('cm_username') || 'Izleyici';
  });
  const [userCity] = useState(() => localStorage.getItem('cm_user_city') || 'Zonguldak');
  const [myAvatar, setMyAvatar] = useState(() => localStorage.getItem('cm_user_avatar') || '🐱');
  const [mySocketId, setMySocketId] = useState('');

  const [inRoom, setInRoom] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [roomName, setRoomName] = useState('');
  const [hostUserId, setHostUserId] = useState('');
  const [roomTheme, setRoomTheme] = useState('default');

  const [roomUsersList, setRoomUsersList] = useState([]);
  const [publicRooms, setPublicRooms] = useState([]);
  const [currentRoomInfo, setCurrentRoomInfo] = useState({ userCount: 1, maxUsers: 2 });
  const [toast, setToast] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  
  // Mobile app only
  const [showOnboarding, setShowOnboarding] = useState(() => isApp() && !localStorage.getItem('cm_onboarding_done'));
  const [mobileTab, setMobileTab] = useState('home');

  useEffect(() => {
    if (isApp()) document.body.classList.add('mobile-app-mode');
  }, []);

  useEffect(() => {
    if (isApp()) {
      document.body.style.overflow = inRoom ? 'hidden' : '';
      return () => { document.body.style.overflow = ''; };
    }
  }, [inRoom]);
  const [messageReactions, setMessageReactions] = useState({});
  const [blockedUsers, setBlockedUsers] = useState([]);

  const [mediaType, setMediaType] = useState('none');
  const [mediaSrc, setMediaSrc] = useState('');
  const [mediaMeta, setMediaMeta] = useState(null);

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
  const [replyTo, setReplyTo] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [messagesSearch, setMessagesSearch] = useState('');

  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [youtubeError, setYoutubeError] = useState(null);
  const [sidebarTab, setSidebarTab] = useState('chat');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const [quickRoomName, setQuickRoomName] = useState('');
  const [quickRoomPass, setQuickRoomPass] = useState('');
  const [quickMaxUsers, setQuickMaxUsers] = useState('2');

  const [editRoomNameInput, setEditRoomNameInput] = useState('');

  const [joinRoomTarget, setJoinRoomTarget] = useState(null);
  const [joinModalPass, setJoinModalPass] = useState('');
  const [joinModalError, setJoinModalError] = useState('');

  const [pendingMediaItem, setPendingMediaItem] = useState(null);
  const [modalTargetCategory, setModalTargetCategory] = useState('Genel');

  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [feedItems, setFeedItems] = useState([]);
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [suggestedFollows, setSuggestedFollows] = useState([]);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [myRole, setMyRole] = useState('user');
  const [reportsList, setReportsList] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifySent, setVerifySent] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletePass, setDeletePass] = useState('');
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFAQR, setTwoFAQR] = useState('');
  const [twoFACode, setTwoFACode] = useState('');

  const [authUser, setAuthUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cm_auth_user')) || null; } catch { return null; }
  });
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('cm_auth_token') || '');
  const [authMode, setAuthMode] = useState('login');
  const [authBusy, setAuthBusy] = useState(false);
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '', bio: '', avatar: '🐱' });
  const displayUsername = authUser?.username || username;

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
  const [dmConversations, setDmConversations] = useState([]);
  const [dmActiveChat, setDmActiveChat] = useState(null);
  const [dmMessages, setDmMessages] = useState({});
  const [dmInput, setDmInput] = useState('');
  const [chatGroups, setChatGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [groupInput, setGroupInput] = useState('');
  const [showGroupCreate, setShowGroupCreate] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [groupMemberInput, setGroupMemberInput] = useState('');

  // ── 2. REFS & SOCKET ──
  const ytPlayerRef = useRef(null);
  const pendingSyncRef = useRef(null);

  const socketRef = useRef(null);
  const handleMediaEndRef = useRef(null);
  const mySocketIdRef = useRef('');
  const currentRoomIdRef = useRef(roomId);
  const mediaTypeRef = useRef(mediaType);
  const playlistRef = useRef(playlist);
  const playModeRef = useRef(playMode);
  const mediaSrcRef = useRef(mediaSrc);
  const authTokenRef = useRef(authToken);

  if (!socketRef.current) {
    socketRef.current = io(BACKEND_URL, { transports: ['polling', 'websocket'], autoConnect: true });
  }
  const socket = socketRef.current;

  useEffect(() => { currentRoomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { mediaTypeRef.current = mediaType; }, [mediaType]);
  useEffect(() => { playlistRef.current = playlist; }, [playlist]);
  useEffect(() => { playModeRef.current = playMode; }, [playMode]);
  useEffect(() => { mediaSrcRef.current = mediaSrc; }, [mediaSrc]);
  useEffect(() => { mySocketIdRef.current = mySocketId; }, [mySocketId]);
  useEffect(() => { authTokenRef.current = authToken; }, [authToken]);

  useEffect(() => {
    if (authToken && socket.connected) {
      socket.emit('social_sync', { token: authToken });
    }
  }, [authToken]);
  useEffect(() => { handleMediaEndRef.current = handleMediaEnd; }, []);

  // ── 3. YARDIMCI FONKSIYONLAR ──
  const currentTheme = THEMES[roomTheme] || THEMES.default;
  const cssVars = { '--cm-primary': currentTheme.primary };
  const styles = getStyles(currentTheme);

  const persistAuth = (user, token) => {
    setAuthUser(user);
    setAuthToken(token || '');
    if (user) {
      localStorage.setItem('cm_auth_user', JSON.stringify(user));
      if (user.username) { setUsername(user.username); localStorage.setItem('cm_username', user.username); }
      if (user.avatar) { setMyAvatar(user.avatar); localStorage.setItem('cm_user_avatar', user.avatar); }
    } else {
      localStorage.removeItem('cm_auth_user');
    }
    if (token) localStorage.setItem('cm_auth_token', token);
    else localStorage.removeItem('cm_auth_token');
  };

  const showFloatingEmoji = (reaction) => {
    setReactions((prev) => [...prev, reaction]);
    setTimeout(() => setReactions((prev) => prev.filter((r) => r.id !== reaction.id)), 2000);
  };

  const toastTimeoutRef = useRef(null);
  const showToast = (msg, sender) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ msg, sender, id: Date.now() });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  };

  const sendAction = (type, payload) => {
    if (socket) socket.emit('room_action', { roomId: currentRoomIdRef.current, type, payload: { ...payload, mediaType: mediaTypeRef.current } });
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

  // ── 4. KIMLIK DOGRULAMA ──
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

  const deleteAccount = () => {
    if (!deletePass || !authToken) return;
    if (!confirm('Hesabını gerçekten silmek istiyor musun? Bu işlem geri alınamaz!')) return;
    socket.emit('delete_account', { token: authToken, password: deletePass });
  };

  useEffect(() => {
    const handler = (data) => {
      if (data.ok) {
        setShowDeleteAccount(false);
        setDeletePass('');
        setShowSocialModal(false);
        persistAuth(null, '');
        setToast({ msg: 'Hesabın başarıyla silindi.', type: 'success' });
      } else {
        setToast({ msg: data.message || 'Hesap silinemedi.', type: 'error' });
      }
    };
    socket.on('delete_account_result', handler);
    return () => socket.off('delete_account_result', handler);
  }, [deletePass, authToken]);

  // ── 5. SOSYAL ──
  const sendGlobalMessage = (e) => {
    e.preventDefault();
    const text = globalChatInput.trim();
    if (!text) return;
    socket.emit('global_chat_message', {
      text, token: authToken || ''
    });
    setGlobalChatInput('');
  };

  const sendDm = (to, text) => {
    if (!text.trim() || !authToken) return;
    const msgId = 'dm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const localMsg = {
      id: msgId, sender: authUser?.username || username, text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(), isLocal: true
    };
    setDmMessages(prev => ({ ...prev, [to]: [...(prev[to] || []), localMsg] }));
    socket.emit('dm_send', { to, text: text.trim(), token: authToken, msgId });
  };

  const sendDmTyping = (to) => { if (authToken) socket.emit('typing_start', { to, token: authToken }); };
  const sendDmStopTyping = (to) => { if (authToken) socket.emit('typing_stop', { to, token: authToken }); };
  const deleteDm = (messageId, withUser) => { if (authToken) socket.emit('dm_delete', { messageId, withUser, token: authToken }); };
  const editDm = (messageId, withUser, newText) => { if (authToken) socket.emit('dm_edit', { messageId, withUser, newText, token: authToken }); };
  const addReaction = (messageId, emoji, messageType = 'dm') => { if (authToken) socket.emit('add_reaction', { messageId, messageType, emoji, token: authToken }); };
  const removeReaction = (messageId, emoji, messageType = 'dm') => { if (authToken) socket.emit('remove_reaction', { messageId, messageType, emoji, token: authToken }); };
  const blockUser = (targetUsername) => { if (authToken) socket.emit('block_user', { targetUsername, token: authToken }); };
  const unblockUser = (targetUsername) => { if (authToken) socket.emit('unblock_user', { targetUsername, token: authToken }); };
  const inviteToRoom = (targetUsername, roomId) => { if (authToken) socket.emit('invite_to_room', { targetUsername, roomId, token: authToken }); };
  const changePassword = (currentPassword, newPassword) => { if (authToken) socket.emit('change_password', { token: authToken, currentPassword, newPassword }); };

  const openDm = (withUser) => {
    if (!authToken) return;
    setDmActiveChat(withUser);
    const username = typeof withUser === 'string' ? withUser : withUser?.username;
    socket.emit('dm_history', { withUser: username, token: authToken });
    socket.emit('dm_read', { withUser: username, token: authToken });
    setSocialTab('dm');
  };

  const loadDmList = () => { if (authToken) socket.emit('dm_list', { token: authToken }); };

  const createGroup = () => {
    if (!groupNameInput.trim() || !authToken) return;
    const members = groupMemberInput.split(',').map(s => s.trim()).filter(Boolean);
    socket.emit('group_create', { name: groupNameInput.trim(), members, token: authToken });
    setGroupNameInput('');
    setGroupMemberInput('');
    setShowGroupCreate(false);
  };

  const openGroup = (groupId) => {
    setActiveGroup(groupId);
    socket.emit('group_history', { groupId, token: authToken });
  };

  const sendGroupMessage = (text) => {
    if (!text.trim() || !activeGroup || !authToken) return;
    socket.emit('group_send', { groupId: activeGroup, text: text.trim(), token: authToken });
  };

  const loadGroups = () => { if (authToken) socket.emit('group_list', { token: authToken }); };

  const searchFriends = () => {
    const q = friendSearch.trim();
    if (!q) return setFriendSearchResults([]);
    socket.emit('friend_search', { q, token: authToken });
  };

  useEffect(() => {
    if (!friendSearch.trim()) { setFriendSearchResults([]); return; }
    const t = setTimeout(() => { socket.emit('friend_search', { q: friendSearch.trim(), token: authToken }); }, 300);
    return () => clearTimeout(t);
  }, [friendSearch]);

  const sendFriendRequest = (targetUsername) => {
    if (!authUser) return openAuth('register');
    if (!authToken) {
      setToast({ msg: 'Oturum bulunamadı. Lütfen tekrar giriş yap.', sender: 'Sistem', id: Date.now() });
      setTimeout(() => setToast(null), 3000);
      openAuth('login');
      return;
    }
    socket.emit('friend_request', { targetUsername, token: authToken });
  };

  const respondFriendRequest = (requestId, action) => {
    socket.emit('friend_request_response', { requestId, action, token: authToken });
  };

  const unfriendUser = (targetUsername) => {
    socket.emit('unfriend', { targetUsername, token: authToken });
  };

  const saveProfile = (data) => {
    if (!authUser) return;
    socket.emit('update_profile', {
      token: authToken,
      bio: (data?.bio ?? profileBioInput).trim().slice(0, 150),
      status: (data?.status ?? profileStatusInput).trim().slice(0, 80),
      avatar: data?.avatar ?? myAvatar,
      username: data?.username ?? authUser.username
    });
    // Update local state immediately
    const updated = { ...authUser };
    if (data?.avatar) { updated.avatar = data.avatar; setMyAvatar(data.avatar); localStorage.setItem('cm_user_avatar', data.avatar); }
    if (data?.bio !== undefined) { updated.bio = data.bio; setProfileBioInput(data.bio); }
    if (data?.status !== undefined) { updated.status = data.status; setProfileStatusInput(data.status); }
    if (data?.username && data.username !== authUser.username) { updated.username = data.username; setUsername(data.username); localStorage.setItem('cm_username', data.username); }
    setAuthUser(updated);
    localStorage.setItem('cm_auth_user', JSON.stringify(updated));
  };

  // ── TAKİP SİSTEMİ ──
  const followUser = (targetUsername) => {
    if (!authUser) { openAuth('login'); return; }
    socket.emit('follow_user', { targetUsername, token: authToken });
  };

  const unfollowUser = (targetUsername) => {
    socket.emit('unfollow_user', { targetUsername, token: authToken });
  };

  const loadFollowCounts = (username) => {
    if (!authUser) return;
    socket.emit('get_follow_counts', { username, token: authToken });
  };

  const loadFollowers = (username) => {
    if (!authUser) return;
    socket.emit('get_followers', { username, token: authToken });
    setShowFollowersModal(true);
  };

  const loadFollowing = (username) => {
    if (!authUser) return;
    socket.emit('get_following', { username, token: authToken });
    setShowFollowingModal(true);
  };

  const loadFeed = () => {
    if (!authUser) return;
    socket.emit('get_feed', { token: authToken });
    setShowFeedModal(true);
  };

  const loadSuggestedFollows = () => {
    if (!authUser) return;
    socket.emit('get_suggested_follows', { token: authToken });
  };

  // ── BILDIRIM SISTEMI ──
  const loadNotifications = () => {
    if (!authUser) return;
    socket.emit('get_notifications', { token: authToken });
    setShowNotifPanel(true);
  };

  const markNotifsRead = () => {
    socket.emit('mark_notifications_read', { token: authToken });
    setUnreadCount(0);
  };

  const reportUser = (target) => {
    setReportTarget(target || '');
    setReportReason('');
    setReportDetails('');
    setShowReportModal(true);
  };

  const submitReport = () => {
    if (!reportReason.trim()) return;
    socket.emit('report_user', { targetUsername: reportTarget, reason: reportReason, details: reportDetails, token: authToken });
    setShowReportModal(false);
  };

  const loadReports = () => {
    socket.emit('get_reports', { token: authToken });
  };

  const resolveReport = (reportId, action) => {
    socket.emit('resolve_report', { reportId, action, token: authToken });
    loadReports();
  };

  const setRole = (target, role) => {
    socket.emit('set_role', { targetUsername: target, role, token: authToken });
  };

  const sendVerificationEmail = () => {
    socket.emit('send_verification_email', { token: authToken });
    setVerifySent(true);
  };

  const verifyEmailCode = () => {
    socket.emit('verify_email_code', { code: verifyCode, token: authToken });
  };

  const setup2FA = () => {
    socket.emit('setup_2fa', { token: authToken });
    setShow2FAModal(true);
  };

  const verify2FASetup = () => {
    socket.emit('verify_2fa_setup', { code: twoFACode, token: authToken });
  };

  const disable2FA = () => {
    socket.emit('disable_2fa', { code: twoFACode, token: authToken });
  };

  const load2FAStatus = () => {
    socket.emit('get_2fa_status', { token: authToken });
  };

  // ── 6. ODA YONETIMI ──
  const handleQuickCreateSubmit = (e) => {
    e.preventDefault();
    const finalRoomId = quickRoomName.trim().toLowerCase() || 'oda-' + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('cm_saved_pass', quickRoomPass.trim());
    const joinData = { roomId: finalRoomId, password: quickRoomPass.trim(), maxUsers: quickMaxUsers, token: authToken, userCity, clientUserId: tabUserId };

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
    setJoinModalError('');
    const timeoutId = setTimeout(() => {
      setShowJoinModal(false);
      setJoinRoomTarget(null);
      setJoinModalPass('');
    }, 3000);
    const onError = (msg) => {
      clearTimeout(timeoutId);
      setJoinModalError(msg);
      socket.off('room_joined', onJoined);
    };
    const onJoined = (data) => {
      clearTimeout(timeoutId);
      socket.off('room_error', onError);
      setShowJoinModal(false);
      setJoinRoomTarget(null);
      setJoinModalPass('');
      setInRoom(true);
      setTimeout(() => navigate('/room/' + encodeURIComponent(data.roomId)), 50);
    };
    socket.once('room_error', onError);
    socket.once('room_joined', onJoined);
    socket.emit('join_room', {
      roomId: joinRoomTarget.id, password: joinModalPass.trim(),
      token: authToken, userCity, clientUserId: tabUserId
    });
  };

  const handleLeaveRoom = () => {
    const rid = currentRoomIdRef.current;
    socket.emit('leave_room');
    setInRoom(false);
    setMediaType('none');
    setMediaSrc('');
    setMessages([]);
    setReplyTo(null);
    localStorage.removeItem('cm_saved_room');
    localStorage.removeItem('cm_saved_pass');
    if (rid) {
      localStorage.removeItem(`cm_room_msgs_${rid}`);
      try {
        const recent = JSON.parse(localStorage.getItem('cm_recent_rooms')) || [];
        localStorage.setItem('cm_recent_rooms', JSON.stringify(recent.filter(r => r !== rid)));
      } catch {}
    }
    navigate('/');
  };

  const handleSaveSettings = () => {
    if (currentRoomIdRef.current) localStorage.setItem(`cm_theme_${currentRoomIdRef.current}`, roomTheme);
    socket.emit('update_room_settings', {
      roomId: currentRoomIdRef.current,
      newName: editRoomNameInput.trim() || roomName,
      newTheme: roomTheme,
      newMaxUsers: currentRoomInfo?.maxUsers
    });
    setShowSettingsModal(false);
  };

  const handleKickUser = (targetUserId) => socket.emit('kick_user', { roomId: currentRoomIdRef.current, targetUserId, token: authToken });
  const handleTransferAdmin = (targetUserId) => socket.emit('update_room_settings', { roomId: currentRoomIdRef.current, newHostUserId: targetUserId });

  // ── 7. MEDYA & PLAYLIST ──
  const handlePlay = () => {
    const currentTime = ytPlayerRef.current?.getCurrentTime?.() || 0;
    if (ytPlayerRef.current) { try { ytPlayerRef.current.playVideo(); } catch {} }
    sendAction('PLAY', { time: currentTime });
  };

  const handlePause = () => {
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

  const handleVideoUpload = (url, filename) => {
    setYoutubeError(null);
    setMediaType('custom_video');
    setMediaSrc(url);
    setMediaMeta({ title: filename, artist: username });
    sendAction('CHANGE_MEDIA', { type: 'custom_video', src: url, title: filename });
  };

  const handleSelectSearchResult = (song, playImmediately = true) => {
    if (!song) return;
    if (playImmediately) {
      setYoutubeError(null);
      if (song.src) {
        setMediaType('youtube');
        setMediaSrc(song.src);
        setMediaMeta({ title: song.title, artist: song.artist, thumbnail: song.thumbnail });
        sendAction('CHANGE_MEDIA', { type: 'youtube', src: song.src, title: song.title });
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
    socket.emit('add_to_playlist', { roomId: currentRoomIdRef.current, item: { ...pendingMediaItem, category: modalTargetCategory }, token: authToken });
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
    socket.emit('remove_from_playlist', { roomId: currentRoomIdRef.current, itemId, token: authToken });
  };

  const handleModeChange = (mode) => {
    setPlayMode(mode);
    socket.emit('change_play_mode', { roomId: currentRoomIdRef.current, mode });
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCategoryInput.trim()) return;
    socket.emit('create_category', { roomId: currentRoomIdRef.current, categoryName: newCategoryInput.trim(), token: authToken });
    setSelectedCategory(newCategoryInput.trim());
    setNewCategoryInput('');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg = {
      id: crypto.randomUUID(), senderId: mySocketId, text: chatInput,
      sender: authUser?.username || displayUsername || 'Izleyici',
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
    if (!mediaSrc) return;
    if (mediaType === 'youtube') window.open(`https://www.youtube.com/watch?v=${mediaSrc}`, '_blank', 'noopener,noreferrer');
    else if (mediaType === 'vimeo') window.open(`https://vimeo.com/${mediaSrc}`, '_blank', 'noopener,noreferrer');
    else if (mediaType === 'custom_video') window.open(mediaSrc, '_blank', 'noopener,noreferrer');
    else window.open(mediaSrc, '_blank', 'noopener,noreferrer');
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

  // ── 8. EFFECTS ──
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setShowInstallBtn(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => { window.removeEventListener('beforeinstallprompt', handler); socketRef.current?.disconnect(); socketRef.current = null; };
  }, []);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', handlePlay);
      navigator.mediaSession.setActionHandler('pause', handlePause);
      navigator.mediaSession.setActionHandler('nexttrack', () => handleMediaEndRef.current?.());
    }
  }, [mediaType]);

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

  // URL'den odaya otomatik katil (/room/:roomId)
  useEffect(() => {
    const match = location.pathname.match(/^\/room\/(.+)$/);
    if (match && match[1] && socket && !inRoom) {
      const targetRoomId = decodeURIComponent(match[1]);
      const savedPass = localStorage.getItem('cm_saved_pass') || '';
      socket.emit('join_room', { roomId: targetRoomId, password: savedPass, token: authToken, userCity, clientUserId: tabUserId });
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!searchInput.trim() || searchInput.trim().length < 2 || searchInput.includes('http://') || searchInput.includes('https://')) {
      setSearchResults([]); setIsSearching(false); return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => { if (socket) socket.emit('search_music', { query: searchInput.trim(), token: authToken }); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ── 9. SOCKET EVENTS (extracted to hook) ──
  useSocketEvents(socket, socketRef, authTokenRef, ytPlayerRef, pendingSyncRef, saveRoomMessages, navigate, {
    setIsConnected, setPublicRooms, setSearchResults, setIsSearching, setInRoom, setErrorMessage,
    setRoomId, setRoomName, setHostUserId, setRoomTheme, setMySocketId, setRoomUsersList,
    setCurrentRoomInfo, setPlaylist, setCategories, setPlayMode, setMessages, setMediaType,
    setMediaSrc, setYoutubeError, setJoinModalError, setJoinRoomTarget, setShowJoinModal,
    setDmConversations, setDmMessages, setDmActiveChat, setChatGroups, setGroupMessages,
    setActiveGroup, setAuthUser, setAuthBusy, setAuthForm, setShowAuthModal, setShowSocialModal,
    setFriends, setFriendRequests, setFriendSearchResults, setFriendOnlineStatuses,
    setTypingUsers, setMessageReactions, setGlobalMessages, setNotifications, setUnreadCount,
    setReportsList, setFeedItems, setSuggestedFollows, setFollowCounts, setIsFollowingUser,
    setFollowersList, setFollowingList, setProfileBioInput, setProfileStatusInput,
    setTwoFASecret, setTwoFAQR, setTwoFAEnabled, setTwoFACode, setShow2FAModal,
    setShowVerifyModal, setVerifyCode, setToast,
    currentRoomIdRef, mySocketIdRef, authTokenRef, authUser, authToken, showJoinModal,
    activeGroup, dmActiveChat, saveToRecentRooms, persistAuth, showFloatingEmoji,
    handleLeaveRoom, loadDmList, currentRoomIdRef: currentRoomIdRef
  });

  // ── 10. FILTERED MESSAGES ──
  const filteredMessages = useMemo(() => {
    if (!messagesSearch.trim()) return messages;
    const q = messagesSearch.toLowerCase();
    return messages.filter((m) => (m.text || '').toLowerCase().includes(q) || (m.sender || '').toLowerCase().includes(q));
  }, [messages, messagesSearch]);

  // ── 11. CONTEXT VALUE ──
  const contextValue = useMemo(() => ({
    socket, userId, username, userCity, myAvatar, setMyAvatar, mySocketId,
    inRoom, roomId, roomName, hostUserId, roomTheme, roomUsersList, toast,
    publicRooms, currentRoomInfo, mediaType, mediaSrc, mediaMeta, setMediaMeta,
    playlist, categories, selectedCategory, setSelectedCategory,
    newCategoryInput, setNewCategoryInput, playMode, searchInput, setSearchInput,
    searchResults, isSearching, messages, chatInput, setChatInput, reactions,
    replyTo, setReplyTo, isConnected, errorMessage, setErrorMessage,
    playbackSpeed, setPlaybackSpeed, messagesSearch, setMessagesSearch, filteredMessages,
    youtubeError, setYoutubeError, sidebarTab, setSidebarTab, showInstallBtn,
    showSettingsModal, setShowSettingsModal, showFolderModal, setShowFolderModal,
    showAuthModal, setShowAuthModal, showSocialModal, setShowSocialModal,
    showVipModal, setShowVipModal, showProfileModal, setShowProfileModal, showQuickCreate, setShowQuickCreate,
    showJoinModal, setShowJoinModal, authUser, authToken, authMode, authBusy,
    showNotifPanel, setShowNotifPanel, mobileTab, setMobileTab,
    authForm, setAuthForm, friendSearch, setFriendSearch, friendSearchResults,
    friends, friendRequests, friendOnlineStatuses, globalMessages,
    globalChatInput, setGlobalChatInput, socialTab, setSocialTab,
    profileBioInput, setProfileBioInput, profileStatusInput, setProfileStatusInput,
    ytPlayerRef, pendingSyncRef, currentTheme, cssVars, styles, filteredPlaylist,
    openAuth, submitAuth, handleLogout, sendGlobalMessage, searchFriends,
    sendFriendRequest, respondFriendRequest, unfriendUser, saveProfile,
    handleQuickCreateSubmit, handleJoinRoomFromModal, handleLeaveRoom,
    handleSaveSettings, handleKickUser, handleTransferAdmin,
    handlePlay, handlePause, handleMediaEnd, handleDirectPlay, handleVideoUpload,
    handleSelectSearchResult, handleOpenAddModal, confirmAddToPlaylist,
    handleSelectPlaylistItem, handleRemovePlaylistItem, handleModeChange,
    handleCreateCategory, handleSendMessage, sendReaction, sendAction,
    handleYouTubeError, openYouTubeExternally, handleInstallApp,
    setJoinRoomTarget, setJoinModalPass, setQuickRoomName, setQuickRoomPass,
    setQuickMaxUsers, quickRoomName, quickRoomPass,
    quickMaxUsers, joinRoomTarget, joinModalPass,
    editRoomNameInput, setEditRoomNameInput, pendingMediaItem, setPendingMediaItem,
    modalTargetCategory, setModalTargetCategory, playMessageSound,
    dmConversations, dmActiveChat, setDmActiveChat, dmMessages, dmInput, setDmInput,
    sendDm, openDm, loadDmList,
    chatGroups, activeGroup, setActiveGroup, groupMessages, groupInput, setGroupInput,
    showGroupCreate, setShowGroupCreate, groupNameInput, setGroupNameInput,
    groupMemberInput, setGroupMemberInput, createGroup, openGroup, sendGroupMessage, loadGroups,
    typingUsers, sendDmTyping, sendDmStopTyping,
    messageReactions, addReaction, removeReaction,
    blockedUsers, blockUser, unblockUser,
    deleteDm, editDm, inviteToRoom, changePassword
  }), [inRoom, roomId, roomTheme, authUser, isConnected, publicRooms, globalMessages, playlist, categories, selectedCategory, playMode, searchInput, messages, chatInput, mediaType, mediaSrc, sidebarTab, friendSearch, friendSearchResults, friends, friendRequests, friendOnlineStatuses, profileBioInput, profileStatusInput, socialTab, showInstallBtn, showSettingsModal, showFolderModal, showAuthModal, showSocialModal, showVipModal, showQuickCreate, showJoinModal, authBusy, quickRoomName, quickRoomPass, quickMaxUsers, joinRoomTarget, joinModalPass, editRoomNameInput, filteredPlaylist, reactions, youtubeError, searchResults, isSearching, myAvatar, username, userCity, mySocketId, currentTheme, styles, cssVars, mediaMeta, dmConversations, dmActiveChat, dmMessages, chatGroups, activeGroup, groupMessages, typingUsers, messageReactions, blockedUsers, followCounts, isFollowingUser, followersList, followingList, showFollowersModal, showFollowingModal, feedItems, showFeedModal, suggestedFollows, showNotifPanel]);

  // ── 11. RENDER ──
  return (
    <AppContext.Provider value={contextValue}>
      {/* Global Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 99999,
          background: 'linear-gradient(135deg, rgba(15,23,42,.95), rgba(30,41,59,.95))',
          backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.1)',
          padding: '10px 20px', borderRadius: 14,
          boxShadow: '0 10px 40px rgba(0,0,0,.5)',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'cmGlobalToastIn 0.3s ease'
        }}>
          <span style={{ fontSize: 16 }}>💬</span>
          <div>
            <span style={{ fontWeight: 800, color: '#00a884', fontSize: 12 }}>{toast.sender}</span>
            <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 6 }}>{toast.msg}</span>
          </div>

        </div>
      )}

      {showOnboarding && <OnboardingScreen onComplete={() => setShowOnboarding(false)} />}

      {isApp() && !inRoom ? (
        <div className="mobile-app-container">
          <div className="mobile-app-content">
            {mobileTab === 'home' && <MobileHomePage />}
            {mobileTab === 'rooms' && <RoomsPage />}
            {mobileTab === 'chat' && <ChatPage />}
            {mobileTab === 'friends' && <FriendsPage />}
            {mobileTab === 'profile' && <ProfilePage authUser={authUser} myAvatar={myAvatar} onLogout={handleLogout} />}
          </div>
          <BottomNavBar activeTab={mobileTab} onTabChange={setMobileTab} />
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/room/:roomIdParam" element={<RoomPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/communities" element={<Communities currentTheme={currentTheme} token={authToken} username={authUser?.username} avatar={authUser?.avatar} socket={socket} />} />
          <Route path="/events" element={<Events currentTheme={currentTheme} token={authToken} username={authUser?.username} socket={socket} />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/ads" element={<AdsPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      )}

      {/* Global Modals */}
      {showAuthModal && (
        <AuthModal authMode={authMode} setAuthMode={setAuthMode} authForm={authForm} setAuthForm={setAuthForm} authBusy={authBusy} submitAuth={submitAuth} setShowAuthModal={setShowAuthModal} errorMessage={errorMessage} setErrorMessage={setErrorMessage} styles={styles} socket={socket} />
      )}
      {showSocialModal && (
        <SocialModal authUser={authUser} socialTab={socialTab} setSocialTab={setSocialTab} globalMessages={globalMessages} globalChatInput={globalChatInput} setGlobalChatInput={setGlobalChatInput} sendGlobalMessage={sendGlobalMessage} friendSearch={friendSearch} setFriendSearch={setFriendSearch} searchFriends={searchFriends} friendSearchResults={friendSearchResults} sendFriendRequest={sendFriendRequest} friendRequests={friendRequests} respondFriendRequest={respondFriendRequest} friends={friends} friendOnlineStatuses={friendOnlineStatuses} unfriendUser={unfriendUser} profileBioInput={profileBioInput} setProfileBioInput={setProfileBioInput} profileStatusInput={profileStatusInput} setProfileStatusInput={setProfileStatusInput} myAvatar={myAvatar} setMyAvatar={setMyAvatar} saveProfile={saveProfile} openAuth={openAuth} handleLogout={handleLogout} setShowSocialModal={setShowSocialModal} showVipModal={showVipModal} setShowVipModal={setShowVipModal} styles={styles}
          dmConversations={dmConversations} dmActiveChat={dmActiveChat} setDmActiveChat={setDmActiveChat} dmMessages={dmMessages} dmInput={dmInput} setDmInput={setDmInput} sendDm={sendDm} openDm={openDm} loadDmList={loadDmList}
          chatGroups={chatGroups} activeGroup={activeGroup} setActiveGroup={setActiveGroup} groupMessages={groupMessages} groupInput={groupInput} setGroupInput={setGroupInput} showGroupCreate={showGroupCreate} setShowGroupCreate={setShowGroupCreate} groupNameInput={groupNameInput} setGroupNameInput={setGroupNameInput} groupMemberInput={groupMemberInput} setGroupMemberInput={setGroupMemberInput} createGroup={createGroup} openGroup={openGroup} sendGroupMessage={sendGroupMessage} loadGroups={loadGroups}
          typingUsers={typingUsers} sendDmTyping={sendDmTyping} sendDmStopTyping={sendDmStopTyping}
          followUser={followUser} unfollowUser={unfollowUser} loadFollowCounts={loadFollowCounts}
          loadFollowers={loadFollowers} loadFollowing={loadFollowing}
          followCounts={followCounts} isFollowingUser={isFollowingUser}
          followersList={followersList} followingList={followingList}
          showFollowersModal={showFollowersModal} setShowFollowersModal={setShowFollowersModal}
          showFollowingModal={showFollowingModal} setShowFollowingModal={setShowFollowingModal}
          feedItems={feedItems} loadFeed={loadFeed} showFeedModal={showFeedModal} setShowFeedModal={setShowFeedModal}
          suggestedFollows={suggestedFollows} loadSuggestedFollows={loadSuggestedFollows}
          notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications}
          markNotifsRead={markNotifsRead} showNotifPanel={showNotifPanel} setShowNotifPanel={setShowNotifPanel}
          myRole={myRole} reportUser={reportUser}
          showVerifyModal={showVerifyModal} setShowVerifyModal={setShowVerifyModal}
          verifyCode={verifyCode} setVerifyCode={setVerifyCode}
          verifySent={verifySent} setVerifySent={setVerifySent}
          sendVerificationEmail={sendVerificationEmail} verifyEmailCode={verifyEmailCode} authUser={authUser}
          show2FAModal={show2FAModal} setShow2FAModal={setShow2FAModal} twoFAEnabled={twoFAEnabled}
          setup2FA={setup2FA} disable2FA={disable2FA} twoFASecret={twoFASecret} twoFAQR={twoFAQR}
          twoFACode={twoFACode} setTwoFACode={setTwoFACode} verify2FASetup={verify2FASetup}
          showDeleteAccount={showDeleteAccount} setShowDeleteAccount={setShowDeleteAccount} deleteAccount={deleteAccount} deletePass={deletePass} setDeletePass={setDeletePass}
        />
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
              <button type="submit" style={{ padding:'14px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#7c3aed,#a855f7)', color:'#fff', fontSize:15, fontWeight:900, cursor:'pointer', boxShadow:'0 8px 25px rgba(124,58,237,.3)', marginTop:4 }}>🚀 Odayi Baslat</button>
            </form>
          </div>
        </div>
      )}

      {showProfileModal && (
        <ProfileModal authUser={authUser} setShowProfileModal={setShowProfileModal} saveProfile={saveProfile} friendOnlineStatuses={friendOnlineStatuses} friends={friends} />
      )}
      {showFolderModal && (
        <FolderModal pendingMediaItem={pendingMediaItem} modalTargetCategory={modalTargetCategory} setModalTargetCategory={setModalTargetCategory} categories={categories} confirmAddToPlaylist={confirmAddToPlaylist} setShowFolderModal={setShowFolderModal} currentTheme={currentTheme} styles={styles} />
      )}
      {showSettingsModal && (
        <SettingsModal hostUserId={hostUserId} userId={userId} editRoomNameInput={editRoomNameInput} setEditRoomNameInput={setEditRoomNameInput} roomName={roomName} roomTheme={roomTheme} setRoomTheme={setRoomTheme} handleSaveSettings={handleSaveSettings} roomUsersList={roomUsersList} handleTransferAdmin={handleTransferAdmin} handleKickUser={handleKickUser} setShowSettingsModal={setShowSettingsModal} currentTheme={currentTheme} authUser={authUser} styles={styles} socket={socket} roomId={roomId} currentRoomInfo={currentRoomInfo} />
      )}

      {showJoinModal && joinRoomTarget && (
        <div style={{ position:'fixed', inset:0, zIndex:25000, background:'rgba(0,0,0,.85)', backdropFilter:'blur(20px)', display:'flex', alignItems:'center', justifyContent:'center', padding:14 }}>
          <div style={{ width:'min(380px,100%)', background:'linear-gradient(180deg,#111b21,#0a0f14)', border:'1px solid #2a3942', borderRadius:24, overflow:'hidden', boxShadow:'0 40px 120px rgba(0,0,0,.6)' }}>
            <div style={{ padding:'22px 24px', borderBottom:'1px solid #25313a', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ color:'#2563eb', fontSize:11, fontWeight:900 }}>🚪 ODAYA KATIL</div>
                <div style={{ color:'#fff', fontSize:18, fontWeight:950, marginTop:2 }}>{joinRoomTarget.name}</div>
              </div>
              <button onClick={() => { setShowJoinModal(false); setJoinRoomTarget(null); setJoinModalPass(''); setJoinModalError(''); }} style={{ background:'rgba(255,255,255,.06)', border:'none', color:'#7f8c98', width:32, height:32, borderRadius:10, cursor:'pointer', fontSize:14 }}>✕</button>
            </div>
            <form onSubmit={handleJoinRoomFromModal} style={{ padding:'20px 24px 24px', display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:'rgba(255,255,255,.03)', borderRadius:12, border:'1px solid rgba(255,255,255,.06)' }}>
                <div style={{ fontSize:24 }}>{joinRoomTarget.hasPassword ? '🔒' : '🎵'}</div>
                <div>
                  <div style={{ color:'#fff', fontSize:14, fontWeight:900 }}>{joinRoomTarget.name}</div>
                  <div style={{ color:'#64748b', fontSize:11 }}>{joinRoomTarget.userCount}/{joinRoomTarget.maxUsers} kisi • {joinRoomTarget.hasPassword ? 'Sifreli' : 'Acik'}</div>
                </div>
              </div>
              {joinModalError && (
                <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', borderRadius:10, padding:'10px 14px', color:'#ef4444', fontSize:12, fontWeight:700, textAlign:'center' }}>
                  ⚠️ {joinModalError}
                </div>
              )}
              {joinRoomTarget.hasPassword && (
                <div>
                  <label style={{ color:'#94a3b8', fontSize:11, fontWeight:800, display:'block', marginBottom:5 }}>Oda Sifresi</label>
                  <input type="password" value={joinModalPass} onChange={(e) => { setJoinModalPass(e.target.value); setJoinModalError(''); }} placeholder="Sifreyi girin..." autoFocus style={{ width:'100%', padding:'12px 14px', background:'#0b141a', border: joinModalError ? '1px solid rgba(239,68,68,.4)' : '1px solid #25313a', color:'#e9edef', borderRadius:12, fontSize:13, outline:'none', boxSizing:'border-box' }} />
                </div>
              )}
              <button type="submit" style={{ padding:'14px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#2563eb,#3b82f6)', color:'#fff', fontSize:15, fontWeight:900, cursor:'pointer', boxShadow:'0 8px 25px rgba(37,99,235,.3)', marginTop:4 }}>🚪 Odaya Gir</button>
            </form>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
}

export default App;
