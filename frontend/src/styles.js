export const getStyles = (currentTheme) => ({
  app: {
    background: currentTheme.bg,
    color: '#e9edef',
    width: '100vw',
    height: '100vh',
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
    overflow: 'hidden',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },
  card: {
    background: currentTheme.cardBg,
    border: '1px solid #22303a',
    borderRadius: '20px',
    padding: '24px'
  },
  buttonPrimary: {
    background: `linear-gradient(135deg, ${currentTheme.primary} 0%, #008f6f 100%)`,
    color: '#ffffff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 6px 18px rgba(0,0,0,0.35)'
  },
  input: {
    background: '#111b21',
    border: '1px solid #222d34',
    color: '#e9edef',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    outline: 'none'
  }
});
