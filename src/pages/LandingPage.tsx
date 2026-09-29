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
import { TelegramRegisterModal } from '../components/auth/TelegramRegisterModal.tsx';
import { NewPlayerWelcomeModal } from '../components/auth/NewPlayerWelcomeModal.tsx';
import { User } from '../types/auth.ts';

export const LandingPage: React.FC = () => {
  const { switchPage, showToast } = useApp();
  const { t, lang } = useLanguage();
  const { loginWithTelegram, telegramUser, user } = useAuth();
  const { addUser, registerBonus } = useAdmin();
  const { addBonus } = useWallet();

  const [isLoading, setIsLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isExistingAccount, setIsExistingAccount] = useState(false);

  // Derive from auth state — AuthContext already checks existence on init
  useEffect(() => {
    if (user && (user.telegramId || user.id)) {
      setIsExistingAccount(true);
    } else {
      setIsExistingAccount(false);
    }
  }, [user]);

  // When new user taps "Claim 10 ETB Bonus" on Slide 3 -> Open clean registration modal
  const handleOpenRegisterModal = () => {
    setShowRegisterModal(true);
  };

  // When user confirms registration inside TelegramRegisterModal
  const handleConfirmRegistration = async () => {
    setIsLoading(true);
    try {
      const { user, isNewUser } = await loginWithTelegram(telegramUser || undefined);

      setShowRegisterModal(false);

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
      showToast(`⚠️ ${err?.message || 'Registration failed.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // When existing user clicks "Continue as [Name]"
  const handleExistingUserLogin = async () => {
    setIsLoading(true);
    try {
      const { user } = await loginWithTelegram(telegramUser || undefined);
      showToast(
        lang === 'am'
          ? `እንኳን ደህና መጡ፣ ${user.fullName}!`
          : `Welcome back, ${user.fullName}!`
      );
      switchPage('games');
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

      {/* 2. Main Content Area: Onboarding Carousel for New Users VS Iconic Hero for Existing Users */}
      <main className="landing-fresh-hero-container">
        {!isExistingAccount ? (
          /* A. NEW USERS: Interactive 3-Slide Onboarding (Strictly Step-by-Step, No premature account creation) */
          <div style={{ padding: '0 4px' }}>
            <BlumOnboardingCarousel
              onClaimBonus={handleOpenRegisterModal}
              isLoading={isLoading}
              onSkip={handleOpenRegisterModal}
            />
          </div>
        ) : (
          /* B. EXISTING USERS: Iconic 3D Casino Layout matching Screenshot */
          <>
            {/* Pretitle */}
            <p className="hero-fresh-pretitle">{t('landing.pretitle')}</p>

            {/* Main Title: Play Bingo with floating lemon */}
            <h1 className="hero-fresh-title">
              {t('landing.title')}
              <span className="hero-lemon-icon">🍋</span>
            </h1>

            {/* Tagline */}
            <p className="hero-fresh-tagline">{t('landing.tagline')}</p>

            {/* Promo 10 ETB Welcome Bonus Block */}
            <div className="hero-promo-block">
              <span className="promo-lbl">{lang === 'am' ? 'የነፃ መመዝገቢያ ስጦታ' : 'FREE SIGN UP BONUS'}</span>
              <div className="promo-bonus-huge">+10.00 ETB BONUS</div>
              <div className="promo-bonus-sub">{lang === 'am' ? 'ምንም ቅድመ ክፍያ አያስፈልግም • ፈጣን የቴሌብር ክፍያ' : '+ 1 Free Cartela • 0 Deposit Needed'}</div>
            </div>

            {/* Glowing 1-Click Action Button */}
            <button
              type="button"
              className="btn-hero-fresh-cta"
              id="landing-continue-btn"
              onClick={handleExistingUserLogin}
              disabled={isLoading}
              style={{
                background: 'linear-gradient(135deg, #facc15 0%, #eab308 50%, #ca8a04 100%)',
                boxShadow: '0 8px 25px rgba(234, 179, 8, 0.45)',
                color: '#0f172a',
                fontWeight: 900
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
                  : `⚡ Sign in as ${displayName}`}
              </span>
            </button>

            {/* 3. Hero 3D Artwork Card (75-Ball & Cartelas) */}
            <div className="hero-fresh-artwork-card">
              <img
                src="/assets/images/lomi-hero-75.jpg"
                alt="75-Ball Lomi Bingo 3D Cards and Balls"
                className="hero-artwork-img"
              />
            </div>

            {/* 4. Exact 3-Pillar Trust Footer */}
            <TrustFooter />
          </>
        )}
      </main>

      {/* 1. Pure Telegram Registration Confirmation Modal */}
      <TelegramRegisterModal
        isOpen={showRegisterModal}
        bonusAmount={registerBonus}
        isLoading={isLoading}
        onConfirm={handleConfirmRegistration}
        onClose={() => setShowRegisterModal(false)}
      />

      {/* 2. Hamster Kombat Style Level 1 Welcome Card Modal */}
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
