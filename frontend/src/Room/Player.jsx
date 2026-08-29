import YouTube from 'react-youtube';
import { useEffect, useState, useRef, useCallback } from 'react';
import { playYouTubeAudio, stopAudio, pauseAudio, resumeAudio, seekAudio, getCurrentTime, isAudioPlaying, getCurrentVideoId } from '../utils/youtubeAudio';

function extractVideoId(src) {
  if (!src) return null;
  if (src.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(src)) return src;
  const m = src.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function Player({
  mediaType, mediaSrc, youtubeError, customVideoRef, ytPlayerRef,
  reactions, fallbackUrl, setFallbackUrl, useFallbackSource,
  openYouTubeExternally, setYoutubeError, setMediaType, handleMediaEnd, handleYouTubeError,
  playlist
}) {
  const videoId = extractVideoId(mediaSrc);
  const currentTitle = playlist?.find(i => i.src === mediaSrc)?.title || 'Şarkı Çalıyor';
  const [audioReady, setAudioReady] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showVideo, setShowVideo] = useState(true);
  const syncInterval = useRef(null);
  const audioReadyRef = useRef(false);

  // YouTube iframe muted = true (sesi HTML5 Audio'den gelecek)
  const ytOpts = {
    height: '100%', width: '100%',
    playerVars: {
      autoplay: 1, controls: 1, playsinline: 1, mute: 1,
      rel: 0, modestbranding: 1, fs: 0, iv_load_policy: 3,
      origin: window.location.origin, disablekb: 0, enablejsapi: 1
    }
  };

  // Ses çıkarma ve HTML5 Audio başlat
  useEffect(() => {
    if (mediaType !== 'youtube' || !videoId) return;
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
              // Ses çıkarma başarısızsa iframe ile devam et (sesli)
              try {
                if (ytPlayerRef.current && ytPlayerRef.current.unMute) {
                  ytPlayerRef.current.unMute();
                  setIsMuted(false);
                }
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

    return () => {
      cancelled = true;
      stopAudio();
    };
  }, [videoId, mediaType]);

  // YouTube iframe ile senkronizasyon
  useEffect(() => {
    if (!audioReady || !ytPlayerRef.current) return;

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
  }, [audioReady]);

  // MediaSession API - kilit ekranı kontrolü
  useEffect(() => {
    if (!videoId || mediaType !== 'youtube') return;
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTitle, artist: 'Couple Meeting', album: 'Birlikte Dinleme Odası',
      artwork: [{ src: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, sizes: '512x512', type: 'image/jpeg' }]
    });

    const playHandler = () => {
      if (audioReadyRef.current) { resumeAudio(); }
      else { ytPlayerRef.current?.playVideo?.(); }
      setIsPlaying(true);
    };
    const pauseHandler = () => {
      if (audioReadyRef.current) { pauseAudio(); }
      else { ytPlayerRef.current?.pauseVideo?.(); }
      setIsPlaying(false);
    };
    const seekHandler = (details) => {
      if (details.seekTime != null) {
        if (audioReadyRef.current) seekAudio(details.seekTime);
        ytPlayerRef.current?.seekTo?.(details.seekTime, true);
      }
    };
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
  }, [videoId, currentTitle, mediaType]);

  // YouTube iframe play/pause senkronu
  const handleYTReady = useCallback((e) => {
    ytPlayerRef.current = e.target;
  }, []);

  const handleYtStateChange = useCallback((e) => {
    if (e.data === 1) { // playing
      setIsPlaying(true);
      if (audioReadyRef.current && !isAudioPlaying()) { resumeAudio(); }
    } else if (e.data === 2) { // paused
      setIsPlaying(false);
      if (audioReadyRef.current && isAudioPlaying()) { pauseAudio(); }
    }
  }, []);

  return (
    <div
      className="cm-video-wrap"
      style={{
        flex: 1, position: 'relative', width: '100%', height: '100%',
        display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0b141a'
      }}
    >
      {/* Hiçbir şey yoksa */}
      {mediaType === 'none' && (
        <div style={{ textAlign: 'center', color: '#8696a0' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎵</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            Yukarıdan Medya Aratın veya Kitaplıktan Seçin!
          </div>
        </div>
      )}

      {/* YouTube video + ses çıkarma */}
      {mediaType === 'youtube' && videoId && !youtubeError && (
        <>
          {/* YouTube iframe - video gösterir, sesi sessiz */}
          {showVideo && (
            <div style={{
              width: '100%', height: '100%', position: 'relative',
              display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000'
            }}>
              <YouTube
                videoId={videoId}
                opts={ytOpts}
                style={{ width: '100%', height: '100%', maxWidth: '100%' }}
                onReady={handleYTReady}
                onStateChange={handleYtStateChange}
                onError={handleYouTubeError}
                onEnd={handleMediaEnd}
              />

              {/* Ses çıkarma durumu göstergesi */}
              <div style={{
                position: 'absolute', top: 8, right: 8, padding: '4px 10px',
                borderRadius: 8, fontSize: 10, fontWeight: 800, zIndex: 5,
                background: audioReady ? 'rgba(0,168,132,.85)' : audioFailed ? 'rgba(255,59,48,.7)' : 'rgba(255,204,0,.7)',
                color: '#fff', backdropFilter: 'blur(8px)'
              }}>
                {audioReady ? '🎧 ARKA PLAN AKTİF' : audioFailed ? '⚠️ İFRAME ÇALIYOR' : '⏳ SES HAZIRLANIYOR...'}
              </div>

              {/* Senkron göstergesi */}
              {audioReady && (
                <div style={{
                  position: 'absolute', bottom: 8, left: 8, padding: '4px 10px',
                  borderRadius: 8, fontSize: 10, fontWeight: 700, zIndex: 5,
                  background: 'rgba(0,0,0,.6)', color: '#53e6bc', backdropFilter: 'blur(8px)'
                }}>
                  🔗 Senkronizado • Süre: {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              )}
            </div>
          )}

          {/* Ses çıkarma durumuna göre görsel */}
          {!showVideo && (
            <div style={{
              width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
              justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(180deg, #0a1628, #050c14)', padding: 24
            }}>
              <div style={{
                width: 180, height: 180, borderRadius: 24, overflow: 'hidden',
                boxShadow: '0 30px 80px rgba(0,168,132,.25)', marginBottom: 20,
                animation: 'cmPulseGlow 3s ease-in-out infinite', position: 'relative'
              }}>
                <img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} alt={currentTitle}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,168,132,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🎵</div>
                </div>
              </div>
              <div style={{ color: '#fff', fontSize: 16, fontWeight: 900, textAlign: 'center', maxWidth: 400 }}>{currentTitle}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, height: 40 }}>
                {[12,20,28,16,24,14,22,18,26,10,20,16].map((h, i) => (
                  <div key={i} style={{
                    width: 3, height: h, borderRadius: 99,
                    background: 'linear-gradient(to top, #00a884, #53e6bc)',
                    animation: `cmWaveBar 0.7s ease-in-out infinite ${i * 0.06}s`, transformOrigin: 'bottom'
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => setShowVideo(true)} style={{
                  background: 'linear-gradient(135deg, #00a884, #008f6f)', color: '#fff', border: 'none',
                  padding: '8px 16px', borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: 'pointer'
                }}>📹 Videoyu Göster</button>
              </div>
              <style>{`@keyframes cmPulseGlow { 0%,100%{transform:scale(1);box-shadow:0 30px 80px rgba(0,168,132,.25)} 50%{transform:scale(1.03);box-shadow:0 30px 80px rgba(0,168,132,.4)} }`}</style>
            </div>
          )}
        </>
      )}

      {/* Hata */}
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

      {/* Tepkiler */}
      {reactions}
    </div>
  );
}

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
