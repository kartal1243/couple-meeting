import YouTube from 'react-youtube';
import { useCallback, useRef, useEffect, useState } from 'react';
import { BACKEND_URL } from '../constants';

function extractVideoId(src) {
  if (!src) return null;
  if (src.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(src)) return src;
  const m = src.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : src;
}

export default function Player({
  mediaType, mediaSrc, youtubeError, ytPlayerRef, mediaMeta,
  reactions, openYouTubeExternally, handleMediaEnd, handleYouTubeError
}) {
  const videoId = extractVideoId(mediaSrc);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const ytOpts = {
    height: '100%', width: '100%',
    playerVars: { autoplay: 1, controls: 1, playsinline: 1, rel: 0, modestbranding: 1, enablejsapi: 1 }
  };

  const handleYTReady = useCallback((e) => {
    ytPlayerRef.current = e.target;
  }, [ytPlayerRef]);

  // Music mode: YouTube → MP3 conversion via yt-audio-api
  useEffect(() => {
    if (mediaType === 'music' && videoId && audioRef.current) {
      setLoading(true);
      setError(false);
      setIsPlaying(false);
      const audio = audioRef.current;

      fetch(`${BACKEND_URL}/api/yt-audio/token?url=https://www.youtube.com/watch?v=${videoId}`)
        .then(r => { if (!r.ok) throw new Error('fail'); return r.json(); })
        .then(data => {
          if (!data.downloadUrl) throw new Error('no url');
          audio.src = data.downloadUrl;
          audio.load();
          audio.oncanplay = () => {
            setLoading(false);
            audio.play().then(() => {
              setIsPlaying(true);
              if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                  title: mediaMeta?.title || 'Müzik', artist: mediaMeta?.artist || 'Couple Meeting',
                  artwork: [{ src: mediaMeta?.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, sizes: '512x512', type: 'image/jpeg' }]
                });
                navigator.mediaSession.setActionHandler('play', () => { audio.play(); setIsPlaying(true); });
                navigator.mediaSession.setActionHandler('pause', () => { audio.pause(); setIsPlaying(false); });
              }
            }).catch(() => setIsPlaying(false));
          };
          audio.onerror = () => { setLoading(false); setError(true); };
        })
        .catch(() => { setLoading(false); setError(true); });
    }
  }, [mediaType, videoId, mediaMeta]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) { audioRef.current.play(); setIsPlaying(true); }
    else { audioRef.current.pause(); setIsPlaying(false); }
  };

  return (
    <div className="cm-video-wrap" style={{
      flex: 1, position: 'relative', width: '100%', height: '100%',
      display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0b141a'
    }}>
      <audio ref={audioRef} playsInline preload="auto" onEnded={() => { setIsPlaying(false); handleMediaEnd?.(); }} />

      {mediaType === 'none' && (
        <div style={{ textAlign: 'center', color: '#8696a0' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎵</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Yukarıdan Medya Aratın veya Kitaplıktan Seçin!</div>
        </div>
      )}

      {mediaType === 'youtube' && videoId && !youtubeError && (
        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
          <YouTube videoId={videoId} opts={ytOpts} style={{ width: '100%', height: '100%', maxWidth: '100%' }}
            onReady={handleYTReady} onError={handleYouTubeError} onEnd={handleMediaEnd} />
        </div>
      )}

      {mediaType === 'music' && videoId && (
        <div style={{ textAlign: 'center', color: '#fff', padding: '20px', zIndex: 2 }}>
          <img src={mediaMeta?.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} alt="" style={{
            width: '240px', height: '240px', borderRadius: '20px', objectFit: 'cover',
            boxShadow: isPlaying ? '0 15px 50px rgba(0, 168, 132, 0.4)' : '0 10px 40px rgba(0,0,0,.6)',
            marginBottom: '18px', transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            transform: isPlaying ? 'scale(1.03)' : 'scale(1)'
          }} />
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '6px' }}>{mediaMeta?.title || 'Şarkı Çalıyor'}</div>
          <div style={{ fontSize: '14px', color: '#8696a0', marginBottom: '16px' }}>{mediaMeta?.artist || 'Couple Meeting Müzik'}</div>
          {loading && <div style={{ fontSize: '13px', color: '#00a884', marginBottom: '12px' }}>⏳ MP3'e dönüştürülüyor...</div>}
          {error && <div style={{ fontSize: '13px', color: '#ea4335', marginBottom: '12px' }}>❌ Yüklenemedi. Tekrar deneyin.</div>}
          <button onClick={togglePlayPause} style={{
            background: isPlaying ? '#ea4335' : '#00a884', color: '#fff', border: 'none',
            padding: '12px 32px', borderRadius: '14px', fontWeight: '800', cursor: 'pointer',
            fontSize: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', transition: '0.2s all'
          }}>
            {isPlaying ? '⏸ Durdur' : '▶ Çal'}
          </button>
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
          <div style={{ color: '#fff', fontWeight: 900, fontSize: '20px', marginBottom: '8px' }}>Bu video oynatılamıyor</div>
          <div style={{ color: '#9aa7b3', fontSize: '13px', lineHeight: 1.6, maxWidth: '620px', margin: '0 auto 18px' }}>{youtubeError.message}</div>
          <button onClick={openYouTubeExternally} style={{
            background: 'linear-gradient(135deg, #ff0033 0%, #cc0000 100%)',
            color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer'
          }}>▶ YouTube'da Aç</button>
        </div>
      )}

      {reactions}
    </div>
  );
}
