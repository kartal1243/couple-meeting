import YouTube from 'react-youtube';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BACKEND_URL } from '../constants';

function extractVideoId(src) {
  if (!src) return null;
  if (src.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(src)) return src;
  const m = src.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : src;
}

function AudioPlayer({ videoId, onEnded, onReady }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!videoId || !audioRef.current) return;
    const audio = audioRef.current;
    setError(null);

    const streamUrl = `${BACKEND_URL}/api/stream/${videoId}`;
    audio.src = streamUrl;
    audio.load();

    const playPromise = audio.play();
    if (playPromise) {
      playPromise.then(() => {
        setIsPlaying(true);
        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: document.title || 'Couple Meeting',
            artist: 'Couple Meeting',
            artwork: [{ src: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, sizes: '480x360', type: 'image/jpeg' }]
          });
          navigator.mediaSession.setActionHandler('play', () => { audio.play(); setIsPlaying(true); });
          navigator.mediaSession.setActionHandler('pause', () => { audio.pause(); setIsPlaying(false); });
          navigator.mediaSession.setActionHandler('stop', () => { audio.pause(); audio.currentTime = 0; setIsPlaying(false); });
        }
        onReady?.();
      }).catch(() => {
        setIsPlaying(false);
      });
    }

    audio.onended = () => { setIsPlaying(false); onEnded?.(); };
    audio.onerror = () => { setError('Ses yuklenemedi'); };

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [videoId]);

  useEffect(() => {
    const handleVis = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden && isPlaying) {
        audio.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  }, [isPlaying]);

  return (
    <>
      <audio ref={audioRef} preload="auto" playsInline />
      {error && (
        <div style={{ position:'absolute', bottom:60, left:'50%', transform:'translateX(-50%)', padding:'8px 16px', borderRadius:10, background:'rgba(239,68,68,.15)', border:'1px solid rgba(239,68,68,.3)', color:'#ef4444', fontSize:12, fontWeight:700, zIndex:50 }}>
          ⚠️ {error}
        </div>
      )}
    </>
  );
}

export default function Player({
  mediaType, mediaSrc, youtubeError, ytPlayerRef, mediaMeta,
  reactions, openYouTubeExternally, handleMediaEnd, handleYouTubeError
}) {
  const videoId = extractVideoId(mediaSrc);

  const ytOpts = {
    height: '100%', width: '100%',
    playerVars: { autoplay: 1, controls: 1, playsinline: 1, rel: 0, modestbranding: 1, enablejsapi: 1 }
  };

  const handleYTReady = useCallback((e) => {
    ytPlayerRef.current = e.target;
  }, [ytPlayerRef]);

  const endedRef = useRef(false);

  useEffect(() => {
    endedRef.current = false;
    if (!videoId || mediaType === 'none') return;
    const interval = setInterval(() => {
      if (mediaType === 'music') return;
      const player = ytPlayerRef.current;
      if (!player || endedRef.current) return;
      try {
        const state = player.getPlayerState?.();
        if (state === 0) {
          endedRef.current = true;
          handleMediaEnd();
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [videoId, mediaType]);

  const showMusicPlayer = mediaType === 'music' && videoId;
  const showVideoPlayer = (mediaType === 'youtube' || mediaType === 'music') && videoId && !showMusicPlayer && !youtubeError;

  return (
    <div className="cm-video-wrap" style={{
      flex: 1, position: 'relative', width: '100%', height: '100%',
      display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0b141a'
    }}>

      {mediaType === 'none' && (
        <div style={{ textAlign: 'center', color: '#8696a0' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎵</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Yukarıdan Medya Aratın veya Kitaplıktan Seçin!</div>
        </div>
      )}

      {showMusicPlayer && (
        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', position: 'relative' }}>
          <img src={mediaMeta?.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} alt=""
            style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15, filter: 'blur(20px)', zIndex: 0 }} />
          <div style={{ position:'relative', zIndex:2, textAlign:'center' }}>
            <img src={mediaMeta?.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} alt=""
              style={{ width:200, height:200, borderRadius:20, objectFit:'cover', boxShadow:'0 20px 60px rgba(0,0,0,.5)' }} />
            <div style={{ marginTop:16, color:'#fff', fontSize:16, fontWeight:800, maxWidth:300, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {mediaMeta?.title || 'Muzik'}
            </div>
            <div style={{ marginTop:4, color:'#94a3b8', fontSize:13 }}>
              {mediaMeta?.artist || 'Bilinmeyen Sanatci'}
            </div>
          </div>
          <AudioPlayer videoId={videoId} onEnded={handleMediaEnd} />
        </div>
      )}

      {showVideoPlayer && (
        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', position: 'relative' }}>
          {mediaType === 'music' && (
            <img src={mediaMeta?.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} alt=""
              style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15, filter: 'blur(20px)', zIndex: 0 }} />
          )}
          <YouTube videoId={videoId} opts={ytOpts}
            style={{ width: '100%', height: '100%', maxWidth: '100%', position: 'relative', zIndex: 1 }}
            onReady={handleYTReady} onError={handleYouTubeError} onEnd={handleMediaEnd} />
        </div>
      )}

      {(mediaType === 'youtube' || mediaType === 'music') && youtubeError && (
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
          }}>▶ YouTube'da Aç</button>
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
