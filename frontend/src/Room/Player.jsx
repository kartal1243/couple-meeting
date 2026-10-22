import YouTube from 'react-youtube';
import { useCallback, useEffect, useRef, useState, memo } from 'react';

const ICEBREAKER_QUESTIONS = [
  {
    q: "Gece 02:00'de arabayla sahile insek fonda hangi şarkı çalmalı?",
    opts: ['🎸 Duman / Türkçe Rock', '🎹 Slow / Akustik Lo-Fi']
  },
  {
    q: 'İlk buluşmada hesap nasıl ödenmeli?',
    opts: ['💳 Alman Usulü (Eşit Paylaşım)', '🥂 Davet Eden Öder']
  },
  {
    q: 'Yağmurlu bir pazar günü için hayalindeki plan hangisi?',
    opts: ['🍿 Evde Battaniye & Film Keyfi', '☕ Sıcak Bir Kafede Derin Sohbet']
  },
  {
    q: 'İlişkide vazgeçilmez en önemli şey sence hangisi?',
    opts: ['🤝 Koşulsuz Güven & Sadakat', '🔥 Tutku & Sürekli Eğlence']
  },
  {
    q: 'Gece yarısı acıktık! Ne sipariş veriyoruz?',
    opts: ['🍔 Hamburger & Çıtır Patates', '🌮 Kokoreç / Gece Sokak Lezzeti']
  },
  {
    q: 'Birlikte çıkacağımız ilk tatil rotası neresi olmalı?',
    opts: ['🏕️ Karavan & Doğa Kampı', '🏖️ Ege / Akdeniz Butik Otel']
  },
  {
    q: 'Birlikte film izleyecek olsak tür tercihin ne olur?',
    opts: ['👻 Korku / Ters Köşe Gerilim', '💕 Romantik Komedi / Sıcak Dizi']
  },
  {
    q: 'Biyolojik saatin hangisine daha yakın?',
    opts: ['🌙 Tam Bir Gece Kuşu', '☀️ Erken Kalkan Sabah İnsanı']
  },
  {
    q: 'Küçük bir tartışma yaşadığımızda ideal çözüm tarzın ne?',
    opts: ['🫂 Hemen Sarılıp Anında Konuşmak', '⏳ Biraz Sakinleşip Sonra Konuşmak']
  },
  {
    q: 'Sence ilk görüşte aşk ve çekim gerçek mi?',
    opts: ['💘 Evet! Enerji İlk Saniyede Belli Olur', '🌱 Hayır, Tanıdıkça ve Paylaştıkça Doğar']
  },
  {
    q: 'Hangisi seni daha çok mutlu eder?',
    opts: ['⏳ Birlikte Geçirilen Kaliteli Zaman', '🎁 Düşünülmüş Anlamlı Sürprizler']
  },
  {
    q: 'Birlikte karaoke yapsak ilk hangi şarkıyı söylerdik?',
    opts: ['🎤 Şebnem Ferah / Yüksek Sadakat', '💃 Tarkan / Enerjik Pop']
  },
  {
    q: 'Telefonunun ekran süresi mi daha yüksek yoksa kitap okuma oranın mı?',
    opts: ['📱 Sosyal Medya & Ekran Bağımlısı', '📚 Sakinlik & Kitap İnsanı']
  },
  {
    q: 'Sevgilinle evde baş başayken favori aktiviteniz hangisi olurdu?',
    opts: ['🍳 Birlikte Yemek Pişirmek', '🎮 Birlikte Oyun / PS Oynamak']
  }
];

const AMBIENCE_THEMES = {
  cafe: {
    id: 'cafe',
    name: '☕ Loş Kafe & Akustik',
    gradient: 'radial-gradient(circle at 50% 30%, rgba(245,158,11,0.18) 0%, rgba(30,18,8,0.95) 70%, #0d0804 100%)',
    accent: '#f59e0b',
    border: 'rgba(245,158,11,0.35)',
    particles: '☕ Sıcak Kahve & Lo-Fi Uğultusu',
    freq: 240
  },
  car_rain: {
    id: 'car_rain',
    name: '🚗🌧️ Gece Sürüşü & Yağmur',
    gradient: 'radial-gradient(circle at 50% 20%, rgba(56,189,248,0.18) 0%, rgba(10,18,32,0.96) 65%, #050811 100%)',
    accent: '#38bdf8',
    border: 'rgba(56,189,248,0.35)',
    particles: '🌧️ Cama Vuran Yağmur & Yol Sesi',
    freq: 380
  },
  campfire: {
    id: 'campfire',
    name: '🔥 Yıldızlar Altında Kamp Ateşi',
    gradient: 'radial-gradient(circle at 50% 75%, rgba(251,146,60,0.22) 0%, rgba(20,10,6,0.96) 65%, #080402 100%)',
    accent: '#fb923c',
    border: 'rgba(251,146,60,0.35)',
    particles: '🔥 Çıtırdayan Odun Ateşi & Gece',
    freq: 300
  },
  cinema: {
    id: 'cinema',
    name: '🍿 VIP Sinema Locası',
    gradient: 'radial-gradient(circle at 50% 25%, rgba(244,63,94,0.18) 0%, rgba(24,8,12,0.96) 65%, #0a0305 100%)',
    accent: '#f43f5e',
    border: 'rgba(244,63,94,0.35)',
    particles: '🍿 Loş Salon & Vizyon Işığı',
    freq: 200
  }
};

function extractVideoId(src) {
  if (!src) return null;
  if (src.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(src)) return src;
  const m = src.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : src;
}

function Player({
  mediaType, mediaSrc, youtubeError, ytPlayerRef, pendingSyncRef, mediaMeta,
  reactions, openYouTubeExternally, handleMediaEnd, handleYouTubeError,
  currentRoomType, currentTheme, roomUsersList, roomName, roomId,
  socket, roomDateState, setRoomDateState, username
}) {
  const playType = mediaType === 'music' ? 'youtube' : mediaType;
  const videoId = extractVideoId(mediaSrc);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nativeControls, setNativeControls] = useState(true);
  const [repeat, setRepeat] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [toastFeedback, setToastFeedback] = useState('');

  // Date Room UX Controls
  const [showVideoMode, setShowVideoMode] = useState(false);
  const [ambienceSoundOn, setAmbienceSoundOn] = useState(false);
  const [ambienceVolume, setAmbienceVolume] = useState(0.35);

  const repeatRef = useRef(false); repeatRef.current = repeat;
  const wrapRef = useRef(null);
  const settingsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);

  const activeAmbienceKey = roomDateState?.dateAmbience || roomDateState?.dateConcept || 'cafe';
  const currentThemeMeta = AMBIENCE_THEMES[activeAmbienceKey] || AMBIENCE_THEMES.cafe;
  const isDateActive = Boolean(roomDateState?.isDateRoom || roomDateState?.dateAmbience !== 'none');

  // Realized Audio Synthesizer (Realistic Brown/Pink noise + Resonant Crackle generator)
  const stopAmbienceAudio = useCallback(() => {
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
      gainNodeRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!ambienceSoundOn) {
      stopAmbienceAudio();
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Warm brown-pink noise curve
        lastOut = (lastOut + 0.025 * white) / 1.025;
        data[i] = lastOut * 0.4;

        // Wood crackle impulses for campfire
        if (activeAmbienceKey === 'campfire' && Math.random() < 0.0035) {
          data[i] += (Math.random() * 0.9 - 0.45);
        }
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = currentThemeMeta.freq || 280;
      filter.Q.value = 1.0;

      const gain = ctx.createGain();
      gain.gain.value = ambienceVolume;
      gainNodeRef.current = gain;

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noiseSource.start(0);
    } catch {}

    return () => {
      stopAmbienceAudio();
    };
  }, [ambienceSoundOn, activeAmbienceKey, currentThemeMeta.freq, stopAmbienceAudio]);

  // Handle dynamic volume slider update
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      try {
        gainNodeRef.current.gain.setTargetAtTime(ambienceVolume, audioCtxRef.current.currentTime, 0.05);
      } catch {}
    }
  }, [ambienceVolume]);

  const activeRoomId = roomId || mediaMeta?.roomId || '';
  const inviteUrl = typeof window !== 'undefined' && activeRoomId
    ? `${window.location.origin}/room/${encodeURIComponent(activeRoomId)}`
    : (typeof window !== 'undefined' ? window.location.href : '');

  const myName = username || 'Ben';
  const myUsersList = Array.isArray(roomUsersList) ? roomUsersList : [];
  const me = myUsersList.find((u) => u.username === myName) || { username: myName, avatar: '🐱' };
  const partner = myUsersList.find((u) => u.username !== myName) || null;

  const handleCopyInvite = () => {
    if (!inviteUrl) return;
    navigator.clipboard?.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const handleWhatsAppInvite = () => {
    const label = roomName || activeRoomId || 'Couple Meeting';
    const text = `💕 "${label}" Sanal Date odasındayım, seni bekliyorum! Tıkla ve hemen yanıma gel: ${inviteUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // Icebreaker & 36 Questions Logic
  const qIndex = Math.abs(Number(roomDateState?.icebreakerIndex || 0)) % ICEBREAKER_QUESTIONS.length;
  const currentQ = ICEBREAKER_QUESTIONS[qIndex];
  const answersMap = roomDateState?.icebreakerAnswers || {};
  const answerEntries = Object.entries(answersMap);
  const myAnswer = answersMap[myName];
  const partnerAnswer = partner ? answersMap[partner.username] : null;
  const bothAnswered = Boolean(myAnswer && partnerAnswer);
  const isPerfectMatch = bothAnswered && myAnswer === partnerAnswer;

  const handleAnswerIcebreaker = (ans) => {
    if (setRoomDateState) {
      setRoomDateState((prev) => ({
        ...prev,
        icebreakerAnswers: { ...(prev?.icebreakerAnswers || {}), [myName]: ans }
      }));
    }
    if (socket && activeRoomId) {
      socket.emit('date_room_action', {
        roomId: activeRoomId,
        type: 'ANSWER_ICEBREAKER',
        username: myName,
        answer: ans
      });
    }
  };

  const handleNextIcebreaker = () => {
    if (setRoomDateState) {
      setRoomDateState((prev) => ({
        ...prev,
        icebreakerIndex: ((prev?.icebreakerIndex || 0) + 1) % ICEBREAKER_QUESTIONS.length,
        icebreakerAnswers: {}
      }));
    }
    if (socket && activeRoomId) {
      socket.emit('date_room_action', {
        roomId: activeRoomId,
        type: 'NEXT_ICEBREAKER'
      });
    }
  };

  const handleChangeAmbience = (themeKey) => {
    if (setRoomDateState) {
      setRoomDateState((prev) => ({ ...prev, dateAmbience: themeKey }));
    }
    if (socket && activeRoomId) {
      socket.emit('date_room_action', {
        roomId: activeRoomId,
        type: 'SET_AMBIENCE',
        ambience: themeKey
      });
    }
  };

  const triggerToastReaction = (emoji, label) => {
    setToastFeedback(`${emoji} ${label}`);
    setTimeout(() => setToastFeedback(''), 2200);
    if (socket && activeRoomId) {
      socket.emit('room_action', {
        roomId: activeRoomId,
        type: 'SEND_REACTION',
        payload: { emoji, sender: myName }
      });
    }
  };

  const ytOpts = {
    height: '100%', width: '100%',
    host: 'https://www.youtube-nocookie.com',
    playerVars: { autoplay: 1, controls: nativeControls ? 1 : 0, playsinline: 1, rel: 0, modestbranding: 1, enablejsapi: 1 }
  };

  const handleYTReady = useCallback((e) => {
    ytPlayerRef.current = e.target;
    if (pendingSyncRef?.current) {
      try {
        const sync = pendingSyncRef.current;
        const elapsed = sync.isPlaying ? (Date.now() - (sync.lastUpdated || Date.now())) / 1000 : 0;
        const seekTo = (sync.time || 0) + elapsed;
        e.target.seekTo(seekTo, true);
        if (sync.isPlaying) e.target.playVideo(); else e.target.pauseVideo();
      } catch {}
      pendingSyncRef.current = null;
    }
  }, [ytPlayerRef, pendingSyncRef]);

  const hasMediaActive = mediaType !== 'none' && Boolean(mediaSrc) && !youtubeError;

  return (
    <div
      className="cm-video-wrap"
      ref={wrapRef}
      style={{
        flex: 1,
        position: 'relative',
        width: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: isDateActive ? currentThemeMeta.gradient : '#090d16',
        overflow: 'hidden',
        transition: 'background 0.5s ease'
      }}
    >
      {/* ── DATE ROOM: ROMANTIC CHEMISTRY LOUNGE (PEOPLE-FIRST, NO VIDEO BY DEFAULT) ── */}
      {isDateActive && !showVideoMode && (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 30,
          overflowY: 'auto'
        }}>
          {/* Top Ambience & Audio Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            width: '100%',
            maxWidth: 780,
            flexWrap: 'wrap',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(16px)',
            border: `1.5px solid ${currentThemeMeta.border}`,
            padding: '8px 14px',
            borderRadius: 999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
          }}>
            {/* Ambience Theme Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: currentThemeMeta.accent }}>✨ MOD:</span>
              {Object.values(AMBIENCE_THEMES).map((theme) => {
                const isSelected = activeAmbienceKey === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleChangeAmbience(theme.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: isSelected ? `1.5px solid ${theme.accent}` : '1px solid rgba(255,255,255,0.12)',
                      background: isSelected ? `${theme.accent}26` : 'rgba(255,255,255,0.05)',
                      color: isSelected ? '#ffffff' : '#94a3b8',
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {theme.name.split(' ')[0]} {theme.name.split(' ')[1]}
                  </button>
                );
              })}
            </div>

            {/* Audio Controls (Sound Synth & Volume) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => setAmbienceSoundOn(!ambienceSoundOn)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 999,
                  border: ambienceSoundOn ? '1.5px solid #22c55e' : '1px solid rgba(255,255,255,0.15)',
                  background: ambienceSoundOn ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.06)',
                  color: ambienceSoundOn ? '#4ade80' : '#cbd5e1',
                  fontSize: 11.5,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {ambienceSoundOn ? '🔊 Fon Sesi Açık' : '🔇 Fon Sesini Aç'}
              </button>

              {ambienceSoundOn && (
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ambienceVolume}
                  onChange={(e) => setAmbienceVolume(parseFloat(e.target.value))}
                  style={{ width: 65, accentColor: currentThemeMeta.accent, cursor: 'pointer' }}
                  title="Ses Düzeyi"
                />
              )}
            </div>
          </div>

          {/* Center Stage: The Couple Cards & Chemistry Match */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(14px, 4vw, 42px)',
            width: '100%',
            maxWidth: 680,
            margin: '16px 0'
          }}>
            {/* Left Card: Me */}
            <div style={{
              flex: '1 1 200px',
              maxWidth: 240,
              background: 'rgba(15, 23, 42, 0.82)',
              border: `1.5px solid ${currentThemeMeta.border}`,
              borderRadius: 22,
              padding: '18px 14px',
              textAlign: 'center',
              boxShadow: '0 16px 36px rgba(0,0,0,0.45)',
              backdropFilter: 'blur(20px)'
            }}>
              <div style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fd267d, #ff6036)',
                margin: '0 auto 10px',
                display: 'grid',
                placeItems: 'center',
                fontSize: 34,
                boxShadow: '0 8px 24px rgba(253,38,125,0.4)',
                border: '3px solid rgba(255,255,255,0.25)'
              }}>
                {me.avatar || '🐱'}
              </div>
              <div style={{ color: '#ffffff', fontWeight: 950, fontSize: 16, marginBottom: 4 }}>
                {me.username}
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(34,197,94,0.18)',
                color: '#4ade80',
                padding: '2px 9px',
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 800
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'cmLivePulse 2s infinite' }} />
                <span>Canlı & Sohbette</span>
              </div>
            </div>

            {/* Center Heart & Compatibility Indicator */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                fontSize: 34,
                animation: 'cmPulseHeart 1.5s ease-in-out infinite',
                filter: 'drop-shadow(0 0 16px rgba(253,38,125,0.6))'
              }}>
                💖
              </div>
              <span style={{
                background: 'linear-gradient(135deg, #fd267d, #ff6036)',
                color: '#ffffff',
                padding: '3px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '0.4px',
                whiteSpace: 'nowrap'
              }}>
                {bothAnswered ? (isPerfectMatch ? '%100 UYUM' : '%75 ÇEKİM') : 'SANAL DATE'}
              </span>
            </div>

            {/* Right Card: Partner */}
            <div style={{
              flex: '1 1 200px',
              maxWidth: 240,
              background: 'rgba(15, 23, 42, 0.82)',
              border: partner ? `1.5px solid ${currentThemeMeta.border}` : '1.5px dashed rgba(255,255,255,0.2)',
              borderRadius: 22,
              padding: '18px 14px',
              textAlign: 'center',
              boxShadow: '0 16px 36px rgba(0,0,0,0.45)',
              backdropFilter: 'blur(20px)'
            }}>
              {partner ? (
                <>
                  <div style={{
                    width: 68,
                    height: 68,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    margin: '0 auto 10px',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 34,
                    boxShadow: '0 8px 24px rgba(139,92,246,0.4)',
                    border: '3px solid rgba(255,255,255,0.25)'
                  }}>
                    {partner.avatar || '🐰'}
                  </div>
                  <div style={{ color: '#ffffff', fontWeight: 950, fontSize: 16, marginBottom: 4 }}>
                    {partner.username}
                  </div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: 'rgba(34,197,94,0.18)',
                    color: '#4ade80',
                    padding: '2px 9px',
                    borderRadius: 999,
                    fontSize: 10.5,
                    fontWeight: 800
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'cmLivePulse 2s infinite' }} />
                    <span>Partnerin Yanında</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{
                    width: 68,
                    height: 68,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)',
                    margin: '0 auto 10px',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 28,
                    color: '#64748b'
                  }}>
                    ⏳
                  </div>
                  <div style={{ color: '#cbd5e1', fontWeight: 900, fontSize: 14, marginBottom: 6 }}>
                    Partner Bekleniyor...
                  </div>
                  <button
                    type="button"
                    onClick={handleWhatsAppInvite}
                    style={{
                      background: 'linear-gradient(135deg, #25D366, #128C7E)',
                      border: 'none',
                      color: '#ffffff',
                      padding: '6px 12px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    💬 WhatsApp&apos;tan Çağır
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Interactive 36 Soru & Buzkıran Centerpiece Card */}
          <div style={{
            width: '100%',
            maxWidth: 680,
            background: 'linear-gradient(165deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1.5px solid rgba(251, 113, 133, 0.35)',
            borderRadius: 24,
            padding: '20px 24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{
                padding: '3px 10px',
                borderRadius: 999,
                background: 'rgba(244, 63, 94, 0.2)',
                color: '#fda4af',
                fontSize: 11,
                fontWeight: 900
              }}>
                🧊 BUZKIRAN #{qIndex + 1} / {ICEBREAKER_QUESTIONS.length}
              </span>

              <button
                type="button"
                onClick={handleNextIcebreaker}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  padding: '5px 12px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                ⏭️ Sıradaki Soru
              </button>
            </div>

            <div style={{ color: '#ffffff', fontSize: 17, fontWeight: 900, marginBottom: 16, lineHeight: 1.4 }}>
              {currentQ.q}
            </div>

            {/* Voting Options */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
              {currentQ.opts.map((opt) => {
                const pickedByMe = myAnswer === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleAnswerIcebreaker(opt)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 14,
                      border: pickedByMe ? '2px solid #fb7185' : '1px solid rgba(255,255,255,0.12)',
                      background: pickedByMe ? 'rgba(244,63,94,0.28)' : 'rgba(255,255,255,0.05)',
                      color: '#ffffff',
                      fontSize: 13.5,
                      fontWeight: 800,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: pickedByMe ? '0 0 16px rgba(251,113,133,0.3)' : 'none'
                    }}
                  >
                    {pickedByMe ? '✓ ' : ''}{opt}
                  </button>
                );
              })}
            </div>

            {/* Answers & Match Status */}
            {bothAnswered && (
              <div style={{
                marginTop: 14,
                padding: '10px 14px',
                borderRadius: 12,
                background: isPerfectMatch ? 'rgba(34,197,94,0.18)' : 'rgba(244,63,94,0.14)',
                border: isPerfectMatch ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(244,63,94,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8
              }}>
                <div style={{ fontSize: 12, color: '#e2e8f0' }}>
                  <strong style={{ color: '#fda4af' }}>{partner?.username || 'Partner'}:</strong> {partnerAnswer}
                </div>
                <span style={{
                  color: isPerfectMatch ? '#4ade80' : '#fda4af',
                  fontWeight: 900,
                  fontSize: 12
                }}>
                  {isPerfectMatch ? '💖 %100 Aynı Fikirdesiniz!' : '⚡ Farklı Düşünüyorsunuz Ama Çekim Var!'}
                </span>
              </div>
            )}
          </div>

          {/* Bottom Romantic Action Bar & Optional Video Mode Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            flexWrap: 'wrap',
            margin: '14px 0 4px',
            width: '100%',
            maxWidth: 680
          }}>
            <button
              type="button"
              onClick={() => triggerToastReaction('🥂', 'Kadeh Kaldırıldı!')}
              style={{
                padding: '9px 16px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.07)',
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🥂 Kadeh Kaldır
            </button>

            <button
              type="button"
              onClick={() => triggerToastReaction('💖', 'Kalp Gönderildi!')}
              style={{
                padding: '9px 16px',
                borderRadius: 999,
                border: '1px solid rgba(253,38,125,0.4)',
                background: 'rgba(253,38,125,0.18)',
                color: '#fda4af',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              💖 Kalp Gönder
            </button>

            {/* Toggle Video Mode (Optional Cinema/Clip Experience) */}
            <button
              type="button"
              onClick={() => setShowVideoMode(true)}
              style={{
                padding: '9px 18px',
                borderRadius: 999,
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 6px 18px rgba(99,102,241,0.35)'
              }}
            >
              <span>🎬 Birlikte Video / Film Aç</span>
              <span style={{ fontSize: 14 }}>↗</span>
            </button>
          </div>

          {toastFeedback && (
            <div style={{
              position: 'absolute',
              bottom: 60,
              background: '#0f172a',
              border: '1.5px solid #fd267d',
              color: '#ffffff',
              padding: '8px 18px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 900,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              animation: 'cmDrawerSlide 0.2s ease'
            }}>
              {toastFeedback}
            </div>
          )}
        </div>
      )}

      {/* ── VIDEO PLAYER MODE (STANDARD ROOMS OR WHEN TOGGLED ON IN DATE ROOM) ── */}
      {(!isDateActive || showVideoMode) && (
        <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {/* Back to Romantic Lounge Mode button if in Date room */}
          {isDateActive && (
            <div style={{
              position: 'absolute',
              top: 12,
              left: 14,
              zIndex: 120,
              display: 'flex',
              gap: 8
            }}>
              <button
                type="button"
                onClick={() => setShowVideoMode(false)}
                style={{
                  padding: '7px 15px',
                  borderRadius: 999,
                  border: '1.5px solid #fd267d',
                  background: 'rgba(15, 23, 42, 0.92)',
                  color: '#fda4af',
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                🛋️ Romantik Lounge & Sohbet Moduna Dön
              </button>
            </div>
          )}

          {/* When no media is playing */}
          {!hasMediaActive && (
            <div style={{
              width: 'min(480px, 92%)',
              margin: 'auto',
              padding: '24px 22px',
              borderRadius: 24,
              background: 'linear-gradient(145deg, rgba(17,27,33,.92), rgba(10,15,20,.95))',
              border: '1px solid rgba(251,113,133,.22)',
              boxShadow: '0 24px 60px rgba(0,0,0,.55)',
              textAlign: 'center',
              color: '#e2e8f0',
              zIndex: 30
            }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>
                {myUsersList.length <= 1 ? '💑' : (currentRoomType === 'music' ? '🎵' : '🎬')}
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 6 }}>
                {myUsersList.length <= 1
                  ? 'Sevgilini / Partnerini Odaya Çağır 💕'
                  : 'Yukarıdan Şarkı veya Video Aratın!'}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, marginBottom: 16 }}>
                {myUsersList.length <= 1
                  ? 'Oda hazır! Aşağıdaki butonla oda linkini gönder; tıkladığı an hesap açmadan yanına katılabilir.'
                  : `Odada ${myUsersList.length} kişisiniz! Üstteki arama çubuğundan bir video veya şarkı seçin.`}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={handleWhatsAppInvite}
                  style={{
                    flex: '1 1 180px', padding: '11px 14px', borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg, #25D366, #128C7E)', color: '#fff',
                    fontSize: 12, fontWeight: 900, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    boxShadow: '0 6px 20px rgba(37,211,102,.25)'
                  }}
                >
                  💬 WhatsApp&apos;tan Çağır
                </button>
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  style={{
                    flex: '1 1 160px', padding: '11px 14px', borderRadius: 12,
                    border: copiedInvite ? '1px solid #34d399' : '1px solid rgba(255,255,255,.14)',
                    background: copiedInvite ? 'rgba(16,185,129,.18)' : 'rgba(255,255,255,.06)',
                    color: copiedInvite ? '#34d399' : '#fff',
                    fontSize: 12, fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                >
                  {copiedInvite ? '✅ Link Kopyalandı!' : '📋 Davet Linkini Kopyala'}
                </button>
              </div>
            </div>
          )}

          {/* Active Media Container */}
          {hasMediaActive && (
            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', overflow: 'hidden' }}>
              {playType === 'youtube' && (
                <YouTube
                  key={nativeControls ? 'c1' : 'c0'}
                  videoId={videoId}
                  opts={ytOpts}
                  style={{ width: '100%', height: '100%', maxWidth: '100%', overflow: 'hidden' }}
                  onReady={handleYTReady}
                  onError={handleYouTubeError}
                  onEnd={handleMediaEnd}
                />
              )}
              {mediaType === 'vimeo' && (
                <iframe
                  src={`https://player.vimeo.com/video/${mediaSrc}?autoplay=1&title=0&byline=0&portrait=0`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title="Vimeo Player"
                />
              )}
              {mediaType === 'custom_video' && (
                <video
                  src={mediaSrc}
                  controls={nativeControls}
                  autoPlay
                  style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
                  onEnded={handleMediaEnd}
                />
              )}
            </div>
          )}

          {/* Settings button when video is active */}
          {hasMediaActive && (
            <div ref={settingsRef} style={{ position: 'absolute', right: 12, bottom: 12, zIndex: 120 }}>
              <button
                onClick={() => setSettingsOpen((v) => !v)}
                aria-label="Oynatıcı ayarları"
                style={{
                  width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,.15)',
                  background: 'rgba(0,0,0,.55)', color: '#fff', cursor: 'pointer', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)'
                }}
              >
                ⚙️
              </button>
              {settingsOpen && (
                <div style={{
                  position: 'absolute', right: 0, bottom: 44, minWidth: 170, borderRadius: 12,
                  background: 'rgba(15,23,42,.97)', border: '1px solid rgba(255,255,255,.1)',
                  boxShadow: '0 16px 40px rgba(0,0,0,.6)', padding: 6, display: 'flex', flexDirection: 'column', gap: 2
                }}>
                  <button onClick={() => wrapRef.current?.requestFullscreen?.()} style={{ background: 'transparent', border: 'none', color: '#94a3b8', padding: '8px 10px', textAlign: 'left', cursor: 'pointer' }}>⤢ Fullscreen</button>
                  <button onClick={() => setNativeControls(v => !v)} style={{ background: 'transparent', border: 'none', color: nativeControls ? '#00a884' : '#94a3b8', padding: '8px 10px', textAlign: 'left', cursor: 'pointer' }}>
                    {nativeControls ? '✓ ' : ''}Native Controls
                  </button>
                  <button onClick={() => setRepeat(v => !v)} style={{ background: 'transparent', border: 'none', color: repeat ? '#00a884' : '#94a3b8', padding: '8px 10px', textAlign: 'left', cursor: 'pointer' }}>
                    {repeat ? '✓ ' : ''}Repeat
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating Reactions Emoji Shower */}
      {Array.isArray(reactions) && reactions.map((r) => (
        <div
          key={r.id}
          style={{
            position: 'absolute', bottom: 20, left: `${r.left}%`,
            fontSize: '36px', pointerEvents: 'none', zIndex: 100,
            animation: 'floatUp 2s ease-out forwards'
          }}
        >
          {r.emoji}
        </div>
      ))}
    </div>
  );
}

export default memo(Player);
