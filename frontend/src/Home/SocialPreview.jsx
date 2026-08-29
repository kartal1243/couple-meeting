export default function SocialPreview({ globalMessages, setShowSocialModal }) {
  return (
    <section className="cm-section">
      <div className="cm-social-card">
        <div className="cm-social-grid">
          <div>
            <div className="cm-social-badge">🌐 GLOBAL TOPLULUK</div>
            <div className="cm-social-title">
              Dünyada da bağlan.
            </div>
            <div className="cm-social-desc">
              Global sohbette konuş, arkadaş ekle.
            </div>
            <div
              className="cm-social-link"
              onClick={() => setShowSocialModal(true)}
            >
              Sohbete Gir →
            </div>
          </div>
          <div className="cm-global-preview">
            {globalMessages.length > 0 ? (
              <>
                <div className="cm-preview-header">
                  <span className="cm-preview-live" />
                  <span>Canlı Sohbet</span>
                </div>
                {globalMessages.slice(-4).reverse().map((m, i) => (
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
                <div>💬</div>
                <div>İlk mesajı sen yaz.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
