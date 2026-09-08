import { useRef } from 'react';

const SwipeHandler = ({ onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, children, style = {} }) => {
  const touchStart = useRef({ x: 0, y: 0 });

  const onTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onTouchEnd = (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStart.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStart.current.y;
    const absX = Math.abs(deltaX), absY = Math.abs(deltaY);
    if (Math.max(absX, absY) < 50) return;
    if (absX > absY) { deltaX > 0 ? onSwipeRight?.() : onSwipeLeft?.(); }
    else { deltaY > 0 ? onSwipeDown?.() : onSwipeUp?.(); }
  };

  return <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={style}>{children}</div>;
};

export default SwipeHandler;
