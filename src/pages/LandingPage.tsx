import React from 'react';
import { LandingNavbar } from '../components/landing/LandingNavbar.tsx';
import { TrustFooter } from '../components/landing/TrustFooter.tsx';
import { useApp } from '../context/AppContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

export const LandingPage: React.FC = () => {
  const { switchPage } = useApp();
  const { t } = useLanguage();

  return (
    <div className="page active page-landing-fresh" id="page-landing">
      {/* 1. Exact Clean Top Navbar */}
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

        {/* Golden Gift CTA Button */}
        <button
          type="button"
          className="btn-hero-fresh-cta"
          id="landing-join-btn"
          onClick={() => switchPage('signup')}
        >
          <span className="cta-gift-icon">🎁</span>
          <span>{t('landing.getBonusNow')}</span>
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
    </div>
  );
};
