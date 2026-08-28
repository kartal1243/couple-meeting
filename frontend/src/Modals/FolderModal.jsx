export default function FolderModal({
  pendingMediaItem, modalTargetCategory, setModalTargetCategory,
  categories, confirmAddToPlaylist, setShowFolderModal, currentTheme, styles
}) {
  if (!pendingMediaItem) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ ...styles.card, width: '400px', textAlign: 'left' }}>
        <h3 style={{ margin: '0 0 12px 0', color: currentTheme.primary, fontSize: '18px', fontWeight: '800' }}>
          📁 Hangi Klasöre Eklensin?
        </h3>
        <p style={{ fontSize: '13px', color: '#8696a0', marginBottom: '16px' }}>
          <strong>{pendingMediaItem.title}</strong> öğesini eklemek istediğiniz klasörü seçin:
        </p>

        <div style={{ marginBottom: '20px' }}>
          <select
            value={modalTargetCategory}
            onChange={(e) => setModalTargetCategory(e.target.value)}
            style={{
              ...styles.input, width: '100%', boxSizing: 'border-box',
              fontWeight: 'bold', color: currentTheme.primary, cursor: 'pointer'
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat} style={{ background: '#111b21', color: '#fff' }}>
                📁 {cat}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowFolderModal(false)}
            style={{
              flex: 1, padding: '10px', background: '#202c33', color: '#fff',
              border: '1px solid #222d34', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            İptal
          </button>
          <button onClick={confirmAddToPlaylist} style={{ flex: 1, ...styles.buttonPrimary }}>
            Listeye Kaydet ➕
          </button>
        </div>
      </div>
    </div>
  );
}
