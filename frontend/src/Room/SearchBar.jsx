import { getStyles } from '../styles';

export default function SearchBar({
  searchInput, setSearchInput, searchResults, isSearching,
  currentTheme, handleDirectPlay, handleOpenAddModal, handleSelectSearchResult
}) {
  const styles = getStyles(currentTheme);

  return (
    <div
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
        onChange={(e) => setSearchInput(e.target.value)}
        style={{ ...styles.input, flex: 1 }}
      />

      <button
        className="cm-action-btn"
        onClick={handleDirectPlay}
        style={{ ...styles.buttonPrimary, background: currentTheme.primary }}
      >
        ▶ Oynat
      </button>
      <button
        className="cm-action-btn"
        onClick={() => handleOpenAddModal(null)}
        style={{ ...styles.buttonPrimary, background: '#008f6f' }}
      >
        ➕ Listeye Ekle
      </button>

      {(searchResults.length > 0 || isSearching) && (
        <div
          className="cm-search-results"
          style={{
            position: 'absolute', top: '62px', left: '20px', right: '20px',
            ...styles.card, padding: '14px', zIndex: 9999,
            display: 'flex', flexDirection: 'column', gap: '10px'
          }}
        >
          {isSearching && (
            <div style={{ color: currentTheme.primary, fontSize: '13px', fontWeight: 'bold' }}>
              ⚡ YouTube Aranıyor...
            </div>
          )}
          {searchResults.map((song) => (
            <div
              key={song.id}
              className="cm-search-result-row"
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                background: '#111b21', padding: '8px 12px', borderRadius: '10px',
                border: '1px solid #222d34'
              }}
            >
              <img
                src={song.thumbnail}
                alt={song.title}
                style={{ width: '60px', height: '36px', borderRadius: '6px', objectFit: 'cover' }}
              />
              <div style={{
                flex: 1, overflow: 'hidden', fontSize: '13px', fontWeight: 'bold',
                color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
              }}>
                {song.title}
              </div>
              <div className="cm-result-actions" style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => handleSelectSearchResult(song, true)}
                  style={{ ...styles.buttonPrimary, padding: '6px 12px', fontSize: '12px' }}
                >
                  ▶ Çal
                </button>
                <button
                  onClick={() => handleSelectSearchResult(song, false)}
                  style={{ ...styles.buttonPrimary, padding: '6px 12px', fontSize: '12px', background: '#008f6f' }}
                >
                  + Klasöre Ekle
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
