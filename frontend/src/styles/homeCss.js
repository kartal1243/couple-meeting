export const HOME_CSS = `
  /* ========================================================
     TINDER PEMBE & BEYAZ (PINK & WHITE) THEME FOR COUPLE MEETING
     ======================================================== */
  .cm-home {
    min-height: 100%;
    position: relative;
    overflow-x: hidden;
    background: #ffffff;
    color: #111827;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  
  /* Tinder Ambient Soft Pink Mesh Glow */
  .cm-home-bg-glow {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 1400px;
    height: 750px;
    background: radial-gradient(circle at 50% 12%, rgba(253, 38, 125, 0.12) 0%, rgba(255, 96, 54, 0.06) 40%, rgba(255, 255, 255, 0) 75%);
    pointer-events: none;
    z-index: 0;
  }

  .cm-home-main {
    position: relative;
    z-index: 2;
    width: min(1200px, 94vw);
    margin: 0 auto;
    padding: 10px 0 60px;
  }

  /* Section Headers */
  .cm-section {
    margin-top: 68px;
  }

  .cm-section-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 20px;
    margin-bottom: 24px;
  }

  .cm-section-head h3 {
    margin: 0;
    color: #0f172a;
    font-size: 28px;
    font-weight: 950;
    letter-spacing: -0.7px;
  }

  .cm-section-head p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 14px;
    font-weight: 500;
  }

  /* Tinder-Style Room Cards */
  .cm-room-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 18px;
  }

  .cm-room {
    padding: 20px 22px;
    border-radius: 22px;
    background: #ffffff;
    border: 1.5px solid rgba(15, 23, 42, 0.08);
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  }

  .cm-room:hover {
    transform: translateY(-4px);
    border-color: #fd267d;
    box-shadow: 0 16px 36px rgba(253, 38, 125, 0.15);
  }

  .cm-room-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 14px;
  }

  .cm-room-icon-wrap {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(253, 38, 125, 0.12), rgba(255, 96, 54, 0.12));
    display: grid;
    place-items: center;
  }

  .cm-room-emoji {
    font-size: 20px;
  }

  .cm-room-name {
    color: #0f172a;
    font-weight: 950;
    font-size: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cm-room-meta {
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
    margin-top: 4px;
  }

  .cm-room-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .cm-room-users {
    display: flex;
    align-items: center;
  }

  .cm-room-user-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 12px;
    margin-left: -8px;
    border: 2px solid #fff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  }

  .cm-room-user-avatar:first-child {
    margin-left: 0;
  }

  .cm-room-join-btn {
    background: linear-gradient(135deg, #fd267d, #ff6036);
    color: #ffffff;
    padding: 7px 16px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 900;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(253, 38, 125, 0.25);
  }

  .cm-room:hover .cm-room-join-btn {
    transform: scale(1.05);
    box-shadow: 0 6px 18px rgba(253, 38, 125, 0.4);
  }

  /* Empty State */
  .cm-empty-state {
    text-align: center;
    padding: 44px 20px;
    background: #ffffff;
    border-radius: 24px;
    border: 1.5px solid rgba(0,0,0,0.08);
  }

  .cm-empty-icon {
    font-size: 46px;
    margin-bottom: 12px;
  }

  .cm-empty-title {
    color: #0f172a;
    font-weight: 950;
    font-size: 18px;
  }

  .cm-empty-desc {
    color: #64748b;
    font-size: 13.5px;
    margin-top: 5px;
  }

  /* Tinder Animations */
  @keyframes cmLivePulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.45); }
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

  @keyframes cmCardFloat {
    0%, 100% { transform: translateY(0px) rotate(-1deg); }
    50% { transform: translateY(-8px) rotate(1deg); }
  }

  @media (max-width: 768px) {
    .cm-home-main {
      width: 100vw !important;
      max-width: 100vw !important;
      padding: 12px 14px 40px !important;
    }
    .cm-room-grid {
      grid-template-columns: 1fr !important;
    }
    .cm-section-head {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 6px !important;
    }
  }
`;
