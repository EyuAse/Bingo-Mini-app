import React from 'react';
import { useAdmin } from '../../context/AdminContext.tsx';
import { useApp } from '../../context/AppContext.tsx';

export type AdminTab =
  | 'overview'
  | 'cashier'
  | 'cashflow'
  | 'users'
  | 'bots'
  | 'cartelas'
  | 'network'
  | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  isMobileOpen: boolean;
  closeMobileSidebar: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen,
  closeMobileSidebar
}) => {
  const {
    isSidebarCollapsed,
    toggleSidebar,
    logoutAdmin,
    transactions,
    simulatedPlayerCount,
    users
  } = useAdmin();

  const { showToast } = useApp();

  const pendingCount = (transactions || []).filter(t => t.status === 'pending').length;

  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    closeMobileSidebar();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div className="admin-sidebar-backdrop" onClick={closeMobileSidebar}></div>
      )}

      <aside
        className={`admin-sidebar-light ${isSidebarCollapsed ? 'collapsed' : ''} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
      >
        {/* 1. Brand Logo Header */}
        <div className="sidebar-light-brand-box">
          <div className="sidebar-light-logo-wrap">
            <div className="lomi-logo-artwork">
              <span className="lomi-letter-l">L</span>
              <span className="lomi-lemon-o">
                <span className="lemon-slice-svg">🍋</span>
              </span>
              <span className="lomi-letter-m">M</span>
              <span className="lomi-letter-i">I</span>
            </div>
            <span className="lomi-sub-dots">• B I N G O •</span>
          </div>

          <button
            type="button"
            className="sidebar-collapse-btn-light"
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <i
              className={`fa-solid ${
                isSidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'
              }`}
            ></i>
          </button>
        </div>

        {/* 2. Admin Panel Pill & Engine Uptime Pill */}
        {!isSidebarCollapsed && (
          <div className="sidebar-status-pills-wrap">
            <div className="admin-panel-tag">
              <i className="fa-solid fa-crown gold-crown"></i>
              <span>ADMIN PANEL</span>
            </div>

            <div className="engine-uptime-tag">
              <div className="pulse-green-dot"></div>
              <span className="uptime-title">Engine V3 Live</span>
              <span className="uptime-pill">99.9% Uptime</span>
            </div>
          </div>
        )}

        {/* 3. Streamlined Navigation Menu Items */}
        <nav className="sidebar-light-nav-menu">
          {/* 1. Dashboard */}
          <button
            type="button"
            className={`light-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleSelectTab('overview')}
            title="Dashboard"
          >
            <div className="light-nav-icon">
              <i className="fa-solid fa-house"></i>
            </div>
            {!isSidebarCollapsed && <span className="light-nav-text">Dashboard</span>}
          </button>

          {/* 2. Cashier Queue */}
          <button
            type="button"
            className={`light-nav-item ${activeTab === 'cashier' ? 'active' : ''}`}
            onClick={() => handleSelectTab('cashier')}
            title="Cashier Queue"
          >
            <div className="light-nav-icon">
              <i className="fa-solid fa-inbox"></i>
            </div>
            {!isSidebarCollapsed && (
              <>
                <span className="light-nav-text">Cashier Queue</span>
                {pendingCount > 0 && (
                  <span className="light-nav-badge yellow-badge">{pendingCount}</span>
                )}
              </>
            )}
          </button>

          {/* 3. Cash Flow & Revenue */}
          <button
            type="button"
            className={`light-nav-item ${activeTab === 'cashflow' ? 'active' : ''}`}
            onClick={() => handleSelectTab('cashflow')}
            title="Cash Flow & Revenue"
          >
            <div className="light-nav-icon">
              <i className="fa-solid fa-scale-balanced"></i>
            </div>
            {!isSidebarCollapsed && <span className="light-nav-text">Cash Flow & Revenue</span>}
          </button>

          {/* 4. Player Accounts */}
          <button
            type="button"
            className={`light-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => handleSelectTab('users')}
            title="Player Accounts"
          >
            <div className="light-nav-icon">
              <i className="fa-solid fa-user-group"></i>
            </div>
            {!isSidebarCollapsed && (
              <>
                <span className="light-nav-text">Player Accounts</span>
                <span className="light-nav-badge">{users.length}</span>
              </>
            )}
          </button>

          {/* 5. Bot Player Accounts */}
          <button
            type="button"
            className={`light-nav-item ${activeTab === 'bots' ? 'active' : ''}`}
            onClick={() => handleSelectTab('bots')}
            title="Bot Player Accounts"
          >
            <div className="light-nav-icon">
              <i className="fa-solid fa-robot"></i>
            </div>
            {!isSidebarCollapsed && (
              <>
                <span className="light-nav-text">Bot Player Accounts</span>
                <span className="light-nav-badge">200</span>
              </>
            )}
          </button>

          {/* 6. 400 Cartelas */}
          <button
            type="button"
            className={`light-nav-item ${activeTab === 'cartelas' ? 'active' : ''}`}
            onClick={() => handleSelectTab('cartelas')}
            title="400 Cartelas"
          >
            <div className="light-nav-icon">
              <i className="fa-solid fa-layer-group"></i>
            </div>
            {!isSidebarCollapsed && (
              <>
                <span className="light-nav-text">400 Cartelas</span>
                <span className="light-nav-badge">400</span>
              </>
            )}
          </button>

          {/* 7. Network Health & Disconnects */}
          <button
            type="button"
            className={`light-nav-item ${activeTab === 'network' ? 'active' : ''}`}
            onClick={() => handleSelectTab('network')}
            title="Live Network Health & Disconnect Protection"
          >
            <div className="light-nav-icon">
              <i className="fa-solid fa-tower-broadcast"></i>
            </div>
            {!isSidebarCollapsed && (
              <>
                <span className="light-nav-text">Network Health</span>
                <span className="light-nav-badge green-badge">🛡️ Live</span>
              </>
            )}
          </button>

          {/* 8. Settings */}
          <button
            type="button"
            className={`light-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleSelectTab('settings')}
            title="System & Commission Settings"
          >
            <div className="light-nav-icon">
              <i className="fa-solid fa-gear"></i>
            </div>
            {!isSidebarCollapsed && <span className="light-nav-text">Settings</span>}
          </button>
        </nav>

        {/* 4. Bottom Promo Card with Lemon Graphic */}
        {!isSidebarCollapsed && (
          <div className="sidebar-light-promo-card">
            <div className="promo-card-left">
              <div className="promo-gift-row">
                <span className="promo-gift-icon">🎁</span>
                <span className="promo-perc-gold">200%</span>
              </div>
              <p className="promo-amharic-txt">የአዲስ ደንበኛ ቦነስ?</p>
            </div>

            <button
              type="button"
              className="btn-promo-circle-arrow"
              onClick={() => showToast('🎉 200% Welcome Deposit Bonus Active')}
              title="Bonus details"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>

            {/* Sliced Lemon Artwork Decoration */}
            <div className="promo-lemon-slice-art">
              <svg viewBox="0 0 60 60" width="46" height="46" fill="none">
                <circle cx="30" cy="30" r="26" fill="#facc15" stroke="#eab308" strokeWidth="2.5" />
                <circle cx="30" cy="30" r="21" fill="#fef08a" />
                {/* Segments */}
                <path d="M30 30L30 10A20 20 0 0 1 45 17Z" fill="#fde047" stroke="#eab308" strokeWidth="1" />
                <path d="M30 30L45 17A20 20 0 0 1 50 30Z" fill="#fde047" stroke="#eab308" strokeWidth="1" />
                <path d="M30 30L50 30A20 20 0 0 1 45 43Z" fill="#fde047" stroke="#eab308" strokeWidth="1" />
                <path d="M30 30L45 43A20 20 0 0 1 30 50Z" fill="#fde047" stroke="#eab308" strokeWidth="1" />
                <path d="M30 30L30 50A20 20 0 0 1 15 43Z" fill="#fde047" stroke="#eab308" strokeWidth="1" />
                <path d="M30 30L15 43A20 20 0 0 1 10 30Z" fill="#fde047" stroke="#eab308" strokeWidth="1" />
                <path d="M30 30L10 30A20 20 0 0 1 15 17Z" fill="#fde047" stroke="#eab308" strokeWidth="1" />
                <path d="M30 30L15 17A20 20 0 0 1 30 10Z" fill="#fde047" stroke="#eab308" strokeWidth="1" />
                <circle cx="30" cy="30" r="4" fill="#ffffff" />
              </svg>
            </div>
          </div>
        )}

        {/* 5. Bottom Logout Action */}
        <div className="sidebar-light-footer-logout">
          <button
            type="button"
            className="btn-light-logout"
            onClick={() => {
              logoutAdmin();
              showToast('👋 Logged out from Admin Portal');
            }}
            title="Logout of Admin"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
