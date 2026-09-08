const BottomNavBar = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'rooms', icon: '🏠', label: 'Odalar' },
    { id: 'chat', icon: '💬', label: 'Sohbet' },
    { id: 'friends', icon: '👥', label: 'Arkadaslar' },
    { id: 'about', icon: 'ℹ️', label: 'Hakkimizda' },
    { id: 'profile', icon: '👤', label: 'Profilim' },
  ];

  return (
    <div className="mobile-bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`mobile-nav-item ${activeTab === tab.id ? 'active' : ''}`}
        >
          <div className="mobile-nav-icon-wrap">
            <span className="mobile-nav-icon">{tab.icon}</span>
            {activeTab === tab.id && <div className="mobile-nav-dot" />}
          </div>
          <span className="mobile-nav-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNavBar;
