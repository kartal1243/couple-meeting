import { getStyles } from '../styles';
import { useState, useRef, useEffect } from 'react';

export default function SearchBar({
  currentTheme, API_BASE, onSelectSong
}) {
  const styles = getStyles(currentTheme);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setTimeout(() => setResults([]), 150);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => { document.removeEventListener('mousedown', handleOutside); document.removeEventListener('touchstart', handleOutside); };
  }, []);

  const doSearch = async (q) => {
    if (!q || q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/music/search?q=${encodeURIComponent(q)}`);
      const d = await r.json();
      setResults(d.results || []);
    } catch { setResults([]); }
    setLoading(false);
  };

  const handleChange = (val) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 400);
  };

  const handleSelect = (song) => {
    setSelectedId(song.videoId);
    setResults([]);
    setQuery('');
    onSelectSong(song);
  };

  return (
    <div ref={searchRef} style={{
      padding: '12px 20px', background: currentTheme.cardBg,
      borderBottom: '1px solid #222d34', zIndex: 999, display: 'flex',
      gap: '10px', alignItems: 'center', position: 'relative'
    }}>
      <input
        type="text"
        placeholder="🔍 Şarkı adı yazın..."
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => query.length >= 2 && doSearch(query)}
        style={{ ...styles.input, flex: 1 }}
      />
      {loading && <span style={{ color: currentTheme.primary, fontSize: '13px' }}>⚡</span>}
      {results.length > 0 && (
        <div style={{
          position: 'absolute', top: '62px', left: '20px', right: '20px',
          ...styles.card, padding: '14px', zIndex: 9999,
          display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: 340, overflowY: 'auto'
        }}>
          {results.map((song) => (
            <div key={song.videoId}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                background: selectedId === song.videoId ? 'rgba(0,168,132,.15)' : '#111b21',
                padding: '8px 12px', borderRadius: '10px',
                border: '1px solid #222d34', cursor: 'pointer', transition: 'all 0.2s'
              }}
              onClick={() => handleSelect(song)}
              onMouseEnter={(e) => e.currentTarget.style.background = '#1a2634'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#111b21'}>
              <img src={song.thumbnail} alt={song.title}
                style={{ width: '60px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{song.title}</div>
                <div style={{ fontSize: '11px', color: '#7f8c98', marginTop: 2 }}>{song.artist}{song.album ? ` • ${song.album}` : ''}</div>
              </div>
              <span style={{ fontSize: '11px', color: '#7f8c98' }}>{Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}</span>
              <button style={{ ...styles.buttonPrimary, padding: '6px 12px', fontSize: '12px' }}>▶ Çal</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
