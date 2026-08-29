import { useEffect, useRef } from 'react';

export default function MusicPlayer({
  currentSong, isPlaying, volume, currentTheme, API_BASE,
  onEnded, onError
}) {
  const audioRef = useRef(null);
  const streamUrlRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, volume));
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying && streamUrlRef.current) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    streamUrlRef.current = null;
    audio.pause();

    fetch(`${API_BASE}/api/music/stream/${currentSong.videoId}`)
      .then(r => r.json())
      .then(data => {
        if (data.url) {
          streamUrlRef.current = data.url;
          audio.src = data.url;
          audio.load();
          if (isPlaying) audio.play().catch(() => {});
        }
      })
      .catch(() => onError?.('Ses akışı alınamadı'));

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        album: currentSong.album || '',
        artwork: [{ src: currentSong.thumbnail, sizes: '300x300', type: 'image/jpeg' }]
      });
      navigator.mediaSession.setActionHandler('play', () => {});
      navigator.mediaSession.setActionHandler('pause', () => {});
    }
  }, [currentSong?.videoId]);

  return (
    <audio ref={audioRef} onEnded={onEnded} onError={onError}
      preload="auto" crossOrigin="anonymous" />
  );
}
