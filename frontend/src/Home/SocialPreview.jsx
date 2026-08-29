export default function SocialPreview({ globalMessages, setShowSocialModal }) {
  return (
    <section className="cm-section">
      <div className="cm-social-card">
        <div className="cm-social-grid">
          <div>
            <div className="cm-social-badge">🌐 GLOBAL TOPLULUK</div>
            <div className="cm-social-title">
              Sadece odada değil,<br />dünyada da bağlan.
            </div>
            <div className="cm-social-desc">
              Global sohbette konuş, profilini doldur, arkadaşlık isteği gönder.
              Misafir olarak okuyabilir ve konuşabilirsin.
            </div>
            <button
              className="cm-big-btn cm-social-btn"
              onClick={() => setShowSocialModal(true)}
            >
              🌍 Sosyal Alanı Aç
            </button>
          </div>
          <div className="cm-global-preview">
            {globalMessages.length > 0 ? (
              <>
                <div className="cm-preview-header">
                  <span className="cm-preview-live" />
                  <span>Canlı Sohbet</span>
                  <span className="cm-preview-count">{globalMessages.length} mesaj</span>
                </div>
                {globalMessages.slice(-5).reverse().map((m, i) => (
                  <div className="cm-preview-msg" key={m.id || i}>
                    <div className="cm-preview-avatar">{m.avatar || '🐱'}</div>
                    <div className="cm-preview-content">
                      <b>{m.username || 'Misafir'}</b>
                      <span>{m.text}</span>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="cm-preview-empty">
                <div className="cm-preview-empty-icon">💬</div>
                <div>Global sohbet burada görünecek.</div>
                <div>İlk mesajı sen yaz. 👋</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
