import YouTube from 'react-youtube';
import { useEffect, useState, useCallback, useRef } from 'react';

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
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);

  const ytOpts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: mediaType === 'youtube' ? 1 : 0,
      playsinline: 1,
      rel: 0,
      modestbranding: 1,
      origin: window.location.origin,
      enablejsapi: 1
    }
  };

  const handleYTReady = useCallback((e) => {
    ytPlayerRef.current = e.target;
    try {
      e.target.playVideo();
      setIsPlaying(true);
    } catch (err) {}
  }, [ytPlayerRef]);

  const handleStateChange = (e) => {
    // 1: Playing, 2: Paused, 3: Buffering, 0: Ended
    if (e.data === 1) {
      setIsPlaying(true);
      setIsBuffering(false);
    } else if (e.data === 2) {
      setIsPlaying(false);
      setIsBuffering(false);
    } else if (e.data === 3) {
      setIsBuffering(true);
    } else if (e.data === 0) {
      setIsPlaying(false);
      handleMediaEnd?.();
    }
  };

  const togglePlayPause = () => {
    if (!ytPlayerRef.current) return;
    try {
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (e) {}
  };

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
            onStateChange={handleStateChange}
            onError={handleYouTubeError}
            onEnd={handleMediaEnd}
          />
        </div>
      )}

      {/* MÜZİK MODU (Şık Albüm Arayüzü + Arka Planda Çalışan Resmi Ses Motoru) */}
      {mediaType === 'music' && videoId && (
        <div style={{ textAlign: 'center', color: '#fff', padding: '20px', zIndex: 2 }}>
          {/* Arka planda çalan görünmez YouTube Iframe (0px gizli) */}
          <div style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0.01, pointerEvents: 'none' }}>
            <YouTube
              videoId={videoId}
              opts={ytOpts}
              onReady={handleYTReady}
              onStateChange={handleStateChange}
              onError={handleYouTubeError}
              onEnd={handleMediaEnd}
            />
          </div>

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

          {isBuffering && <div style={{ fontSize: '13px', color: '#00a884', marginBottom: '12px' }}>⏳ Yükleniyor...</div>}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={togglePlayPause}
              style={{
                background: isPlaying ? '#ea4335' : '#00a884',
                color: '#fff',
                border: 'none',
                padding: '12px 30px',
                borderRadius: '12px',
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