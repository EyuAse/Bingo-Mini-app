import React from 'react';
import { LandingNavbar } from '../components/landing/LandingNavbar.tsx';
import { TrustFooter } from '../components/landing/TrustFooter.tsx';
import { useApp } from '../context/AppContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

export const LandingPage: React.FC = () => {
  const { switchPage } = useApp();
  const { t } = useLanguage();

  return (
    <div className="page active" id="page-landing">
      <LandingNavbar />

      <div className="landing-ambient-rays"></div>
      <div className="landing-content">
        <h2 className="landing-pretitle">{t('landing.welcome')}</h2>
        <div className="landing-title-wrapper">
          <h1 className="landing-hero-title">{t('landing.title')}</h1>
          <span className="landing-crown">🍋</span>
        </div>
        <p className="landing-subtitle">{t('landing.subtitle')}</p>

        <div className="landing-offer-box">
          <span className="landing-offer-label">{t('landing.depositOffer')}</span>
          <span className="landing-bonus-amount">{t('landing.bonusAmount')}</span>
          <span className="landing-spins-amount">{t('landing.freeSpins')}</span>
        </div>

        <button
          className="landing-join-btn"
          id="landing-join-btn"
          onClick={() => switchPage('signup')}
        >
          {t('landing.joinNow')}
        </button>

        <div className="landing-hero-visual">
          <img
            src="/assets/images/landing-hero.jpg"
            alt="Lomi Bingo Cards and 3D Balls"
            className="landing-hero-img"
          />
        </div>

        {/* Trust Footer Bar */}
        <TrustFooter />
      </div>
    </div>
  );
};
