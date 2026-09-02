import { getStyles } from '../styles';
import { useState, useRef, useEffect } from 'react';

export default function SearchBar({
  searchInput, setSearchInput, searchResults, isSearching,
  currentTheme, handleDirectPlay, handleOpenAddModal, handleSelectSearchResult
}) {
  const styles = getStyles(currentTheme);
  const [showResults, setShowResults] = useState(false);
  const [addedId, setAddedId] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setTimeout(() => setShowResults(false), 150);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => { document.removeEventListener('mousedown', handleOutside); document.removeEventListener('touchstart', handleOutside); };
  }, []);

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

  const showYouTubeResults = showResults && (searchResults.length > 0 || isSearching);

  return (
    <div
      ref={searchRef}
      className="cm-search-bar"
      style={{
        padding: '8px 12px', background: currentTheme.cardBg,
        borderBottom: '1px solid #222d34', zIndex: 999, display: 'flex',
        gap: '6px', alignItems: 'center', position: 'relative'
      }}
    >
      <style>{`
        .cm-search-bar { gap: 6px !important; }
        .cm-search-bar input { flex: 1; min-width: 0; padding: 8px 10px !important; font-size: 12px !important; border-radius: 8px !important; }
        .cm-search-btn { padding: 7px 10px !important; font-size: 11px !important; font-weight: 800 !important; border-radius: 8px !important; white-space: nowrap !important; border: none !important; cursor: pointer !important; }
        .cm-search-btn-play { background: ${currentTheme.primary} !important; color: #fff !important; }
        .cm-search-btn-add { background: #008f6f !important; color: #fff !important; }
        @media (max-width: 480px) {
          .cm-search-bar { padding: 6px 8px !important; gap: 4px !important; }
          .cm-search-bar input { padding: 7px 8px !important; font-size: 11px !important; }
          .cm-search-btn { padding: 6px 8px !important; font-size: 10px !important; border-radius: 6px !important; }
        }
      `}</style>

      <input
        type="text"
        placeholder="🔍 Ara..."
        value={searchInput}
        onChange={(e) => { setSearchInput(e.target.value); setShowResults(true); }}
        onFocus={() => setShowResults(true)}
      />

      <button className="cm-search-btn cm-search-btn-play" onClick={handlePlay}>▶ Oynat</button>
      <button className="cm-search-btn cm-search-btn-add" onClick={handleAddToPlaylist}>➕ Ekle</button>

      {showYouTubeResults && (
        <div className="cm-search-results" style={{
          position: 'absolute', top: '52px', left: '8px', right: '8px',
          ...styles.card, padding: '10px', zIndex: 9999,
          display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: 320, overflowY: 'auto'
        }}>
          {isSearching && <div style={{ color: currentTheme.primary, fontSize: '12px', fontWeight: 'bold' }}>⚡ Aranıyor...</div>}
          {searchResults.map((song) => (
            <div key={song.id} className="cm-search-result-row"
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: addedId === song.id ? 'rgba(0,168,132,.15)' : '#111b21',
                padding: '6px 10px', borderRadius: '8px',
                border: addedId === song.id ? '1px solid rgba(0,168,132,.3)' : '1px solid #222d34',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onClick={() => handleSelectResult(song, true)}
              onMouseEnter={(e) => { if (addedId !== song.id) e.currentTarget.style.background = '#1a2634'; }}
              onMouseLeave={(e) => { if (addedId !== song.id) e.currentTarget.style.background = '#111b21'; }}>
              <img src={song.thumbnail} alt={song.title} style={{ width: '50px', height: '30px', borderRadius: '5px', objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{song.title}</div>
                <div style={{ fontSize: '10px', color: '#7f8c98', marginTop: 1 }}>{song.timestamp}</div>
              </div>
              <div className="cm-result-actions" style={{ display: 'flex', gap: '4px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                {addedId === song.id ? (
                  <span style={{ color: '#00a884', fontSize: '11px', fontWeight: 800, padding: '4px 8px' }}>✓</span>
                ) : (
                  <>
                    <button onClick={() => handleSelectResult(song, true)} className="cm-search-btn cm-search-btn-play" style={{ padding: '4px 8px', fontSize: '10px' }}>▶</button>
                    <button onClick={() => handleSelectResult(song, false)} className="cm-search-btn cm-search-btn-add" style={{ padding: '4px 8px', fontSize: '10px' }}>+</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
