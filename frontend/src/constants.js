export const PLAY_STORE_URL = 'https://play.google.com/apps/testing/com.couplemeeting.app';

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
  || ((window.location.protocol === 'capacitor:' || window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'https://couplemeeting.com.tr'
    : window.location.origin);

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
  weekly: { price: 49.90, duration: '7 gün • Haftalık Randevu Paketi', label: 'Haftalık Randevu Paketi', icon: '🍿', badge: 'Hafta Sonu' },
  monthly: { price: 99.90, duration: '30 gün • Kişi başı ₺49.95', label: 'Aylık Çift VIP', icon: '💑', badge: '1 Alana 2 VIP' },
  yearly: { price: 599.90, duration: '1 yıl • Aylık ₺49.90 • %50 İndirim', label: 'Yıllık Çift VIP', icon: '👑', savings: '%50', badge: 'En Popüler 💕' }
};

export const VIP_FEATURES = [
  { icon: '💑', title: '1 Alana 2 Kişilik VIP (Çift Paketi)', desc: 'Sen VIP olunca sevgilin veya en yakın arkadaşın da ücretsiz VIP olur!' },
  { icon: '🔒', title: 'Kalıcı Özel Oda ("Bizim Odamız")', desc: 'Kapanmayan, şifreli ve sadece ikinize özel kalıcı buluşma odası' },
  { icon: '🎨', title: 'Romantik & Özel Temalar', desc: 'Rose, Gold, Ocean, Emerald ve Sunset ambiyans temaları' },
  { icon: '🏆', title: 'VIP Rozet & Çerçeve Seviyeleri', desc: 'Bronze, Silver, Gold ve Diamond profil çerçevesi' },
  { icon: '👥', title: '20 Kişilik Parti Odası', desc: 'Standart 8 kişi yerine 20 kişiye kadar sinema & müzik odası' },
  { icon: '👻', title: 'Görünmez Mod & Gizlilik', desc: 'Sadece partnerin ve seçtiğin arkadaşların seni çevrimiçi görsün' },
  { icon: '👀', title: 'Profil Ziyaretçilerini Gör', desc: 'Profiline kimlerin ne zaman baktığını anında öğren' },
  { icon: '🚫', title: 'Tamamen Reklamsız Deneyim', desc: 'Film ve müzik keyfiniz hiç bölünmeden kesintisiz izleyin' },
  { icon: '🎭', title: 'Özel Çift & VIP Avatarları', desc: 'VIP üyelere özel 12 premium avatar ve ikon' },
  { icon: '♾️', title: 'Sınırsız Ortak Playlist', desc: 'Beraber dinlediğiniz tüm şarkıları ve filmleri sınırsız kaydedin' }
];

