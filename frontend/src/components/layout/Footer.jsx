import { useNavigate } from 'react-router-dom';
import { trackVipModalOpened } from '../../utils/analytics';

export default function Footer({ setShowVipModal }) {
  const navigate = useNavigate();

  const handleOpenVip = () => {
    trackVipModalOpened();
    if (setShowVipModal) setShowVipModal(true);
  };

  return (
    <footer className="cm-footer" style={{ borderTop: '2px solid #0f172a', background: '#ffffff', marginTop: 40 }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '48px 20px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 36, marginBottom: 36 }}>
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 22 }}>🔥</span>
              <span style={{ fontWeight: 950, color: '#0f172a', fontSize: 20, letterSpacing: '-0.5px' }}>couple meeting</span>
            </div>
            <div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.65, fontWeight: 500 }}>
              Uzak mesafe sevgilileri ve yeni tanışanlar için senkronize video, müzik ve baş başa Sanal Date deneyimi. Aynı saniyede dinle, izle, hisset.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <a href="https://twitter.com/couplemeetingtr" target="_blank" rel="noopener noreferrer" style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontSize: 15, textDecoration: 'none', border: '1px solid #e2e8f0' }}>𝕏</a>
              <a href="https://instagram.com/couplemeetingtr" target="_blank" rel="noopener noreferrer" style={{ width: 36, height: 36, borderRadius: 10, background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48', fontSize: 15, textDecoration: 'none', border: '1px solid #fecdd3' }}>📷</a>
              <a href="https://github.com/kartal1243/couple-meeting" target="_blank" rel="noopener noreferrer" style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontSize: 15, textDecoration: 'none', border: '1px solid #e2e8f0' }}>⌨️</a>
            </div>
          </div>

          {/* Kolon 1: Ürün & Özellikler */}
          <div>
            <div style={{ color: '#0f172a', fontSize: 14, fontWeight: 900, marginBottom: 14 }}>Ürün & Deneyim</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="/date" onClick={(e) => { e.preventDefault(); navigate('/date'); }} style={{ color: '#475569', fontSize: 13, cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}>💘 Sanal Date (Canlı Eşleşme)</a>
              <a href="/landing" onClick={(e) => { e.preventDefault(); navigate('/landing'); }} style={{ color: '#475569', fontSize: 13, cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}>🎬 Birlikte Video & YouTube</a>
              <span onClick={handleOpenVip} style={{ color: '#475569', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>👑 Couple Pass VIP</span>
              <a href="/communities" onClick={(e) => { e.preventDefault(); navigate('/communities'); }} style={{ color: '#475569', fontSize: 13, cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}>🏘️ Topluluklar & Odalar</a>
            </div>
          </div>

          {/* Kolon 2: Keşfet & Rehber */}
          <div>
            <div style={{ color: '#0f172a', fontSize: 14, fontWeight: 900, marginBottom: 14 }}>Keşfet & Etkinlik</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="/events" onClick={(e) => { e.preventDefault(); navigate('/events'); }} style={{ color: '#475569', fontSize: 13, cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}>📅 Canlı Etkinlik Takvimi</a>
              <a href="/blog" onClick={(e) => { e.preventDefault(); navigate('/blog'); }} style={{ color: '#475569', fontSize: 13, cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}>📝 Çift & Film Rehberi (Blog)</a>
              <a href="/ads?angle=couple" onClick={(e) => { e.preventDefault(); navigate('/ads?angle=couple'); }} style={{ color: '#475569', fontSize: 13, cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}>💕 Uzak Mesafe Çift Odaları</a>
            </div>
          </div>

          {/* Kolon 3: Yasal & Güvenlik */}
          <div>
            <div style={{ color: '#0f172a', fontSize: 14, fontWeight: 900, marginBottom: 14 }}>Destek & Yasal</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="mailto:support@couplemeeting.com.tr" style={{ color: '#475569', fontSize: 13, cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}>✉️ support@couplemeeting.com.tr</a>
              <a href="/privacy.html" style={{ color: '#475569', fontSize: 13, cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}>🔒 Gizlilik Politikası</a>
              <a href="/child-safety.html" style={{ color: '#475569', fontSize: 13, cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}>🛡️ Topluluk Kuralları & Güvenlik</a>
              <a href="/delete-account.html" style={{ color: '#475569', fontSize: 13, cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}>🗑️ Hesap Silme Talebi</a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright bar */}
        <div style={{
          paddingTop: 24, borderTop: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
        }}>
          <div style={{ color: '#94a3b8', fontSize: 12.5, fontWeight: 600 }}>
            © 2026 Couple Meeting. Tüm hakları saklıdır. Sevgiyle tasarlandı.
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#64748b', fontWeight: 700 }}>
            <span>🌐 Türkiye (TR)</span>
            <span>•</span>
            <span>🇹🇷 Türkçe</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
