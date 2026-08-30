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
import { DepositPage } from './pages/DepositPage.tsx';
import { WithdrawPage } from './pages/WithdrawPage.tsx';
import { HistoryPage } from './pages/HistoryPage.tsx';
import { LeaderPage } from './pages/LeaderPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { BingoPage } from './pages/BingoPage.tsx';
import { AffiliatePage } from './pages/AffiliatePage.tsx';
import { AccountInfoPage } from './pages/AccountInfoPage.tsx';
import { HelpCenterPage } from './pages/HelpCenterPage.tsx';
import { AboutLomiPage } from './pages/AboutLomiPage.tsx';
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
    currentPage === 'signup';

  const isSubpage =
    currentPage === 'account-info' ||
    currentPage === 'help' ||
    currentPage === 'about' ||
    currentPage === 'deposit' ||
    currentPage === 'withdraw';

  return (
    <div className="app-container">
      {/* Top Header for all main game & user views */}
      {!isStandalonePage && !isSubpage && <TopHeader />}

      {/* Balance Bar for all main game & user views */}
      {!isStandalonePage && !isSubpage && <BalanceBar />}

      {/* Active Page View */}
      {currentPage === 'landing' && <LandingPage />}
      {currentPage === 'login' && <LoginPage />}
      {currentPage === 'signup' && <SignupPage />}
      {currentPage === 'games' && <GamesPage />}
      {currentPage === 'wallet' && <WalletPage />}
      {currentPage === 'deposit' && <DepositPage />}
      {currentPage === 'withdraw' && <WithdrawPage />}
      {currentPage === 'history' && <HistoryPage />}
      {currentPage === 'leader' && <LeaderPage />}
      {currentPage === 'profile' && <ProfilePage />}
      {currentPage === 'bingo' && <BingoPage />}
      {currentPage === 'affiliate' && <AffiliatePage />}
      {currentPage === 'account-info' && <AccountInfoPage />}
      {currentPage === 'help' && <HelpCenterPage />}
      {currentPage === 'about' && <AboutLomiPage />}

      {/* Bottom Navigation */}
      {!isStandalonePage && <BottomNav />}

      {/* Global Toast */}
      <Toast />
    </div>
  );
};
