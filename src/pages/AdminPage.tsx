import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext.tsx';
import { useApp } from '../context/AppContext.tsx';
import { AdminPINModal } from '../components/admin/AdminPINModal.tsx';
import { AdminSidebar, AdminTab } from '../components/admin/AdminSidebar.tsx';
import { AdminBottomNav } from '../components/admin/AdminBottomNav.tsx';
import { DashboardOverview } from '../components/admin/DashboardOverview.tsx';
import { CashierDesk } from '../components/admin/CashierDesk.tsx';
import { CashFlowAnalytics } from '../components/admin/CashFlowAnalytics.tsx';
import { PlayerAccountsDesk } from '../components/admin/PlayerAccountsDesk.tsx';
import { BotsSimulatorDesk } from '../components/admin/BotsSimulatorDesk.tsx';
import { BotAccountsDesk } from '../components/admin/BotAccountsDesk.tsx';
import { CartelasDesk } from '../components/admin/CartelasDesk.tsx';
import { AdminSettings } from '../components/admin/AdminSettings.tsx';
import { NetworkHealthDesk } from '../components/admin/NetworkHealthDesk.tsx';
import '../styles/admin.css';

export const AdminPage: React.FC = () => {
  const { isAuthenticated, isSidebarCollapsed } = useAdmin();
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // If not authenticated, render the PIN lock guard
  if (!isAuthenticated) {
    return <AdminPINModal />;
  }

  return (
    <div className="admin-layout-shell">
      {/* 1. Modern Collapsible Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileSidebarOpen}
        closeMobileSidebar={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Admin Content Viewport */}
      <div className={`admin-main-viewport ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Top Header Bar matching Reference UI */}
        <header className="admin-viewport-header-light">
          <div className="viewport-header-left-light">
            <button
              className="admin-mobile-toggle-light"
              onClick={() => setIsMobileSidebarOpen(true)}
              title="Open Navigation"
            >
              <i className="fa-solid fa-bars"></i>
            </button>
            <div className="viewport-page-title-box">
              <h2 className="viewport-page-main-heading">
                <i className="fa-solid fa-bolt-lightning header-gold-bolt"></i>
                {activeTab === 'overview' && 'Dashboard & Operations Desk'}
                {activeTab === 'cashier' && 'Cashier Approvals & Settlement Queue'}
                {activeTab === 'cashflow' && 'Cash Flow & Revenue Analytics'}
                {activeTab === 'users' && 'Player Accounts & Wallets Directory'}
                {activeTab === 'bots' && '200 Bot Player Accounts & Wallets'}
                {activeTab === 'cartelas' && '400 Serial Cartela Cards Library'}
                {activeTab === 'network' && 'Live Network Health & Disconnect Protection Desk'}
                {activeTab === 'settings' && 'System & Commission Settings'}
              </h2>
              <p className="viewport-page-amharic-sub">
                {activeTab === 'cashier' && 'ተወራራጅ ክፍያዎችን ያጽድቁ እና ገንዘቦችን በቀጥታ ባንክ ይላኩ'}
                {activeTab === 'overview' && 'የቀጥታ ጨዋታዎችን፣ የኮሚሽን ትርፍን እና የክፍያዎችን ፍሰት ይቆጣጠሩ'}
                {activeTab === 'cashflow' && 'የቀን ተቀማጭ፣ የክፍያ ወጪ እና የተጣራ የሎሚ ቢንጎ ገቢ ዝርዝር'}
                {activeTab === 'users' && 'የተመዘገቡ ተጫዋቾች፣ የዋሌት ቀሪ ሂሳብ እና የቦነስ ማበረታቻዎች'}
                {activeTab === 'bots' && 'እውነተኛ የውሂብ ጎታ ያላቸው 200 የቦቶች ዋሌቶች፣ ራስ-ሰር ተወራራጅነት እና የቀጥታ አሸናፊነት መዝገብ'}
                {activeTab === 'cartelas' && '400 የቢንጎ ካርቴላ ካርዶች ቤተ-መጽሐፍት'}
                {activeTab === 'network' && 'የቀጥታ ሶኬት ፍጥነት፣ የኔትዎርክ ጤንነት እና የራስ-ሰር አሸናፊነት መዝገብ'}
                {activeTab === 'settings' && 'የኮሚሽን ተመን፣ የጨዋታ ህጎች እና የአስተዳዳሪ ደህንነት'}
              </p>
            </div>
          </div>

          <div className="viewport-header-right-light">
            {/* Language Switcher Pill */}
            <div className="admin-lang-pill-light">
              <span className="lang-flag-icon">🇪🇹</span>
              <span className="lang-text-amharic">አማ</span>
              <i className="fa-solid fa-chevron-down lang-chevron-down"></i>
            </div>

            {/* Notification Bell with Badge */}
            <button
              type="button"
              className="admin-bell-btn-light"
              onClick={() => showToast('🔔 12 Pending Action items')}
              title="Notifications"
            >
              <i className="fa-regular fa-bell"></i>
              <span className="bell-red-badge">12</span>
            </button>

            {/* Admin Profile Pill */}
            <div className="admin-profile-pill-light">
              <div className="profile-crown-icon">
                <i className="fa-solid fa-crown gold"></i>
              </div>
              <div className="profile-text-group">
                <strong className="profile-name">Admin</strong>
                <span className="profile-role">Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Content Panes */}
        <main className="admin-tab-content">
          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {activeTab === 'overview' && <DashboardOverview onNavigateTab={setActiveTab} />}

          {/* TAB 2: CASHIER APPROVALS DESK */}
          {activeTab === 'cashier' && <CashierDesk />}

          {/* TAB 3: CASH FLOW & REVENUE ANALYTICS */}
          {activeTab === 'cashflow' && <CashFlowAnalytics />}

          {/* TAB 4: PLAYER ACCOUNTS & WALLETS DIRECTORY */}
          {activeTab === 'users' && <PlayerAccountsDesk />}

          {/* TAB 5: 200 BOT PLAYER ACCOUNTS & WALLETS */}
          {activeTab === 'bots' && <BotAccountsDesk />}

          {/* TAB 6: 400 SERIAL CARTELA CARDS LIBRARY */}
          {activeTab === 'cartelas' && <CartelasDesk />}

          {/* TAB 7: LIVE NETWORK HEALTH & DISCONNECT PROTECTION */}
          {activeTab === 'network' && <NetworkHealthDesk />}

          {/* TAB 8: SYSTEM & COMMISSION SETTINGS */}
          {activeTab === 'settings' && <AdminSettings />}
        </main>

        {/* 3. Mobile App-Style Bottom Navigation Bar (< 768px) */}
        <AdminBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
};
