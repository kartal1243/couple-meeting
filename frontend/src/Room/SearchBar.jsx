import { getStyles } from '../styles';
import { useState, useRef, useEffect } from 'react';

const API_BASE = 'https://couple-meeting.onrender.com';

export default function SearchBar({
  searchInput, setSearchInput, searchResults, isSearching,
  currentTheme, handleDirectPlay, handleOpenAddModal, handleSelectSearchResult,
  onSpotifyUrl, playerMode
}) {
  const styles = getStyles(currentTheme);
  const [showResults, setShowResults] = useState(false);
  const [addedId, setAddedId] = useState(null);
  const searchRef = useRef(null);
  const [spotifyResults, setSpotifyResults] = useState([]);
  const [spotifySearching, setSpotifySearching] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setTimeout(() => setShowResults(false), 150);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => { document.removeEventListener('mousedown', handleOutside); document.removeEventListener('touchstart', handleOutside); };
  }, []);

  useEffect(() => {
    if (playerMode !== 'spotify' || !searchInput.trim()) {
      setSpotifyResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSpotifySearching(true);
      try {
        const res = await fetch(`${API_BASE}/api/spotify/search?q=${encodeURIComponent(searchInput.trim())}`);
        const data = await res.json();
        setSpotifyResults(data.results || []);
      } catch (e) { setSpotifyResults([]); }
      setSpotifySearching(false);
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput, playerMode]);

  const handlePlay = () => {
    handleDirectPlay();
    setShowResults(false);
    setSearchInput('');
  };

  const handleAddToPlaylist = () => {
    handleOpenAddModal(null);
    setShowResults(false);
    setSearchInput('');
  };

  const handleSelectResult = (song, playNow) => {
    handleSelectSearchResult(song, playNow);
    if (!playNow) {
      setAddedId(song.id);
      setTimeout(() => setAddedId(null), 1200);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    setShowResults(true);
    if (val.includes('open.spotify.com/') || val.includes('spotify.link/')) {
      onSpotifyUrl?.(val);
      setSearchInput('');
      setShowResults(false);
    }
  };

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const showYouTubeResults = playerMode === 'youtube' && showResults && (searchResults.length > 0 || isSearching);
  const showSpotifyResults = playerMode === 'spotify' && showResults && (spotifyResults.length > 0 || spotifySearching);

  return (
    <div
      ref={searchRef}
      className="cm-search-bar"
      style={{
        padding: '12px 20px', background: currentTheme.cardBg,
        borderBottom: '1px solid #222d34', zIndex: 999, display: 'flex',
        gap: '10px', alignItems: 'center', position: 'relative'
      }}
    >
      <input
        type="text"
        placeholder={playerMode === 'spotify' ? '🔍 Şarkı/sanatçı adı yazın veya Spotify linki yapıştırın...' : '🔍 YouTube linki veya şarkı adı yazın...'}
        value={searchInput}
        onChange={handleInputChange}
        onFocus={() => setShowResults(true)}
        style={{ ...styles.input, flex: 1 }}
      />

      {playerMode === 'youtube' && (
        <>
          <button className="cm-action-btn" onClick={handlePlay}
            style={{ ...styles.buttonPrimary, background: currentTheme.primary }}>▶ Oynat</button>
          <button className="cm-action-btn" onClick={handleAddToPlaylist}
            style={{ ...styles.buttonPrimary, background: '#008f6f' }}>➕ Listeye Ekle</button>
        </>
      )}

      {playerMode === 'spotify' && searchInput.trim() && (
        <button className="cm-action-btn" onClick={() => {
          if (searchInput.includes('open.spotify.com/') || searchInput.includes('spotify.link/')) {
            onSpotifyUrl?.(searchInput);
            setSearchInput('');
            setShowResults(false);
          }
        }}
          style={{ ...styles.buttonPrimary, background: '#1DB954' }}>🎵 Bağla</button>
      )}

      {showYouTubeResults && (
        <div className="cm-search-results" style={{
          position: 'absolute', top: '62px', left: '20px', right: '20px',
          ...styles.card, padding: '14px', zIndex: 9999,
          display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: 340, overflowY: 'auto'
        }}>
          {isSearching && <div style={{ color: currentTheme.primary, fontSize: '13px', fontWeight: 'bold' }}>⚡ YouTube Aranıyor...</div>}
          {searchResults.map((song) => (
            <div key={song.id} className="cm-search-result-row"
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                background: addedId === song.id ? 'rgba(0,168,132,.15)' : '#111b21',
                padding: '8px 12px', borderRadius: '10px',
                border: addedId === song.id ? '1px solid rgba(0,168,132,.3)' : '1px solid #222d34',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onClick={() => handleSelectResult(song, true)}
              onMouseEnter={(e) => { if (addedId !== song.id) e.currentTarget.style.background = '#1a2634'; }}
              onMouseLeave={(e) => { if (addedId !== song.id) e.currentTarget.style.background = '#111b21'; }}>
              <img src={song.thumbnail} alt={song.title} style={{ width: '60px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{song.title}</div>
                <div style={{ fontSize: '11px', color: '#7f8c98', marginTop: 2 }}>{song.timestamp}</div>
              </div>
              <div className="cm-result-actions" style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                {addedId === song.id ? (
                  <span style={{ color: '#00a884', fontSize: '12px', fontWeight: 800, padding: '6px 12px' }}>✓ Eklendi</span>
                ) : (
                  <>
                    <button onClick={() => handleSelectResult(song, true)} style={{ ...styles.buttonPrimary, padding: '6px 12px', fontSize: '12px' }}>▶ Çal</button>
                    <button onClick={() => handleSelectResult(song, false)} style={{ ...styles.buttonPrimary, padding: '6px 12px', fontSize: '12px', background: '#008f6f' }}>+ Ekle</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showSpotifyResults && (
        <div className="cm-search-results" style={{
          position: 'absolute', top: '62px', left: '20px', right: '20px',
          background: 'linear-gradient(145deg,#1a1a2e,#121212)', border: '1px solid #333',
          padding: '14px', zIndex: 9999, borderRadius: 16,
          display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: 340, overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,.5)'
        }}>
          {spotifySearching && <div style={{ color: '#1DB954', fontSize: '13px', fontWeight: 'bold' }}>🎵 Spotify Aranıyor...</div>}
          {!spotifySearching && spotifyResults.length === 0 && (
            <div style={{ color: '#666', fontSize: '12px', textAlign: 'center', padding: 10 }}>Sonuç bulunamadı</div>
          )}
          {spotifyResults.map((track) => (
            <div key={track.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: '#1a1a2e', padding: '8px 12px', borderRadius: '10px',
                border: '1px solid #333', cursor: 'pointer', transition: 'all 0.2s'
              }}
              onClick={() => { onSpotifyUrl?.(track.spotifyUrl); setSearchInput(''); setShowResults(false); }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#222244'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#1a1a2e'}>
              {track.thumbnail ? (
                <img src={track.thumbnail} alt={track.title} style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: 6, background: '#282828', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎵</div>
              )}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{track.title}</div>
                <div style={{ fontSize: '11px', color: '#b3b3b3', marginTop: 2, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{track.artist} • {track.album}</div>
              </div>
              <div style={{ color: '#888', fontSize: 11, whiteSpace: 'nowrap' }}>{formatDuration(track.duration)}</div>
              <div style={{ background: '#1DB954', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>▶ Çal</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
