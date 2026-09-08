import { useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

const PullToRefresh = ({ onRefresh, children }) => {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const threshold = 80;

  const onTouchStart = (e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  };

  const onTouchMove = (e) => {
    if (!pulling) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.5, 120));
    }
  };

  const onTouchEnd = async () => {
    if (!pulling) return;
    setPulling(false);

    if (pullDistance >= threshold) {
      setRefreshing(true);
      try {
        await onRefresh?.();
      } catch (e) {}
      setRefreshing(false);
    }
    setPullDistance(0);
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ position: 'relative', minHeight: '100%' }}
    >
      <motion.div
        animate={{
          height: pullDistance > 0 ? pullDistance : 0,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
        transition={{ duration: 0.1 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', background: 'rgba(124,58,237,0.1)'
        }}
      >
        <motion.div
          animate={refreshing ? { rotate: 360 } : { rotate: pullDistance > threshold ? 180 : 0 }}
          transition={refreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : { duration: 0.2 }}
          style={{ fontSize: 24 }}
        >
          {refreshing ? '⏳' : '⬇️'}
        </motion.div>
      </motion.div>
      {children}
    </div>
  );
};

export default PullToRefresh;
