import YouTube from 'react-youtube';

export default function Player({
  mediaType, mediaSrc, youtubeError, customVideoRef, ytPlayerRef,
  reactions, fallbackUrl, setFallbackUrl, useFallbackSource,
  openYouTubeExternally, setYoutubeError, setMediaType, handleMediaEnd, handleYouTubeError,
  audioMode, playlist
}) {
  const currentTitle = playlist?.find(i => i.src === mediaSrc)?.title || 'Şarkı Çalıyor';

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

      {/* YENİ: Audio Modu - Arka plan çalma görseli */}
      {mediaType === 'youtube' && audioMode && !youtubeError && (
        <div style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(180deg, #0a1628, #050c14)',
          padding: 24
        }}>
          <div style={{
            width: 200, height: 200, borderRadius: 28, overflow: 'hidden',
            boxShadow: '0 30px 80px rgba(0,168,132,.25)', marginBottom: 24,
            animation: 'pulse 3s ease-in-out infinite', position: 'relative'
          }}>
            <img
              src={`https://img.youtube.com/vi/${mediaSrc}/hqdefault.jpg`}
              alt={currentTitle}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,168,132,.8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28
              }}>
                🎵
              </div>
            </div>
          </div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 900, textAlign: 'center', maxWidth: 400 }}>
            {currentTitle}
          </div>
          <div style={{ color: '#53e6bc', fontSize: 12, fontWeight: 800, marginTop: 8 }}>
            🎧 ARKA PLANDA ÇALIYOR
          </div>
          <div style={{ color: '#63727d', fontSize: 11, marginTop: 12, textAlign: 'center', maxWidth: 350 }}>
            Bu mod arka planda çalmaya izin verir. Şarkı kilit ekranında da kontrol edilebilir.
          </div>
          <style>{`
            @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
          `}</style>
        </div>
      )}

      {/* YouTube iframe (audio mode değilse) */}
      {mediaType === 'youtube' && !audioMode && !youtubeError && (
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000'
        }}>
          <YouTube
            videoId={mediaSrc}
            opts={{
              height: '100%', width: '100%',
              playerVars: { autoplay: 1, controls: 1, playsinline: 1, rel: 0, modestbranding: 1, origin: window.location.origin }
            }}
            style={{ width: '100%', height: '100%', maxWidth: '100%' }}
            onReady={(e) => { ytPlayerRef.current = e.target; }}
            onError={handleYouTubeError}
            onEnd={handleMediaEnd}
          />
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
            Bu YouTube videosu burada oynatılamıyor
          </div>
          <div style={{ color: '#9aa7b3', fontSize: '13px', lineHeight: 1.6, maxWidth: '620px', margin: '0 auto 18px' }}>
            {youtubeError.message} Bu genellikle video sahibinin harici oynatmayı kapatmasından kaynaklanır.
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '18px' }}>
            <button
              onClick={openYouTubeExternally}
              style={{
                background: 'linear-gradient(135deg, #ff0033 0%, #cc0000 100%)',
                color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '12px',
                fontWeight: '700', cursor: 'pointer', boxShadow: '0 6px 18px rgba(0,0,0,0.35)'
              }}
            >
              ▶ YouTube'da Aç
            </button>
            <button
              onClick={() => { setYoutubeError(null); setMediaType('none'); setTimeout(() => setMediaType('youtube'), 50); }}
              style={{
                background: '#25313b', color: '#fff', border: 'none', padding: '10px 16px',
                borderRadius: '12px', fontWeight: '700', cursor: 'pointer'
              }}
            >
              🔄 Tekrar Dene
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', maxWidth: '620px', margin: '0 auto' }}>
            <input
              value={fallbackUrl}
              onChange={(e) => setFallbackUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') useFallbackSource(); }}
              placeholder="Alternatif MP4 / WebM / iframe bağlantısı..."
              style={{
                background: '#111b21', border: '1px solid #222d34', color: '#e9edef',
                padding: '10px 14px', borderRadius: '10px', fontSize: '13px', outline: 'none',
                width: '100%', boxSizing: 'border-box'
              }}
            />
            <button
              onClick={useFallbackSource}
              style={{
                background: 'linear-gradient(135deg, #00a884 0%, #008f6f 100%)',
                color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '12px',
                fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              Kaynağı Kullan
            </button>
          </div>
        </div>
      )}

      {mediaType === 'custom_video' && (
        <video
          ref={customVideoRef}
          src={mediaSrc}
          controls
          playsInline
          preload="metadata"
          onEnded={handleMediaEnd}
          style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
        />
      )}

      {mediaType === 'iframe' && (
        <iframe
          src={mediaSrc}
          title="Couple Meeting Harici Medya"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: '0', background: '#000' }}
        />
      )}

      {reactions.map((r) => (
        <div
          key={r.id}
          style={{
            position: 'absolute', bottom: '30px', left: `${r.left}%`,
            fontSize: '42px', pointerEvents: 'none',
            animation: 'floatUp 2s ease-out forwards', zIndex: 99
          }}
        >
          {r.emoji}
        </div>
      ))}
    </div>
  );
}
