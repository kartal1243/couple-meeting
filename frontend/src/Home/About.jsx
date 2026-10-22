export default function About() {
  return (
    <section className="cm-section" style={{ textAlign: 'center' }}>
      <div className="cm-section-head" style={{ display: 'flex', justifyContent: 'center' }}>
        <div>
          <h3>Couple Meeting Nedir?</h3>
          <p>Uzak mesafe sevgilinle ve en yakın arkadaşlarınla aynı odada buluşma deneyimi.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, maxWidth: 960, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '28px 24px' }}>
          <div aria-hidden="true" style={{ fontSize: 32, marginBottom: 12 }}>🎬</div>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Senkronize Sinema & Video Odası</div>
          <div style={{ color: '#8696a0', fontSize: 13, lineHeight: 1.7 }}>
            "3, 2, 1 aynı anda başlat" derdine son! YouTube'dan film, dizi, klip veya vlog aç;
            sevgilinle aynı saniyede, aynı kareyi izleyip birlikte gülün.
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '28px 24px' }}>
          <div aria-hidden="true" style={{ fontSize: 32, marginBottom: 12 }}>🎵</div>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Birlikte Müzik Dinleme</div>
          <div style={{ color: '#8696a0', fontSize: 13, lineHeight: 1.7 }}>
            YouTube Music kataloğundan milyonlarca şarkıya eriş. Ortak çalma listenizi oluşturun,
            gece uyurken bile aynı şarkıyı aynı ritimde dinleyin.
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '28px 24px' }}>
          <div aria-hidden="true" style={{ fontSize: 32, marginBottom: 12 }}>🎤</div>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Sesli & Anlık Sohbet</div>
          <div style={{ color: '#8696a0', fontSize: 13, lineHeight: 1.7 }}>
            Video sesiyle yankı yapmadan net sesli sohbet et, anlık mesaj gönder ve ekranda uçuşan
            kalp/emoji tepkileriyle duygularını paylaş.
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '28px 24px' }}>
          <div aria-hidden="true" style={{ fontSize: 32, marginBottom: 12 }}>🎲</div>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Çift Oyunları & Uyum Testleri</div>
          <div style={{ color: '#8696a0', fontSize: 13, lineHeight: 1.7 }}>
            Sohbet tıkanırsa oda içindeki çift soruları, müzik uyum testi ve eğlenceli mini oyunlarla
            birbirinizi daha yakından tanıyın.
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '28px 24px' }}>
          <div aria-hidden="true" style={{ fontSize: 32, marginBottom: 12 }}>🧾</div>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Randevu Fişi (Date Night Receipt)</div>
          <div style={{ color: '#8696a0', fontSize: 13, lineHeight: 1.7 }}>
            Buluşma sonunda birlikte kaç dakika geçirdiğinizi, dinlediğiniz şarkıları ve mesaj sayınızı
            gösteren paylaşılabilir özel randevu fişinizi alın!
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '28px 24px' }}>
          <div aria-hidden="true" style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Şifreli Özel Odalar & Tüm Cihazlar</div>
          <div style={{ color: '#8696a0', fontSize: 13, lineHeight: 1.7 }}>
            Sadece ikinize özel şifreli oda kurun. Uygulama indirmeden iPhone, Android, tablet veya
            bilgisayardan tek linkle anında bağlanın.
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '40px auto 0', textAlign: 'center', padding: '0 20px' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,.1), rgba(37,99,235,.1))', border: '1px solid rgba(124,58,237,.2)', borderRadius: 20, padding: '28px 24px' }}>
          <div style={{ color: '#a78bfa', fontSize: 11, fontWeight: 900, marginBottom: 4 }}>🚀 NASIL ÇALIŞIR?</div>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>3 Kolay Adımda Randevu Odanı Kur</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(124,58,237,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 8px' }}>1</div>
              <div style={{ color: '#e9edef', fontSize: 13, fontWeight: 700 }}>Özel Oda Oluştur</div>
              <div style={{ color: '#8696a0', fontSize: 11 }}>5 saniyede ücretsiz aç</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(37,99,235,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 8px' }}>2</div>
              <div style={{ color: '#e9edef', fontSize: 13, fontWeight: 700 }}>Sevgiline / Arkadaşına At</div>
              <div style={{ color: '#8696a0', fontSize: 11 }}>WhatsApp veya DM'den linki paylaş</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(0,168,132,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 8px' }}>3</div>
              <div style={{ color: '#e9edef', fontSize: 13, fontWeight: 700 }}>Birlikte İzle & Konuş</div>
              <div style={{ color: '#8696a0', fontSize: 11 }}>Aynı saniyede sinema ve müzik keyfi</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
