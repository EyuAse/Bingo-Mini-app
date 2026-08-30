import React from 'react';
import { LandingNavbar } from '../components/landing/LandingNavbar.tsx';
import { TrustFooter } from '../components/landing/TrustFooter.tsx';
import { useApp } from '../context/AppContext.tsx';

export const LandingPage: React.FC = () => {
  const { switchPage } = useApp();

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
        <p className="hero-fresh-pretitle">The best place to play and win</p>

        {/* Main Title: Play Bingo with floating lemon */}
        <h1 className="hero-fresh-title">
          Play <span className="title-highlight">Bingo</span>
          <span className="hero-lemon-icon">🍋</span>
        </h1>

        {/* Tagline */}
        <p className="hero-fresh-tagline">More numbers, more fun, more wins!</p>

        {/* Promo Deposit Bonus Block */}
        <div className="hero-promo-block">
          <span className="promo-lbl">First Deposit Bonus</span>
          <div className="promo-bonus-huge">200% BONUS</div>
          <div className="promo-bonus-sub">+ 30 Free Tickets</div>
        </div>

        {/* Golden Gift CTA Button */}
        <button
          type="button"
          className="btn-hero-fresh-cta"
          id="landing-join-btn"
          onClick={() => switchPage('signup')}
        >
          <span className="cta-gift-icon">🎁</span>
          <span>Get 200% Bonus Now</span>
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
