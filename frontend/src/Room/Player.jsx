import YouTube from 'react-youtube';
import { useCallback, useEffect, useRef, useState, memo } from 'react';

function extractVideoId(src) {
  if (!src) return null;
  if (src.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(src)) return src;
  const m = src.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : src;
}

function Player({
  mediaType, mediaSrc, youtubeError, ytPlayerRef, pendingSyncRef, mediaMeta,
  reactions, openYouTubeExternally, handleMediaEnd, handleYouTubeError,
  currentRoomType, currentTheme, roomUsersList, roomName, roomId
}) {
  const playType = mediaType === 'music' ? 'youtube' : mediaType;
  const videoId = extractVideoId(mediaSrc);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nativeControls, setNativeControls] = useState(true);
  const [repeat, setRepeat] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const repeatRef = useRef(false); repeatRef.current = repeat;
  const wrapRef = useRef(null);
  const settingsRef = useRef(null);

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

      {mediaType === 'none' && (
        <div style={{
          width: 'min(480px, 92%)', padding: '24px 22px', borderRadius: 24,
          background: 'linear-gradient(145deg, rgba(17,27,33,.92), rgba(10,15,20,.95))',
          border: '1px solid rgba(251,113,133,.22)',
          boxShadow: '0 24px 60px rgba(0,0,0,.55), 0 0 40px rgba(251,113,133,.08)',
          textAlign: 'center', color: '#e2e8f0'
        }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>
            {userCount <= 1 ? '💑' : (currentRoomType === 'music' ? '🎵' : '🎬')}
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 6 }}>
            {userCount <= 1
              ? 'Sevgilini / Arkadaşını Odaya Çağır 💕'
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
          boxShadow: '0 30px 80px rgba(0,0,0,.55)', textAlign: 'center'
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
