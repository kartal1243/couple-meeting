const BottomNavBar = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', icon: '🏠', label: 'Ana Sayfa' },
    { id: 'chat', icon: '💬', label: 'Sohbet' },
    { id: 'friends', icon: '👥', label: 'Arkadaslar' },
    { id: 'settings', icon: '⚙️', label: 'Ayarlar' },
  ];

  return (
    <div className="mobile-bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`mobile-nav-item ${activeTab === tab.id ? 'active' : ''}`}
        >
          <span className="mobile-nav-icon">{tab.icon}</span>
          <span className="mobile-nav-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNavBar;
