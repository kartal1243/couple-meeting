const AUDIO_CACHE = {};
let currentAudio = null;
let audioCallbacks = { onPlay: null, onPause: null, onEnd: null, onTimeUpdate: null, onError: null };
let currentVideoId = null;

const API_BASE = 'https://couple-meeting.onrender.com';

async function extractAudioUrl(videoId) {
  if (AUDIO_CACHE[videoId]) return AUDIO_CACHE[videoId];

  try {
    const res = await fetch(`${API_BASE}/api/audio-url/${videoId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.url) { AUDIO_CACHE[videoId] = data.url; return data.url; }
    }
  } catch (e) {}

  return null;
}

function createAudioElement() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.onplay = null;
    currentAudio.onpause = null;
    currentAudio.onended = null;
    currentAudio.ontimeupdate = null;
    currentAudio.onerror = null;
    currentAudio.src = '';
  }

  const audio = new Audio();
  audio.preload = 'auto';

  audio.onplay = () => audioCallbacks.onPlay?.();
  audio.onpause = () => audioCallbacks.onPause?.();
  audio.onended = () => audioCallbacks.onEnd?.();
  audio.ontimeupdate = () => audioCallbacks.onTimeUpdate?.({ currentTime: audio.currentTime, duration: audio.duration });
  audio.onerror = (e) => audioCallbacks.onError?.(e);

  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => audio.play().catch(() => {}));
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime != null) audio.currentTime = details.seekTime;
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => audioCallbacks.onEnd?.());
  }

  currentAudio = audio;
  return audio;
}

export async function playYouTubeAudio(videoId, title = 'Couple Meeting', callbacks = {}) {
  audioCallbacks = { ...audioCallbacks, ...callbacks };
  currentVideoId = videoId;

  const audioUrl = await extractAudioUrl(videoId);
  if (!audioUrl) {
    callbacks.onError?.(new Error('Ses çıkarılamadı'));
    return null;
  }

  if (currentVideoId !== videoId) return null;

  const audio = createAudioElement();
  audio.src = audioUrl;

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title, artist: 'Couple Meeting', album: 'Birlikte Dinleme Odası',
      artwork: [
        { src: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, sizes: '96x96', type: 'image/jpeg' },
        { src: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, sizes: '512x512', type: 'image/jpeg' }
      ]
    });
  }

  try { await audio.play(); } catch (e) { console.warn('Autoplay engellendi:', e); }
  return audio;
}

export function pauseAudio() { currentAudio?.pause(); }
export function resumeAudio() { currentAudio?.play().catch(() => {}); }
export function seekAudio(time) { if (currentAudio) currentAudio.currentTime = time; }
export function getCurrentTime() { return currentAudio?.currentTime || 0; }
export function getDuration() { return currentAudio?.duration || 0; }
export function isAudioPlaying() { return currentAudio && !currentAudio.paused; }
export function getCurrentVideoId() { return currentVideoId; }
export function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.onplay = null;
    currentAudio.onpause = null;
    currentAudio.onended = null;
    currentAudio.ontimeupdate = null;
    currentAudio.onerror = null;
    currentAudio.src = '';
    currentAudio = null;
  }
  currentVideoId = null;
}
