export default function Features() {
  const features = [
    { icon: '🎵', title: 'Senkron Müzik', desc: 'Aynı şarkıyı aynı anda dinle, herkes aynı ritimde.', color: '#7c3aed', bg: 'rgba(124,58,237,.12)' },
    { icon: '🎬', title: 'Birlikte İzle', desc: 'YouTube videolarını birlikte izle, aynı saniyede.', color: '#2563eb', bg: 'rgba(37,99,235,.12)' },
    { icon: '💬', title: 'Gerçek Zamanlı Sohbet', desc: 'Mesajlaş, emoji gönder, anlık tepki ver.', color: '#00a884', bg: 'rgba(0,168,132,.12)' },
    { icon: '🤝', title: 'Arkadaşlık', desc: 'Profilini oluştur, arkadaşlarını bul, birlikte dinle.', color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
  ];

  return (
    <section className="cm-section" id="cm-room-box">
      <div className="cm-section-head">
        <div>
          <h3>İnsanların sevdiği tarafı</h3>
          <p>Oda aç, arkadaşını bul, konuş, müzik ekle. Hepsi tek yerde.</p>
        </div>
      </div>
      <div className="cm-feature-grid">
        {features.map((f, i) => (
          <div className="cm-feature" key={i}>
            <div className="cm-feature-icon" style={{ background: f.bg, color: f.color }}>{f.icon}</div>
            <b>{f.title}</b>
            <span>{f.desc}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
