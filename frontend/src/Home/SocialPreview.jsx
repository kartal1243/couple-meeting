export default function SocialPreview({ globalMessages, setShowSocialModal }) {
  return (
    <section className="cm-section">
      <div className="cm-social-card">
        <div className="cm-social-grid">
          <div>
            <div style={{ color: '#53e6bc', fontSize: 11, fontWeight: 900 }}>🌐 GLOBAL TOPLULUK</div>
            <div style={{ fontSize: 28, color: '#fff', fontWeight: 950, letterSpacing: -1, marginTop: 7 }}>
              Sadece odada değil, dünyada da bağlan.
            </div>
            <div style={{ color: '#7f8c98', fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>
              Global sohbette konuş, profilini doldur, arkadaşlık isteği gönder.
              Misafir olarak okuyabilir ve konuşabilirsin; arkadaşlık ve profil özellikleri hesapla açılır.
            </div>
            <button
              className="cm-big-btn"
              onClick={() => setShowSocialModal(true)}
              style={{ marginTop: 18, background: 'linear-gradient(135deg,#3742fa,#5352ed)' }}
            >
              🌍 Sosyal Alanı Aç
            </button>
          </div>
          <div className="cm-global-preview">
            {globalMessages.slice(-5).reverse().map((m, i) => (
              <div className="cm-preview-msg" key={m.id || i}>
                <div style={{ fontSize: 19 }}>{m.avatar || '🐱'}</div>
                <div>
                  <b>{m.username || 'Misafir'}</b>
                  <div style={{ color: '#8d9aa5', fontSize: 11, marginTop: 2 }}>{m.text}</div>
                </div>
              </div>
            ))}
            {globalMessages.length === 0 && (
              <div style={{ color: '#75838e', fontSize: 12, padding: 20, textAlign: 'center' }}>
                Global sohbet burada görünecek. İlk mesajı sen yaz. 👋
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
