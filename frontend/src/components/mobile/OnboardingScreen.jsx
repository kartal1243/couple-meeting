import { useState } from 'react';

const steps = [
  { icon: '🎵', title: 'Müziklerini Dinle', description: 'Müzik çalma listelerini oluştur ve arkadaşlarınla birlikte dinle' },
  { icon: '💬', title: 'Sohbet Et', description: 'Arkadaşlarınla anlık mesajlaşma ve sesli sohbet' },
  { icon: '🎬', title: 'Birlikte İzle', description: 'YouTube ve Vimeo videolarını senkron olarak izle' },
  { icon: '🚀', title: 'Hemen Başla', description: 'Ücretsiz hesap oluştur ve arkadaşlarını davet et' }
];

const OnboardingScreen = ({ onComplete }) => {
  const [current, setCurrent] = useState(0);

  const next = () => {
    if (current < steps.length - 1) setCurrent(current + 1);
    else { localStorage.setItem('cm_onboarding_done', 'true'); onComplete(); }
  };

  const skip = () => { localStorage.setItem('cm_onboarding_done', 'true'); onComplete(); };

  return (
    <div className="onboarding-overlay">
      <button className="onboarding-skip" onClick={skip}>Gec ⏭️</button>
      <div className="onboarding-content anim-scale-in">
        <div className="onboarding-icon anim-float">{steps[current].icon}</div>
        <h2 className="onboarding-title">{steps[current].title}</h2>
        <p className="onboarding-desc">{steps[current].description}</p>
      </div>
      <div className="onboarding-dots">
        {steps.map((_, i) => (
          <div key={i} className={`onboarding-dot ${i === current ? 'active' : ''}`} />
        ))}
      </div>
      <button className="onboarding-btn" onClick={next}>
        {current === steps.length - 1 ? 'Basla 🚀' : 'Devam Et →'}
      </button>
    </div>
  );
};

export default OnboardingScreen;
