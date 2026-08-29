import YouTube from 'react-youtube';
import { useEffect, useState } from 'react';

function isMobile() {
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export default function Player({
  mediaType, mediaSrc, youtubeError, customVideoRef, ytPlayerRef,
  reactions, fallbackUrl, setFallbackUrl, useFallbackSource,
  openYouTubeExternally, setYoutubeError, setMediaType, handleMediaEnd, handleYouTubeError,
  audioMode, playlist
}) {
  const currentTitle = playlist?.find(i => i.src === mediaSrc)?.title || 'Şarkı Çalıyor';
  const [muted, setMuted] = useState(isMobile());
  const [userInteracted, setUserInteracted] = useState(false);

  // İlk tıklamada sesi aç
  useEffect(() => {
    if (userInteracted || !isMobile()) return;
    const unlock = () => {
      setUserInteracted(true);
      setMuted(false);
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };
    document.addEventListener('click', unlock);
    document.addEventListener('touchstart', unlock);
    return () => { document.removeEventListener('click', unlock); document.removeEventListener('touchstart', unlock); };
  }, [userInteracted]);

  // MediaSession API
  useEffect(() => {
    if (!mediaSrc || mediaType !== 'youtube') return;
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTitle, artist: 'Couple Meeting', album: 'Oda Müziği',
      artwork: [{ src: `https://img.youtube.com/vi/${mediaSrc}/hqdefault.jpg`, sizes: '480x360', type: 'image/jpeg' }]
    });
    navigator.mediaSession.setActionHandler('play', () => { ytPlayerRef.current?.playVideo(); });
    navigator.mediaSession.setActionHandler('pause', () => { ytPlayerRef.current?.pauseVideo(); });
    return () => { try { navigator.mediaSession.setActionHandler('play', null); navigator.mediaSession.setActionHandler('pause', null); } catch {} };
  }, [mediaSrc, mediaType, currentTitle]);

  const ytOpts = {
    height: '100%', width: '100%',
    playerVars: {
      autoplay: 1, controls: isMobile() ? 1 : 1, playsinline: 1,
      rel: 0, modestbranding: 1, fs: 0, iv_load_policy: 3,
      origin: window.location.origin,
      disablekb: 0, enablejsapi: 1
    }
  };

  return (
    <div
      className="cm-video-wrap"
      style={{
        flex: 1, position: 'relative', width: '100%', height: '100%',
        display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0b141a'
      }}
    >
      {mediaType === 'none' && (
        <div style={{ textAlign: 'center', color: '#8696a0' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎵</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            Yukarıdan Medya Aratın veya Kitaplıktan Seçin!
          </div>
        </div>
      )}

      {/* SES MODU - Arka plan çalma */}
      {mediaType === 'youtube' && audioMode && !youtubeError && (
        <div style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(180deg, #0a1628, #050c14)', padding: 24
        }}>
          <div style={{
            width: 180, height: 180, borderRadius: 24, overflow: 'hidden',
            boxShadow: '0 30px 80px rgba(0,168,132,.25)', marginBottom: 20,
            animation: 'cmPulseGlow 3s ease-in-out infinite', position: 'relative'
          }}>
            <img src={`https://img.youtube.com/vi/${mediaSrc}/hqdefault.jpg`} alt={currentTitle}
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
          <div style={{ color: '#53e6bc', fontSize: 11, fontWeight: 800, marginTop: 8 }}>🎧 SES MODU - ARKA PLANDA ÇALIYOR</div>
          <div style={{ color: '#4a5568', fontSize: 10, marginTop: 6 }}>Ekran kapalıyken bile müzik çalar</div>
          <style>{`@keyframes cmPulseGlow { 0%,100%{transform:scale(1);box-shadow:0 30px 80px rgba(0,168,132,.25)} 50%{transform:scale(1.03);box-shadow:0 30px 80px rgba(0,168,132,.4)} }`}</style>
        </div>
      )}

      {/* VIDEO MODU - YouTube iframe */}
      {mediaType === 'youtube' && !audioMode && !youtubeError && (
        <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
          <YouTube
            videoId={mediaSrc}
            opts={ytOpts}
            style={{ width: '100%', height: '100%', maxWidth: '100%' }}
            onReady={(e) => { ytPlayerRef.current = e.target; }}
            onError={handleYouTubeError}
            onEnd={handleMediaEnd}
          />
          {/* Mobilde ses butonu */}
          {isMobile() && !userInteracted && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,.6)', zIndex: 10, cursor: 'pointer'
            }} onClick={() => { setUserInteracted(true); setMuted(false); }}>
              <div style={{
                padding: '16px 28px', borderRadius: 16, background: 'linear-gradient(135deg, #00a884, #008f6f)',
                color: '#fff', fontWeight: 900, fontSize: 15, boxShadow: '0 10px 30px rgba(0,0,0,.5)'
              }}>
                ▶ Müziği Başlat
              </div>
            </div>
          )}
        </div>
      )}

      {/* HATA */}
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
