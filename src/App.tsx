import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext.tsx';
import { useAuth } from './context/AuthContext.tsx';
import { useAdmin } from './context/AdminContext.tsx';
import { useWallet } from './context/WalletContext.tsx';
import { TopHeader } from './components/common/TopHeader.tsx';
import { BalanceBar } from './components/common/BalanceBar.tsx';
import { LiveSocialProofTicker } from './components/common/LiveSocialProofTicker.tsx';
import { BottomNav } from './components/common/BottomNav.tsx';
import { Toast } from './components/common/Toast.tsx';
import { NewPlayerWelcomeModal } from './components/auth/NewPlayerWelcomeModal.tsx';
import { ConcurrentSessionModal } from './components/auth/ConcurrentSessionModal.tsx';

// Pages
import { LandingPage } from './pages/LandingPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { SignupPage } from './pages/SignupPage.tsx';
import { GamesPage } from './pages/GamesPage.tsx';
import { WalletPage } from './pages/WalletPage.tsx';
import { DepositPage } from './pages/DepositPage.tsx';
import { WithdrawPage } from './pages/WithdrawPage.tsx';
import { HistoryPage } from './pages/HistoryPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { BingoPage } from './pages/BingoPage.tsx';
import { AffiliatePage } from './pages/AffiliatePage.tsx';
import { AccountInfoPage } from './pages/AccountInfoPage.tsx';
import { HelpCenterPage } from './pages/HelpCenterPage.tsx';
import { AboutLomiPage } from './pages/AboutLomiPage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';

export const App: React.FC = () => {
  const { currentPage, switchPage } = useApp();
  const { user, isAuthenticated, isFirstTimeTelegramUser, dismissFirstTimeModal } = useAuth();
  const { addUser, registerBonus } = useAdmin();
  const { addBonus } = useWallet();

  // Seamless routing: If user is authenticated in Telegram, jump straight into games!
  useEffect(() => {
    if (isAuthenticated && (currentPage === 'landing' || currentPage === 'login' || currentPage === 'signup')) {
      switchPage('games');
    }
  }, [isAuthenticated, currentPage, switchPage]);

  // Handle first-time Telegram registration notification
  useEffect(() => {
    if (isFirstTimeTelegramUser && user) {
      addUser({
        name: user.fullName,
        phone: user.formattedPhone,
        balance: 0,
        bonus: registerBonus,
        referralCount: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
        status: 'active'
      });
    }
  }, [isFirstTimeTelegramUser, user, addUser, registerBonus]);

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
    currentPage === 'about';

  const isDedicatedGamePage = currentPage === 'bingo';

  return (
    <div className={`app-container${isDedicatedGamePage ? ' dedicated-game-view' : ''}`}>
      {/* Top Header for all main game & user views */}
      {!isStandalonePage && !isSubpage && !isDedicatedGamePage && <TopHeader />}

      {/* Balance Bar for all main game & user views */}
      {!isStandalonePage && !isSubpage && !isDedicatedGamePage && <BalanceBar />}

      {/* Phase 3: Live Online Players & Winners Ticker */}
      {!isStandalonePage && !isSubpage && !isDedicatedGamePage && (
        <LiveSocialProofTicker />
      )}

      {/* Active Page View */}
      {currentPage === 'landing' && <LandingPage />}
      {currentPage === 'login' && <LoginPage />}
      {currentPage === 'signup' && <SignupPage />}
      {currentPage === 'games' && <GamesPage />}
      {currentPage === 'wallet' && <WalletPage />}
      {currentPage === 'deposit' && <DepositPage />}
      {currentPage === 'withdraw' && <WithdrawPage />}
      {currentPage === 'history' && <HistoryPage />}
      {currentPage === 'profile' && <ProfilePage />}
      {currentPage === 'bingo' && <BingoPage />}
      {currentPage === 'affiliate' && <AffiliatePage />}
      {currentPage === 'account-info' && <AccountInfoPage />}
      {currentPage === 'help' && <HelpCenterPage />}
      {currentPage === 'about' && <AboutLomiPage />}

      {/* Bottom Navigation */}
      {!isStandalonePage && !isDedicatedGamePage && <BottomNav />}

      {/* Phase 1: First-time registration celebration modal */}
      <NewPlayerWelcomeModal
        isOpen={isFirstTimeTelegramUser}
        user={user}
        bonusAmount={registerBonus}
        onClose={dismissFirstTimeModal}
      />

      {/* Single-device enforcement notice */}
      <ConcurrentSessionModal />

      {/* Global Toast */}
      <Toast />
    </div>
  );
};
