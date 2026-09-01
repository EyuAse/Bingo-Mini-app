import React, { useState, useEffect } from 'react';
import { LandingNavbar } from '../components/landing/LandingNavbar.tsx';
import { BlumOnboardingCarousel } from '../components/landing/BlumOnboardingCarousel.tsx';
import { TrustFooter } from '../components/landing/TrustFooter.tsx';
import { useApp } from '../context/AppContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useAdmin } from '../context/AdminContext.tsx';
import { useWallet } from '../context/WalletContext.tsx';
import { authService } from '../services/authService.ts';
import { NewPlayerWelcomeModal } from '../components/auth/NewPlayerWelcomeModal.tsx';
import { User } from '../types/auth.ts';

export const LandingPage: React.FC = () => {
  const { switchPage, showToast } = useApp();
  const { t, lang } = useLanguage();
  const { loginWithTelegram, telegramUser } = useAuth();
  const { addUser, registerBonus } = useAdmin();
  const { addBonus } = useWallet();

  const [isLoading, setIsLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isExistingAccount, setIsExistingAccount] = useState(false);

  useEffect(() => {
    if (telegramUser?.id) {
      const existing = authService.checkTelegramUserExists(telegramUser.id, telegramUser.username);
      setIsExistingAccount(!!existing);
    } else {
      setIsExistingAccount(false);
    }
  }, [telegramUser]);

  const handleClaimBonusClick = async () => {
    setIsLoading(true);
    try {
      const { user, isNewUser } = await loginWithTelegram(telegramUser || undefined);

      if (isNewUser) {
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
        addBonus(registerBonus);
        setCreatedUser(user);
        setShowWelcomeModal(true);
        setIsExistingAccount(true);
      } else {
        showToast(
          lang === 'am'
            ? `እንኳን ደህና መጡ፣ ${user.fullName}!`
            : `Welcome back, ${user.fullName}!`
        );
        switchPage('games');
      }
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Login failed.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const displayName = telegramUser
    ? `${telegramUser.first_name || ''} ${telegramUser.last_name || ''}`.trim() || `@${telegramUser.username}`
    : 'Telegram Player';

  return (
    <div className="page active page-landing-fresh" id="page-landing">
      {/* 1. Exact Clean Top Navbar (No Login/Signup buttons) */}
      <LandingNavbar />

      {/* Floating Background Lemon Slices & Fresh Leaves */}
      <div className="bg-floating-lemon-slice lemon-top-left"></div>
      <div className="bg-floating-lemon-slice lemon-top-right"></div>
      <div className="bg-floating-leaf leaf-mid-left"></div>
      <div className="bg-floating-lemon-slice lemon-bottom-left"></div>
      <div className="bg-floating-leaf leaf-bottom-right"></div>

      {/* 2. Hero Content Section */}
      <main className="landing-fresh-hero-container" style={{ padding: '14px 14px 28px 14px' }}>
        {/* Blum-Style Interactive 3D Onboarding Story Card */}
        <BlumOnboardingCarousel
          onClaimBonus={handleClaimBonusClick}
          isLoading={isLoading}
        />

        {/* Dynamic Secondary Action Button (If already registered: "Log in as [Name]") */}
        {isExistingAccount && (
          <button
            type="button"
            className="btn-hero-fresh-cta"
            id="landing-claim-bonus-btn"
            onClick={handleClaimBonusClick}
            disabled={isLoading}
            style={{
              background: 'linear-gradient(135deg, #2AABEE 0%, #229ED9 50%, #0284c7 100%)',
              boxShadow: '0 8px 25px rgba(34, 158, 217, 0.45)',
              marginBottom: '16px'
            }}
          >
            <span className="cta-gift-icon">⚡</span>
            <span>
              {isLoading
                ? lang === 'am'
                  ? 'በመግባት ላይ...'
                  : 'Connecting...'
                : lang === 'am'
                ? `⚡ እንደ ${displayName} ግባ`
                : `⚡ Log in as ${displayName}`}
            </span>
          </button>
        )}

        {/* 3. 3-Pillar Trust Footer */}
        <TrustFooter />
      </main>

      {/* Hamster Kombat Style Level 1 Welcome Card Modal */}
      <NewPlayerWelcomeModal
        isOpen={showWelcomeModal}
        user={createdUser}
        bonusAmount={registerBonus}
        onClose={() => {
          setShowWelcomeModal(false);
          switchPage('games');
        }}
      />
    </div>
  );
};
