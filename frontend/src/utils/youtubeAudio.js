// YouTube'dan ses çıkarma ve HTML5 Audio ile çalma
// Arka planda çalışmaya izin verir

const AUDIO_CACHE = {};
let currentAudio = null;
let audioCallbacks = { onPlay: null, onPause: null, onEnd: null, onTimeUpdate: null, onError: null };

// YouTube ses URL'i çekme (çoklu kaynak deneme)
async function extractAudioUrl(videoId) {
  if (AUDIO_CACHE[videoId]) return AUDIO_CACHE[videoId];

  const services = [
    // 1. cobalt API (en güvenilir)
    async () => {
      const res = await fetch('https://api.cobalt.tools/api/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${videoId}`, isAudioOnly: true, aFormat: 'mp3' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) return data.url;
      }
      throw new Error('cobalt failed');
    },
    // 2. invidious instances
    async () => {
      const instances = ['https://inv.nadeko.net', 'https://invidious.nerdvpn.de', 'https://vid.puffyan.us'];
      for (const inst of instances) {
        try {
          const res = await fetch(`${inst}/latest_version?id=${videoId}&itag=140`, { redirect: 'follow' });
          if (res.ok && res.url) return res.url;
        } catch (e) {}
      }
      throw new Error('invidious failed');
    },
    // 3. proxy URL (basit)
    async () => {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
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

// Audio element oluştur
function createAudioElement() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
  }

  const audio = new Audio();
  audio.preload = 'auto';
  audio.crossOrigin = 'anonymous';

  audio.addEventListener('play', () => audioCallbacks.onPlay?.());
  audio.addEventListener('pause', () => audioCallbacks.onPause?.());
  audio.addEventListener('ended', () => audioCallbacks.onEnd?.());
  audio.addEventListener('timeupdate', () => {
    audioCallbacks.onTimeUpdate?.({ currentTime: audio.currentTime, duration: audio.duration });
  });
  audio.addEventListener('error', (e) => audioCallbacks.onError?.(e));

  // Mobilde arka plan desteği
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

// Ana fonksiyon: YouTube video ID ile ses çal
export async function playYouTubeAudio(videoId, title = 'Couple Meeting', callbacks = {}) {
  audioCallbacks = { ...audioCallbacks, ...callbacks };

  const audioUrl = await extractAudioUrl(videoId);
  if (!audioUrl) {
    callbacks.onError?.(new Error('Ses çıkarılamadı'));
    return null;
  }

  const audio = createAudioElement();
  audio.src = audioUrl;

  // MediaSession metadata
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
export function stopAudio() {
  if (currentAudio) { currentAudio.pause(); currentAudio.src = ''; currentAudio = null; }
}
