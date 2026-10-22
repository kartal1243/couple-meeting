import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackAdCtaClicked } from '../utils/analytics';

function LandingPage() {
  const navigate = useNavigate();

  const handleStartRoom = () => {
    trackAdCtaClicked('landing_page');
    navigate('/?action=create');
  };

  const features = [
    { icon: '🎬', title: 'YouTube Birlikte İzle', desc: 'Sevgilinle veya arkadaşlarınla aynı saniyede YouTube videosu izle. Film, dizi, müzik klibi, vlog — her şey senkronize.' },
    { icon: '🎵', title: 'Senkronize Müzik Dinle', desc: 'Favori şarkılarını paylaş, ortak çalma listeleri oluştur ve gece boyu aynı ritimde dinleyin.' },
    { icon: '🎤', title: 'Net Sesli & Yazılı Sohbet', desc: 'Video sesiyle karışmayan sesli sohbet ve anlık mesajlaşma ile yan yanaymış gibi konuşun.' },
    { icon: '🎲', title: 'Çift Oyunları & Uyum Testi', desc: 'Oda içinde eğlenceli çift soruları, müzik uyum testi ve mini oyunlarla unutulmaz anlar yaşayın.' },
    { icon: '🧾', title: 'Randevu Fişi (Date Receipt)', desc: 'Buluşma sonunda birlikte geçirdiğiniz dakikaları ve dinlediğiniz şarkıları gösteren hatıra fişinizi paylaşın.' },
    { icon: '🔒', title: 'Şifreli Özel Odalar', desc: 'Şifreli özel oda oluştur, sadece davet linkini gönderdiğin kişi girsin. İkinize özel sinema salonu.' },
    { icon: '👑', title: 'Couple Pass VIP (1 Öder 2 Kullanır)', desc: 'Kalıcı özel oda, 20 kişilik parti kapasitesi, özel romantik temalar ve VIP rozetleri.' },
    { icon: '📱', title: 'Uygulama İndirmeden Her Cihazda', desc: 'iPhone, Android, tablet ve bilgisayarda tarayıcıdan tek tıkla çalışır. Tamamen ücretsiz.' }
  ];

  const steps = [
    { num: '1', title: 'Özel Odanı Aç', desc: 'Tek tıkla ücretsiz ve şifreli odanı 5 saniyede kur.', icon: '🏠' },
    { num: '2', title: 'Linki Sevgiline At', desc: 'WhatsApp veya Instagram DM üzerinden davet linkini gönder.', icon: '💌' },
    { num: '3', title: 'Birlikte İzle & Konuş', desc: 'YouTube videosunu veya şarkıyı başlat, sesli sohbeti aç.', icon: '🎬' },
    { num: '4', title: 'Randevu Fişini Al', desc: 'Gece sonunda buluşma fişinizi indirip Story\'de paylaşın!', icon: '🧾' }
  ];

  const testimonials = [
    { name: 'Zeynep & Burak', text: 'Aramızda 600 km var ama her gece burada film izleyip sesli konuşarak uyuyoruz. "3-2-1 başlat" derdi bitti!', avatar: '💑' },
    { name: 'Ahmet R.', text: 'Müzik dinleme partileri ve oda içi çift soruları harika oluyor. Telefondan uygulama indirmeden girmek çok pratik.', avatar: '👨' },
    { name: 'Elif S.', text: 'Yakın arkadaş grubumuzla dizi bölümlerini aynı saniyede izleyip dedikodu yapmak için vazgeçilmezimiz oldu.', avatar: '👩‍🦰' }
  ];

  const faqs = [
    { q: 'Couple Meeting ücretsiz mi?', a: 'Evet! Couple Meeting ile oda açmak, birlikte video/müzik izlemek ve sesli sohbet etmek tamamen ücretsizdir. Kayıt bile olmadan misafir olarak hemen başlayabilirsin.' },
    { q: 'Sevgilimle sadece ikimize özel şifreli oda açabilir miyim?', a: 'Evet, oda oluştururken 2 kişilik kapasite seçip şifre koyabilirsin. Sadece linki ve şifreyi gönderdiğin kişi odaya katılabilir.' },
    { q: 'Telefondan (iPhone / Android) uygulama indirmeden çalışır mı?', a: 'Evet, Couple Meeting tüm mobil tarayıcılarda (Safari, Chrome) tam uyumludur. İstersen Android uygulamamızı veya PWA kısayolunu da kullanabilirsin.' },
    { q: 'Kaç kişi aynı anda odaya girebilir?', a: 'Ücretsiz odalarda 2 ila 8 kişi, VIP odalarda ise 20 kişiye kadar aynı anda senkronize izleme yapabilirsiniz.' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0e14, #0f172a, #1a1033)', color: '#e2e8f0', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .7; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .landing-section { animation: fadeInUp .6s ease-out; }
        .feature-card { transition: all .3s; }
        .feature-card:hover { transform: translateY(-4px); border-color: rgba(124,58,237,.3) !important; }
        .cta-btn { transition: all .2s; }
        .cta-btn:hover { transform: scale(1.03); box-shadow: 0 12px 40px rgba(124,58,237,.4) !important; }
        .faq-item { transition: all .3s; }
        .faq-item:hover { background: rgba(255,255,255,.04) !important; }
      `}</style>

      {/* Navbar */}
      <nav style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #00d4ff, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💕</div>
          <span style={{ fontWeight: 900, fontSize: 18 }}>Couple Meeting</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleStartRoom} className="cta-btn" style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>🚀 Hemen Oda Aç</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-section" style={{ padding: '80px 24px', textAlign: 'center', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: 'rgba(124,58,237,.1)', border: '1px solid rgba(124,58,237,.2)', color: '#a855f7', fontSize: 12, fontWeight: 800, marginBottom: 20 }}>✨ UYGULAMA İNDİRMEK YOK — %100 ÜCRETSİZ</div>
        <h1 style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 950, lineHeight: 1.1, marginBottom: 20 }}>
          Sevgilinle & Arkadaşlarınla <span style={{ background: 'linear-gradient(135deg, #00d4ff, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Aynı Anda</span> İzle
        </h1>
        <p style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#94a3b8', lineHeight: 1.7, marginBottom: 32, maxWidth: 640, margin: '0 auto 32px' }}>
          Mesafeleri sıfırla. YouTube videolarını ve müzikleri aynı saniyede senkronize izle, sesli ve yazılı sohbet et, çift oyunları oyna — uzakta olsan bile yan yana hisset.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleStartRoom} className="cta-btn" style={{ padding: '16px 32px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', fontWeight: 900, fontSize: 16, cursor: 'pointer', boxShadow: '0 8px 30px rgba(124,58,237,.3)' }}>
            🚀 Ücretsiz Özel Oda Aç
          </button>
          <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} className="cta-btn" style={{ padding: '16px 32px', borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: '#e2e8f0', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
            ❓ Nasıl Çalışır?
          </button>
        </div>
        <div style={{ display: 'flex', gap: 28, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
          {[{ n: '10.000+', l: 'Senkronize Buluşma' }, { n: '%100', l: 'Ücretsiz & Kayıtsız' }, { n: '7/24', l: 'Tüm Cihazlarda' }].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#a855f7' }}>{s.n}</div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="landing-section" style={{ padding: '60px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, textAlign: 'center', marginBottom: 12 }}>Neler Yapabilirsin?</h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginBottom: 40 }}>Uzak mesafe sevgilinle veya arkadaş grubunla kaliteli vakit geçirmek için her şey tek odada.</p>
        <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {features.map((f, i) => (
            <div key={i} className="feature-card" style={{
              background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)',
              borderRadius: 18, padding: '28px 24px', cursor: 'default'
            }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: '#fff' }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="landing-section" style={{ padding: '60px 24px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, textAlign: 'center', marginBottom: 12 }}>Nasıl Çalışır?</h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginBottom: 40 }}>4 basit adımda sevgilinle veya arkadaşlarınla buluş.</p>
        <div className="step-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', position: 'relative' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, rgba(124,58,237,.15), rgba(168,85,247,.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 14px', border: '1px solid rgba(124,58,237,.2)' }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#7c3aed', marginBottom: 6 }}>{s.num}</div>
              <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 6, color: '#fff' }}>{s.title}</h3>
              <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="landing-section" style={{ padding: '60px 24px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, textAlign: 'center', marginBottom: 12 }}>Çiftler & Kullanıcılar Ne Diyor?</h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginBottom: 40 }}>Topluluktan gelen gerçek geri bildirimler.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {testimonials.map((t, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)', borderRadius: 16, padding: '24px 20px' }}>
              <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, marginBottom: 16, fontStyle: 'italic' }}>"{t.text}"</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{t.avatar}</span>
                <span style={{ fontWeight: 800, fontSize: 13 }}>{t.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="landing-section" style={{ padding: '60px 24px', maxWidth: 700, margin: '0 auto' }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, textAlign: 'center', marginBottom: 12 }}>Sıkça Sorulan Sorular</h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginBottom: 40 }}>Merak ettiklerin.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {faqs.map((f, i) => (
            <div key={i} className="faq-item" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6, color: '#e2e8f0' }}>{f.q}</div>
              <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="landing-section" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 950, marginBottom: 16 }}>Bu Gece Odanızı Açın, Ücretsiz!</h2>
          <p style={{ fontSize: 16, color: '#94a3b8', marginBottom: 32 }}>Sevgilinle veya arkadaşlarınla buluşmak için tek yapman gereken odayı başlatıp linki göndermek.</p>
          <button onClick={handleStartRoom} className="cta-btn" style={{ padding: '18px 40px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', fontWeight: 900, fontSize: 18, cursor: 'pointer', boxShadow: '0 12px 40px rgba(124,58,237,.3)' }}>
            🚀 Hemen Özel Oda Oluştur
          </button>
          <p style={{ fontSize: 12, color: '#475569', marginTop: 16 }}>Kayıt şartı yoktur. Kredi kartı gerekmez.</p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,.05)', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Ana Sayfa', action: () => navigate('/') },
            { label: 'Topluluklar', action: () => navigate('/communities') },
            { label: 'Etkinlikler', action: () => navigate('/events') },
            { label: 'Blog & Rehber', action: () => navigate('/blog') }
          ].map((l, i) => (
            <button key={i} onClick={l.action} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>{l.label}</button>
          ))}
        </div>
        <p style={{ color: '#475569', fontSize: 11 }}>&copy; 2026 Couple Meeting. Tüm hakları saklıdır.</p>
      </footer>

      {/* SEO-friendly structured data for landing page */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Couple Meeting — Sevgilinle & Arkadaşlarınla Aynı Anda Film İzle, Müzik Dinle",
        "description": "Couple Meeting ile sevgilinle ve arkadaşlarınla aynı saniyede YouTube videosu izle, müzik paylaş, sesli sohbet et ve çift oyunları oyna.",
        "url": "https://couplemeeting.com.tr/landing",
        "mainEntity": {
          "@type": "FAQPage",
          "mainEntity": faqs.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": { "@type": "Answer", "text": f.a }
          }))
        }
      }) }} />
    </div>
  );
}

export default memo(LandingPage);
