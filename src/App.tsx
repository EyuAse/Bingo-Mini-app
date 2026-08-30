import React from 'react';
import { useApp } from './context/AppContext.tsx';
import { TopHeader } from './components/common/TopHeader.tsx';
import { BalanceBar } from './components/common/BalanceBar.tsx';
import { BottomNav } from './components/common/BottomNav.tsx';
import { Toast } from './components/common/Toast.tsx';

// Pages
import { LandingPage } from './pages/LandingPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { SignupPage } from './pages/SignupPage.tsx';
import { GamesPage } from './pages/GamesPage.tsx';
import { WalletPage } from './pages/WalletPage.tsx';
import { HistoryPage } from './pages/HistoryPage.tsx';
import { LeaderPage } from './pages/LeaderPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { BingoPage } from './pages/BingoPage.tsx';
import { AffiliatePage } from './pages/AffiliatePage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';

export const App: React.FC = () => {
  const { currentPage } = useApp();

  // If on Admin portal route, render full-screen bypassing 480px app-container
  if (currentPage === 'admin') {
    return (
      <div className="admin-fullscreen-root">
        <AdminPage />
        <Toast />
      </div>
    );
  }

  const isStandalonePage =
    currentPage === 'landing' ||
    currentPage === 'login' ||
    currentPage === 'signup' ||
    currentPage === 'bingo';

  return (
    <div className="app-container">
      {/* Top Header for main views */}
      {!isStandalonePage && <TopHeader />}

      {/* Balance Bar for main views */}
      {!isStandalonePage && <BalanceBar />}

      {/* Active Page View */}
      {currentPage === 'landing' && <LandingPage />}
      {currentPage === 'login' && <LoginPage />}
      {currentPage === 'signup' && <SignupPage />}
      {currentPage === 'games' && <GamesPage />}
      {currentPage === 'wallet' && <WalletPage />}
      {currentPage === 'history' && <HistoryPage />}
      {currentPage === 'leader' && <LeaderPage />}
      {currentPage === 'profile' && <ProfilePage />}
      {currentPage === 'bingo' && <BingoPage />}
      {currentPage === 'affiliate' && <AffiliatePage />}

      {/* Bottom Navigation */}
      {!isStandalonePage && <BottomNav />}

      {/* Global Toast */}
      <Toast />
    </div>
  );
};

