const DarkModeToggle = ({ isDark, onToggle }) => (
  <button className="dark-mode-toggle touch-feedback" onClick={onToggle}>
    <span>{isDark ? '🌙' : '☀️'}</span>
    <span className="dark-mode-label">{isDark ? 'Karanlik Mod' : 'Aydinlik Mod'}</span>
    <div className={`dark-mode-switch ${isDark ? 'on' : ''}`}>
      <div className="dark-mode-knob" />
    </div>
  </button>
);

export default DarkModeToggle;
