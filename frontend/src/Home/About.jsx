export default function About() {
  const features = [
    {
      icon: '💘',
      title: 'Zevkine Göre Eşleş (Sanal Date)',
      desc: 'Müzik ve film tercihlerine göre anında baş başa 10 dakikalık romantik lounge odasına geç. Profil kaydırarak vakit kaybetme, ortak zevkle tanış.'
    },
    {
      icon: '🎬',
      title: '0 Gecikmeyle Birlikte İzle',
      desc: '"3, 2, 1 aynı anda başlat" çilesine son! YouTube videolarını, film fragmanlarını veya dizileri sevgilinle aynı milisaniyede izle, birlikte gülün.'
    },
    {
      icon: '🎵',
      title: 'Birlikte Müzik & Ortak Çalma Listesi',
      desc: 'Milyonlarca şarkıya erişin, ortak çalma listenizi oluşturun. Gece uyurken bile aynı şarkıyı aynı ritimde dinleyin, birbirinize şarkı ithaf edin.'
    },
    {
      icon: '🧊',
      title: '36 Soru & Çift Buzkıranları',
      desc: 'Sohbetin hiç tıkanmadığı, derin kimya ve tutku uyandıran interaktif soru kartları. Cevaplayın, anında %100 uyumunuzu kutlayın.'
    },
    {
      icon: '🎙️',
      title: 'Yankısız Kristal Netliğinde Ses',
      desc: 'Video sesiyle karışmayan, yankı yapmayan modern sesli sohbet altyapısı. Kilometrelerce uzakta olsanız bile yan yanaymış gibi fısıldaşın.'
    },
    {
      icon: '🔒',
      title: 'Şifreli Özel Çift Odaları & Tek Link',
      desc: 'Uygulama indirmeye gerek yok. Sadece sizin bildiğiniz şifreyle özel odanızı kurun, linki partnerinize gönderin; tek tıkla yanınıza katılsın.'
    }
  ];

  return (
    <section className="cm-section" style={{ textAlign: 'center' }}>
      <div className="cm-section-head" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 14px', borderRadius: 999, background: '#fff1f2',
          border: '1px solid #fecdd3', color: '#e11d48', fontSize: 11, fontWeight: 900, marginBottom: 12
        }}>
          ✨ AŞK & ARKADAŞLIK DENEYİMİ
        </div>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.8px', margin: 0 }}>
          Neden Couple Meeting?
        </h2>
        <p style={{ maxWidth: 560, margin: '8px auto 0', color: '#64748b', fontSize: 15, fontWeight: 500 }}>
          Mesafeleri sıfıra indiren, sadece sevgililer ve yeni tanışanlar için özel tasarlanmış dijital buluşma evi.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 22,
        maxWidth: 1140,
        margin: '0 auto',
        padding: '0 16px',
        textAlign: 'left'
      }}>
        {features.map((f, i) => (
          <div
            key={i}
            style={{
              background: '#ffffff',
              border: '1.5px solid rgba(253, 38, 125, 0.14)',
              borderRadius: 24,
              padding: '28px 24px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
              transition: 'all 0.25s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#fd267d';
              e.currentTarget.style.boxShadow = '0 16px 36px rgba(253,38,125,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(253, 38, 125, 0.14)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.03)';
            }}
          >
            <div style={{
              width: 50, height: 50, borderRadius: 16,
              background: 'linear-gradient(135deg, #fff1f2, #ffe4e6)',
              border: '1px solid #fecdd3',
              display: 'grid', placeItems: 'center', fontSize: 24, marginBottom: 16
            }}>
              {f.icon}
            </div>
            <h3 style={{ color: '#0f172a', fontSize: 18, fontWeight: 950, marginBottom: 8, letterSpacing: '-0.3px' }}>
              {f.title}
            </h3>
            <p style={{ color: '#64748b', fontSize: 13.5, lineHeight: 1.65, margin: 0, fontWeight: 500 }}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
