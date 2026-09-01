export default function Footer() {
  return (
    <footer className="cm-footer" style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, marginBottom: 32 }}>
          <div>
            <div className="cm-footer-text" style={{ marginBottom: 12 }}>
              <span style={{ fontWeight: 900, color: '#fff', fontSize: 18 }}>couple</span>
              <span style={{ fontWeight: 300, color: '#a78bfa', fontSize: 18 }}>meeting</span>
            </div>
            <div style={{ color: '#8696a0', fontSize: 12, lineHeight: 1.7 }}>
              Uzaktaki sevdiklerinle müzik ve video deneyimini birlikte yaşa. Aynı anda dinle, izle, sohbet et.
            </div>
          </div>

          <div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Ürün</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ color: '#8696a0', fontSize: 12, cursor: 'pointer' }}>Nasıl Çalışır?</span>
              <span style={{ color: '#8696a0', fontSize: 12, cursor: 'pointer' }}>Özellikler</span>
              <span style={{ color: '#8696a0', fontSize: 12, cursor: 'pointer' }}>VIP Üyelik</span>
              <span style={{ color: '#8696a0', fontSize: 12, cursor: 'pointer' }}>Fiyatlandırma</span>
            </div>
          </div>

          <div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Topluluk</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ color: '#8696a0', fontSize: 12, cursor: 'pointer' }}>Canlı Odalar</span>
              <span style={{ color: '#8696a0', fontSize: 12, cursor: 'pointer' }}>Global Sohbet</span>
              <span style={{ color: '#8696a0', fontSize: 12, cursor: 'pointer' }}>Arkadaşlık</span>
            </div>
          </div>

          <div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Destek</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ color: '#8696a0', fontSize: 12, cursor: 'pointer' }}>Geri Bildirim</span>
              <span style={{ color: '#8696a0', fontSize: 12, cursor: 'pointer' }}>Gizlilik Politikası</span>
              <span style={{ color: '#8696a0', fontSize: 12, cursor: 'pointer' }}>Kullanım Şartları</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ color: '#4a5568', fontSize: 11 }}>
            © 2026 couplemeeting.com.tr — Tüm hakları saklıdır.
          </div>
          <div style={{ color: '#4a5568', fontSize: 11 }}>
            Made with ❤️ in Turkey
          </div>
        </div>
      </div>
    </footer>
  );
}
