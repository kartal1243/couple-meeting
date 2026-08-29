import YouTube from 'react-youtube';
import { useEffect, useState, useCallback, useRef } from 'react';
import { BACKEND_URL } from '../constants';

function extractVideoId(src) {
  if (!src) return null;
  if (src.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(src)) return src;
  const m = src.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function Player({
  mediaType, mediaSrc, youtubeError, customVideoRef, ytPlayerRef, mediaMeta,
  reactions, fallbackUrl, setFallbackUrl, useFallbackSource,
  openYouTubeExternally, setYoutubeError, setMediaType, handleMediaEnd, handleYouTubeError
}) {
  const videoId = extractVideoId(mediaSrc);
  const audioRef = useRef(null);
  const [musicLoading, setMusicLoading] = useState(false);

  const ytOpts = {
    height: '100%', width: '100%',
    playerVars: {
      autoplay: 1, controls: 1, playsinline: 1,
      rel: 0, modestbranding: 1, iv_load_policy: 3,
      origin: window.location.origin, enablejsapi: 1
    }
  };

  const handleYTReady = useCallback((e) => { ytPlayerRef.current = e.target; }, []);

  useEffect(() => {
    if (mediaType === 'music' && mediaSrc) {
      setMusicLoading(true);
      fetch(`${BACKEND_URL}/api/music/stream/${mediaSrc}`)
        .then(r => r.json())
        .then(data => {
          if (data.url && audioRef.current) {
            audioRef.current.src = data.url;
            audioRef.current.play().catch(() => {});
            if ('mediaSession' in navigator && mediaMeta) {
              navigator.mediaSession.metadata = new MediaMetadata({
                title: mediaMeta.title || 'Müzik',
                artist: mediaMeta.artist || '',
                artwork: mediaMeta.thumbnail ? [{ src: mediaMeta.thumbnail, sizes: '300x300', type: 'image/jpeg' }] : []
              });
            }
          }
          setMusicLoading(false);
        })
        .catch(() => setMusicLoading(false));
    }
  }, [mediaType, mediaSrc]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => handleMediaEnd?.();
    }
  }, []);

  return (
    <div className="cm-video-wrap" style={{
      flex: 1, position: 'relative', width: '100%', height: '100%',
      display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0b141a'
    }}>
      <audio ref={audioRef} preload="auto" crossOrigin="anonymous" />

      {mediaType === 'none' && (
        <div style={{ textAlign: 'center', color: '#8696a0' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎵</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            Yukarıdan Medya Aratın veya Kitaplıktan Seçin!
          </div>
        </div>
      )}

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

      {mediaType === 'music' && (
        <div style={{ textAlign: 'center', color: '#fff', padding: '20px' }}>
          {mediaMeta?.thumbnail && (
            <img src={mediaMeta.thumbnail} alt="" style={{ width: '240px', height: '240px', borderRadius: '16px', objectFit: 'cover', boxShadow: '0 10px 40px rgba(0,0,0,.5)', marginBottom: '16px' }} />
          )}
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '6px' }}>{mediaMeta?.title || 'Müzik'}</div>
          <div style={{ fontSize: '13px', color: '#8696a0' }}>{mediaMeta?.artist || ''}</div>
          {musicLoading && <div style={{ fontSize: '13px', color: '#00a884', marginTop: '10px' }}>⏳ Yükleniyor...</div>}
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button onClick={() => { if (audioRef.current) audioRef.current.paused ? audioRef.current.play() : audioRef.current.pause(); }}
              style={{ background: '#00a884', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
              ▶ / ⏸
            </button>
          </div>
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

      {reactions}
    </div>
  );
}
