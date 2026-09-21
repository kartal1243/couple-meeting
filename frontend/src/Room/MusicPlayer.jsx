import { useEffect, useRef, useState, memo } from 'react';
import { BACKEND_URL } from '../constants';

function MusicPlayer({ videoId, meta, audioRef, pendingSyncRef, onEnded, onError }) {
  const [streamUrl, setStreamUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [retry, setRetry] = useState(0);
  const elRef = useRef(null);

  // Stream URL al
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setStreamUrl('');
    setBlocked(false);
    if (!videoId) { setLoading(false); return; }
    const ctrl = new AbortController();
    fetch(`${BACKEND_URL}/api/music/stream/${videoId}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.url) setStreamUrl(d.url);
        else { setError('Ses alınamadı.'); onError?.({ message: 'Ses alınamadı.' }); }
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled || e.name === 'AbortError') return;
        setError('Bağlantı hatası.');
        setLoading(false);
      });
    return () => { cancelled = true; ctrl.abort(); };
  }, [videoId, retry]);

  // Audio elementini paylaşılan ref'e bağla
  useEffect(() => {
    if (audioRef) audioRef.current = elRef.current;
    return () => { if (audioRef) audioRef.current = null; };
  }, [audioRef]);

  // Otomatik başlat + geç katılım senkronu
  useEffect(() => {
    const el = elRef.current;
    if (!el || !streamUrl) return;
    el.load();
    const pending = pendingSyncRef?.current;
    const startAt = pending ? (pending.time || 0) + (pending.isPlaying ? (Date.now() - (pending.lastUpdated || Date.now())) / 1000 : 0) : 0;
    const shouldPlay = pending ? !!pending.isPlaying : true;
    if (pendingSyncRef) pendingSyncRef.current = null;
    const t = setTimeout(() => {
      try {
        if (startAt > 0) { try { el.currentTime = startAt; } catch {} }
        if (shouldPlay) {
          el.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
        }
      } catch { setBlocked(true); }
    }, 150);
    return () => clearTimeout(t);
  }, [streamUrl]);

  // Tarayıcı engellerse overlay tetikleyici
  useEffect(() => {
    const onBlocked = () => setBlocked(true);
    window.addEventListener('cm-audio-blocked', onBlocked);
    return () => window.removeEventListener('cm-audio-blocked', onBlocked);
  }, []);

  // MediaSession (kilit ekranı + bildirim kontrolleri)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: meta?.title || 'Couple Meeting',
        artist: meta?.artist || 'Canlı Oda',
        artwork: meta?.thumbnail ? [{ src: meta.thumbnail, sizes: '512x512', type: 'image/png' }] : []
      });
    } catch {}
  }, [meta]);

  const resume = () => {
    const el = elRef.current;
    if (!el) return;
    el.play().then(() => setBlocked(false)).catch(() => {});
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% 30%, #0f2a26 0%, #000 70%)', position: 'relative', padding: 20 }}>
      <audio
        ref={elRef}
        src={streamUrl || undefined}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => onEnded?.()}
        onError={() => { setError('Ses çalınamadı.'); }}
      />
      {meta?.thumbnail ? (
        <img src={meta.thumbnail} alt="" style={{ width: 180, height: 180, borderRadius: 24, objectFit: 'cover', boxShadow: isPlaying ? '0 0 60px rgba(0,168,132,.5)' : '0 10px 40px rgba(0,0,0,.6)', animation: isPlaying ? 'cmSpin 12s linear infinite' : 'none' }} />
      ) : (
        <div style={{ fontSize: 72 }}>🎵</div>
      )}
      <div style={{ color: '#fff', fontWeight: 900, fontSize: 17, marginTop: 16, textAlign: 'center', maxWidth: '90%' }}>{meta?.title || 'Yükleniyor...'}</div>
      <div style={{ color: '#53e6bc', fontSize: 13, marginTop: 4 }}>{meta?.artist || ''}</div>
      {loading && <div style={{ color: '#64748b', fontSize: 12, marginTop: 12 }}>⏳ Ses hazırlanıyor...</div>}
      {error && !loading && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <div style={{ color: '#ef4444', fontSize: 12 }}>{error}</div>
          <button onClick={() => { setError(''); setLoading(true); setRetry((r) => r + 1); }} style={{ marginTop: 8, padding: '8px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.06)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>🔄 Tekrar Dene</button>
        </div>
      )}
      {blocked && !loading && !error && (
        <button onClick={resume} style={{ marginTop: 16, padding: '12px 28px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#00a884,#008f6f)', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 25px rgba(0,168,132,.35)' }}>
          ▶ Dinlemeye Devam Et
        </button>
      )}
      <div style={{ color: '#475569', fontSize: 10, marginTop: 12 }}>🔒 Ekran kapalıyken de çalmaya devam eder</div>
      <style>{`@keyframes cmSpin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default memo(MusicPlayer);
