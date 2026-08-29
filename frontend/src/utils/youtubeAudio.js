// YouTube'dan ses çıkarma ve HTML5 Audio ile çalma
const AUDIO_CACHE = {};
let currentAudio = null;
let audioCallbacks = { onPlay: null, onPause: null, onEnd: null, onTimeUpdate: null, onError: null };
let currentVideoId = null;

async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

async function extractAudioUrl(videoId) {
  if (AUDIO_CACHE[videoId]) return AUDIO_CACHE[videoId];

  const services = [
    async () => {
      const res = await fetchWithTimeout('https://api.cobalt.tools/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${videoId}`, audioFormat: 'mp3', isAudioOnly: true })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) return data.url;
      }
      throw new Error('cobalt failed');
    },
    async () => {
      const instances = ['https://inv.nadeko.net', 'https://invidious.nerdvpn.de', 'https://vid.puffyan.us', 'https://yewtu.be', 'https://invidious.lunar.icu'];
      for (const inst of instances) {
        try {
          const res = await fetchWithTimeout(`${inst}/latest_version?id=${videoId}&itag=140`, { redirect: 'follow' }, 4000);
          if (res.ok && res.url) return res.url;
        } catch (e) {}
      }
      throw new Error('invidious failed');
    },
    async () => {
      const res = await fetchWithTimeout(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`, {}, 3000);
      if (res.ok) {
        return null;
      }
      throw new Error('noembed failed');
    }
  ];

  for (const service of services) {
    try {
      const url = await service();
      if (url) {
        AUDIO_CACHE[videoId] = url;
        return url;
      }
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
