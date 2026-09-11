import { useEffect, useRef } from 'react';
import { playMessageSound } from '../utils/notificationSound';

export function useSocketEvents(socket, socketRef, authTokenRef, ytPlayerRef, pendingSyncRef, saveRoomMessages, navigate, actions) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    if (!socket) return;
    const a = () => actionsRef.current;

    socket.on('connect', () => {
      a().setIsConnected(true);
      const token = authTokenRef.current;
      if (token) socket.emit('social_sync', { token });
    });
    socket.on('disconnect', () => a().setIsConnected(false));
    socket.on('reconnect', () => {
      const token = authTokenRef.current;
      if (token) socket.emit('social_sync', { token });
      const rid = a().currentRoomIdRef?.current;
      if (rid) socket.emit('request_room_sync', { roomId: rid, token });
    });

    const heartbeatInterval = setInterval(() => {
      if (socket.connected) socket.emit('heartbeat');
    }, 15000);

    socket.on('public_rooms_update', (roomsList) => a().setPublicRooms(Array.isArray(roomsList) ? roomsList : []));
    socket.on('search_results', (results) => { a().setSearchResults(Array.isArray(results) ? results : []); a().setIsSearching(false); });

    socket.on('room_joined', (data) => {
      a().setInRoom(true);
      a().setErrorMessage('');
      a().setRoomId(data.roomId);
      a().setRoomName(data.roomName || data.roomId);
      a().setHostUserId(data.hostUserId);
      const savedTheme = localStorage.getItem(`cm_theme_${data.roomId}`);
      a().setRoomTheme(savedTheme || data.theme || 'default');
      a().setMySocketId(data.socketId);
      if (data.users) a().setRoomUsersList(data.users);
      a().setCurrentRoomInfo({ userCount: data.userCount, maxUsers: data.maxUsers });

      if (Array.isArray(data.playlist)) { a().setPlaylist(data.playlist); localStorage.setItem('cm_local_playlist', JSON.stringify(data.playlist)); }
      if (Array.isArray(data.categories)) { a().setCategories(data.categories); localStorage.setItem('cm_local_categories', JSON.stringify(data.categories)); }
      if (data.playMode) a().setPlayMode(data.playMode);

      const serverMsgs = Array.isArray(data.messages) ? data.messages : [];
      a().setMessages(serverMsgs);
      if (serverMsgs.length > 0) saveRoomMessages(data.roomId, serverMsgs);

      localStorage.setItem('cm_saved_room', data.roomId);
      a().saveToRecentRooms(data.roomId);
      if (a().authToken) socket.emit('social_sync', { token: a().authToken });

      setTimeout(() => navigate(`/room/${encodeURIComponent(data.roomId)}`, { replace: true }), 50);

      if (data.currentMedia && data.currentMedia.type !== 'none') {
        a().setYoutubeError(null);
        a().setMediaType(data.currentMedia.type);
        a().setMediaSrc(data.currentMedia.src);
        setTimeout(() => {
          if ((data.currentMedia.type === 'youtube' || data.currentMedia.type === 'music') && ytPlayerRef.current) {
            ytPlayerRef.current.seekTo(data.currentMedia.time || 0, true);
            if (data.currentMedia.isPlaying) ytPlayerRef.current.playVideo(); else ytPlayerRef.current.pauseVideo();
          }
        }, 800);
      }
    });

    socket.on('room_user_count_update', (data) => {
      a().setCurrentRoomInfo({ userCount: data.userCount, maxUsers: data.maxUsers });
      if (data.users) a().setRoomUsersList(data.users);
      if (data.hostUserId) a().setHostUserId(data.hostUserId);
      if (data.roomName) a().setRoomName(data.roomName);
      if (data.theme) {
        a().setRoomTheme(data.theme);
        if (a().currentRoomIdRef?.current) localStorage.setItem(`cm_theme_${a().currentRoomIdRef.current}`, data.theme);
      }
    });

    socket.on('room_host_changed', (data) => {
      if (data.hostUserId) a().setHostUserId(data.hostUserId);
      if (data.message) a().setToast({ msg: data.message, type: 'info' });
    });

    socket.on('room_settings_updated', (data) => {
      if (data.roomName) a().setRoomName(data.roomName);
      if (data.theme) {
        a().setRoomTheme(data.theme);
        if (a().currentRoomIdRef?.current) localStorage.setItem(`cm_theme_${a().currentRoomIdRef.current}`, data.theme);
      }
      if (data.hostUserId) a().setHostUserId(data.hostUserId);
      if (data.maxUsers) a().setCurrentRoomInfo((prev) => ({ ...prev, maxUsers: data.maxUsers }));
    });

    socket.on('kicked_from_room', (msg) => { a().setErrorMessage(msg); a().handleLeaveRoom(); });

    socket.on('categories_updated', (cats) => { a().setCategories(cats); localStorage.setItem('cm_local_categories', JSON.stringify(cats)); });
    socket.on('playlist_updated', (data) => {
      const newPlaylist = Array.isArray(data) ? data : (data.playlist || []);
      a().setPlaylist(newPlaylist);
      localStorage.setItem('cm_local_playlist', JSON.stringify(newPlaylist));
      if (data && data.playMode) a().setPlayMode(data.playMode);
    });
    socket.on('play_mode_changed', (mode) => a().setPlayMode(mode));
    socket.on('room_error', (msg) => {
      if (a().showJoinModal) {
        a().setJoinModalError(msg);
      } else {
        a().setErrorMessage(msg);
        a().setInRoom(false);
        navigate('/', { replace: true });
        localStorage.removeItem('cm_saved_room');
        localStorage.removeItem('cm_saved_pass');
      }
    });

    socket.on('room_action', ({ type, payload }) => {
      if (type === 'PLAY') {
        if (ytPlayerRef.current) { try { ytPlayerRef.current.seekTo(payload.time || 0, true); ytPlayerRef.current.playVideo(); } catch {} }
      } else if (type === 'PAUSE') {
        if (ytPlayerRef.current) { try { ytPlayerRef.current.pauseVideo(); } catch {} }
      } else if (type === 'SEEK') {
        if (ytPlayerRef.current) { try { ytPlayerRef.current.seekTo(payload.time || 0, true); } catch {} }
      } else if (type === 'CHANGE_MEDIA') {
        a().setYoutubeError(null);
        a().setMediaType(payload.type);
        a().setMediaSrc(payload.src);
      } else if (type === 'CHAT_MESSAGE') {
        a().setMessages((prev) => {
          const updated = [...prev, payload];
          saveRoomMessages(a().currentRoomIdRef?.current, updated);
          return updated;
        });
        if (payload.senderId !== a().mySocketIdRef?.current) {
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
        a().showFloatingEmoji(payload);
      } else if (type === 'SPEED') {
        if (ytPlayerRef.current) { try { ytPlayerRef.current.setPlaybackRate(payload.speed || 1); } catch {} }
      } else if (type === 'ROOM_CLOSED') {
        a().setErrorMessage(payload?.message || 'Oda kapatildi.');
        a().handleLeaveRoom();
      }
    });

    socket.on('room_sync_data', (data) => {
      if (!data) return;
      if (data.currentMedia) {
        a().setMediaType(data.currentMedia.type || 'none');
        a().setMediaSrc(data.currentMedia.src || '');
        if (ytPlayerRef.current) {
          try {
            const elapsed = data.currentMedia.isPlaying ? (Date.now() - (data.currentMedia.lastUpdated || Date.now())) / 1000 : 0;
            const seekTo = (data.currentMedia.time || 0) + elapsed;
            ytPlayerRef.current.seekTo(seekTo, true);
            if (data.currentMedia.isPlaying) ytPlayerRef.current.playVideo();
            else ytPlayerRef.current.pauseVideo();
          } catch {}
        } else {
          pendingSyncRef.current = data.currentMedia;
        }
      }
      if (data.users) a().setRoomUsersList(data.users);
      if (data.hostUserId) a().setHostUserId(data.hostUserId);
      if (data.roomName) a().setRoomName(data.roomName);
      if (data.roomTheme) a().setRoomTheme(data.roomTheme);
    });

    socket.on('global_chat_history', (items) => a().setGlobalMessages(Array.isArray(items) ? items : []));
    socket.on('global_chat_message', (msg) => a().setGlobalMessages((prev) => [...prev.slice(-79), msg]));
    socket.on('global_chat_cleared', () => { a().setGlobalMessages([]); a().setToast({ msg: 'Canli sohbet admin tarafindan temizlendi', sender: 'Sistem', id: Date.now() }); setTimeout(() => a().setToast(null), 4000); });

    socket.on('dm_list', ({ conversations }) => a().setDmConversations(conversations || []));
    socket.on('dm_history', ({ messages, withUser }) => {
      a().setDmMessages(prev => ({ ...prev, [withUser]: messages || [] }));
    });
    socket.on('dm_sent', (msg) => {
      a().setDmMessages((prev) => {
        const chatKey = msg.to;
        const msgs = prev[chatKey] || [];
        const exists = msgs.find(m => m.id === msg.id || m.id === msg.localMsgId);
        if (exists) return { ...prev, [chatKey]: msgs.map(m => (m.id === msg.localMsgId ? { ...m, id: msg.id, from: a().authUser?.username || m.sender, isLocal: false } : m)) };
        return { ...prev, [chatKey]: [...msgs, { ...msg, from: msg.from || a().authUser?.username }] };
      });
      a().loadDmList();
    });
    socket.on('dm_status', (data) => { if (data?.message) { a().setToast({ msg: data.message, sender: 'Sistem', id: Date.now() }); setTimeout(() => a().setToast(null), 4000); } });
    socket.on('dm_received', (msg) => {
      const activeChat = typeof a().dmActiveChat === 'string' ? a().dmActiveChat : a().dmActiveChat?.username;
      if (activeChat === msg.from) {
        a().setDmMessages((prev) => {
          const msgs = prev[msg.from] || [];
          if (msgs.find(m => m.id === msg.id)) return prev;
          return { ...prev, [msg.from]: [...msgs, msg] };
        });
        socket.emit('dm_read', { withUser: msg.from, token: a().authToken });
      } else {
        a().setToast({ msg: `${msg.from}: ${msg.text}`, sender: msg.from, id: Date.now() });
        setTimeout(() => a().setToast(null), 4000);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Yeni Mesaj', { body: `${msg.from}: ${msg.text}` });
        }
      }
      a().loadDmList();
    });

    socket.on('group_list', ({ groups }) => a().setChatGroups(groups || []));
    socket.on('group_created', (group) => { a().setChatGroups((prev) => [...prev, group]); });
    socket.on('group_updated', (data) => { a().setChatGroups((prev) => prev.map(g => g.id === data.id ? { ...g, members: data.members } : g)); });
    socket.on('group_history', ({ groupId, messages }) => { if (a().activeGroup === groupId) a().setGroupMessages(messages || []); });
    socket.on('group_message', ({ groupId, msg }) => { if (a().activeGroup === groupId) a().setGroupMessages((prev) => [...prev, msg]); });

    socket.on('social_profile', (user) => {
      if (!user) {
        a().persistAuth(null, '');
        return;
      }
      a().setAuthUser(user);
      localStorage.setItem('cm_auth_user', JSON.stringify(user));
      a().setProfileBioInput(user?.bio || '');
      a().setProfileStatusInput(user?.status || '');
    });

    socket.on('auth_result', (data) => {
      a().setAuthBusy(false);
      if (data?.ok) {
        a().persistAuth(data.user, data.token);
        a().setProfileBioInput(data.user?.bio || '');
        a().setProfileStatusInput(data.user?.status || '');
        a().setAuthForm({ username: '', email: '', password: '', bio: '', avatar: data.user?.avatar || '🐱' });
        a().setShowAuthModal(false);
        a().setShowSocialModal(true);
        a().setErrorMessage('');
        socket.emit('social_sync', { token: data.token });
      } else {
        a().setErrorMessage(data?.message || 'Islem basarisiz.');
      }
    });

    socket.on('friends_update', (data) => {
      a().setFriends(Array.isArray(data?.friends) ? data.friends : []);
      a().setFriendRequests(Array.isArray(data?.requests) ? data.requests : []);
    });
    socket.on('friend_search_results', (items) => a().setFriendSearchResults(Array.isArray(items) ? items : []));
    socket.on('friend_request_received', (data) => {
      a().setFriendRequests((prev) => [data, ...prev.filter((x) => x.id !== data.id)]);
      a().setToast({ msg: `${data.fromUsername} sana arkadaslik istegi gonderdi!`, sender: data.fromUsername, id: Date.now() });
      setTimeout(() => a().setToast(null), 4000);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Yeni Arkadaslik Istegi!', { body: `${data.fromUsername} sana istek gonderdi`, icon: data.avatar || '🐱' });
      }
    });
    socket.on('friend_request_status', (data) => {
      if (data?.message) {
        a().setToast({ msg: data.message, sender: 'Sistem', id: Date.now() });
        setTimeout(() => a().setToast(null), 3000);
      }
    });
    socket.on('friend_online_status', (data) => {
      a().setFriendOnlineStatuses((prev) => ({ ...prev, [data.username]: { isOnline: data.isOnline, lastSeen: data.lastSeen } }));
    });
    socket.on('global_online_update', (data) => {
      a().setFriendOnlineStatuses((prev) => ({ ...prev, [data.username]: { isOnline: data.isOnline, lastSeen: data.lastSeen } }));
    });

    socket.on('typing_indicator', (data) => {
      a().setTypingUsers(prev => {
        const next = { ...prev };
        if (data.typing) { next[data.from] = Date.now(); } else { delete next[data.from]; }
        return next;
      });
      if (data.typing) {
        setTimeout(() => { a().setTypingUsers(prev => { const next = { ...prev }; if (next[data.from] && Date.now() - next[data.from] > 3000) delete next[data.from]; return next; }); }, 4000);
      }
    });

    socket.on('dm_read_receipt', (data) => {
      a().setDmMessages(prev => {
        const next = {};
        for (const [k, msgs] of Object.entries(prev)) {
          next[k] = Array.isArray(msgs) ? msgs.map(m => m.from === data.from && !m.read ? { ...m, read: true } : m) : msgs;
        }
        return next;
      });
    });

    socket.on('dm_deleted', (data) => {
      a().setDmMessages(prev => {
        const next = {};
        for (const [k, msgs] of Object.entries(prev)) {
          next[k] = Array.isArray(msgs) ? msgs.filter(m => m.id !== data.messageId) : msgs;
        }
        return next;
      });
    });

    socket.on('dm_edited', (data) => {
      a().setDmMessages(prev => {
        const next = {};
        for (const [k, msgs] of Object.entries(prev)) {
          next[k] = Array.isArray(msgs) ? msgs.map(m => m.id === data.messageId ? { ...m, text: data.text, edited: true } : m) : msgs;
        }
        return next;
      });
    });

    socket.on('reactions_update', (data) => {
      a().setMessageReactions(prev => ({ ...prev, [data.messageId]: data.reactions }));
    });

    socket.on('room_invite', (data) => {
      a().setToast({ msg: `${data.from} seni "${data.roomName}" odasina davet etti!`, sender: data.from, id: Date.now() });
      setTimeout(() => a().setToast(null), 5000);
    });

    socket.on('vip_activated', (data) => {
      a().setAuthUser((prev) => {
        const updated = { ...prev, isVip: data.isVip, vipExpiry: data.vipExpiry };
        localStorage.setItem('cm_auth_user', JSON.stringify(updated));
        return updated;
      });
    });

    socket.on('follow_result', (data) => {
      if (data?.success) {
        a().setIsFollowingUser(data.following);
        if (data.target) a().setFollowCounts({ followers: data.followers || 0, following: data.following || 0 });
      }
      if (data?.message) {
        a().setToast({ msg: data.message, sender: 'Sistem', id: Date.now() });
        setTimeout(() => a().setToast(null), 4000);
      }
    });

    socket.on('follow_counts', (data) => {
      if (data?.username) {
        a().setFollowCounts({ followers: data.followers || 0, following: data.following || 0 });
        a().setIsFollowingUser(data.isFollowing || false);
      }
    });

    socket.on('follow_counts_update', (data) => {
      a().setFollowCounts({ followers: data.followers || 0, following: data.following || 0 });
    });

    socket.on('followed_you', (data) => {
      a().setToast({ msg: `${data.username} seni takip etti!`, sender: data.username, id: Date.now() });
      setTimeout(() => a().setToast(null), 4000);
      a().loadDmList();
    });

    socket.on('followers_list', (data) => { if (data?.followers) a().setFollowersList(data.followers); });
    socket.on('following_list', (data) => { if (data?.following) a().setFollowingList(data.following); });
    socket.on('feed', (data) => { if (data?.items) a().setFeedItems(data.items); });
    socket.on('suggested_follows', (data) => { if (data?.suggestions) a().setSuggestedFollows(data.suggestions); });

    socket.on('notifications', (data) => {
      if (data?.notifications) a().setNotifications(data.notifications);
      if (data?.unread !== undefined) a().setUnreadCount(data.unread);
    });

    socket.on('reports_list', (data) => { if (data?.reports) a().setReportsList(data.reports); });
    socket.on('role_result', (data) => {
      if (data?.message) { a().setToast({ msg: data.message, sender: 'Sistem', id: Date.now() }); setTimeout(() => a().setToast(null), 4000); }
    });
    socket.on('report_result', (data) => {
      if (data?.message) { a().setToast({ msg: data.message, sender: 'Sistem', id: Date.now() }); setTimeout(() => a().setToast(null), 4000); }
    });
    socket.on('verify_result', (data) => {
      if (data?.message) { a().setToast({ msg: data.message, sender: 'Dogrulama', id: Date.now() }); setTimeout(() => a().setToast(null), 4000); }
      if (data?.success) { a().setShowVerifyModal(false); a().setVerifyCode(''); if (a().authUser) { const u = { ...a().authUser, email_verified: 1 }; a().setAuthUser(u); localStorage.setItem('cm_auth_user', JSON.stringify(u)); } }
    });
    socket.on('two_factor_setup', (data) => {
      if (data?.success) { a().setTwoFASecret(data.secret || ''); a().setTwoFAQR(data.qrCode || ''); }
      if (data?.message) { a().setToast({ msg: data.message, sender: '2FA', id: Date.now() }); setTimeout(() => a().setToast(null), 4000); }
    });
    socket.on('two_factor_result', (data) => {
      if (data?.message) { a().setToast({ msg: data.message, sender: '2FA', id: Date.now() }); setTimeout(() => a().setToast(null), 4000); }
      if (data?.success) { a().setTwoFAEnabled(data.message?.includes('aktif')); a().setTwoFACode(''); a().setShow2FAModal(false); }
    });
    socket.on('two_factor_status', (data) => { a().setTwoFAEnabled(data?.enabled || false); });

    if ('Notification' in window && Notification.permission === 'default') {
      document.addEventListener('click', function reqNotif() {
        Notification.requestPermission();
        document.removeEventListener('click', reqNotif);
      });
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && socketRef.current) {
        const token = authTokenRef.current;
        socketRef.current.connect();
        if (token) socketRef.current.emit('social_sync', { token });
        if (a().currentRoomIdRef?.current) {
          socketRef.current.emit('request_room_sync', { roomId: a().currentRoomIdRef.current, token });
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      socket.off('connect'); socket.off('disconnect'); socket.off('reconnect'); socket.off('public_rooms_update');
      socket.off('search_results'); socket.off('room_joined'); socket.off('room_user_count_update');
      socket.off('room_settings_updated'); socket.off('kicked_from_room'); socket.off('categories_updated');
      socket.off('playlist_updated'); socket.off('play_mode_changed'); socket.off('room_error'); socket.off('room_action');
      socket.off('room_sync_data');
      socket.off('global_chat_history'); socket.off('global_chat_message'); socket.off('global_chat_cleared'); socket.off('social_profile'); socket.off('auth_result');
      socket.off('friends_update'); socket.off('friend_search_results'); socket.off('friend_request_received');
      socket.off('friend_request_status'); socket.off('friend_online_status'); socket.off('global_online_update'); socket.off('vip_activated');
      socket.off('typing_indicator'); socket.off('dm_read_receipt'); socket.off('dm_deleted'); socket.off('dm_edited');
      socket.off('reactions_update'); socket.off('room_invite');
      socket.off('follow_result'); socket.off('follow_counts'); socket.off('follow_counts_update');
      socket.off('followed_you'); socket.off('followers_list'); socket.off('following_list');
      socket.off('feed'); socket.off('suggested_follows');
      socket.off('notifications'); socket.off('reports_list'); socket.off('role_result'); socket.off('report_result'); socket.off('verify_result');
      socket.off('two_factor_setup'); socket.off('two_factor_result'); socket.off('two_factor_status');
      socket.off('dm_list'); socket.off('dm_history'); socket.off('dm_sent'); socket.off('dm_received'); socket.off('dm_status');
      socket.off('group_list'); socket.off('group_created'); socket.off('group_updated'); socket.off('group_history'); socket.off('group_message');
    };
  }, []);
}
