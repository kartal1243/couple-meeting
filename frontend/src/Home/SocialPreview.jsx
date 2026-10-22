export default function SocialPreview({ globalMessages, setShowSocialModal }) {
  const safeMsgs = Array.isArray(globalMessages) ? globalMessages : [];

  return (
    <section className="cm-section">
      <div style={{
        padding: '36px 30px',
        borderRadius: 28,
        background: 'linear-gradient(135deg, #ffffff 0%, #fff5f7 100%)',
        border: '1.5px solid rgba(253, 38, 125, 0.22)',
        boxShadow: '0 16px 40px rgba(253, 38, 125, 0.08)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 260, flex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 999, background: '#fff1f2',
              color: '#e11d48', fontSize: 11, fontWeight: 900, marginBottom: 12
            }}>
              🌐 CANLI TOPLULUK & FLÖRT
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', color: '#0f172a', fontWeight: 950, letterSpacing: '-0.7px', lineHeight: 1.15, margin: '0 0 10px' }}>
              Binlerce İnsan Şu An <br />
              <span style={{
                background: 'linear-gradient(135deg, #fd267d 0%, #ff6036 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Burada Konuşuyor.
              </span>
            </h2>
            <p style={{ color: '#64748b', fontSize: 14.5, lineHeight: 1.6, marginBottom: 20, maxWidth: 440, fontWeight: 500 }}>
              Global sohbette müzik zevkini paylaş, yeni insanlarla tanış, arkadaş ekle veya baş başa Sanal Date&apos;e davet et.
            </p>
            <button
              type="button"
              onClick={() => setShowSocialModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '13px 26px', borderRadius: 999, border: 'none',
                background: 'linear-gradient(135deg, #fd267d, #ff6036)',
                color: '#ffffff', fontSize: 14, fontWeight: 900, cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(253, 38, 125, 0.35)',
                transition: 'all .2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <span>Canlı Sohbete Katıl</span>
              <span style={{ fontSize: 16 }}>→</span>
            </button>
          </div>

          {/* Right Live Stream Box */}
          <div style={{
            flex: '1 1 300px', maxWidth: 440,
            display: 'flex', flexDirection: 'column', gap: 6,
            maxHeight: 280, overflow: 'hidden',
            borderRadius: 20, background: '#ffffff',
            padding: 16, border: '1.5px solid rgba(15, 23, 42, 0.08)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,.4)', animation: 'cmLivePulse 2s ease-in-out infinite' }} />
              <span style={{ color: '#0f172a', fontSize: 12, fontWeight: 900 }}>GLOBAL CANLI AKIŞ</span>
              <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 11, fontWeight: 700 }}>{safeMsgs.length} mesaj</span>
            </div>

            {safeMsgs.length > 0 ? (
              safeMsgs.slice(-5).reverse().map((m, i) => (
                <div key={m.id || i} style={{
                  display: 'flex', gap: 10, alignItems: 'center',
                  padding: '7px 10px', borderRadius: 12,
                  background: i === 0 ? '#fff1f2' : '#f8fafc',
                  border: i === 0 ? '1px solid #fecdd3' : '1px solid transparent'
                }}>
                  <div style={{
                    width: 32, height: 32, display: 'grid', placeItems: 'center',
                    background: '#ffffff', borderRadius: 10, flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                  }}>
                    {m.avatar && m.avatar.startsWith('data:image') && m.avatar.length > 30
                      ? <img src={m.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                      : <span style={{ fontSize: 16 }}>{m.avatar || '🐱'}</span>}
                  </div>
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{ fontSize: 11.5, color: '#0f172a', fontWeight: 900 }}>{m.username || 'Misafir'}</div>
                    <div style={{ fontSize: 12, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{m.text}</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: 13 }}>
                💬 Henüz mesaj yok. İlk mesajı sen gönder!
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
