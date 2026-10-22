import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import Navbar from '../components/layout/Navbar';

const DATE_CONCEPTS = [
  {
    id: 'car_rain',
    icon: '🚗🌧️',
    title: 'Gece Sürüşü & Yağmur Sesi',
    shortLabel: '🚗🌧️ Yağmur & Araba',
    desc: 'Camda süzülen yağmur damlaları, gece yolu ve fonda lo-fi şarkılar',
    accent: '#38bdf8'
  },
  {
    id: 'cinema',
    icon: '🍿',
    title: 'Loş Sinema & Patlamış Mısır',
    shortLabel: '🍿 Sinema',
    desc: 'Karanlık salon ambiyansı, sıcak vizyon ışığı ve baş başa film keyfi',
    accent: '#f43f5e'
  },
  {
    id: 'cafe',
    icon: '☕',
    title: 'Yağmurlu Kafe & Lo-Fi',
    shortLabel: '☕ Kafe',
    desc: 'Sıcak kahve kokusu, hafif kafe uğultusu ve samimi tanışma sohbeti',
    accent: '#f59e0b'
  },
  {
    id: 'campfire',
    icon: '🔥',
    title: 'Sahilde Kamp Ateşi',
    shortLabel: '🔥 Kamp Ateşi',
    desc: 'Çıtırdayan kamp ateşi, dalga sesleri ve yıldızların altında müzik',
    accent: '#fb923c'
  }
];

const QUICK_SONGS = [
  'Duman - Senden Daha Güzel',
  'Arctic Monkeys - 505',
  'DKTT - Aldattım',
  'Mabel Matiz - Antidepresan',
  'The Weeknd - Die For You'
];

export default function DatePage() {
  const navigate = useNavigate();
  const {
    socket, authUser, authToken, userId, username, myAvatar, publicRooms, userCity
  } = useApp();

  const [guestNick, setGuestNick] = useState(() => {
    const saved = localStorage.getItem('cm_username') || '';
    if (saved && saved !== 'Izleyici' && saved !== 'İzleyici') return saved;
    return '';
  });
  const [nickError, setNickError] = useState('');
  const [gender, setGender] = useState(() => localStorage.getItem('cm_date_gender') || 'male');
  const [lookingFor, setLookingFor] = useState(() => localStorage.getItem('cm_date_looking') || 'female');
  const [dateConcept, setDateConcept] = useState(() => localStorage.getItem('cm_date_concept') || 'car_rain');
  const [favSong, setFavSong] = useState(() => localStorage.getItem('cm_date_song') || QUICK_SONGS[0]);

  const [inQueue, setInQueue] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [queuePosition, setQueuePosition] = useState(1);
  const [openDateRooms, setOpenDateRooms] = useState([]);
  const [matchBanner, setMatchBanner] = useState(null);
  const [creatingRoom, setCreatingRoom] = useState(false);

  const effectiveUsername = useMemo(() => {
    if (authUser?.username) return authUser.username;
    if (guestNick.trim()) return guestNick.trim();
    if (username && username !== 'Izleyici' && username !== 'İzleyici') return username;
    return '';
  }, [authUser, guestNick, username]);

  const effectiveAvatar = authUser?.avatar || myAvatar || (gender === 'female' ? '👩' : '👨');

  useEffect(() => {
    localStorage.setItem('cm_date_gender', gender);
    localStorage.setItem('cm_date_looking', lookingFor);
    localStorage.setItem('cm_date_concept', dateConcept);
    localStorage.setItem('cm_date_song', favSong);
  }, [gender, lookingFor, dateConcept, favSong]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('date_get_lobby');
    const pollInterval = setInterval(() => {
      if (socket.connected) socket.emit('date_get_lobby');
    }, 6000);

    const onLobbyStats = (data) => {
      if (!data) return;
      if (typeof data.queueCount === 'number') setQueueCount(data.queueCount);
      if (Array.isArray(data.openDateRooms)) setOpenDateRooms(data.openDateRooms);
    };

    const onQueueWaiting = (data) => {
      setInQueue(true);
      if (data?.position) setQueuePosition(data.position);
      if (typeof data?.queueCount === 'number') setQueueCount(data.queueCount);
    };

    const onMatchFound = (data) => {
      if (!data?.roomId) return;
      setInQueue(false);
      setMatchBanner(data);
      const cleanName = effectiveUsername || 'RomantikMisafir';
      if (!authUser && cleanName) {
        localStorage.setItem('cm_username', cleanName);
      }
      setTimeout(() => {
        socket.emit('join_room', {
          roomId: data.roomId,
          password: '',
          token: authToken,
          userCity,
          clientUserId: userId,
          guestName: !authToken ? cleanName : ''
        });
        navigate(`/room/${encodeURIComponent(data.roomId)}`);
      }, 1500);
    };

    socket.on('date_lobby_stats', onLobbyStats);
    socket.on('date_queue_waiting', onQueueWaiting);
    socket.on('date_match_found', onMatchFound);

    return () => {
      clearInterval(pollInterval);
      socket.off('date_lobby_stats', onLobbyStats);
      socket.off('date_queue_waiting', onQueueWaiting);
      socket.off('date_match_found', onMatchFound);
    };
  }, [socket, authToken, authUser, effectiveUsername, navigate, userCity, userId]);

  // Unmount olurken kuyruktaysa çık
  useEffect(() => {
    return () => {
      if (inQueue && socket) {
        socket.emit('date_queue_leave');
      }
    };
  }, [inQueue, socket]);

  const ensureNickname = () => {
    if (authUser?.username) return authUser.username;
    const clean = guestNick.trim();
    if (!clean || clean.length < 2) {
      setNickError('Lütfen Date için en az 2 harfli ismini / rumuzunu yaz 💕');
      return null;
    }
    setNickError('');
    localStorage.setItem('cm_username', clean);
    return clean;
  };

  const handleToggleQueue = () => {
    if (!socket) return;
    if (inQueue) {
      socket.emit('date_queue_leave');
      setInQueue(false);
      return;
    }
    const cleanName = ensureNickname();
    if (!cleanName) return;

    setInQueue(true);
    socket.emit('date_queue_join', {
      username: cleanName,
      avatar: effectiveAvatar,
      gender,
      lookingFor,
      dateConcept,
      favSong: favSong.trim() || QUICK_SONGS[0],
      token: authToken,
      userId
    });
  };

  const handleCreateWaitingDateRoom = () => {
    if (!socket || creatingRoom) return;
    const cleanName = ensureNickname();
    if (!cleanName) return;

    setCreatingRoom(true);
    if (inQueue) {
      socket.emit('date_queue_leave');
      setInQueue(false);
    }
    socket.emit('date_create_waiting_room', {
      username: cleanName,
      avatar: effectiveAvatar,
      gender,
      lookingFor,
      dateConcept,
      favSong: favSong.trim() || QUICK_SONGS[0],
      token: authToken,
      userId,
      userCity
    });
    setTimeout(() => setCreatingRoom(false), 2500);
  };

  const handleJoinWaitingRoom = (room) => {
    const cleanName = ensureNickname();
    if (!cleanName) return;
    const targetId = room.roomId || room.id;
    if (!targetId) return;
    if (inQueue && socket) {
      socket.emit('date_queue_leave');
      setInQueue(false);
    }
    socket.emit('join_room', {
      roomId: targetId,
      password: '',
      token: authToken,
      userCity,
      clientUserId: userId,
      guestName: !authToken ? cleanName : ''
    });
  };

  // Partner bekleyen Date odaları: date_lobby_stats + publicRooms içindeki 1/2 kişilik odalar
  const mergedWaitingRooms = useMemo(() => {
    const map = new Map();
    if (Array.isArray(openDateRooms)) {
      openDateRooms.forEach((r) => {
        const id = r.roomId || r.id;
        if (id) map.set(id, r);
      });
    }
    if (Array.isArray(publicRooms)) {
      publicRooms.forEach((r) => {
        const id = r.id || r.roomId;
        if (!id || map.has(id)) return;
        if (Number(r.maxUsers) === 2 && Number(r.userCount) === 1 && !r.hasPassword) {
          map.set(id, {
            roomId: id,
            roomName: r.name || id,
            hostName: r.hostName || r.creator || 'Romantik Ev Sahibi',
            hostAvatar: r.hostAvatar || '💑',
            dateConcept: r.dateConcept || r.dateAmbience || 'car_rain',
            favSong: r.favSong || r.currentMedia?.title || 'Duman - Senden Daha Güzel',
            userCount: r.userCount || 1,
            maxUsers: 2
          });
        }
      });
    }
    return Array.from(map.values());
  }, [openDateRooms, publicRooms]);

  const getConceptMeta = (conceptId) => {
    return DATE_CONCEPTS.find((c) => c.id === conceptId) || DATE_CONCEPTS[0];
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff', color: '#0f172a',
      paddingBottom: 60
    }}>
      <Navbar />

      {/* Match Found Heyecanlı Bildirim Banner */}
      {matchBanner && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(9,13,22,.88)', backdropFilter: 'blur(18px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            width: 'min(460px, 100%)', padding: '32px 26px', borderRadius: 28,
            background: '#ffffff', border: '2px solid #0f172a', color: '#0f172a',
            border: '1px solid rgba(251,113,133,.45)',
            boxShadow: '0 30px 90px rgba(244,63,94,.35)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 56, marginBottom: 10 }}>💘</div>
            <div style={{
              display: 'inline-block', padding: '4px 12px', borderRadius: 999,
              background: 'rgba(244,63,94,.2)', border: '1px solid rgba(251,113,133,.4)',
              color: '#fda4af', fontSize: 11, fontWeight: 900, letterSpacing: '0.8px', marginBottom: 10
            }}>
              EŞLEŞME BULUNDU!
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 950, color: '#0f172a' }}>
              {matchBanner.partner?.username || 'Yeni Partnerin'} ile Date Başlıyor!
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              Ortak Date odanıza bağlanıyorsun... İlk 10 dakikalık buzkıran sorularınız ve ambiyansınız hazır!
            </p>
            {matchBanner.favSong && (
              <div style={{
                padding: '10px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
                color: '#fda4af', fontSize: 12, fontWeight: 800
              }}>
                🎵 Ortak Şarkı: {matchBanner.favSong}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 16px' }}>
        {/* Üst Başlık */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
          gap: 14, marginBottom: 24, padding: '20px 24px', borderRadius: 24,
          background: '#ffffff', border: '2px solid #0f172a', boxShadow: '0 8px 24px rgba(253,38,125,0.08)'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                padding: '4px 10px', borderRadius: 999,
                background: 'rgba(244,63,94,.2)', border: '1px solid rgba(251,113,133,.35)',
                color: '#fda4af', fontSize: 11, fontWeight: 900
              }}>
                💘 SANAL DATE LOBİSİ
              </span>
              <span style={{
                padding: '4px 10px', borderRadius: 999,
                background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.3)',
                color: '#4ade80', fontSize: 11, fontWeight: 800
              }}>
                🟢 {queueCount + mergedWaitingRooms.length} Kişi Date Arıyor
              </span>
            </div>
            <h1 style={{ margin: '0 0 4px', fontSize: 'clamp(22px, 3.2vw, 30px)', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Yeni Biriyle Tanış & İlk Sanal Date'ine Çık ✨
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1' }}>
              Date konseptini ve favori şarkını seç; ister canlı radarda anında eşleş, ister kendi 2 kişilik Date odanı açıp partner bekle.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 16px', borderRadius: 12,
              background: '#ffffff', border: '1.5px solid #0f172a', color: '#0f172a', fontSize: 12, fontWeight: 800, cursor: 'pointer'
            }}
          >
            ← Keşfet'e Dön
          </button>
        </div>

        {/* İki Panelli Ana Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))',
          gap: 22,
          alignItems: 'start'
        }}>
          {/* SOL PANEL: Canlı Sanal Date Eşleşmesi */}
          <div style={{
            padding: '24px', borderRadius: 24,
            background: '#ffffff', border: '2px solid #0f172a', boxShadow: '0 12px 30px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ color: '#fb7185', fontSize: 11, fontWeight: 900, letterSpacing: '0.6px' }}>
                  SPEED DATE & BLIND DATE
                </div>
                <h2 style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 950, color: '#0f172a' }}>
                  💘 Canlı Sanal Date Eşleşmesi
                </h2>
              </div>
              <span style={{ fontSize: 28 }}>🥂</span>
            </div>

            {/* 1. Misafir İsim / Rumuz */}
            {!authUser ? (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: '#fda4af', fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                  👋 Senin İsmin / Rumuzun
                </label>
                <input
                  value={guestNick}
                  onChange={(e) => { setGuestNick(e.target.value); setNickError(''); }}
                  placeholder="Örn: Ömer, Elif, GeceKuşu..."
                  maxLength={20}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 12,
                    background: '#ffffff',
                    border: nickError ? '1px solid #ef4444' : '1px solid rgba(251,113,133,.35)',
                    color: '#0f172a', fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box'
                  }}
                />
                {nickError && <div style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, marginTop: 4 }}>{nickError}</div>}
              </div>
            ) : (
              <div style={{
                marginBottom: 16, padding: '10px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                <span style={{ fontSize: 22 }}>{authUser.avatar || myAvatar || '😻'}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{authUser.username}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Onaylı profilinle Date'e katılıyorsun</div>
                </div>
              </div>
            )}

            {/* 2. Cinsiyetin & Kiminle Date'e Çıkmak İstersin */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 800, marginBottom: 6 }}>
                  Cinsiyetin
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { id: 'male', label: '👨 Erkek' },
                    { id: 'female', label: '👩 Kadın' }
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGender(g.id)}
                      style={{
                        flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                        border: gender === g.id ? '2px solid #f43f5e' : '1px solid rgba(255,255,255,.1)',
                        background: gender === g.id ? 'rgba(244,63,94,.18)' : '#0b131e',
                        color: gender === g.id ? '#fff' : '#94a3b8',
                        fontSize: 12, fontWeight: 800
                      }}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 800, marginBottom: 6 }}>
                  Aradığın Partner
                </label>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[
                    { id: 'female', label: '👩 Kadın' },
                    { id: 'male', label: '👨 Erkek' },
                    { id: 'any', label: '🌍 Farketmez' }
                  ].map((lf) => (
                    <button
                      key={lf.id}
                      type="button"
                      onClick={() => setLookingFor(lf.id)}
                      style={{
                        flex: 1, padding: '10px 4px', borderRadius: 10, cursor: 'pointer',
                        border: lookingFor === lf.id ? '2px solid #a855f7' : '1px solid rgba(255,255,255,.1)',
                        background: lookingFor === lf.id ? 'rgba(168,85,247,.2)' : '#0b131e',
                        color: lookingFor === lf.id ? '#fff' : '#94a3b8',
                        fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap'
                      }}
                    >
                      {lf.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Hayalindeki Date Konsepti */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 800, marginBottom: 8 }}>
                ✨ Hayalindeki Date Konsepti (Oda Ambiyansı)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {DATE_CONCEPTS.map((c) => {
                  const active = dateConcept === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setDateConcept(c.id)}
                      style={{
                        textAlign: 'left', padding: '12px', borderRadius: 14, cursor: 'pointer',
                        border: active ? `2px solid ${c.accent}` : '1px solid rgba(255,255,255,.08)',
                        background: active ? `${c.accent}1f` : 'rgba(255,255,255,.03)',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{c.icon}</div>
                      <div style={{ color: '#0f172a', fontSize: 12, fontWeight: 900, marginBottom: 2 }}>{c.title}</div>
                      <div style={{ color: '#94a3b8', fontSize: 10.5, lineHeight: 1.35 }}>{c.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Favori Şarkın (Buzkıran) */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 800, marginBottom: 6 }}>
                🎵 Senin Favori Şarkın (İlk Date Buzkıranı)
              </label>
              <input
                value={favSong}
                onChange={(e) => setFavSong(e.target.value)}
                placeholder="Örn: Duman - Senden Daha Güzel, Arctic Monkeys - 505..."
                maxLength={70}
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 12,
                  background: '#ffffff', border: '1px solid rgba(255,255,255,.12)',
                  color: '#0f172a', fontSize: 12.5, fontWeight: 700, outline: 'none', boxSizing: 'border-box',
                  marginBottom: 8
                }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {QUICK_SONGS.map((song) => {
                  const selected = favSong === song;
                  return (
                    <button
                      key={song}
                      type="button"
                      onClick={() => setFavSong(song)}
                      style={{
                        padding: '5px 10px', borderRadius: 999, cursor: 'pointer',
                        border: selected ? '1px solid #fb7185' : '1px solid rgba(255,255,255,.08)',
                        background: selected ? 'rgba(244,63,94,.2)' : 'rgba(255,255,255,.04)',
                        color: selected ? '#fda4af' : '#94a3b8',
                        fontSize: 10.5, fontWeight: 800
                      }}
                    >
                      🎵 {song}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Radar Durumu */}
            {inQueue && (
              <div style={{
                marginBottom: 14, padding: '16px', borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(244,63,94,.16), rgba(168,85,247,.16))',
                border: '1px solid rgba(251,113,133,.4)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>📡</div>
                <div style={{ color: '#0f172a', fontSize: 14, fontWeight: 900, marginBottom: 4 }}>
                  Partner Aranıyor... Sırada {Math.max(1, queueCount)} kişi var
                </div>
                <div style={{ color: '#fda4af', fontSize: 11.5 }}>
                  Seçtiğin konsept: <strong>{getConceptMeta(dateConcept).shortLabel}</strong> • Eşleşme bulunduğunda otomatik bağlanacaksın!
                </div>
              </div>
            )}

            {/* 5. İki Aksiyon Butonu */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                onClick={handleToggleQueue}
                style={{
                  width: '100%', padding: '14px 18px', borderRadius: 14, border: 'none',
                  background: inQueue
                    ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                    : 'linear-gradient(135deg, #f43f5e, #e11d48)',
                  color: '#0f172a', fontSize: 14, fontWeight: 900, cursor: 'pointer',
                  boxShadow: '0 10px 28px rgba(244,63,94,.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                {inQueue ? '✕ Aramayı İptal Et' : '⚡ Canlı Eşleşme Başlat (Radar)'}
              </button>

              <button
                type="button"
                onClick={handleCreateWaitingDateRoom}
                disabled={creatingRoom}
                style={{
                  width: '100%', padding: '13px 18px', borderRadius: 14,
                  border: '1px solid rgba(251,113,133,.35)',
                  background: 'rgba(244,63,94,.1)',
                  color: '#fda4af', fontSize: 13, fontWeight: 900, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                {creatingRoom ? '🕯️ Date Odan Hazırlanıyor...' : '🕯️ Date Odamı Aç & Partner Bekle'}
              </button>
            </div>
          </div>

          {/* SAĞ PANEL: Şu An Partner Bekleyen Date Odaları (1/2 Kişi) */}
          <div style={{
            padding: '24px', borderRadius: 24,
            background: '#ffffff', border: '2px solid #0f172a', boxShadow: '0 12px 30px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ color: '#c084fc', fontSize: 11, fontWeight: 900, letterSpacing: '0.6px' }}>
                  BEKLEMEDEN ANINDA KATIL
                </div>
                <h2 style={{ margin: '2px 0 0', fontSize: 19, fontWeight: 950, color: '#0f172a' }}>
                  🔥 Şu An Partner Bekleyen Date Odaları (1/2 Kişi)
                </h2>
              </div>
              <span style={{
                padding: '4px 10px', borderRadius: 999,
                background: 'rgba(168,85,247,.16)', border: '1px solid rgba(168,85,247,.35)',
                color: '#d8b4fe', fontSize: 11, fontWeight: 900
              }}>
                {mergedWaitingRooms.length} Açık Oda
              </span>
            </div>

            {mergedWaitingRooms.length === 0 ? (
              <div style={{
                padding: '38px 20px', borderRadius: 18,
                background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.12)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 42, marginBottom: 10 }}>🕯️</div>
                <div style={{ color: '#0f172a', fontSize: 15, fontWeight: 900, marginBottom: 6 }}>
                  Şu an açık Date odası yok — İlk Date odasını sen aç!
                </div>
                <p style={{ color: '#94a3b8', fontSize: 12.5, lineHeight: 1.5, margin: '0 auto 16px', maxWidth: 360 }}>
                  Soldaki <strong>"🕯️ Date Odamı Aç & Partner Bekle"</strong> butonuna bastığında odan burada listelenir ve gelen partner doğrudan senin ambiyansına katılır.
                </p>
                <button
                  type="button"
                  onClick={handleCreateWaitingDateRoom}
                  style={{
                    padding: '11px 18px', borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg, #f43f5e, #a855f7)',
                    color: '#0f172a', fontSize: 12.5, fontWeight: 900, cursor: 'pointer'
                  }}
                >
                  🕯️ İlk Date Odasını Ben Açayım →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {mergedWaitingRooms.map((room) => {
                  const cMeta = getConceptMeta(room.dateConcept);
                  return (
                    <div
                      key={room.roomId || room.id}
                      style={{
                        padding: '16px', borderRadius: 18,
                        background: 'rgba(255,255,255,.03)',
                        border: '1px solid rgba(251,113,133,.22)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 12, flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: 16, flexShrink: 0,
                          background: 'linear-gradient(135deg, rgba(244,63,94,.25), rgba(168,85,247,.25))',
                          border: '1px solid rgba(251,113,133,.35)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
                        }}>
                          {room.hostAvatar || '💑'}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                            <span style={{ color: '#0f172a', fontSize: 14, fontWeight: 900 }}>
                              {room.hostName || room.roomName || 'Date Odası'}
                            </span>
                            <span style={{
                              padding: '2px 8px', borderRadius: 999,
                              background: `${cMeta.accent}22`, border: `1px solid ${cMeta.accent}55`,
                              color: '#0f172a', fontSize: 10, fontWeight: 800
                            }}>
                              {cMeta.shortLabel}
                            </span>
                          </div>
                          <div style={{
                            color: '#fda4af', fontSize: 11.5, fontWeight: 700,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            🎵 Favori Şarkısı: {room.favSong || 'Duman - Senden Daha Güzel'}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleJoinWaitingRoom(room)}
                        style={{
                          padding: '10px 16px', borderRadius: 12, border: 'none',
                          background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                          color: '#0f172a', fontSize: 12, fontWeight: 900, cursor: 'pointer',
                          boxShadow: '0 6px 18px rgba(244,63,94,.3)', flexShrink: 0
                        }}
                      >
                        💘 Date'e Katıl (1/2)
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
