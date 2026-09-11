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
  .cm-nav-soundwave { display:flex; align-items:center; gap:2px; height:28px; }
  .cm-nav-bar { width:3px; border-radius:99px; background:linear-gradient(to top,#ec4899,#8b5cf6); transform-origin:bottom; }
  .cm-nav-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
  .cm-nav-btn { padding:8px 14px; border-radius:10px; font-weight:800; font-size:12px; cursor:pointer; transition:.2s; border:none; white-space:nowrap; }
  .cm-nav-btn-ghost { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); color:#fff; }
  .cm-nav-btn-ghost:hover { background:rgba(255,255,255,.1); }
  .cm-nav-btn-green { background:#00a884; color:#fff; }
  .cm-nav-btn-green:hover { background:#00c997; }

  @keyframes cmWaveBar { 0%,100%{transform:scaleY(0.5)} 50%{transform:scaleY(1.3)} }

  .cm-pulse-hearts { position:relative; display:flex; align-items:center; justify-content:center; margin-bottom:30px; }
  .cm-pulse-hearts-glow { position:absolute; width:140px; height:140px; background:radial-gradient(circle,rgba(236,72,153,.35),rgba(139,92,246,.2),transparent 70%); border-radius:50%; animation:cmPulseGlow 2.5s ease-in-out infinite; }
  @keyframes cmPulseGlow { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.2);opacity:1} }
  .cm-pulse-hearts-pair { position:relative; display:flex; }
  .cm-pulse-heart { width:52px; height:52px; border-radius:14px; display:grid; place-items:center; font-size:22px; color:#fff; box-shadow:0 10px 30px rgba(0,0,0,.3); }
  .cm-pulse-heart-1 { background:linear-gradient(135deg,#ec4899,#f43f5e); transform:rotate(45deg); animation:cmPulseHeart 1.2s ease-in-out infinite; }
  .cm-pulse-heart-2 { background:linear-gradient(135deg,#8b5cf6,#d946ef); transform:rotate(45deg); animation:cmPulseHeart 1.2s ease-in-out infinite 0.3s; border:2px solid rgba(255,255,255,.2); margin-left:-10px; }
  @keyframes cmPulseHeart { 0%,100%{transform:rotate(45deg) scale(1)} 50%{transform:rotate(45deg) scale(1.12)} }
  .cm-pulse-heart span { transform:rotate(-45deg); }
  .cm-pulse-line { position:absolute; bottom:-6px; width:70px; height:2px; background:linear-gradient(90deg,#ec4899,#8b5cf6); border-radius:99px; opacity:.5; }

  .cm-home-main { position:relative; z-index:2; width:min(1200px,92vw); margin:0 auto; padding:40px 0 70px; }

  .cm-hero { text-align:center; padding:20px 0 0; }
  .cm-hero-title { margin:0 auto 20px; font-size:clamp(56px,10vw,110px); line-height:.92; letter-spacing:-5px; color:#fff; font-weight:950; text-transform:uppercase; background:linear-gradient(180deg, #fff 0%, #c4b5fd 40%, #7c3aed 100%); -webkit-background-clip:text; background-clip:text; color:transparent; text-shadow:none; filter:drop-shadow(0 4px 30px rgba(124,58,237,.3)); }
  .cm-hero-sub { margin:0 auto; color:#94a3b8; font-size:17px; line-height:1.7; max-width:520px; text-align:center; }
  .cm-hero-actions { display:flex; gap:14px; margin-top:30px; justify-content:center; flex-wrap:wrap; }
  .cm-big-btn { border:none;padding:14px 20px;border-radius:14px;font-weight:900;cursor:pointer;color:white;box-shadow:0 12px 30px rgba(0,0,0,.28); font-size:14px; transition:transform .15s; }
  .cm-big-btn:hover { transform:translateY(-2px); }
  .cm-hero-features { display:flex; gap:18px; justify-content:center; flex-wrap:wrap; margin-top:22px; color:#94a3b8; font-size:12px; font-weight:800; }

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

  .cm-device-laptop .cm-device-screen { width:320px; height:200px; }
  .cm-device-base { width:80%; height:6px; margin:0 auto; background:rgba(255,255,255,.08); border-radius:0 0 6px 6px; }

  .cm-device-phone { border-radius:20px; }
  .cm-device-phone .cm-device-screen { border-radius:18px; border-width:3px; }
  .cm-device-notch { position:absolute; top:6px; left:50%; transform:translateX(-50%); width:60px; height:14px; background:#0f172a; border-radius:0 0 10px 10px; z-index:3; }
  .cm-phone-screen { width:140px; height:260px; }
  .cm-phone-left { transform:rotate(3deg); }
  .cm-phone-right { transform:rotate(-3deg); }

  .cm-device-desktop .cm-device-screen { width:360px; height:220px; }
  .cm-device-desktop .cm-device-base { width:90px; height:40px; background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02)); border-radius:0 0 4px 4px; clip-path:polygon(20% 0, 80% 0, 100% 100%, 0% 100%); }

  .cm-device-label { text-align:center; color:#94a3b8; font-size:11px; font-weight:800; margin-top:10px; display:flex; align-items:center; justify-content:center; gap:4px; }

  .cm-section { margin-top:72px; }
  .cm-section-head { display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:18px; }
  .cm-section-head h3 { margin:0;color:#fff;font-size:25px;letter-spacing:-.8px; }
  .cm-section-head p { margin:5px 0 0;color:#7d8b97;font-size:13px; }

  .cm-feature-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:14px; }
  .cm-feature { padding:22px 18px;border-radius:20px;background:rgba(17,27,33,.6);border:1px solid rgba(255,255,255,.06);min-height:160px;transition:.3s;cursor:default; }
  .cm-feature:hover { transform:translateY(-6px);border-color:rgba(124,58,237,.3);box-shadow:0 20px 40px rgba(0,0,0,.3); }
  .cm-feature-icon { width:48px;height:48px;border-radius:14px;display:grid;place-items:center;font-size:24px;margin-bottom:14px; }
  .cm-feature b{display:block;color:#fff;margin-top:4px;font-size:14px}
  .cm-feature span{display:block;color:#7f8b96;font-size:12px;line-height:1.6;margin-top:8px}

  .cm-room-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:10px; }
  .cm-room { padding:14px;border-radius:14px;background:linear-gradient(160deg,rgba(30,40,55,.85),rgba(12,20,32,.95));border:1px solid rgba(255,255,255,.06);cursor:pointer;transition:.3s;position:relative;overflow:hidden; }
  .cm-room-glow { position:absolute;top:-40%;right:-40%;width:80%;height:80%;background:radial-gradient(circle,rgba(124,58,237,.12),transparent 70%);pointer-events:none;transition:.4s; }
  .cm-room:hover .cm-room-glow { opacity:1;top:-30%;right:-30%; }
  .cm-room::after { content:''; position:absolute; bottom:0; left:0; right:0; height:2px; background:linear-gradient(90deg,#7c3aed,#2563eb,#00a884); transform:scaleX(0); transition:.3s; }
  .cm-room:hover { transform:translateY(-3px);border-color:rgba(124,58,237,.3);box-shadow:0 10px 24px rgba(0,0,0,.3); }
  .cm-room:hover::after { transform:scaleX(1); }
  .cm-room-top { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px; }
  .cm-room-icon-wrap { width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,rgba(124,58,237,.2),rgba(37,99,235,.15));display:grid;place-items:center; }
  .cm-room-emoji { font-size:16px; }
  .cm-room-count { color:#94a3b8;font-size:9px;font-weight:800;background:rgba(255,255,255,.06);padding:2px 7px;border-radius:10px; }
  .cm-room-name { color:#fff;font-weight:900;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
  .cm-room-meta { color:#64748b;font-size:9px;margin-top:2px; }
  .cm-room-bottom { display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.05); }
  .cm-room-users { display:flex;align-items:center; }
  .cm-room-user-avatar { width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:9px;margin-left:-6px;border:2px solid rgba(15,23,35,.9); }
  .cm-room-user-avatar:first-child { margin-left:0; }
  .cm-room-user-more { width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:7px;color:#94a3b8;background:rgba(255,255,255,.08);margin-left:-6px;border:2px solid rgba(15,23,35,.9);font-weight:800; }
  .cm-room-join-btn { color:#a78bfa;font-size:11px;font-weight:800;transition:.2s; }
  .cm-room:hover .cm-room-join-btn { color:#c4b5fd;transform:translateX(3px); }
  .cm-empty-state { text-align:center;padding:30px 20px; }
  .cm-empty-icon { font-size:38px;margin-bottom:8px; }
  .cm-empty-title { color:#fff;font-weight:900;font-size:15px; }
  .cm-empty-desc { color:#64748b;font-size:11px;margin-top:4px; }

  .cm-social-card { padding:20px;border-radius:20px;background:linear-gradient(160deg,rgba(30,40,55,.8),rgba(12,20,32,.9));border:1px solid rgba(255,255,255,.06); }
  .cm-social-grid { display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:center; }
  .cm-social-badge { color:#a78bfa;font-size:10px;font-weight:900;letter-spacing:1px; }
  .cm-social-title { font-size:22px;color:#fff;font-weight:950;letter-spacing:-0.5px;margin-top:8px;line-height:1.2; }
  .cm-social-desc { color:#7d8b97;font-size:12px;line-height:1.6;margin-top:8px; }
  .cm-social-link { display:inline-block;margin-top:14px;color:#a78bfa;font-size:13px;font-weight:800;cursor:pointer;transition:.2s; }
  .cm-social-link:hover { color:#c4b5fd;transform:translateX(4px); }
  .cm-global-preview { display:flex;flex-direction:column;gap:5px;max-height:200px;overflow:hidden;border-radius:12px;background:rgba(0,0,0,.3);padding:10px;border:1px solid rgba(255,255,255,.04); }
  .cm-preview-header { display:flex;align-items:center;gap:6px;color:#94a3b8;font-size:10px;font-weight:800;margin-bottom:2px; }
  .cm-preview-live { width:7px;height:7px;border-radius:50%;background:#22c55e;animation:cmLivePulse 2s ease-in-out infinite; }
  @keyframes cmLivePulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(34,197,94,.4)} 50%{opacity:.8;box-shadow:0 0 0 5px rgba(34,197,94,0)} }
  .cm-preview-msg { display:flex;gap:7px;align-items:flex-start;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,.03);transition:.2s; }
  .cm-preview-msg:hover { background:rgba(255,255,255,.06); }
  .cm-preview-avatar { font-size:16px;width:26px;height:26px;display:grid;place-items:center;background:rgba(255,255,255,.05);border-radius:7px;flex-shrink:0; }
  .cm-preview-content { overflow:hidden; }
  .cm-preview-content b{font-size:10px;color:#e2e8f0;display:block;margin-bottom:1px}
  .cm-preview-content span{font-size:10px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
  .cm-preview-empty { text-align:center;padding:20px 12px;color:#475569;font-size:11px; }

  .cm-footer { padding:40px 0 30px; text-align:center; border-top:1px solid rgba(255,255,255,.05); margin-top:60px; }
  .cm-footer-text { margin-top:14px; font-size:16px; letter-spacing:-0.3px; }
  .cm-footer-slogan { color:#64748b; font-size:12px; margin-top:6px; }
  .cm-footer-socials { display:flex; gap:12px; justify-content:center; margin-top:18px; }
  .cm-footer-socials a { width:38px; height:38px; border-radius:50%; display:grid; place-items:center; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.08); color:#94a3b8; font-size:16px; text-decoration:none; transition:all .2s; }
  .cm-footer-socials a:hover { background:rgba(124,58,237,.2); border-color:rgba(124,58,237,.4); color:#a78bfa; transform:translateY(-2px); }

  @media (max-width: 768px) {
    .cm-home-main { width: 100vw !important; max-width: 100vw !important; padding: 20px 12px 40px !important; overflow-x: hidden !important; }
    .cm-home-nav { padding: 10px 12px !important; }
    .cm-nav-actions { width: auto !important; }
    .cm-hero { padding: 10px 0 0 !important; }
    .cm-hero-title { font-size: clamp(30px, 8vw, 50px) !important; letter-spacing: -2px !important; }
    .cm-hero-sub { font-size: 13px !important; line-height: 1.5 !important; max-width: 100% !important; padding: 0 4px !important; }
    .cm-hero-actions { gap: 10px !important; }
    .cm-big-btn { width: 100% !important; padding: 14px 16px !important; font-size: 13px !important; }
    .cm-section { margin-top: 36px !important; }
    .cm-section-head { flex-direction: column !important; gap: 6px !important; text-align: center !important; }
    .cm-section-head h3 { font-size: 20px !important; }
    .cm-room-grid { grid-template-columns: 1fr !important; gap: 10px !important; }
    .cm-feature-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
    .cm-social-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
    .cm-devices-showcase { display: none !important; }
    .cm-footer-text { font-size: 14px !important; }
  }
`;
