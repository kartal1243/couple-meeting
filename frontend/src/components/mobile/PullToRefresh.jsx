import { useState, useRef } from 'react';

const PullToRefresh = ({ onRefresh, children }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);

  const onTouchStart = (e) => {
    if (window.scrollY === 0) startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e) => {
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && window.scrollY === 0) setPullDistance(Math.min(delta * 0.5, 100));
  };

  const onTouchEnd = async () => {
    if (pullDistance >= 60) {
      setRefreshing(true);
      await onRefresh?.();
      setRefreshing(false);
    }
    setPullDistance(0);
  };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {pullDistance > 0 && (
        <div className="pull-indicator" style={{ height: pullDistance }}>
          <span className={refreshing ? 'anim-spin' : ''}>{refreshing ? '⏳' : '⬇️'}</span>
        </div>
      )}
      {children}
    </div>
  );
};

export default PullToRefresh;
