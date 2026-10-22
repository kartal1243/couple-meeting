import YouTube from 'react-youtube';
import { useCallback, useEffect, useRef, useState, memo } from 'react';

const ICEBREAKER_QUESTIONS = [
  {
    q: "Gece 02:00'de arabayla sahile insek fonda hangi şarkı çalmalı?",
    opts: ['🎸 Duman / Rock', '🎹 Slow / Akustik']
  },
  {
    q: 'İlk buluşmada hesap nasıl ödenmeli?',
    opts: ['💳 Alman Usulü', '🥂 Davet Eden Öder']
  },
  {
    q: 'Yağmurlu bir pazar günü ideal planın ne?',
    opts: ['🍿 Evde Battaniye & Film', '☕ Sıcak Bir Kafede Sohbet']
  },
  {
    q: 'İlişkide en önemli şey sence hangisi?',
    opts: ['🤝 Koşulsuz Güven', '🔥 Tutku & Eğlence']
  },
  {
    q: 'Gece yarısı acıktık! Ne söylüyoruz?',
    opts: ['🍔 Hamburger & Patates', '🌮 Kokoreç / Sokak Lezzeti']
  },
  {
    q: 'Hayalindeki tatil rotası hangisi?',
    opts: ['🏕️ Karavan & Doğa Kampı', '🏖️ Deniz & Yazlık Kasaba']
  },
  {
    q: 'Birlikte hangi tür film izlemeyi tercih edersin?',
    opts: ['👻 Korku / Gerilim', '💕 Romantik Komedi / Bilim Kurgu']
  },
  {
    q: 'Sabah insanı mısın yoksa gece kuşu mu?',
    opts: ['🌙 Tam Bir Gece Kuşu', '☀️ Erken Kalkan Sabah İnsanı']
  },
  {
    q: 'Tartıştığımızda nasıl barışmayı tercih edersin?',
    opts: ['🫂 Hemen Sarılıp Konuşarak', '⏳ Biraz Sakinleşip Sonra Konuşarak']
  },
  {
    q: 'Kahve mi yoksa çay insanı mısın?',
    opts: ['☕ Kesinlikle Kahve', '🫖 Demli Çay Vazgeçilmezim']
  },
  {
    q: 'Sürpriz hediyeler mi yoksa birlikte kaliteli zaman mı?',
    opts: ['⏳ Birlikte Kaliteli Zaman', '🎁 Düşünceli Sürpriz Hediyeler']
  },
  {
    q: 'İlk görüşte aşka inanır mısın?',
    opts: ['💘 Evet, Enerji Anında Belli Olur', '🌱 Hayır, Tanıdıkça Sevgi Büyür']
  }
];

const AMBIENCE_META = {
  car_rain: {
    badge: '🚗🌧️ Gece Sürüşü & Yağmur Sesi',
    vignette: 'radial-gradient(circle at 50% 40%, transparent 45%, rgba(14,116,144,.32) 100%)',
    border: 'rgba(56,189,248,.35)',
    freq: 580
  },
  cinema: {
    badge: '🍿 Loş Sinema Salonu',
    vignette: 'radial-gradient(circle at 50% 45%, transparent 40%, rgba(159,18,57,.38) 100%)',
    border: 'rgba(244,63,94,.35)',
    freq: 280
  },
  cafe: {
    badge: '☕ Yağmurlu Kafe & Lo-Fi',
    vignette: 'radial-gradient(circle at 50% 45%, transparent 45%, rgba(180,83,9,.32) 100%)',
    border: 'rgba(245,158,11,.35)',
    freq: 650
  },
  campfire: {
    badge: '🔥 Sahilde Kamp Ateşi',
    vignette: 'radial-gradient(circle at 50% 60%, rgba(249,115,22,.14) 10%, rgba(124,45,18,.38) 100%)',
    border: 'rgba(251,146,60,.4)',
    freq: 460
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
  const [ambienceSoundOn, setAmbienceSoundOn] = useState(false);
  const [icebreakerCollapsed, setIcebreakerCollapsed] = useState(false);

  const repeatRef = useRef(false); repeatRef.current = repeat;
  const wrapRef = useRef(null);
  const settingsRef = useRef(null);
  const audioCtxRef = useRef(null);

  const activeAmbience = roomDateState?.dateAmbience || roomDateState?.dateConcept || 'none';
  const hasAmbience = activeAmbience && activeAmbience !== 'none' && AMBIENCE_META[activeAmbience];
  const isDateActive = Boolean(roomDateState?.isDateRoom || hasAmbience);

  // Web Audio API Synthesized Ambient Sound Generator (Pink/Brown noise + Lowpass filter)
  const stopAmbienceAudio = useCallback(() => {
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!ambienceSoundOn || !hasAmbience) {
      stopAmbienceAudio();
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 0.25;
        if (activeAmbience === 'campfire' && Math.random() < 0.0015) {
          output[i] += (Math.random() * 0.55 - 0.27);
        }
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = AMBIENCE_META[activeAmbience]?.freq || 600;

      const gain = ctx.createGain();
      gain.gain.value = 0.16;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(0);
    } catch {}

    return () => {
      stopAmbienceAudio();
    };
  }, [ambienceSoundOn, hasAmbience, activeAmbience, stopAmbienceAudio]);

  const activeRoomId = roomId || mediaMeta?.roomId || '';
  const inviteUrl = typeof window !== 'undefined' && activeRoomId
    ? `${window.location.origin}/room/${encodeURIComponent(activeRoomId)}`
    : (typeof window !== 'undefined' ? window.location.href : '');
  const userCount = Array.isArray(roomUsersList) && roomUsersList.length > 0 ? roomUsersList.length : 1;

  const handleCopyInvite = () => {
    if (!inviteUrl) return;
    navigator.clipboard?.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const handleWhatsAppInvite = () => {
    const label = roomName || activeRoomId || 'Couple Meeting';
    const text = `💕 "${label}" odasını açtım, seni bekliyorum! Tıkla ve yanıma gel, birlikte izleyip dinleyelim: ${inviteUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // Icebreaker handlers
  const qIndex = Math.abs(Number(roomDateState?.icebreakerIndex || 0)) % ICEBREAKER_QUESTIONS.length;
  const currentQ = ICEBREAKER_QUESTIONS[qIndex];
  const answersMap = roomDateState?.icebreakerAnswers || {};
  const answerEntries = Object.entries(answersMap);
  const myName = username || 'Ben';
  const myAnswer = answersMap[myName];
  const bothAnswered = answerEntries.length >= 2;
  const isPerfectMatch = bothAnswered && new Set(answerEntries.map(([, val]) => val)).size === 1;

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

  const ytOpts = {
    height: '100%', width: '100%',
    host: 'https://www.youtube-nocookie.com',
    playerVars: { autoplay: 1, controls: nativeControls ? 1 : 0, playsinline: 1, rel: 0, modestbranding: 1, enablejsapi: 1 }
  };

  useEffect(() => {
    if (!settingsOpen) return;
    const onDoc = (e) => { if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [settingsOpen]);

  const handleYTReady = useCallback((e) => {
    ytPlayerRef.current = e.target;
    if (pendingSyncRef.current) {
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

  const endedRef = useRef(false);

  useEffect(() => {
    endedRef.current = false;
    if (!videoId || mediaType === 'none') return;
    const interval = setInterval(() => {
      const player = ytPlayerRef.current;
      if (!player || endedRef.current) return;
      try {
        const state = player.getPlayerState?.();
        if (state === 0) {
          endedRef.current = true;
          if (repeatRef.current) {
            try { player.seekTo(0, true); player.playVideo(); } catch {}
            setTimeout(() => { endedRef.current = false; }, 1000);
          } else {
            handleMediaEnd();
          }
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [videoId, mediaType]);

  const showPlayer = mediaType !== 'none' && mediaSrc && !youtubeError;

  const menuBtn = {
    background: 'transparent', border: 'none', color: '#94a3b8', textAlign: 'left',
    padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700
  };

  return (
    <div className="cm-video-wrap" ref={wrapRef} style={{
      flex: 1, position: 'relative', width: '100%', minHeight: 0,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      background: `radial-gradient(circle at center, ${currentTheme?.primary || '#00a884'}1f 0%, #0b141a 75%)`, overflow: 'hidden'
    }}>

      {/* Date Ambience Atmospheric Frame & Web Audio API Sound Toggle */}
      {hasAmbience && (
        <>
          <div
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 25,
              background: AMBIENCE_META[activeAmbience].vignette,
              boxShadow: `inset 0 0 60px ${AMBIENCE_META[activeAmbience].border}`
            }}
          />
          <div style={{
            position: 'absolute', top: 10, left: 12, zIndex: 115,
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap'
          }}>
            <span style={{
              padding: '5px 11px', borderRadius: 999,
              background: 'rgba(15,23,42,.82)', backdropFilter: 'blur(10px)',
              border: `1px solid ${AMBIENCE_META[activeAmbience].border}`,
              color: '#fff', fontSize: 11, fontWeight: 900
            }}>
              {AMBIENCE_META[activeAmbience].badge}
            </span>
            <button
              type="button"
              onClick={() => setAmbienceSoundOn((v) => !v)}
              style={{
                padding: '5px 11px', borderRadius: 999, cursor: 'pointer',
                background: ambienceSoundOn ? 'rgba(34,197,94,.22)' : 'rgba(15,23,42,.82)',
                border: ambienceSoundOn ? '1px solid #4ade80' : '1px solid rgba(255,255,255,.16)',
                color: ambienceSoundOn ? '#4ade80' : '#cbd5e1',
                fontSize: 11, fontWeight: 800, backdropFilter: 'blur(10px)'
              }}
            >
              {ambienceSoundOn ? '🔊 Ambience Sesi Açık' : '🔇 Ambience Sesini Aç'}
            </button>
          </div>
        </>
      )}

      {mediaType === 'none' && (
        <div style={{
          width: 'min(480px, 92%)', padding: '24px 22px', borderRadius: 24,
          background: 'linear-gradient(145deg, rgba(17,27,33,.92), rgba(10,15,20,.95))',
          border: '1px solid rgba(251,113,133,.22)',
          boxShadow: '0 24px 60px rgba(0,0,0,.55), 0 0 40px rgba(251,113,133,.08)',
          textAlign: 'center', color: '#e2e8f0', zIndex: 30
        }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>
            {userCount <= 1 ? '💑' : (currentRoomType === 'music' ? '🎵' : '🎬')}
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 6 }}>
            {userCount <= 1
              ? 'Sevgilini / Partnerini Odaya Çağır 💕'
              : (currentRoomType === 'music' ? 'Yukarıdan Şarkı Arayın ve Seçin!' : 'Yukarıdan Şarkı veya Video Aratın!')}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, marginBottom: 16 }}>
            {userCount <= 1
              ? 'Oda hazır! Aşağıdaki butonla oda linkini gönder; tıkladığı an hesap açmadan yanına katılabilir.'
              : `Odada ${userCount} kişisiniz! Üstteki arama çubuğundan bir film, video veya şarkı seçip aynı anda başlatın.`}
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
              💬 WhatsApp'tan Çağır
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

      {showPlayer && (
        <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', overflow: 'hidden' }}>
          {playType === 'youtube' && (
            <YouTube key={nativeControls ? 'c1' : 'c0'} videoId={videoId} opts={ytOpts}
              style={{ width: '100%', height: '100%', maxWidth: '100%', overflow: 'hidden' }}
              onReady={handleYTReady} onError={handleYouTubeError} onEnd={handleMediaEnd} />
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
          {mediaType === 'iframe' && /^https:\/\//i.test(mediaSrc || '') && (
            <iframe
              src={mediaSrc}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen"
              allowFullScreen
              sandbox="allow-scripts allow-presentation"
              referrerPolicy="no-referrer"
              title="Embedded Content"
            />
          )}
        </div>
      )}

      {mediaType !== 'none' && youtubeError && (
        <div style={{
          width: 'min(760px, 92%)', padding: '28px', borderRadius: '24px',
          background: 'linear-gradient(145deg,#151b23,#0a0e14)',
          border: '1px solid rgba(255,255,255,.08)',
          boxShadow: '0 30px 80px rgba(0,0,0,.55)', textAlign: 'center', zIndex: 30
        }}>
          <div style={{ fontSize: '46px', marginBottom: '12px' }}>⚠️</div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: '20px', marginBottom: '8px' }}>Bu video oynatılamıyor</div>
          <div style={{ color: '#9aa7b3', fontSize: '13px', lineHeight: 1.6, maxWidth: '620px', margin: '0 auto 18px' }}>{youtubeError.message}</div>
          <button onClick={openYouTubeExternally} style={{
            background: 'linear-gradient(135deg, #ff0033 0%, #cc0000 100%)',
            color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer'
          }}>▶ {mediaType === 'youtube' ? "YouTube'da Aç" : mediaType === 'vimeo' ? "Vimeo'da Aç" : "Dışarıda Aç"}</button>
        </div>
      )}

      {/* 🧊 Buzkıran & Çift Sorusu Floating Bar */}
      {isDateActive && (
        <div style={{
          position: 'absolute', left: 12, right: 56, bottom: 10, zIndex: 118,
          maxWidth: 680, margin: '0 auto'
        }}>
          {icebreakerCollapsed ? (
            <button
              type="button"
              onClick={() => setIcebreakerCollapsed(false)}
              style={{
                padding: '7px 14px', borderRadius: 999, cursor: 'pointer',
                background: 'rgba(15,23,42,.9)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(251,113,133,.4)',
                color: '#fda4af', fontSize: 11.5, fontWeight: 900,
                boxShadow: '0 8px 24px rgba(0,0,0,.45)'
              }}
            >
              🧊 Buzkıran & Çift Sorusunu Aç ({qIndex + 1}/{ICEBREAKER_QUESTIONS.length})
            </button>
          ) : (
            <div style={{
              padding: '10px 14px', borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(15,23,42,.92), rgba(30,27,75,.92))',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(251,113,133,.35)',
              boxShadow: '0 12px 32px rgba(0,0,0,.55)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 999,
                    background: 'rgba(244,63,94,.2)', color: '#fda4af',
                    fontSize: 10, fontWeight: 900, flexShrink: 0
                  }}>
                    🧊 BUZKIRAN #{qIndex + 1}
                  </span>
                  <span style={{ color: '#fff', fontSize: 12.5, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentQ.q}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={handleNextIcebreaker}
                    style={{
                      padding: '4px 9px', borderRadius: 8, border: '1px solid rgba(255,255,255,.14)',
                      background: 'rgba(255,255,255,.06)', color: '#cbd5e1',
                      fontSize: 10.5, fontWeight: 800, cursor: 'pointer'
                    }}
                  >
                    ⏭️ Yeni Soru
                  </button>
                  <button
                    type="button"
                    onClick={() => setIcebreakerCollapsed(true)}
                    style={{
                      background: 'transparent', border: 'none', color: '#94a3b8',
                      fontSize: 12, fontWeight: 900, cursor: 'pointer', padding: '2px 4px'
                    }}
                    title="Gizle"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {currentQ.opts.map((opt) => {
                  const pickedByMe = myAnswer === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleAnswerIcebreaker(opt)}
                      style={{
                        flex: '1 1 180px', padding: '7px 11px', borderRadius: 10, cursor: 'pointer',
                        border: pickedByMe ? '1.5px solid #fb7185' : '1px solid rgba(255,255,255,.12)',
                        background: pickedByMe ? 'rgba(244,63,94,.22)' : 'rgba(255,255,255,.05)',
                        color: '#fff', fontSize: 11.5, fontWeight: 800, textAlign: 'left'
                      }}
                    >
                      {pickedByMe ? '✓ ' : ''}{opt}
                    </button>
                  );
                })}
              </div>

              {answerEntries.length > 0 && (
                <div style={{
                  marginTop: 7, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6
                }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11, color: '#cbd5e1' }}>
                    {answerEntries.map(([u, ans]) => (
                      <span key={u}>
                        <strong style={{ color: '#fda4af' }}>{u}:</strong> {ans}
                      </span>
                    ))}
                  </div>
                  {isPerfectMatch && (
                    <span style={{
                      padding: '2px 9px', borderRadius: 999,
                      background: 'rgba(34,197,94,.2)', border: '1px solid rgba(74,222,128,.4)',
                      color: '#4ade80', fontSize: 10.5, fontWeight: 900
                    }}>
                      💖 %100 Uyum! İkiniz de aynı cevabı seçtiniz!
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showPlayer && (
        <div ref={settingsRef} style={{ position: 'absolute', right: 12, bottom: 12, zIndex: 120 }}>
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            aria-label="Oynatıcı ayarları"
            style={{
              width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,.15)',
              background: 'rgba(0,0,0,.55)', color: '#fff', cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)'
            }}
          >⚙️</button>
          {settingsOpen && (
            <div style={{
              position: 'absolute', right: 0, bottom: 44, minWidth: 170, borderRadius: 12,
              background: 'rgba(15,23,42,.97)', border: '1px solid rgba(255,255,255,.1)',
              boxShadow: '0 16px 40px rgba(0,0,0,.6)', padding: 6, display: 'flex', flexDirection: 'column', gap: 2
            }}>
              <button onClick={() => wrapRef.current?.requestFullscreen?.()} style={menuBtn}>⤢ Fullscreen</button>
              <button onClick={() => setNativeControls(v => !v)} style={{ ...menuBtn, color: nativeControls ? '#00a884' : '#94a3b8' }}>
                {nativeControls ? '✓ ' : ''}Native Controls
              </button>
              <button onClick={() => setRepeat(v => !v)} style={{ ...menuBtn, color: repeat ? '#00a884' : '#94a3b8' }}>
                {repeat ? '✓ ' : ''}Repeat
              </button>
              <button onClick={() => {
                setLiveMode(v => {
                  const next = !v;
                  if (next) { try { const p = ytPlayerRef.current; const d = p?.getDuration?.(); if (d) p.seekTo(Math.max(0, d - 2), true); } catch {} }
                  return next;
                });
              }} style={{ ...menuBtn, color: liveMode ? '#ef4444' : '#94a3b8' }}>
                {liveMode ? '🔴 ' : ''}Live Mode
              </button>
            </div>
          )}
        </div>
      )}

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
