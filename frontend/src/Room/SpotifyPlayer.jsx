import { useState, useEffect, useRef } from 'react';

function parseSpotifyUrl(url) {
  if (!url) return null;
  const patterns = [
    { type: 'track', regex: /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/ },
    { type: 'album', regex: /open\.spotify\.com\/album\/([a-zA-Z0-9]+)/ },
    { type: 'playlist', regex: /open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/ },
    { type: 'artist', regex: /open\.spotify\.com\/artist\/([a-zA-Z0-9]+)/ },
  ];
  for (const p of patterns) {
    const m = url.match(p.regex);
    if (m) return { type: p.type, id: m[1] };
  }
  return null;
}

function embedUrl(type, id) {
  return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
}

export { parseSpotifyUrl };

export default function SpotifyPlayer({ spotifyUrl, onClose, onPlayingChange }) {
  const [parsed, setParsed] = useState(null);
  const [inputUrl, setInputUrl] = useState('');
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (spotifyUrl) {
      const p = parseSpotifyUrl(spotifyUrl);
      if (p) { setParsed(p); setError(''); setInputUrl(''); }
      else { setError('Geçersiz Spotify linki'); }
    }
  }, [spotifyUrl]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    const p = parseSpotifyUrl(inputUrl.trim());
    if (p) { setParsed(p); setError(''); }
    else { setError('Geçersiz Spotify linki. track/album/playlist linki yapıştırın.'); }
  };

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, #121212, #0a0a0a)', position: 'relative'
    }}>
      {/* Spotify yeşil şerit */}
      <div style={{
        height: 3, width: '100%',
        background: 'linear-gradient(90deg, #1DB954, #1ed760)'
      }} />

      {!parsed ? (
        /* URL Girişi */
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', padding: 24
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1DB954, #1ed760)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, fontSize: 36
          }}>🎵</div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 900, marginBottom: 4 }}>
            Spotify Müzik Çalar
          </div>
          <div style={{ color: '#b3b3b3', fontSize: 12, marginBottom: 20, textAlign: 'center' }}>
            Spotify'dan şarkı/album/playlist linki yapıştırın
          </div>

          <form onSubmit={handleSubmit} style={{
            display: 'flex', gap: 8, width: '100%', maxWidth: 400
          }}>
            <input
              value={inputUrl}
              onChange={(e) => { setInputUrl(e.target.value); setError(''); }}
              placeholder="https://open.spotify.com/track/..."
              style={{
                flex: 1, background: '#282828', border: '1px solid #333',
                color: '#fff', padding: '12px 16px', borderRadius: 8,
                fontSize: 13, outline: 'none'
              }}
            />
            <button type="submit" style={{
              background: '#1DB954', color: '#fff', border: 'none',
              padding: '12px 20px', borderRadius: 8, fontWeight: 800,
              fontSize: 13, cursor: 'pointer'
            }}>Bağla</button>
          </form>

          {error && (
            <div style={{ color: '#ff4444', fontSize: 12, marginTop: 10 }}>{error}</div>
          )}

          <div style={{
            marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center'
          }}>
            {[
              { label: 'Pop', url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M' },
              { label: 'Rock', url: 'https://open.spotify.com/playlist/37i9dQZF1DWXRqgorJj26U' },
              { label: 'Rap', url: 'https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd' },
              { label: 'Seviyeli', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4o1oenSJRJd' },
            ].map(p => (
              <button key={p.label} onClick={() => { setInputUrl(p.url); }}
                style={{
                  background: '#282828', color: '#b3b3b3', border: '1px solid #333',
                  padding: '6px 14px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.target.style.background = '#1DB954'; e.target.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.target.style.background = '#282828'; e.target.style.color = '#b3b3b3'; }}
              >
                🎧 {p.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Spotify Embed Player */
        <div style={{ flex: 1, position: 'relative' }}>
          <iframe
            ref={iframeRef}
            src={embedUrl(parsed.type, parsed.id)}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{
              border: 'none', borderRadius: 0,
              position: 'absolute', inset: 0
            }}
            onLoad={() => setIsPlaying(true)}
          />

          {/* Üst bar - bilgi + kontrol */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 12px',
            background: 'linear-gradient(180deg, rgba(0,0,0,.7), transparent)',
            zIndex: 10
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: '#1DB954', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 12
              }}>🎵</div>
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>
                SPOTIFY • {parsed.type === 'track' ? 'Şarkı' : parsed.type === 'album' ? 'Album' : 'Playlist'}
              </span>
              <span style={{
                background: 'rgba(29,185,84,.2)', color: '#1DB954',
                padding: '2px 8px', borderRadius: 10, fontSize: 9, fontWeight: 700
              }}>
                ARKA PLAN AKTİF
              </span>
            </div>

            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => { setParsed(null); setInputUrl(''); }}
                style={{
                  background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff',
                  width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontSize: 12
                }}>🔄</button>
              <button onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff',
                  width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontSize: 12
                }}>✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
