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
