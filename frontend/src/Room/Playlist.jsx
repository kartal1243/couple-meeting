export default function Playlist({
  categories, selectedCategory, setSelectedCategory,
  newCategoryInput, setNewCategoryInput, handleCreateCategory,
  playMode, handleModeChange, filteredPlaylist, mediaSrc,
  handleSelectPlaylistItem, handleRemovePlaylistItem, currentTheme
}) {
  return (
    <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', background: '#0b141a' }}>
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              background: selectedCategory === cat ? currentTheme.primary : '#111b21',
              color: selectedCategory === cat ? '#fff' : '#8696a0',
              border: '1px solid #222d34', padding: '5px 10px', borderRadius: '16px',
              cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap'
            }}
          >
            📁 {cat}
          </button>
        ))}
      </div>

      <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '6px' }}>
        <input
          type="text"
          placeholder="+ Yeni Klasör..."
          value={newCategoryInput}
          onChange={(e) => setNewCategoryInput(e.target.value)}
          style={{
            flex: 1, padding: '6px 10px', fontSize: '11px',
            background: '#111b21', border: '1px solid #222d34', color: '#e9edef',
            borderRadius: '10px', outline: 'none'
          }}
        />
        <button
          type="submit"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary} 0%, #008f6f 100%)`,
            color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '12px',
            fontWeight: '700', cursor: 'pointer', fontSize: '11px'
          }}
        >
          Aç
        </button>
      </form>

      <div style={{ display: 'flex', gap: '4px', background: '#111b21', padding: '3px', borderRadius: '10px', border: '1px solid #222d34' }}>
        {[
          { mode: 'sequence', label: '▶ Sırayla' },
          { mode: 'shuffle', label: '🔀 Rastgele' },
          { mode: 'alphabetical', label: '🔤 A-Z' }
        ].map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => handleModeChange(mode)}
            style={{
              flex: 1, padding: '5px', borderRadius: '6px', border: 'none',
              background: playMode === mode ? currentTheme.primary : 'transparent',
              color: playMode === mode ? '#fff' : '#8696a0',
              fontWeight: 'bold', cursor: 'pointer', fontSize: '10px'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {filteredPlaylist.length === 0 ? (
        <div style={{ color: '#8696a0', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
          Bu klasör henüz boş.
        </div>
      ) : (
        filteredPlaylist.map((item) => (
          <div
            key={item.id}
            onClick={() => handleSelectPlaylistItem(item)}
            style={{
              background: mediaSrc === item.src ? 'rgba(0, 168, 132, 0.15)' : '#111b21',
              border: mediaSrc === item.src ? `1px solid ${currentTheme.primary}` : '1px solid #222d34',
              padding: '10px', borderRadius: '10px', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}
          >
            <div style={{
              fontSize: '12px', fontWeight: 'bold', color: '#fff',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1
            }}>
              {item.title}
            </div>
            <button
              onClick={(e) => handleRemovePlaylistItem(item.id, e)}
              style={{ background: 'transparent', border: 'none', color: '#ff4757', cursor: 'pointer' }}
            >
              🗑️
            </button>
          </div>
        ))
      )}
    </div>
  );
}
