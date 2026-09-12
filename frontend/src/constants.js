export const BACKEND_URL = (window.location.protocol === 'capacitor:' || window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'https://couplemeeting.com.tr'
  : window.location.origin;

export const AVATARS = ['🐱', '🐶', '🦊', '🐼', '👑', '👸', '🦁', '🐻'];

export const VIP_AVATARS = ['🦄', '🐲', '🧙', '🧛', '🦸', '🧑‍🚀', '🧑‍🎤', '🧑‍💻', '💀', '👽', '🤖', '🎃'];

export const VIP_LEVELS = {
  0: { label: '', color: '#64748b', icon: '', frameColor: 'transparent', gradient: '' },
  1: { label: 'Bronze VIP', color: '#cd7f32', icon: '🥉', frameColor: '#cd7f32', gradient: 'linear-gradient(135deg, #cd7f32, #a0522d)' },
  2: { label: 'Silver VIP', color: '#c0c0c0', icon: '🥈', frameColor: '#c0c0c0', gradient: 'linear-gradient(135deg, #c0c0c0, #a8a8a8)' },
  3: { label: 'Gold VIP', color: '#f59e0b', icon: '👑', frameColor: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #f97316)' },
  4: { label: 'Diamond VIP', color: '#06b6d4', icon: '💎', frameColor: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }
};

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
  { icon: '🏆', title: 'VIP Rozet Seviyeleri', desc: 'Bronze, Silver, Gold, Diamond cerceve' },
  { icon: '👥', title: '20 Kisiye Kadar Oda', desc: 'Normal 8, VIP 20 kisi' },
  { icon: '👻', title: 'Gorunmez Mod', desc: 'Sadece arkadaslar gorun' },
  { icon: '👀', title: 'Ziyaretcileri Gor', desc: 'Kim profiline bakti ogren' },
  { icon: '🚫', title: 'Reklamsiz', desc: 'Reklamlari tamamen kaldir' },
  { icon: '🎭', title: 'Ozel Avatarlar', desc: 'VIP\'e ozel 12 avatar' },
  { icon: '♾️', title: 'Sinirsiz Playlist', desc: 'Sinirsiz sarki kaydetme' },
  { icon: '🔍', title: 'Sohbet Arama', desc: 'Eski mesajlarinda arama yap' }
];
