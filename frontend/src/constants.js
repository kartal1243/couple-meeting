export const BACKEND_URL = window.location.origin;

export const AVATARS = ['🐱', '🐶', '🦊', '🐼', '👑', '👸', '🦁', '🐻'];

export const THEMES = {
  default: { bg: 'linear-gradient(135deg, #090d16 0%, #05070c 100%)', cardBg: '#111b21', primary: '#00a884' },
  purple: { bg: 'linear-gradient(135deg, #130f40 0%, #000000 100%)', cardBg: '#1e1b4b', primary: '#a855f7' },
  blue: { bg: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)', cardBg: '#1e293b', primary: '#38bdf8' },
  rose: { bg: 'linear-gradient(135deg, #2a0813 0%, #05070c 100%)', cardBg: '#3f0e1e', primary: '#fb7185' },
  gold: { bg: 'linear-gradient(135deg, #2a1f08 0%, #0a0a00 100%)', cardBg: '#2a2210', primary: '#f59e0b', vip: true },
  ocean: { bg: 'linear-gradient(135deg, #001a33 0%, #000d1a 100%)', cardBg: '#0a2540', primary: '#0ea5e9', vip: true },
  emerald: { bg: 'linear-gradient(135deg, #052e16 0%, #022c0e 100%)', cardBg: '#0c3d1f', primary: '#34d399', vip: true },
  sunset: { bg: 'linear-gradient(135deg, #3b1a08 0%, #1a0a00 100%)', cardBg: '#3b1a08', primary: '#f97316', vip: true }
};

export const VIP_PLANS = {
  monthly: { price: 29.90, duration: '30 gun', label: 'Aylik VIP', icon: '⭐' },
  yearly: { price: 199.90, duration: '1 yil', label: 'Yillik VIP', icon: '👑', savings: '%45' }
};

export const VIP_FEATURES = [
  { icon: '🎨', title: 'Ozel Temalar', desc: 'Gold, Ocean, Emerald, Sunset temalari' },
  { icon: '🛡️', title: 'VIP Oda', desc: 'Otomatik silinmeyen kalici odalar' },
  { icon: '👤', title: 'VIP Rozeti', desc: 'Profilinde altin rozet' },
  { icon: '🎵', title: 'Sinirsiz Playlist', desc: 'Sinirsiz sarki kaydetme' },
  { icon: '🚀', title: 'Oncelikli Destek', desc: 'Hizli teknik destek' },
  { icon: '🎯', title: 'Ozel Avatarlar', desc: 'VIP\'e ozel avatar secenekleri' }
];
