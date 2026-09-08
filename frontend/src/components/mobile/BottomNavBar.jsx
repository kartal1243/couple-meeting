import { useState } from 'react';
import { motion } from 'framer-motion';

const tabs = [
  { id: 'home', icon: '🏠', label: 'Ana Sayfa' },
  { id: 'chat', icon: '💬', label: 'Sohbet' },
  { id: 'friends', icon: '👥', label: 'Arkadaşlar' },
  { id: 'settings', icon: '⚙️', label: 'Ayarlar' },
];

const BottomNavBar = ({ activeTab, onTabChange }) => {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(15, 15, 25, 0.95)', backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '8px 0', paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      zIndex: 9998
    }}>
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          whileTap={{ scale: 0.9 }}
          onClick={() => onTabChange(tab.id)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 2, background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 12px', borderRadius: 12,
            background: activeTab === tab.id ? 'rgba(124,58,237,0.2)' : 'transparent',
          }}
        >
          <span style={{ fontSize: 20 }}>{tab.icon}</span>
          <span style={{
            fontSize: 10, fontWeight: activeTab === tab.id ? 700 : 500,
            color: activeTab === tab.id ? '#a78bfa' : '#6b7280',
          }}>{tab.label}</span>
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              style={{
                position: 'absolute', bottom: -4, width: 20, height: 3,
                background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                borderRadius: 2,
              }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
};

export default BottomNavBar;
