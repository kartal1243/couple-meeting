import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  {
    icon: '🎵',
    title: 'Müziklerini Dinle',
    description: 'Müzik çalma listelerini oluştur ve arkadaşlarınla birlikte dinle',
    color: '#7c3aed'
  },
  {
    icon: '💬',
    title: 'Sohbet Et',
    description: 'Arkadaşlarınla anlık mesajlaşma ve sesli sohbet',
    color: '#ec4899'
  },
  {
    icon: '🎬',
    title: 'Birlikte İzle',
    description: 'YouTube ve Vimeo videolarını senkron olarak izle',
    color: '#06b6d4'
  },
  {
    icon: '🚀',
    title: 'Hemen Başla',
    description: 'Ücretsiz hesap oluştur ve arkadaşlarını davet et',
    color: '#10b981'
  }
];

const OnboardingScreen = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('cm_onboarding_done', 'true');
      onComplete();
    }
  };

  const skip = () => {
    localStorage.setItem('cm_onboarding_done', 'true');
    onComplete();
  };

  const step = steps[currentStep];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: `linear-gradient(135deg, ${step.color}20, #0a0e14)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 40
      }}
    >
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={skip}
        style={{
          position: 'absolute', top: 50, right: 20, right: 'env(safe-area-inset-right, 20px)',
          background: 'none', border: 'none', color: '#6b7280', fontSize: 16, cursor: 'pointer'
        }}
      >
        Geç ⏭️
      </motion.button>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30 }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ fontSize: 80 }}
          >
            {step.icon}
          </motion.div>

          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, textAlign: 'center' }}>
            {step.title}
          </h2>

          <p style={{ fontSize: 16, color: '#9ca3af', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
            {step.description}
          </p>
        </motion.div>
      </AnimatePresence>

      <div style={{ display: 'flex', gap: 8, marginTop: 50 }}>
        {steps.map((_, i) => (
          <motion.div
            key={i}
            animate={{ width: i === currentStep ? 30 : 8, background: i === currentStep ? step.color : '#374151' }}
            style={{ height: 8, borderRadius: 4 }}
          />
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={nextStep}
        style={{
          marginTop: 40, padding: '16px 60px', borderRadius: 16,
          background: `linear-gradient(135deg, ${step.color}, ${step.color}cc)`,
          border: 'none', color: '#fff', fontSize: 18, fontWeight: 700,
          cursor: 'pointer', boxShadow: `0 8px 30px ${step.color}40`
        }}
      >
        {currentStep === steps.length - 1 ? 'Başla 🚀' : 'Devam Et →'}
      </motion.button>
    </motion.div>
  );
};

export default OnboardingScreen;
