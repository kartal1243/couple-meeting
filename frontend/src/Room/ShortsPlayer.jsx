import YouTube from 'react-youtube';
import { useCallback, useEffect, useRef, useState, memo } from 'react';

function ShortsPlayer({ videoIds, currentIndex, isHost, socket, roomId, onExit }) {
  const [currentIdx, setCurrentIdx] = useState(currentIndex || 0);
  const [liked, setLiked] = useState({});
  const containerRef = useRef(null);
  const touchStartRef = useRef(null);
  const isNavigatingRef = useRef(false);

  const currentVideoId = videoIds?.[currentIdx];

  useEffect(() => {
    setCurrentIdx(currentIndex || 0);
  }, [currentIndex]);

  useEffect(() => {
    if (!socket) return;
    const handleNavigate = (data) => {
      setCurrentIdx(data.currentIndex);
    };
    const handleExit = () => { if (onExit) onExit(); };
    socket.on('shorts_navigated', handleNavigate);
    socket.on('shorts_mode_exited', handleExit);
    return () => {
      socket.off('shorts_navigated', handleNavigate);
      socket.off('shorts_mode_exited', handleExit);
    };
  }, [socket, onExit]);

  const navigate = useCallback((direction) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setTimeout(() => { isNavigatingRef.current = false; }, 400);

    if (isHost && socket && roomId) {
      socket.emit('shorts_navigate', { roomId, direction });
    } else if (!isHost) {
      if (direction === 'next' && currentIdx < (videoIds?.length || 1) - 1) {
        setCurrentIdx(prev => prev + 1);
      } else if (direction === 'prev' && currentIdx > 0) {
        setCurrentIdx(prev => prev - 1);
      }
    }
  }, [isHost, socket, roomId, currentIdx, videoIds?.length]);

  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartRef.current === null) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) {
      navigate(diff > 0 ? 'next' : 'prev');
    }
    touchStartRef.current = null;
  }, [navigate]);

  const handleWheel = useCallback((e) => {
    if (Math.abs(e.deltaY) > 30) {
      navigate(e.deltaY > 0 ? 'next' : 'prev');
    }
  }, [navigate]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown' || e.key === 'j') navigate('next');
    else if (e.key === 'ArrowUp' || e.key === 'k') navigate('prev');
    else if (e.key === 'Escape' && onExit) onExit();
  }, [navigate, onExit]);

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.focus();
  }, []);

  const toggleLike = (id) => {
    setLiked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!videoIds || videoIds.length === 0) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16, color: '#94a3b8', background: '#0a0e14'
      }}>
        <div style={{ fontSize: 48 }}>📱</div>
        <p style={{ fontSize: 15, fontWeight: 700 }}>Shorts listesi boş</p>
        {onExit && (
          <button onClick={onExit} style={{
            padding: '10px 24px', borderRadius: 12, border: 'none',
            background: 'rgba(255,255,255,.08)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer'
          }}>
            Normal moda dön
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      style={{
        width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
        background: '#000', borderRadius: 12, outline: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
    >
      {/* YouTube embed */}
      <div style={{
        width: '100%', height: '100%', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {currentVideoId && (
          <YouTube
            videoId={currentVideoId}
            opts={{
              width: '100%',
              height: '100%',
              playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, playsinline: 1, disablekb: 1 }
            }}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            onEnd={() => navigate('next')}
          />
        )}
      </div>

      {/* Gradient overlays */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 80,
        background: 'linear-gradient(180deg, rgba(0,0,0,.6), transparent)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
        background: 'linear-gradient(0deg, rgba(0,0,0,.7), transparent)', pointerEvents: 'none'
      }} />

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 12, left: 14, right: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10
      }}>
        <span style={{
          color: '#fff', fontSize: 14, fontWeight: 800,
          textShadow: '0 1px 4px rgba(0,0,0,.8)'
        }}>
          Shorts {currentIdx + 1}/{videoIds.length}
        </span>
        {onExit && (
          <button onClick={onExit} style={{
            padding: '6px 14px', borderRadius: 20, border: 'none',
            background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(8px)',
            color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer'
          }}>
            ✕ Çık
          </button>
        )}
      </div>

      {/* Right side actions (like, share) */}
      <div style={{
        position: 'absolute', right: 12, bottom: 140, display: 'flex',
        flexDirection: 'column', gap: 18, zIndex: 10
      }}>
        <button onClick={() => toggleLike(currentVideoId)} style={{
          width: 44, height: 44, borderRadius: 22, border: 'none',
          background: liked[currentVideoId] ? 'rgba(239,68,68,.3)' : 'rgba(255,255,255,.12)',
          color: liked[currentVideoId] ? '#ef4444' : '#fff', fontSize: 20,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)', transition: 'all .2s'
        }}>
          {liked[currentVideoId] ? '❤️' : '🤍'}
        </button>
        <button onClick={() => {
          if (navigator.share) navigator.share({ title: 'Shorts', url: `https://www.youtube.com/shorts/${currentVideoId}` });
          else navigator.clipboard?.writeText(`https://www.youtube.com/shorts/${currentVideoId}`);
        }} style={{
          width: 44, height: 44, borderRadius: 22, border: 'none',
          background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: 18,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)'
        }}>
          ↗
        </button>
      </div>

      {/* Navigation arrows for non-touch */}
      {!isHost && (
        <>
          <button onClick={() => navigate('prev')} style={{
            position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)',
            width: 36, height: 36, borderRadius: 18, border: 'none',
            background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 16,
            cursor: 'pointer', opacity: currentIdx > 0 ? 1 : 0.3,
            pointerEvents: currentIdx > 0 ? 'auto' : 'none',
            backdropFilter: 'blur(4px)', zIndex: 10
          }}>
            ▲
          </button>
          <button onClick={() => navigate('next')} style={{
            position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)',
            width: 36, height: 36, borderRadius: 18, border: 'none',
            background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 16,
            cursor: 'pointer', opacity: currentIdx < videoIds.length - 1 ? 1 : 0.3,
            pointerEvents: currentIdx < videoIds.length - 1 ? 'auto' : 'none',
            backdropFilter: 'blur(4px)', zIndex: 10
          }}>
            ▼
          </button>
        </>
      )}

      {/* Progress dots */}
      <div style={{
        position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 4, zIndex: 10
      }}>
        {videoIds.slice(Math.max(0, currentIdx - 5), currentIdx + 6).map((_, i) => {
          const realIdx = Math.max(0, currentIdx - 5) + i;
          return (
            <div key={realIdx} style={{
              width: realIdx === currentIdx ? 16 : 6, height: 6, borderRadius: 3,
              background: realIdx === currentIdx ? '#fff' : 'rgba(255,255,255,.3)',
              transition: 'all .3s'
            }} />
          );
        })}
      </div>

      {/* Scroll hint */}
      <div style={{
        position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,.4)', fontSize: 11, fontWeight: 600, zIndex: 10
      }}>
        {isHost ? 'Host kontrolü: Yukarı/Aşağı kaydır' : 'Yukarı/Aşağı kaydır'}
      </div>
    </div>
  );
}

export default memo(ShortsPlayer);
