import { useRef, useState } from 'react';

const SwipeHandler = ({ onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, children, style = {} }) => {
  const touchStart = useRef({ x: 0, y: 0 });
  const [swiping, setSwiping] = useState(false);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setSwiping(true);
  };

  const onTouchEnd = (e) => {
    if (!swiping) return;
    setSwiping(false);

    const deltaX = e.changedTouches[0].clientX - touchStart.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStart.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (Math.max(absDeltaX, absDeltaY) < minSwipeDistance) return;

    if (absDeltaX > absDeltaY) {
      if (deltaX > 0) onSwipeRight?.();
      else onSwipeLeft?.();
    } else {
      if (deltaY > 0) onSwipeDown?.();
      else onSwipeUp?.();
    }
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: 'pan-y', ...style }}
    >
      {children}
    </div>
  );
};

export default SwipeHandler;
