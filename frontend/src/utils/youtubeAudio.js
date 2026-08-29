const AUDIO_CACHE = {};
let currentAudio = null;
let audioCallbacks = { onPlay: null, onPause: null, onEnd: null, onTimeUpdate: null, onError: null };
let currentVideoId = null;

const API_BASE = 'https://couple-meeting.onrender.com';

async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) { clearTimeout(timer); throw e; }
}

async function extractAudioUrl(videoId) {
  if (AUDIO_CACHE[videoId]) return AUDIO_CACHE[videoId];

  // 1) Backend API (cobalt v10 proxy)
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/audio-url/${videoId}`, {}, 10000);
    if (res.ok) {
      const data = await res.json();
      if (data.url) { AUDIO_CACHE[videoId] = data.url; return data.url; }
    }
  } catch (e) {}

  // 2) Piped API (çalışan instance'lar)
  const pipedInstances = [
    'https://pipedapi.kavin.rocks',
    'https://piped-api.lunar.icu',
    'https://watchapi.whatever.social'
  ];
  for (const inst of pipedInstances) {
    try {
      const res = await fetchWithTimeout(`${inst}/streams/${videoId}`, {}, 5000);
      if (res.ok) {
        const data = await res.json();
        const audioStream = data.audioStreams?.find(s => s.mimeType?.includes('audio'));
        if (audioStream?.url) { AUDIO_CACHE[videoId] = audioStream.url; return audioStream.url; }
      }
    } catch (e) {}
  }

  // 3) Invidious instance'ları
  const invidiousInstances = [
    'https://inv.nadeko.net', 'https://invidious.nerdvpn.de',
    'https://vid.puffyan.us', 'https://yewtu.be',
    'https://invidious.lunar.icu', 'https://inv.tux.pizza'
  ];
  for (const inst of invidiousInstances) {
    try {
      const res = await fetchWithTimeout(`${inst}/latest_version?id=${videoId}&itag=140`, { redirect: 'follow' }, 5000);
      if (res.ok && res.url) { AUDIO_CACHE[videoId] = res.url; return res.url; }
    } catch (e) {}
  }

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
  audio.crossOrigin = 'anonymous';

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
    navigator.mediaSession.setActionHandler('previoustrack', null);
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
