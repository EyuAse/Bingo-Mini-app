import React, { useState } from 'react';
import { LandingNavbar } from '../components/landing/LandingNavbar.tsx';
import { TrustFooter } from '../components/landing/TrustFooter.tsx';
import { useApp } from '../context/AppContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useAdmin } from '../context/AdminContext.tsx';
import { useWallet } from '../context/WalletContext.tsx';
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
      <main className="landing-fresh-hero-container">
        {/* Pretitle */}
        <p className="hero-fresh-pretitle">{t('landing.pretitle')}</p>

        {/* Main Title: Play Bingo with floating lemon */}
        <h1 className="hero-fresh-title">
          {t('landing.title')}
          <span className="hero-lemon-icon">🍋</span>
        </h1>

        {/* Tagline */}
        <p className="hero-fresh-tagline">{t('landing.tagline')}</p>

        {/* Promo Deposit Bonus Block */}
        <div className="hero-promo-block">
          <span className="promo-lbl">{t('landing.firstDepositBonus')}</span>
          <div className="promo-bonus-huge">{t('landing.bonus200')}</div>
          <div className="promo-bonus-sub">{t('landing.freeTickets')}</div>
        </div>

        {/* Big Glowing Hamster-Style Bonus CTA Button */}
        <button
          type="button"
          className="btn-hero-fresh-cta"
          id="landing-claim-bonus-btn"
          onClick={handleClaimBonusClick}
          disabled={isLoading}
          style={{
            background: 'linear-gradient(135deg, #facc15 0%, #eab308 50%, #ca8a04 100%)',
            boxShadow: '0 8px 25px rgba(234, 179, 8, 0.45)'
          }}
        >
          <span className="cta-gift-icon">🎁</span>
          <span>
            {isLoading
              ? lang === 'am'
                ? 'በመግባት ላይ...'
                : 'Connecting...'
              : lang === 'am'
              ? '🎁 የ10 ብር መመዝገቢያ ቦነስ አሁኑኑ ያግኙ'
              : '🎁 Get 10 birr sign up Bonus Now'}
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
