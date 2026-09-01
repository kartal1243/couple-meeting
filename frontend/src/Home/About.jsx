export default function About() {
  return (
    <section className="cm-section">
      <div className="cm-section-head">
        <div>
          <h3>Couple Meeting Nedir?</h3>
          <p>Uzaktaki sevdiklerinle müzik ve video deneyimini birlikte yaşa.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, maxWidth: 960, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '28px 24px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎵</div>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Senkron Müzik Dinleme</div>
          <div style={{ color: '#8696a0', fontSize: 13, lineHeight: 1.7 }}>
            YouTube Music kataloğundan milyonlarca şarkıya eriş. Seçtiğin şarkıyı sevdiklerinle aynı anda,
            aynı saniyede dinle. Oda sahibi şarkıyı değiştirirken herkes otomatik olarak geçer.
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '28px 24px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎬</div>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Birlikte Video İzleme</div>
          <div style={{ color: '#8696a0', fontSize: 13, lineHeight: 1.7 }}>
            YouTube videolarını birlikte izle. Klip, belgesel, podcast — ne istersen.
            Herkes aynı kareyi görüyor, aynı anda güldüğünüzü hissedeceksin.
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '28px 24px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Anlık Sohbet</div>
          <div style={{ color: '#8696a0', fontSize: 13, lineHeight: 1.7 }}>
            Müzik dinlerken sohbet et. Mesaj gönder, emoji ile tepki ver, yanıtla.
            Oda içi sohbet ve global sohbet ile her zaman bağlı kal.
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '28px 24px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🤝</div>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Arkadaşlık Sistemi</div>
          <div style={{ color: '#8696a0', fontSize: 13, lineHeight: 1.7 }}>
            Profilini oluştur, arkadaşlarını bul ve ekle. Arkadaşlarının online durumunu gör,
            son görülmelerini takip et. Yeni insanlarla tanış.
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '28px 24px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Gizli Odalar</div>
          <div style={{ color: '#8696a0', fontSize: 13, lineHeight: 1.7 }}>
            Şifreli oda oluştur ve sadece davet ettiğin kişiler katılsın.
            2, 4 veya 8 kişilik odalar aç. Tema ve ayarları özelleştir.
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '28px 24px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📱</div>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Her Cihazda Çalışır</div>
          <div style={{ color: '#8696a0', fontSize: 13, lineHeight: 1.7 }}>
            Telefon, tablet, bilgisayar — hangi cihazı kullanırsan kullan.
            Arka planda müzik çalmaya devam eder. Uygulama indirmene gerek yok.
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '40px auto 0', textAlign: 'center', padding: '0 20px' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,.1), rgba(37,99,235,.1))', border: '1px solid rgba(124,58,237,.2)', borderRadius: 20, padding: '28px 24px' }}>
          <div style={{ color: '#a78bfa', fontSize: 11, fontWeight: 900, marginBottom: 4 }}>🚀 NASIL ÇALIŞIR?</div>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>3 Kolay Adım</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(124,58,237,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 8px' }}>1</div>
              <div style={{ color: '#e9edef', fontSize: 13, fontWeight: 700 }}>Oda Oluştur</div>
              <div style={{ color: '#8696a0', fontSize: 11 }}>Tek tıkla oda aç</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(37,99,235,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 8px' }}>2</div>
              <div style={{ color: '#e9edef', fontSize: 13, fontWeight: 700 }}>Arkadaşını Davet Et</div>
              <div style={{ color: '#8696a0', fontSize: 11 }}>Linki paylaş</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(0,168,132,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 8px' }}>3</div>
              <div style={{ color: '#e9edef', fontSize: 13, fontWeight: 700 }}>Birlikte Dinle</div>
              <div style={{ color: '#8696a0', fontSize: 11 }}>Müzik ve sohbet</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
