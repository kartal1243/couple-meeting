export const HOME_CSS = `
  .cm-home { min-height: 100%; position: relative; overflow-x: hidden; background: #ffffff; color: #111827; }
  
  /* Tinder Ambient Mesh Glow */
  .cm-home-bg-glow {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 1400px;
    height: 700px;
    background: radial-gradient(circle at 50% 15%, rgba(253, 38, 125, 0.09) 0%, rgba(255, 96, 54, 0.05) 45%, rgba(255, 255, 255, 0) 75%);
    pointer-events: none;
    z-index: 0;
  }

  .cm-home-main { position: relative; z-index: 2; width: min(1200px, 92vw); margin: 0 auto; padding: 20px 0 60px; }

  /* Sections */
  .cm-section { margin-top: 64px; }
  .cm-section-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; margin-bottom: 22px; }
  .cm-section-head h3 { margin: 0; color: #111827; font-size: 26px; font-weight: 950; letter-spacing: -0.6px; }
  .cm-section-head p { margin: 4px 0 0; color: #64748b; font-size: 14px; }

  /* Tinder-Style Room Cards */
  .cm-room-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
  .cm-room {
    padding: 18px 20px;
    border-radius: 20px;
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.08);
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
  }
  .cm-room:hover {
    transform: translateY(-4px);
    border-color: rgba(253, 38, 125, 0.4);
    box-shadow: 0 16px 36px rgba(253, 38, 125, 0.12);
  }
  .cm-room-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
  .cm-room-icon-wrap {
    width: 38px; height: 38px; border-radius: 12px;
    background: linear-gradient(135deg, rgba(253, 38, 125, 0.1), rgba(255, 96, 54, 0.1));
    display: grid; place-items: center;
  }
  .cm-room-emoji { font-size: 18px; }
  .cm-room-name { color: #111827; font-weight: 950; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cm-room-meta { color: #64748b; font-size: 11px; font-weight: 600; margin-top: 3px; }
  .cm-room-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(0, 0, 0, 0.05); }
  .cm-room-users { display: flex; align-items: center; }
  .cm-room-user-avatar { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font-size: 11px; margin-left: -7px; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
  .cm-room-user-avatar:first-child { margin-left: 0; }
  .cm-room-user-more { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font-size: 9px; color: #64748b; background: #f1f5f9; margin-left: -7px; border: 2px solid #fff; font-weight: 800; }
  .cm-room-join-btn {
    background: linear-gradient(135deg, #fd267d, #ff6036);
    color: #fff;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 900;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(253, 38, 125, 0.25);
  }
  .cm-room:hover .cm-room-join-btn {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(253, 38, 125, 0.4);
  }

  /* Empty State */
  .cm-empty-state { text-align: center; padding: 40px 20px; background: #ffffff; border-radius: 24px; border: 1px solid rgba(0,0,0,0.07); }
  .cm-empty-icon { font-size: 42px; margin-bottom: 10px; }
  .cm-empty-title { color: #111827; font-weight: 950; font-size: 17px; }
  .cm-empty-desc { color: #64748b; font-size: 13px; margin-top: 4px; }

  @keyframes cmLivePulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
    50% { opacity: 0.8; box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
  }

  @keyframes cmPulseHeart {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.15); }
  }

  @keyframes cmWaveBar {
    0%, 100% { transform: scaleY(0.4); }
    50% { transform: scaleY(1.3); }
  }

  @media (max-width: 768px) {
    .cm-home-main { width: 100vw !important; max-width: 100vw !important; padding: 16px 14px 40px !important; }
    .cm-room-grid { grid-template-columns: 1fr !important; }
    .cm-section-head { flex-direction: column !important; align-items: flex-start !important; gap: 6px !important; }
  }
`;
