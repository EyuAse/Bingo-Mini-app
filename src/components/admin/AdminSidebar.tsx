import React from 'react';
import { useAdmin } from '../../context/AdminContext.tsx';
import { useApp } from '../../context/AppContext.tsx';

export type AdminTab = 'overview' | 'cashier' | 'cashflow' | 'commission' | 'bots' | 'users' | 'cartelas';

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
    users,
    totalHouseProfit
  } = useAdmin();

  const { switchPage, showToast } = useApp();

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
        className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
      >
        {/* 1. Sidebar Brand Header */}
        <div className="sidebar-brand-box">
          <div className="sidebar-brand-left">
            <div className="sidebar-brand-icon">
              <i className="fa-solid fa-crown"></i>
            </div>
            {!isSidebarCollapsed && (
              <div className="sidebar-brand-title">
                <span className="brand-white">LOMI</span>
                <span className="brand-gold">BINGO</span>
                <span className="sidebar-engine-badge">V-ADMIN</span>
              </div>
            )}
          </div>

          <button
            className="sidebar-collapse-btn"
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

        {/* 2. Live Engine Heartbeat Indicator */}
        {!isSidebarCollapsed && (
          <div className="sidebar-engine-status">
            <div className="pulse-dot"></div>
            <span className="status-text">Engine V3 Live · 99.9% Up</span>
          </div>
        )}

        {/* 3. Navigation Links */}
        <nav className="sidebar-nav-menu">
          <button
            className={`sidebar-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleSelectTab('overview')}
            title="Overview & Platform Dashboard"
          >
            <div className="nav-icon-wrap">
              <i className="fa-solid fa-chart-pie"></i>
            </div>
            {!isSidebarCollapsed && <span className="nav-label">Dashboard & Metrics</span>}
          </button>

          {/* Cashier Approvals Desk with Glowing Badge */}
          <button
            className={`sidebar-nav-item cashier-item ${activeTab === 'cashier' ? 'active' : ''}`}
            onClick={() => handleSelectTab('cashier')}
            title="Deposit & Withdraw Approvals Desk"
          >
            <div className="nav-icon-wrap">
              <i className="fa-solid fa-bolt-lightning" style={{ color: '#facc15' }}></i>
            </div>
            {!isSidebarCollapsed && (
              <>
                <span className="nav-label">Cashier Approvals</span>
                {pendingCount > 0 && (
                  <span className="sidebar-pending-badge">{pendingCount}</span>
                )}
              </>
            )}
            {isSidebarCollapsed && pendingCount > 0 && (
              <span className="sidebar-dot-badge"></span>
            )}
          </button>

          {/* Dedicated Cash Flow & Revenue Ledger */}
          <button
            className={`sidebar-nav-item ${activeTab === 'cashflow' ? 'active' : ''}`}
            onClick={() => handleSelectTab('cashflow')}
            title="Cash Flow & Revenue Analytics"
          >
            <div className="nav-icon-wrap">
              <i className="fa-solid fa-scale-balanced" style={{ color: '#4ade80' }}></i>
            </div>
            {!isSidebarCollapsed && <span className="nav-label">Cash Flow & Revenue</span>}
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'commission' ? 'active' : ''}`}
            onClick={() => handleSelectTab('commission')}
            title="Game Rules & House Commission"
          >
            <div className="nav-icon-wrap">
              <i className="fa-solid fa-sliders"></i>
            </div>
            {!isSidebarCollapsed && <span className="nav-label">Game & Commission</span>}
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'bots' ? 'active' : ''}`}
            onClick={() => handleSelectTab('bots')}
            title="200+ Bot Simulator & RTP"
          >
            <div className="nav-icon-wrap">
              <i className="fa-solid fa-robot"></i>
            </div>
            {!isSidebarCollapsed && (
              <>
                <span className="nav-label">200+ Bot Simulator</span>
                <span className="sidebar-count-badge">{simulatedPlayerCount}</span>
              </>
            )}
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => handleSelectTab('users')}
            title="Users & Bonus Management"
          >
            <div className="nav-icon-wrap">
              <i className="fa-solid fa-users-gear"></i>
            </div>
            {!isSidebarCollapsed && (
              <>
                <span className="nav-label">Users & Bonuses</span>
                <span className="sidebar-count-badge">{users.length}</span>
              </>
            )}
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'cartelas' ? 'active' : ''}`}
            onClick={() => handleSelectTab('cartelas')}
            title="400 Cartela Cards Pool"
          >
            <div className="nav-icon-wrap">
              <i className="fa-solid fa-layer-group"></i>
            </div>
            {!isSidebarCollapsed && (
              <>
                <span className="nav-label">400 Cartela Cards</span>
                <span className="sidebar-count-badge">400</span>
              </>
            )}
          </button>
        </nav>

        {/* 4. Quick Snapshot Widget in Sidebar Footer */}
        {!isSidebarCollapsed && (
          <div className="sidebar-snapshot-card">
            <div className="snapshot-header">
              <span>House Profit (10%)</span>
              <i className="fa-solid fa-vault gold"></i>
            </div>
            <div className="snapshot-val">{(totalHouseProfit || 0).toFixed(2)} ETB</div>
            <div className="snapshot-footer">
              <span>Online Crowd: {simulatedPlayerCount} Players</span>
            </div>
          </div>
        )}

        {/* 5. Bottom Logout Action */}
        <div className="sidebar-footer-actions">
          <button
            className="sidebar-action-btn btn-logout"
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
