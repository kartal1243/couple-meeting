import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import BottomNavBar from './BottomNavBar';
import OnboardingScreen from './OnboardingScreen';
import { isApp } from '../../utils/platform';

const MobileLayout = ({ children, onNavigate }) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    if (isApp()) {
      const done = localStorage.getItem('cm_onboarding_done');
      if (!done) setShowOnboarding(true);
    }
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    onNavigate?.(tab);
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 70 }}>
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>

      <div style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        {children}
      </div>

      <BottomNavBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default MobileLayout;
