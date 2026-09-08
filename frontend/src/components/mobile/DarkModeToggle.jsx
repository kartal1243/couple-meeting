import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const DarkModeToggle = ({ isDark, onToggle }) => {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
        borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
        background: isDark ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.05)',
        cursor: 'pointer', width: '100%'
      }}
    >
      <span style={{ fontSize: 20 }}>{isDark ? '🌙' : '☀️'}</span>
      <span style={{ color: '#fff', fontSize: 14, fontWeight: 500, flex: 1, textAlign: 'left' }}>
        {isDark ? 'Karanlık Mod' : 'Aydınlık Mod'}
      </span>
      <div style={{
        width: 44, height: 24, borderRadius: 12,
        background: isDark ? '#7c3aed' : '#374151',
        padding: 2, cursor: 'pointer', position: 'relative'
      }}>
        <motion.div
          animate={{ x: isDark ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            width: 20, height: 20, borderRadius: '50%',
            background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        />
      </div>
    </motion.button>
  );
};

export default DarkModeToggle;
