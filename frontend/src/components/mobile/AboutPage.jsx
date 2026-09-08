const AboutPage = () => {
  return (
    <div className="mobile-page about-page">
      <div className="about-header">
        <div className="about-logo anim-float">💕</div>
        <h1 className="about-title">Couple Meeting</h1>
        <p className="about-subtitle">Arkadaslarinla birlikte izle, dinle, eglene</p>
      </div>

      <div className="about-cards">
        <div className="about-card">
          <span className="about-card-icon">🎵</span>
          <h3>Muzik Dinle</h3>
          <p>Arkadaslarinla ayni anda muzik dinle, playlist olustur</p>
        </div>

        <div className="about-card">
          <span className="about-card-icon">🎬</span>
          <h3>Video Izle</h3>
          <p>YouTube ve Vimeo videolarini senkron olarak izle</p>
        </div>

        <div className="about-card">
          <span className="about-card-icon">💬</span>
          <h3>Sohbet Et</h3>
          <p>Gercek zamanli mesajlasma ve sesli sohbet</p>
        </div>

        <div className="about-card">
          <span className="about-card-icon">👥</span>
          <h3>Arkadas Edin</h3>
          <p>Yeni arkadaslar bul, onlarla vakit gecir</p>
        </div>
      </div>

      <div className="about-stats">
        <div className="about-stat">
          <span className="about-stat-num">10K+</span>
          <span className="about-stat-label">Kullanici</span>
        </div>
        <div className="about-stat">
          <span className="about-stat-num">50K+</span>
          <span className="about-stat-label">Sohbet</span>
        </div>
        <div className="about-stat">
          <span className="about-stat-num">100K+</span>
          <span className="about-stat-label">Video</span>
        </div>
      </div>

      <div className="about-section">
        <h3>Biz Kimiz?</h3>
        <p>Couple Meeting, arkadaslarin birlikte vakit gecirecegi bir platformdur. Uzaktaki sevdiklerinle bile birlikte muzik dinleyebilir, video izleyebilir ve sohbet edebilirsin.</p>
      </div>

      <div className="about-section">
        <h3>Nasil Calisir?</h3>
        <div className="about-steps">
          <div className="about-step"><span>1</span> Oda olustur veya mevcut odaya katil</div>
          <div className="about-step"><span>2</span> Davet linkini arkadaslarinla paylas</div>
          <div className="about-step"><span>3</span> Birlikte izle, dinle, eglene!</div>
        </div>
      </div>

      <div className="about-footer">
        <p>Couple Meeting v1.0</p>
        <p>couplemeeting.com.tr</p>
        <div className="about-links">
          <a href="#">Gizlilik Politikasi</a>
          <a href="#">Kullanim Sartlari</a>
          <a href="#">Iletisim</a>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
