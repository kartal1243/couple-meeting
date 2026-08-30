import YouTube from 'react-youtube';
import { useEffect, useState, useCallback, useRef } from 'react';
import { BACKEND_URL } from '../constants';

function extractVideoId(src) {
  if (!src) return null;
  if (src.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(src)) return src;
  const m = src.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : src;
}

export default function Player({
  mediaType, mediaSrc, youtubeError, customVideoRef, ytPlayerRef, mediaMeta,
  reactions, fallbackUrl, setFallbackUrl, useFallbackSource,
  openYouTubeExternally, setYoutubeError, setMediaType, handleMediaEnd, handleYouTubeError
}) {
  const videoId = extractVideoId(mediaSrc);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicError, setMusicError] = useState(false);

  const ytOpts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 1,
      playsinline: 1,
      rel: 0,
      modestbranding: 1,
      enablejsapi: 1
    }
  };

  const handleYTReady = useCallback((e) => {
    ytPlayerRef.current = e.target;
  }, [ytPlayerRef]);

  // Telefonun kilit ekranında bildirim gösterme ve arka planda çalma
  const setupMediaSession = useCallback(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: mediaMeta?.title || 'Couple Meeting Şarkı',
        artist: mediaMeta?.artist || 'Couple Meeting',
        album: 'Müzik Odası',
        artwork: [
          {
            src: mediaMeta?.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        audioRef.current?.play();
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        audioRef.current?.pause();
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('stop', () => {
        audioRef.current?.pause();
        setIsPlaying(false);
      });
    }
  }, [mediaMeta, videoId]);

  // Kendi sunucumuzun IP'si üzerinden saf ses akışı
  useEffect(() => {
    if (mediaType === 'music' && videoId && audioRef.current) {
      setMusicLoading(true);
      setMusicError(false);
      setIsPlaying(false);

      const audio = audioRef.current;
      audio.src = `${BACKEND_URL}/api/music/stream/${videoId}`;

      audio.oncanplay = () => {
        setMusicLoading(false);
        audio.play().then(() => {
          setIsPlaying(true);
          setupMediaSession();
          if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
        }).catch(() => setIsPlaying(false));
      };

      audio.onerror = () => { setMusicLoading(false); setMusicError(true); };
    }
  }, [mediaType, videoId, setupMediaSession]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    }
  };

  return (
    <div className="cm-video-wrap" style={{
      flex: 1, position: 'relative', width: '100%', height: '100%',
      display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0b141a'
    }}>
      {/* HTML5 Saf Ses Oynatıcı - Kilit Ekranında Çalan Motor */}
      <audio
        ref={audioRef}
        playsInline
        preload="auto"
        onEnded={() => { setIsPlaying(false); handleMediaEnd?.(); }}
      />

      {mediaType === 'none' && (
        <div style={{ textAlign: 'center', color: '#8696a0' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎵</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            Yukarıdan Medya Aratın veya Kitaplıktan Seçin!
          </div>
        </div>
      )}

      {/* VİDEO MODU */}
      {mediaType === 'youtube' && videoId && !youtubeError && (
        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
          <YouTube
            videoId={videoId}
            opts={ytOpts}
            style={{ width: '100%', height: '100%', maxWidth: '100%' }}
            onReady={handleYTReady}
            onError={handleYouTubeError}
            onEnd={handleMediaEnd}
          />
        </div>
      )}

      {/* MÜZİK MODU (Kendi Sunucumuzdan Canlı Akış) */}
      {mediaType === 'music' && videoId && (
        <div style={{ textAlign: 'center', color: '#fff', padding: '20px', zIndex: 2 }}>
          <img
            src={mediaMeta?.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt=""
            style={{
              width: '240px',
              height: '240px',
              borderRadius: '20px',
              objectFit: 'cover',
              boxShadow: isPlaying ? '0 15px 50px rgba(0, 168, 132, 0.4)' : '0 10px 40px rgba(0,0,0,.6)',
              marginBottom: '18px',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              transform: isPlaying ? 'scale(1.03)' : 'scale(1)'
            }}
          />
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '6px' }}>{mediaMeta?.title || 'Şarkı Çalıyor'}</div>
          <div style={{ fontSize: '14px', color: '#8696a0', marginBottom: '16px' }}>{mediaMeta?.artist || 'Couple Meeting Müzik'}</div>

          {musicLoading && <div style={{ fontSize: '13px', color: '#00a884', marginBottom: '12px' }}>⏳ Şarkı sunucudan yükleniyor...</div>}
          {musicError && <div style={{ fontSize: '13px', color: '#ea4335', marginBottom: '12px' }}>❌ Şarkı yüklenemedi. Tekrar deneyin.</div>}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={togglePlayPause}
              style={{
                background: isPlaying ? '#ea4335' : '#00a884',
                color: '#fff',
                border: 'none',
                padding: '12px 32px',
                borderRadius: '14px',
                fontWeight: '800',
                cursor: 'pointer',
                fontSize: '15px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                transition: '0.2s all'
              }}>
              {isPlaying ? '⏸ Durdur' : '▶ Çal'}
            </button>
          </div>
        </div>
      )}

      {/* YOUTUBE HATA EKRANI */}
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
          </div>
        </div>
      )}

      {reactions}
    </div>
  );
}