import { useState, useEffect } from 'react';
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

  if (showOnboarding) return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;

  return (
    <div className="mobile-layout">
      <div className="mobile-content">{children}</div>
      <BottomNavBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default MobileLayout;
