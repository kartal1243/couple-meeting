export default function Hero({ authUser, openAuth, setActiveTab, setInRoom }) {
  return (
    <section className="cm-hero">
      <div>
        <div className="cm-badge">
          <span className="cm-live-dot" /> Uzaklık sadece bir detay.
        </div>
        <h1>Birlikte izleyin.<br /><span>Birlikte hissedin.</span></h1>
        <p>
          Sevgilinle, arkadaşınla veya yeni insanlarla aynı videoyu aynı anda izle,
          müzik dinle ve anlık sohbet et. Hesap açmak zorunda değilsin; ama hesabın
          olursa profilin, arkadaşların ve sosyal özelliklerin yanında kalır.
        </p>
        <div className="cm-hero-actions">
          <button
            className="cm-big-btn"
            onClick={() => {
              setActiveTab('create');
              setInRoom(false);
              document.getElementById('cm-room-box')?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{ background: 'linear-gradient(135deg,#00a884,#008f6f)' }}
          >
            🚀 Hemen Oda Oluştur
          </button>
          <button
            className="cm-big-btn"
            onClick={() => openAuth(authUser ? 'login' : 'register')}
            style={{ background: '#202c33', border: '1px solid #34424c' }}
          >
            👤 Hesapla Daha Fazlasını Yap
          </button>
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 22, color: '#778590', fontSize: 11, fontWeight: 800 }}>
          <span>✓ Misafir giriş</span>
          <span>✓ Arkadaş sistemi</span>
          <span>✓ Global sohbet</span>
          <span>✓ Profil & durum</span>
        </div>
      </div>

      <div className="cm-hero-card">
        <div className="cm-floating-chip cm-chip-a">💬 "Başlattım, gelsene ❤️"</div>
        <div className="cm-floating-chip cm-chip-b">🟢 2 kişi odada</div>
        <div className="cm-floating-chip cm-chip-c">❤️ birlikte 12:48</div>
        <div className="cm-now-playing">
          <div className="cm-mini-top">
            <span>NOW PLAYING</span>
            <span style={{ color: '#53e6bc' }}>● LIVE</span>
          </div>
          <div>
            <div className="cm-cover"></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 900 }}>Our Little Moment</div>
              <div style={{ color: '#778590', fontSize: 11, marginTop: 5 }}>Couple Meeting Radio</div>
            </div>
            <div className="cm-wave">
              {Array.from({ length: 7 }).map((_, i) => <i key={i} />)}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#7f8c98', fontSize: 12 }}>
            <span>♡ 248</span>
            <span style={{ color: '#53e6bc' }}>◀︎ 2:18 ━━━━━ 4:12 ▶︎</span>
            <span>♡</span>
          </div>
        </div>
      </div>
    </section>
  );
}
