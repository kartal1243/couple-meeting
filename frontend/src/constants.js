export const BACKEND_URL = 'https://couple-meeting.onrender.com';

export const AVATARS = ['🐱', '🐶', '🦊', '🐼', '👑', '👸', '🦁', '🐻'];

export const CITIES = [
  'Zonguldak', 'Tokat', 'İstanbul', 'Ankara', 'İzmir', 'Antalya',
  'Bursa', 'Trabzon', 'Sivas', 'Adana', 'Eskişehir', 'Samsun',
  'Kayseri', 'Konya', 'Diyarbakır'
];

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
  monthly: { price: 29.90, duration: '30 gün', label: 'Aylık VIP', icon: '⭐' },
  yearly: { price: 199.90, duration: '1 yıl', label: 'Yıllık VIP', icon: '👑', savings: '%45' }
};

export const VIP_FEATURES = [
  { icon: '🎨', title: 'Özel Temalar', desc: 'Gold, Ocean, Emerald, Sunset temaları' },
  { icon: '🛡️', title: 'VIP Oda', desc: 'Otomatik silinmeyen kalıcı odalar' },
  { icon: '👤', title: 'VIP Rozeti', desc: 'Profilinde altın rozet' },
  { icon: '🎵', title: 'Sınırsız Playlist', desc: 'Sınırsız şarkı kaydetme' },
  { icon: '🚀', title: 'Öncelikli Destek', desc: 'Hızlı teknik destek' },
  { icon: '🎯', title: 'Özel Avatarlar', desc: 'VIP\'e özel avatar seçenekleri' }
];

export const GLOBAL_CSS = `
  @keyframes floatUp { 0% { transform: translateY(0) scale(0.8); opacity: 1; } 100% { transform: translateY(-300px) scale(1.6); opacity: 0; } }
  @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
  @keyframes pulseDot { 0%, 100% { box-shadow: 0 0 0 0 rgba(0,200,150,.5); } 50% { box-shadow: 0 0 0 6px rgba(0,200,150,0); } }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: #0b141a; }
  ::-webkit-scrollbar-thumb { background: #2a3942; border-radius: 4px; }
  button { transition: transform .15s ease, filter .2s ease, box-shadow .2s ease !important; }
  button:hover { filter: brightness(1.12); transform: translateY(-1px); }
  button:active { transform: translateY(0) scale(.98); }
  input, select { transition: border-color .2s ease, box-shadow .2s ease !important; }
  input:focus, select:focus { outline: none; border-color: var(--cm-primary, #00a884) !important; box-shadow: 0 0 0 3px rgba(0,168,132,.25); }
  html, body { overflow-x: hidden !important; max-width: 100vw !important; margin: 0; padding: 0; }
  * { min-width: 0; box-sizing: border-box !important; }

  @media (max-width: 768px) {
    .cm-room-header {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      height: 60px !important;
      padding: 0 12px !important;
      z-index: 99999 !important;
      background: #111b21 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      border-bottom: 1px solid #222d34 !important;
    }
    .cm-room-header-actions { display: flex !important; gap: 6px !important; }
    .cm-room-header-actions button { padding: 6px 10px !important; font-size: 11px !important; }
    .cm-room-layout {
      margin-top: 60px !important;
      flex-direction: column !important;
      height: calc(100dvh - 60px) !important;
      overflow-y: auto !important;
    }
    .cm-player-column { width: 100% !important; min-height: auto !important; overflow: visible !important; }
    .cm-search-bar { flex-wrap: wrap !important; padding: 8px !important; position: relative !important; z-index: 100 !important; }
    .cm-search-bar input { flex: 1 1 100% !important; min-width: 0 !important; }
    .cm-search-bar .cm-action-btn { flex: 1 1 calc(50% - 5px) !important; }
    .cm-search-results { left: 8px !important; right: 8px !important; top: 95px !important; z-index: 99999 !important; }
    .cm-video-wrap { width: 100% !important; aspect-ratio: 16 / 9 !important; height: auto !important; min-height: 200px !important; flex: none !important; }
    .cm-controls { flex-wrap: wrap !important; padding: 8px !important; gap: 6px !important; }
    .cm-controls > button { flex: 1 1 calc(50% - 4px) !important; }
    .cm-reactions { width: 100% !important; display: grid !important; grid-template-columns: repeat(6, 1fr) !important; }
    .cm-reactions button { padding: 6px 2px !important; font-size: 16px !important; }
    .cm-sidebar { width: 100% !important; height: 450px !important; border-left: none !important; border-top: 1px solid #222d34 !important; }
  }
`;

export const HOME_CSS = `
  .cm-home { min-height: 100%; position: relative; overflow: hidden; background: linear-gradient(135deg, #0a0118 0%, #0d0221 20%, #150538 40%, #0a0d2e 60%, #06101f 80%, #0a0118 100%); }
  .cm-home::before { content:''; position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px); background-size:42px 42px; mask-image:linear-gradient(to bottom,black,transparent 90%); pointer-events:none; }
  .cm-orb { position:absolute; border-radius:50%; filter:blur(80px); opacity:.35; animation:cmFloat 10s ease-in-out infinite; pointer-events:none; }
  .cm-orb.one { width:500px;height:500px; background:#7c3aed; top:-200px;left:-150px; }
  .cm-orb.two { width:400px;height:400px; background:#2563eb; right:-150px;top:100px;animation-delay:-3s; }
  .cm-orb.three { width:350px;height:350px; background:#a855f7; left:30%;top:350px;animation-delay:-6s; }
  @keyframes cmFloat { 0%,100%{transform:translate3d(0,0,0)} 50%{transform:translate3d(25px,-22px,0)} }
  .cm-home-nav { position:relative; z-index:5; display:flex; justify-content:space-between; align-items:center; gap:12px; padding:18px 5vw; border-bottom:1px solid rgba(255,255,255,.07); background:rgba(5,7,12,.34); backdrop-filter:blur(18px); position:sticky; top:0; }
  .cm-home-brand { display:flex; align-items:center; gap:11px; }
  .cm-home-logo-wrap { position:relative; width:42px; height:42px; display:grid; place-items:center; }
  .cm-home-logo { width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#7c3aed,#2563eb);font-size:18px;box-shadow:0 8px 24px rgba(124,58,237,.4);position:relative;z-index:2; }
  .cm-home-logo-ring { position:absolute; inset:-3px; border-radius:50%; border:2px solid transparent; background:conic-gradient(#7c3aed,#2563eb,#00a884,#7c3aed) border-box; -webkit-mask:linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0); -webkit-mask-composite:xor; mask-composite:exclude; animation:cmLogoRing 3s linear infinite; }
  @keyframes cmLogoRing { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
  .cm-nav-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
  .cm-home-main { position:relative; z-index:2; width:min(1200px,92vw); margin:0 auto; padding:40px 0 70px; }

  /* === HERO RAVE TARZI === */
  .cm-hero { text-align:center; padding:20px 0 0; }
  .cm-hero-title { margin:0 auto 20px; font-size:clamp(56px,10vw,110px); line-height:.92; letter-spacing:-5px; color:#fff; font-weight:950; text-transform:uppercase; background:linear-gradient(180deg, #fff 0%, #c4b5fd 40%, #7c3aed 100%); -webkit-background-clip:text; background-clip:text; color:transparent; text-shadow:none; filter:drop-shadow(0 4px 30px rgba(124,58,237,.3)); }
  .cm-hero-sub { margin:0 auto; color:#94a3b8; font-size:17px; line-height:1.7; max-width:520px; text-align:center; }
  .cm-hero-actions { display:flex; gap:14px; margin-top:30px; justify-content:center; flex-wrap:wrap; }
  .cm-big-btn { border:none;padding:14px 20px;border-radius:14px;font-weight:900;cursor:pointer;color:white;box-shadow:0 12px 30px rgba(0,0,0,.28); font-size:14px; transition:transform .15s; }
  .cm-big-btn:hover { transform:translateY(-2px); }
  .cm-hero-features { display:flex; gap:18px; justify-content:center; flex-wrap:wrap; margin-top:22px; color:#94a3b8; font-size:12px; font-weight:800; }

  /* === CİHAZ MOCKUPLARI === */
  .cm-devices-showcase { display:flex; align-items:flex-end; justify-content:center; gap:20px; margin-top:60px; padding:0 20px; perspective:1200px; }
  .cm-device { position:relative; transition:transform .3s; }
  .cm-device:hover { transform:translateY(-8px); }
  .cm-device-screen { background:#0f172a; border-radius:12px; overflow:hidden; border:2px solid rgba(255,255,255,.1); box-shadow:0 20px 60px rgba(0,0,0,.5), 0 0 40px rgba(124,58,237,.15); }
  .cm-screen-header { display:flex; align-items:center; gap:5px; padding:8px 12px; background:rgba(255,255,255,.04); border-bottom:1px solid rgba(255,255,255,.06); }
  .cm-screen-dot { width:8px; height:8px; border-radius:50%; }
  .cm-screen-title { margin-left:auto; margin-right:auto; color:#64748b; font-size:10px; font-weight:800; }
  .cm-screen-body { padding:12px; display:flex; flex-direction:column; gap:10px; }
  .cm-screen-player { display:flex; align-items:center; gap:10px; padding:10px; background:rgba(255,255,255,.03); border-radius:10px; }
  .cm-screen-album { width:52px; height:52px; border-radius:10px; background:linear-gradient(135deg,#7c3aed,#2563eb); flex-shrink:0; box-shadow:0 4px 15px rgba(124,58,237,.3); animation:cmPulse 3s ease-in-out infinite; }
  .cm-album-small { width:38px; height:38px; }
  .cm-screen-song { overflow:hidden; }
  .cm-screen-song-name { color:#fff; font-size:11px; font-weight:900; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .cm-screen-song-artist { color:#64748b; font-size:9px; margin-top:2px; }
  @keyframes cmPulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.04)} }
  .cm-screen-chat { display:flex; flex-direction:column; gap:4px; }
  .cm-screen-msg { padding:5px 8px; border-radius:8px; font-size:9px; color:#e2e8f0; max-width:80%; font-weight:600; }
  .cm-msg-them { background:rgba(255,255,255,.08); align-self:flex-start; border-bottom-left-radius:2px; }
  .cm-msg-me { background:rgba(0,168,132,.25); align-self:flex-end; border-bottom-right-radius:2px; }

  /* Laptop */
  .cm-device-laptop .cm-device-screen { width:320px; height:200px; }
  .cm-device-base { width:80%; height:6px; margin:0 auto; background:rgba(255,255,255,.08); border-radius:0 0 6px 6px; }

  /* Telefon */
  .cm-device-phone { border-radius:20px; }
  .cm-device-phone .cm-device-screen { border-radius:18px; border-width:3px; }
  .cm-device-notch { position:absolute; top:6px; left:50%; transform:translateX(-50%); width:60px; height:14px; background:#0f172a; border-radius:0 0 10px 10px; z-index:3; }
  .cm-phone-screen { width:140px; height:260px; }
  .cm-phone-left { transform:rotate(3deg); }
  .cm-phone-right { transform:rotate(-3deg); }

  /* Masaüstü monitor */
  .cm-device-desktop .cm-device-screen { width:360px; height:220px; }
  .cm-device-desktop .cm-device-base { width:90px; height:40px; background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02)); border-radius:0 0 4px 4px; clip-path:polygon(20% 0, 80% 0, 100% 100%, 0% 100%); }

  .cm-device-label { text-align:center; color:#94a3b8; font-size:11px; font-weight:800; margin-top:10px; display:flex; align-items:center; justify-content:center; gap:4px; }

  /* === DİĞER SEKSIYONLAR === */
  .cm-section { margin-top:72px; }
  .cm-section-head { display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:18px; }
  .cm-section-head h3 { margin:0;color:#fff;font-size:25px;letter-spacing:-.8px; }
  .cm-section-head p { margin:5px 0 0;color:#7d8b97;font-size:13px; }

  /* Özellikler */
  .cm-feature-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:14px; }
  .cm-feature { padding:22px 18px;border-radius:20px;background:rgba(17,27,33,.6);border:1px solid rgba(255,255,255,.06);min-height:160px;transition:.3s;cursor:default; }
  .cm-feature:hover { transform:translateY(-6px);border-color:rgba(124,58,237,.3);box-shadow:0 20px 40px rgba(0,0,0,.3); }
  .cm-feature-icon { width:48px;height:48px;border-radius:14px;display:grid;place-items:center;font-size:24px;margin-bottom:14px; }
  .cm-feature b{display:block;color:#fff;margin-top:4px;font-size:14px}
  .cm-feature span{display:block;color:#7f8b96;font-size:12px;line-height:1.6;margin-top:8px}

  /* Açık odalar */
  .cm-room-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:12px; }
  .cm-room { padding:16px;border-radius:16px;background:linear-gradient(160deg,rgba(30,40,55,.85),rgba(12,20,32,.95));border:1px solid rgba(255,255,255,.06);cursor:pointer;transition:.3s;position:relative;overflow:hidden; }
  .cm-room-glow { position:absolute;top:-40%;right:-40%;width:80%;height:80%;background:radial-gradient(circle,rgba(124,58,237,.12),transparent 70%);pointer-events:none;transition:.4s; }
  .cm-room:hover .cm-room-glow { opacity:1;top:-30%;right:-30%; }
  .cm-room::after { content:''; position:absolute; bottom:0; left:0; right:0; height:2px; background:linear-gradient(90deg,#7c3aed,#2563eb,#00a884); transform:scaleX(0); transition:.3s; }
  .cm-room:hover { transform:translateY(-4px);border-color:rgba(124,58,237,.3);box-shadow:0 12px 30px rgba(0,0,0,.35); }
  .cm-room:hover::after { transform:scaleX(1); }
  .cm-room-top { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px; }
  .cm-room-icon-wrap { width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,rgba(124,58,237,.2),rgba(37,99,235,.15));display:grid;place-items:center; }
  .cm-room-emoji { font-size:18px; }
  .cm-room-count { color:#94a3b8;font-size:10px;font-weight:800;background:rgba(255,255,255,.06);padding:3px 8px;border-radius:12px; }
  .cm-room-name { color:#fff;font-weight:900;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
  .cm-room-meta { color:#64748b;font-size:10px;margin-top:3px; }
  .cm-room-bottom { display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.05); }
  .cm-room-users { display:flex;align-items:center; }
  .cm-room-user-avatar { width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:10px;margin-left:-6px;border:2px solid rgba(15,23,35,.9); }
  .cm-room-user-avatar:first-child { margin-left:0; }
  .cm-room-user-more { width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:8px;color:#94a3b8;background:rgba(255,255,255,.08);margin-left:-6px;border:2px solid rgba(15,23,35,.9);font-weight:800; }
  .cm-room-join-btn { color:#a78bfa;font-size:12px;font-weight:800;transition:.2s; }
  .cm-room:hover .cm-room-join-btn { color:#c4b5fd;transform:translateX(3px); }
  .cm-empty-state { text-align:center;padding:40px 20px; }
  .cm-empty-icon { font-size:44px;margin-bottom:10px; }
  .cm-empty-title { color:#fff;font-weight:900;font-size:16px; }
  .cm-empty-desc { color:#64748b;font-size:12px;margin-top:5px; }

  .cm-social-card { padding:24px;border-radius:24px;background:linear-gradient(145deg,rgba(30,40,55,.8),rgba(15,23,35,.9));border:1px solid rgba(255,255,255,.06); }
  .cm-social-grid { display:grid;grid-template-columns:1.1fr .9fr;gap:20px; }
  .cm-social-badge { color:#a78bfa;font-size:11px;font-weight:900;letter-spacing:1px; }
  .cm-social-title { font-size:26px;color:#fff;font-weight:950;letter-spacing:-1px;margin-top:10px;line-height:1.2; }
  .cm-social-desc { color:#7d8b97;font-size:13px;line-height:1.7;margin-top:12px; }
  .cm-social-btn { margin-top:20px;background:linear-gradient(135deg,#7c3aed,#2563eb) !important; }
  .cm-global-preview { display:flex;flex-direction:column;gap:6px;max-height:260px;overflow:hidden;border-radius:16px;background:rgba(0,0,0,.3);padding:12px;border:1px solid rgba(255,255,255,.05); }
  .cm-preview-header { display:flex;align-items:center;gap:6px;color:#94a3b8;font-size:11px;font-weight:800;margin-bottom:4px; }
  .cm-preview-live { width:8px;height:8px;border-radius:50%;background:#22c55e;animation:cmLivePulse 2s ease-in-out infinite; }
  @keyframes cmLivePulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(34,197,94,.4)} 50%{opacity:.8;box-shadow:0 0 0 6px rgba(34,197,94,0)} }
  .cm-preview-count { margin-left:auto;color:#475569;font-size:10px; }
  .cm-preview-msg { display:flex;gap:8px;align-items:flex-start;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.03);transition:.2s; }
  .cm-preview-msg:hover { background:rgba(255,255,255,.06); }
  .cm-preview-avatar { font-size:18px;width:28px;height:28px;display:grid;place-items:center;background:rgba(255,255,255,.05);border-radius:8px;flex-shrink:0; }
  .cm-preview-content { overflow:hidden; }
  .cm-preview-content b{font-size:11px;color:#e2e8f0;display:block;margin-bottom:2px}
  .cm-preview-content span{font-size:11px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
  .cm-preview-empty { text-align:center;padding:28px 16px;color:#475569;font-size:12px; }
  .cm-preview-empty-icon { font-size:36px;margin-bottom:10px; }

  /* === FOOTER === */
  .cm-footer { padding:35px 0 30px; text-align:center; color:#475569; font-size:12px; border-top:1px solid rgba(255,255,255,.05); margin-top:60px; }
  .cm-footer-socials { display:flex; gap:12px; justify-content:center; margin-bottom:14px; }
  .cm-footer-socials a { width:38px; height:38px; border-radius:50%; display:grid; place-items:center; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.08); color:#94a3b8; font-size:16px; text-decoration:none; transition:all .2s; }
  .cm-footer-socials a:hover { background:rgba(124,58,237,.2); border-color:rgba(124,58,237,.4); color:#a78bfa; transform:translateY(-2px); }

  /* === RESPONSIVE === */
  @media(max-width:1024px){
    .cm-devices-showcase { gap:12px; }
    .cm-device-laptop .cm-device-screen { width:240px; height:160px; }
    .cm-phone-screen { width:110px; height:210px; }
    .cm-device-desktop .cm-device-screen { width:260px; height:170px; }
  }
  @media(max-width:768px){
    .cm-hero-title { letter-spacing:-3px; }
    .cm-devices-showcase { gap:8px; margin-top:40px; flex-wrap:wrap; justify-content:center; }
    .cm-device-laptop .cm-device-screen { width:200px; height:130px; }
    .cm-phone-screen { width:95px; height:180px; }
    .cm-device-desktop .cm-device-screen { width:200px; height:130px; }
    .cm-device-desktop { display:none; }
    .cm-feature-grid{grid-template-columns:1fr 1fr}.cm-room-grid{grid-template-columns:1fr 1fr}.cm-social-grid{grid-template-columns:1fr}
  }
  @media(max-width:600px){
    .cm-home-nav{padding:12px 14px}.cm-nav-actions{width:100%}.cm-nav-actions button{flex:1}.cm-home-main{width:min(94vw,560px);padding:30px 0 34px}
    .cm-hero-title{font-size:48px;letter-spacing:-2.5px}.cm-hero-sub{font-size:14px}.cm-hero-actions{display:grid;grid-template-columns:1fr}
    .cm-devices-showcase{display:none}
    .cm-feature-grid,.cm-room-grid{grid-template-columns:1fr}.cm-section{margin-top:44px}.cm-section-head{display:block}.cm-section-head h3{font-size:22px}
  }
`;
