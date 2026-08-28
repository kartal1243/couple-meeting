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
  rose: { bg: 'linear-gradient(135deg, #2a0813 0%, #05070c 100%)', cardBg: '#3f0e1e', primary: '#fb7185' }
};

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
  .cm-home { min-height: 100%; position: relative; overflow: hidden; }
  .cm-home::before { content:''; position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px); background-size:42px 42px; mask-image:linear-gradient(to bottom,black,transparent 90%); pointer-events:none; }
  .cm-orb { position:absolute; border-radius:50%; filter:blur(10px); opacity:.48; animation:cmFloat 10s ease-in-out infinite; pointer-events:none; }
  .cm-orb.one { width:420px;height:420px; background:#00a884; top:-170px;left:-140px; }
  .cm-orb.two { width:340px;height:340px; background:#7c3aed; right:-120px;top:180px;animation-delay:-3s; }
  .cm-orb.three { width:280px;height:280px; background:#ff4757; left:32%;top:420px;animation-delay:-6s; }
  @keyframes cmFloat { 0%,100%{transform:translate3d(0,0,0)} 50%{transform:translate3d(25px,-22px,0)} }
  .cm-home-nav { position:relative; z-index:5; display:flex; justify-content:space-between; align-items:center; gap:12px; padding:18px 5vw; border-bottom:1px solid rgba(255,255,255,.07); background:rgba(5,7,12,.54); backdrop-filter:blur(18px); position:sticky; top:0; }
  .cm-home-brand { display:flex; align-items:center; gap:11px; }
  .cm-home-logo { width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(135deg,#ff4757,#00a884);font-size:22px;box-shadow:0 12px 35px rgba(0,168,132,.26); }
  .cm-nav-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
  .cm-home-main { position:relative; z-index:2; width:min(1200px,92vw); margin:0 auto; padding:78px 0 70px; }
  .cm-hero { display:grid; grid-template-columns:1.15fr .85fr; gap:34px; align-items:center; }
  .cm-badge { display:inline-flex; align-items:center; gap:8px; padding:8px 13px;border-radius:999px;background:rgba(0,168,132,.1);border:1px solid rgba(0,168,132,.22);color:#63f0c0;font-size:12px;font-weight:800; }
  .cm-hero h1 { margin:16px 0 16px;font-size:clamp(42px,6.2vw,78px);line-height:.98;letter-spacing:-4px;color:#fff;font-weight:950; }
  .cm-hero h1 span { background:linear-gradient(90deg,#fff,#68ffd2 45%,#8bd8ff);-webkit-background-clip:text;background-clip:text;color:transparent; }
  .cm-hero p { margin:0; color:#93a1ad; font-size:18px;line-height:1.65;max-width:690px; }
  .cm-hero-actions { display:flex; gap:12px; margin-top:28px; flex-wrap:wrap; }
  .cm-big-btn { border:none;padding:14px 18px;border-radius:14px;font-weight:900;cursor:pointer;color:white;box-shadow:0 12px 30px rgba(0,0,0,.28); }
  .cm-hero-card { min-height:360px; position:relative; border:1px solid rgba(255,255,255,.08); border-radius:28px; background:linear-gradient(145deg,rgba(17,27,33,.85),rgba(10,14,22,.67)); backdrop-filter:blur(20px); box-shadow:0 30px 80px rgba(0,0,0,.36); overflow:hidden; padding:22px; }
  .cm-now-playing { height:100%; display:flex; flex-direction:column; justify-content:space-between; }
  .cm-mini-top { display:flex;justify-content:space-between;align-items:center;color:#91a0ac;font-size:11px;font-weight:800; }
  .cm-cover { margin:20px auto 14px; width:172px;height:172px;border-radius:28px;background:radial-gradient(circle at 30% 25%,#ff94a1 0 12%,transparent 13%),radial-gradient(circle at 72% 70%,#4be6c0 0 14%,transparent 15%),linear-gradient(135deg,#7c3aed,#00a884); box-shadow:0 22px 45px rgba(0,0,0,.38); animation:cmPulse 3s ease-in-out infinite; }
  @keyframes cmPulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.035)} }
  .cm-wave { display:flex;justify-content:center;align-items:flex-end;gap:4px;height:40px;margin-top:12px; }
  .cm-wave i { width:4px;border-radius:6px;background:linear-gradient(to top,#00a884,#8bd8ff);animation:cmWave 1s ease-in-out infinite; }
  .cm-wave i:nth-child(2){animation-delay:.12s}.cm-wave i:nth-child(3){animation-delay:.22s}.cm-wave i:nth-child(4){animation-delay:.1s}.cm-wave i:nth-child(5){animation-delay:.28s}.cm-wave i:nth-child(6){animation-delay:.18s}.cm-wave i:nth-child(7){animation-delay:.36s}
  @keyframes cmWave {0%,100%{height:10px;opacity:.5}50%{height:36px;opacity:1}}
  .cm-floating-chip { position:absolute; padding:9px 12px;border-radius:14px;background:rgba(9,13,22,.86);border:1px solid rgba(255,255,255,.08);box-shadow:0 12px 30px rgba(0,0,0,.25);font-size:11px;font-weight:800;color:#fff;animation:cmFloat 8s ease-in-out infinite; }
  .cm-chip-a{left:18px;top:96px}.cm-chip-b{right:18px;top:150px;animation-delay:-2s}.cm-chip-c{right:30px;bottom:34px;animation-delay:-4s}
  .cm-section { margin-top:72px; }
  .cm-section-head { display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:18px; }
  .cm-section-head h3 { margin:0;color:#fff;font-size:25px;letter-spacing:-.8px; }
  .cm-section-head p { margin:5px 0 0;color:#7d8b97;font-size:13px; }
  .cm-feature-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:12px; }
  .cm-feature { padding:18px;border-radius:20px;background:rgba(17,27,33,.68);border:1px solid rgba(255,255,255,.06);min-height:145px;transition:.25s; }
  .cm-feature:hover { transform:translateY(-4px);border-color:rgba(0,168,132,.25);box-shadow:0 18px 36px rgba(0,0,0,.22); }
  .cm-feature .ico { font-size:26px; }.cm-feature b{display:block;color:#fff;margin-top:12px}.cm-feature span{display:block;color:#7f8b96;font-size:12px;line-height:1.5;margin-top:6px}
  .cm-room-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:12px; }
  .cm-room { padding:16px;border-radius:18px;background:rgba(17,27,33,.7);border:1px solid rgba(255,255,255,.06); }
  .cm-room-row{display:flex;justify-content:space-between;gap:10px;align-items:center}.cm-room-name{color:#fff;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cm-room-meta{color:#7e8a95;font-size:11px}.cm-room button{margin-top:12px;width:100%;padding:10px;border:1px solid rgba(0,168,132,.22);background:rgba(0,168,132,.08);color:#5de9c0;border-radius:12px;font-weight:800;cursor:pointer}
  .cm-social-card { padding:20px;border-radius:24px;background:linear-gradient(145deg,rgba(17,27,33,.82),rgba(10,14,22,.72));border:1px solid rgba(255,255,255,.07); }
  .cm-social-grid { display:grid;grid-template-columns:1.1fr .9fr;gap:14px; }
  .cm-global-preview { display:flex;flex-direction:column;gap:8px;max-height:230px;overflow:hidden; }
  .cm-preview-msg { display:flex;gap:8px;align-items:flex-start;padding:9px 10px;border-radius:12px;background:#0b141a;border:1px solid rgba(255,255,255,.045); }
  .cm-preview-msg b{font-size:11px;color:#fff}.cm-preview-msg span{font-size:11px;color:#8794a0}
  .cm-footer { padding:35px 0 50px; text-align:center; color:#64717b;font-size:12px; }
  @media(max-width:900px){ .cm-hero{grid-template-columns:1fr}.cm-feature-grid{grid-template-columns:1fr 1fr}.cm-room-grid{grid-template-columns:1fr 1fr}.cm-social-grid{grid-template-columns:1fr}.cm-hero-card{min-height:330px} }
  @media(max-width:600px){ .cm-home-nav{padding:12px 14px}.cm-nav-actions{width:100%}.cm-nav-actions button{flex:1}.cm-home-main{width:min(94vw,560px);padding:42px 0 34px}.cm-hero h1{font-size:48px;letter-spacing:-2.5px}.cm-hero p{font-size:15px}.cm-hero-actions{display:grid;grid-template-columns:1fr}.cm-feature-grid,.cm-room-grid{grid-template-columns:1fr}.cm-cover{width:145px;height:145px}.cm-floating-chip{display:none}.cm-section{margin-top:44px}.cm-section-head{display:block}.cm-section-head h3{font-size:22px} }
`;
