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
    document.addEventListener('touchstart', handleOutside, { passive: true });
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
        padding: '12px 20px', background: currentTheme.cardBg,
        borderBottom: '1px solid #222d34', zIndex: 999, display: 'flex',
        gap: '10px', alignItems: 'center', position: 'relative'
      }}
    >
      <input
        type="text"
        placeholder="🔍 Şarkı/Dizi Adı Yazın veya Link Yapıştırın..."
        value={searchInput}
        onChange={(e) => { setSearchInput(e.target.value); setShowResults(true); }}
        onFocus={() => setShowResults(true)}
        style={{ ...styles.input, flex: 1 }}
      />

      <button className="cm-action-btn" onClick={handlePlay}
        style={{ ...styles.buttonPrimary, background: currentTheme.primary }}>▶ Oynat</button>
      <button className="cm-action-btn" onClick={handleAddToPlaylist}
        style={{ ...styles.buttonPrimary, background: '#008f6f' }}>➕ Listeye Ekle</button>

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
    </div>
  );
}
