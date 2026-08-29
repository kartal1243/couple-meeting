import YouTube from 'react-youtube';
import { useEffect, useState, useRef, useCallback } from 'react';
import SpotifyPlayer, { parseSpotifyUrl } from './SpotifyPlayer';
import { playYouTubeAudio, stopAudio, pauseAudio, resumeAudio, seekAudio, getCurrentTime, isAudioPlaying, getCurrentVideoId } from '../utils/youtubeAudio';

function extractVideoId(src) {
  if (!src) return null;
  if (src.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(src)) return src;
  const m = src.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function Player({
  mediaType, mediaSrc, youtubeError, customVideoRef, ytPlayerRef,
  reactions, fallbackUrl, setFallbackUrl, useFallbackSource,
  openYouTubeExternally, setYoutubeError, setMediaType, handleMediaEnd, handleYouTubeError,
  playlist, playerMode, setPlayerMode, spotifyUrl, setSpotifyUrl
}) {
  const videoId = extractVideoId(mediaSrc);
  const currentTitle = playlist?.find(i => i.src === mediaSrc)?.title || 'Şarkı Çalıyor';
  const [audioReady, setAudioReady] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const syncInterval = useRef(null);
  const audioReadyRef = useRef(false);

  const ytOpts = {
    height: '100%', width: '100%',
    playerVars: {
      autoplay: 1, controls: 1, playsinline: 1, mute: 1,
      rel: 0, modestbranding: 1, fs: 0, iv_load_policy: 3,
      origin: window.location.origin, disablekb: 0, enablejsapi: 1
    }
  };

  // YouTube ses çıkarma
  useEffect(() => {
    if (playerMode !== 'youtube' || mediaType !== 'youtube' || !videoId) return;
    setAudioReady(false);
    setAudioFailed(false);
    setIsPlaying(true);

    let cancelled = false;

    const startAudio = async () => {
      try {
        const audio = await playYouTubeAudio(videoId, currentTitle, {
          onPlay: () => { if (!cancelled) { setIsPlaying(true); audioReadyRef.current = true; setAudioReady(true); } },
          onPause: () => { if (!cancelled) setIsPlaying(false); },
          onEnd: () => { if (!cancelled) handleMediaEnd?.(); },
          onTimeUpdate: (t) => { if (!cancelled) { setCurrentTime(t.currentTime || 0); setDuration(t.duration || 0); } },
          onError: () => {
            if (!cancelled) {
              setAudioFailed(true);
              setAudioReady(false);
              audioReadyRef.current = false;
              try {
                if (ytPlayerRef.current?.unMute) { ytPlayerRef.current.unMute(); }
              } catch {}
            }
          }
        });
        if (cancelled && audio) { try { audio.pause(); } catch {} }
      } catch (e) {
        if (!cancelled) { setAudioFailed(true); setAudioReady(false); }
      }
    };

    startAudio();
    return () => { cancelled = true; stopAudio(); };
  }, [videoId, mediaType, playerMode]);

  // YouTube senkronizasyon
  useEffect(() => {
    if (!audioReady || !ytPlayerRef.current || playerMode !== 'youtube') return;
    syncInterval.current = setInterval(() => {
      try {
        const iframeTime = ytPlayerRef.current?.getCurrentTime?.() || 0;
        const audioTime = getCurrentTime();
        if (audioReadyRef.current && Math.abs(iframeTime - audioTime) > 3) {
          seekAudio(iframeTime);
        }
      } catch {}
    }, 3000);
    return () => { if (syncInterval.current) clearInterval(syncInterval.current); };
  }, [audioReady, playerMode]);

  // MediaSession API
  useEffect(() => {
    if (playerMode !== 'youtube' || !videoId || mediaType !== 'youtube') return;
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTitle, artist: 'Couple Meeting', album: 'Birlikte Dinleme Odası',
      artwork: [{ src: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, sizes: '512x512', type: 'image/jpeg' }]
    });

    const playHandler = () => { if (audioReadyRef.current) resumeAudio(); else ytPlayerRef.current?.playVideo?.(); setIsPlaying(true); };
    const pauseHandler = () => { if (audioReadyRef.current) pauseAudio(); else ytPlayerRef.current?.pauseVideo?.(); setIsPlaying(false); };
    const seekHandler = (details) => { if (details.seekTime != null) { if (audioReadyRef.current) seekAudio(details.seekTime); ytPlayerRef.current?.seekTo?.(details.seekTime, true); } };
    const nextHandler = () => handleMediaEnd?.();

    try {
      navigator.mediaSession.setActionHandler('play', playHandler);
      navigator.mediaSession.setActionHandler('pause', pauseHandler);
      navigator.mediaSession.setActionHandler('seekto', seekHandler);
      navigator.mediaSession.setActionHandler('nexttrack', nextHandler);
    } catch {}

    return () => {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('seekto', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
      } catch {}
    };
  }, [videoId, currentTitle, mediaType, playerMode]);

  const handleYTReady = useCallback((e) => { ytPlayerRef.current = e.target; }, []);
  const handleYtStateChange = useCallback((e) => {
    if (e.data === 1) { setIsPlaying(true); if (audioReadyRef.current && !isAudioPlaying()) resumeAudio(); }
    else if (e.data === 2) { setIsPlaying(false); if (audioReadyRef.current && isAudioPlaying()) pauseAudio(); }
  }, []);

  return (
    <div className="cm-video-wrap" style={{
      flex: 1, position: 'relative', width: '100%', height: '100%',
      display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0b141a'
    }}>

      {/* MOD SEÇİCİ - Her zaman görünür */}
      <div style={{
        position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 4, zIndex: 20,
        background: 'rgba(0,0,0,.6)', borderRadius: 10, padding: 3, backdropFilter: 'blur(10px)'
      }}>
        <button onClick={() => setPlayerMode('youtube')} style={{
          padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
          fontSize: 11, fontWeight: 800, transition: 'all 0.2s',
          background: playerMode === 'youtube' ? 'linear-gradient(135deg, #ff0033, #cc0000)' : 'transparent',
          color: playerMode === 'youtube' ? '#fff' : '#888'
        }}>🎬 YouTube</button>
        <button onClick={() => setPlayerMode('spotify')} style={{
          padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
          fontSize: 11, fontWeight: 800, transition: 'all 0.2s',
          background: playerMode === 'spotify' ? 'linear-gradient(135deg, #1DB954, #1ed760)' : 'transparent',
          color: playerMode === 'spotify' ? '#fff' : '#888'
        }}>🎵 Spotify</button>
      </div>

      {/* SPOTIFY MODU */}
      {playerMode === 'spotify' && (
        <SpotifyPlayer
          spotifyUrl={spotifyUrl}
          onClose={() => { setSpotifyUrl(''); setPlayerMode('youtube'); }}
        />
      )}

      {/* YOUTUBE MODU */}
      {playerMode === 'youtube' && (
        <>
          {mediaType === 'none' && (
            <div style={{ textAlign: 'center', color: '#8696a0', marginTop: 40 }}>
              <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎵</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                Yukarıdan Medya Aratın veya Kitaplıktan Seçin!
              </div>
            </div>
          )}

          {mediaType === 'youtube' && videoId && !youtubeError && (
            <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
              <YouTube
                videoId={videoId}
                opts={ytOpts}
                style={{ width: '100%', height: '100%', maxWidth: '100%' }}
                onReady={handleYTReady}
                onStateChange={handleYtStateChange}
                onError={handleYouTubeError}
                onEnd={handleMediaEnd}
              />

              {/* Ses durumu göstergesi */}
              <div style={{
                position: 'absolute', top: 8, right: 8, padding: '4px 10px',
                borderRadius: 8, fontSize: 10, fontWeight: 800, zIndex: 5,
                background: audioReady ? 'rgba(0,168,132,.85)' : audioFailed ? 'rgba(255,59,48,.7)' : 'rgba(255,204,0,.7)',
                color: '#fff', backdropFilter: 'blur(8px)'
              }}>
                {audioReady ? '🎧 ARKA PLAN AKTİF' : audioFailed ? '⚠️ SES ÇIKARILAMADI' : '⏳ SES HAZIRLANIYOR...'}
              </div>

              {audioReady && (
                <div style={{
                  position: 'absolute', bottom: 8, left: 8, padding: '4px 10px',
                  borderRadius: 8, fontSize: 10, fontWeight: 700, zIndex: 5,
                  background: 'rgba(0,0,0,.6)', color: '#53e6bc', backdropFilter: 'blur(8px)'
                }}>
                  🔗 {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              )}
            </div>
          )}

          {mediaType === 'youtube' && youtubeError && (
            <div style={{
              width: 'min(760px, 92%)', padding: '28px', borderRadius: '24px',
              background: 'linear-gradient(145deg,#151b23,#0a0e14)',
              border: '1px solid rgba(255,255,255,.08)',
              boxShadow: '0 30px 80px rgba(0,0,0,.55)', textAlign: 'center'
            }}>
              <div style={{ fontSize: '46px', marginBottom: '12px' }}>⚠️</div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: '20px', marginBottom: '8px' }}>
                Bu video oynatılamıyor
              </div>
              <div style={{ color: '#9aa7b3', fontSize: '13px', lineHeight: 1.6, maxWidth: '620px', margin: '0 auto 18px' }}>
                {youtubeError.message}
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '18px' }}>
                <button onClick={openYouTubeExternally} style={{
                  background: 'linear-gradient(135deg, #ff0033 0%, #cc0000 100%)',
                  color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer'
                }}>▶ YouTube'da Aç</button>
                <button onClick={() => { setYoutubeError(null); setMediaType('none'); setTimeout(() => setMediaType('youtube'), 50); }}
                  style={{ background: '#25313b', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>🔄 Tekrar Dene</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', maxWidth: '620px', margin: '0 auto' }}>
                <input value={fallbackUrl} onChange={(e) => setFallbackUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') useFallbackSource(); }}
                  placeholder="Alternatif MP4 / WebM / iframe bağlantısı..."
                  style={{ background: '#111b21', border: '1px solid #222d34', color: '#e9edef', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                />
                <button onClick={useFallbackSource} style={{ background: '#25d366', color: '#000', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' }}>Oynat</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tepkiler */}
      {reactions}
    </div>
  );
}
