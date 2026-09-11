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
  img, video, iframe, embed, object { max-width: 100% !important; }
  input, textarea, select, button { max-width: 100% !important; }

  @media (max-width: 768px) {
    html, body, #root { width: 100vw !important; overflow-x: hidden !important; }

    .cm-room-root { display: flex !important; flex-direction: column !important; height: auto !important; min-height: 100dvh !important; }
    .cm-room-header { position: sticky !important; top: 0 !important; z-index: 99999 !important; flex-shrink: 0 !important; width: 100% !important; padding: 0 10px !important; height: 50px !important; }
    .cm-room-header h2 { font-size: 13px !important; max-width: 80px !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; }

    .cm-player-col { width: 100% !important; flex-shrink: 0 !important; padding: 0 8px !important; }
    .cm-search-bar { padding: 6px 8px !important; gap: 4px !important; flex-wrap: wrap !important; }
    .cm-search-bar input { min-width: 0 !important; flex: 1 1 100% !important; font-size: 12px !important; padding: 8px !important; }
    .cm-search-bar .cm-action-btn { flex: 1 1 calc(50% - 2px) !important; font-size: 10px !important; padding: 7px 6px !important; }
    .cm-search-results { position: fixed !important; top: 56px !important; left: 8px !important; right: 8px !important; max-height: 50vh !important; overflow-y: auto !important; z-index: 99999 !important; }
    .cm-video-wrap { width: 100% !important; aspect-ratio: 16/9 !important; height: auto !important; min-height: 0 !important; }
    .cm-controls { padding: 6px 8px !important; gap: 4px !important; flex-wrap: wrap !important; }
    .cm-controls > button { flex: 1 1 calc(33% - 4px) !important; font-size: 11px !important; padding: 7px 4px !important; }
    .cm-reactions { width: 100% !important; display: grid !important; grid-template-columns: repeat(6, 1fr) !important; gap: 2px !important; }
    .cm-reactions button { padding: 5px 2px !important; font-size: 15px !important; }

    .cm-sidebar { width: 100% !important; max-height: 45vh !important; border-left: none !important; border-top: 1px solid #222d34 !important; flex-shrink: 0 !important; }
    .cm-sidebar-tabs { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
    .cm-sidebar-tabs::-webkit-scrollbar { display: none !important; }

    .cm-room-header-actions { gap: 4px !important; }
    .cm-room-header-actions button { padding: 5px 8px !important; font-size: 10px !important; }

    .cm-home-main { width: 100vw !important; padding: 20px 12px 40px !important; overflow-x: hidden !important; }
    .cm-home-nav { padding: 10px 12px !important; }
    .cm-home-brand { gap: 6px !important; }
    .cm-nav-soundwave { display: none !important; }
    .cm-home-brand > div > div:first-child { font-size: 14px !important; }
    .cm-home-brand > div > div:last-child { font-size: 8px !important; }
    .cm-nav-actions { gap: 4px !important; }
    .cm-nav-actions button { padding: 6px 8px !important; font-size: 10px !important; }

    .cm-hero-title { font-size: 36px !important; letter-spacing: -2px !important; }
    .cm-hero-sub { font-size: 13px !important; padding: 0 8px !important; }
    .cm-hero-actions { flex-direction: column !important; gap: 8px !important; }
    .cm-big-btn { width: 100% !important; text-align: center !important; padding: 12px !important; font-size: 13px !important; }

    .cm-section { margin-top: 36px !important; }
    .cm-section-head h3 { font-size: 18px !important; }
    .cm-section-head p { font-size: 11px !important; }

    .cm-room-grid { grid-template-columns: 1fr !important; gap: 8px !important; }
    .cm-feature-grid { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
    .cm-social-grid { grid-template-columns: 1fr !important; }
    .cm-social-box { width: 100% !important; height: 100% !important; border-radius: 0 !important; max-height: 100dvh !important; }
    .cm-social-layout { flex-direction: column !important; }
    .cm-social-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid #25313a !important; flex-direction: row !important; overflow-x: auto !important; gap: 2px !important; padding: 4px 6px !important; }
    .cm-social-sidebar::-webkit-scrollbar { display: none !important; }
    .cm-social-sidebar-btn { padding: 6px 10px !important; font-size: 10px !important; white-space: nowrap !important; flex-shrink: 0 !important; }
    .cm-social-sidebar-footer { display: none !important; }
    .cm-social-content { padding: 8px !important; }
    .cm-social-msg-input { font-size: 13px !important; padding: 8px !important; }

    .cm-devices-showcase { display: none !important; }
    .cm-footer-text { font-size: 14px !important; }

    .admin-grid { grid-template-columns: 1fr !important; }
    .admin-stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .admin-header { flex-wrap: wrap !important; }

    .cm-comm-root { padding: 10px !important; }
    .cm-comm-header { flex-direction: column !important; gap: 8px !important; }
    .cm-comm-header button { width: 100% !important; text-align: center !important; }
  }

  @media (max-width: 400px) {
    .cm-hero-title { font-size: 28px !important; }
    .cm-feature-grid { grid-template-columns: 1fr !important; }
    .cm-controls > button { flex: 1 1 calc(50% - 4px) !important; }
  }
`;
