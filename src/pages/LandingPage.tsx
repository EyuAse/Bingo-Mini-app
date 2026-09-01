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
      {/* 1. Brand Logo & Language Switcher at Top */}
      <LandingNavbar />

      {/* Floating Background Lemon Slices & Fresh Leaves */}
      <div className="bg-floating-lemon-slice lemon-top-left"></div>
      <div className="bg-floating-lemon-slice lemon-top-right"></div>
      <div className="bg-floating-leaf leaf-mid-left"></div>
      <div className="bg-floating-lemon-slice lemon-bottom-left"></div>
      <div className="bg-floating-leaf leaf-bottom-right"></div>

      {/* 2. Main Content */}
      <main className="landing-fresh-hero-container" style={{ padding: '8px 12px 28px 12px' }}>
        {!isExistingAccount ? (
          /* A. NEW USER: Exact Reference 3-Slide Interactive Onboarding */
          <BlumOnboardingCarousel
            onClaimBonus={handleClaimBonusClick}
            isLoading={isLoading}
            onSkip={handleClaimBonusClick}
          />
        ) : (
          /* B. EXISTING LOGGED-OUT USER: Clean Hero with Instant Re-Login */
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '380px', margin: '20px auto 0 auto' }}>
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fef08a 0%, #facc15 50%, #eab308 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '44px',
                margin: '0 auto 16px auto',
                boxShadow: '0 8px 24px rgba(234, 179, 8, 0.4)'
              }}
            >
              🍋
            </div>

            <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
              {lang === 'am' ? `እንኳን ደህና መጡ!` : `Welcome Back!`}
            </h1>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 24px 0' }}>
              {lang === 'am'
                ? `እንደ @${telegramUser?.username || displayName} የቀጥታ 75-ኳስ ቢንጎ ጨዋታዎን ይቀጥሉ`
                : `Continue playing live 75-ball express bingo as @${telegramUser?.username || displayName}`}
            </p>

            <button
              type="button"
              className="btn-hero-fresh-cta"
              id="landing-claim-bonus-btn"
              onClick={handleClaimBonusClick}
              disabled={isLoading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #2AABEE 0%, #229ED9 50%, #0284c7 100%)',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '900',
                padding: '16px 20px',
                borderRadius: '999px',
                boxShadow: '0 8px 25px rgba(34, 158, 217, 0.45)',
                marginBottom: '20px'
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
                  : `⚡ Continue as ${displayName}`}
              </span>
            </button>

            <TrustFooter />
          </div>
        )}
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
