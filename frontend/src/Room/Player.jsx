import YouTube from 'react-youtube';
import { useCallback, useRef } from 'react';

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

  return (
    <div className="cm-video-wrap" style={{
      flex: 1, position: 'relative', width: '100%', height: '100%',
      display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0b141a'
    }}>
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

      {/* MÜZİK MODU - Aynı YouTube iframe, arka planda çalıyor */}
      {mediaType === 'music' && videoId && !youtubeError && (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
          <YouTube
            videoId={videoId}
            opts={{
              ...ytOpts,
              playerVars: {
                ...ytOpts.playerVars,
                autoplay: 1,
                controls: 0,
                disablekb: 1,
                fs: 0,
                iv_load_policy: 3,
                modestbranding: 1,
                playsinline: 1
              }
            }}
            style={{ width: '100%', height: '100%', maxWidth: '100%', opacity: 0.15, position: 'absolute', top: 0, left: 0 }}
            onReady={handleYTReady}
            onError={handleYouTubeError}
            onEnd={handleMediaEnd}
          />
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            zIndex: 2, pointerEvents: 'none'
          }}>
            <img
              src={mediaMeta?.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              alt=""
              style={{
                width: '220px', height: '220px', borderRadius: '20px', objectFit: 'cover',
                boxShadow: '0 15px 50px rgba(0, 168, 132, 0.4)', marginBottom: '18px'
              }}
            />
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginBottom: '6px', textShadow: '0 2px 8px rgba(0,0,0,.7)' }}>
              {mediaMeta?.title || 'Şarkı Çalıyor'}
            </div>
            <div style={{ fontSize: '14px', color: '#a0aec0', textShadow: '0 2px 6px rgba(0,0,0,.7)' }}>
              {mediaMeta?.artist || 'Couple Meeting Müzik'}
            </div>
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
