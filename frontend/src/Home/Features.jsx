export default function Features() {
  return (
    <section className="cm-section" id="cm-room-box">
      <div className="cm-section-head">
        <div>
          <h3>İnsanların sevdiği tarafı</h3>
          <p>Oda aç, arkadaşını bul, konuş, müzik ekle. Hepsi tek yerde.</p>
        </div>
      </div>
      <div className="cm-feature-grid">
        <div className="cm-feature">
          <div className="ico">🎬</div>
          <b>Senkron İzleme</b>
          <span>Aynı videoda aynı saniye. Oynat, durdur ve oda ile eşleştir.</span>
        </div>
        <div className="cm-feature">
          <div className="ico">🎵</div>
          <b>Ortak Müzik</b>
          <span>Arat, çalma listene ekle ve birlikte dinle.</span>
        </div>
        <div className="cm-feature">
          <div className="ico">💬</div>
          <b>Global Sohbet</b>
          <span>Odanın dışındaki insanlarla da konuş, keşfet.</span>
        </div>
        <div className="cm-feature">
          <div className="ico">🤝</div>
          <b>Arkadaşlık</b>
          <span>Profilini oluştur, durumunu yaz ve arkadaş ekle.</span>
        </div>
      </div>
    </section>
  );
}
