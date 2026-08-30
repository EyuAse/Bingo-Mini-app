import React from 'react';
import { useApp } from '../context/AppContext.tsx';

export const AboutLomiPage: React.FC = () => {
  const { switchPage, showToast } = useApp();

  return (
    <div className="page active page-subpage-dedicated" id="page-about-lomi">
      {/* Top Back Navigation Bar */}
      <div className="subpage-back-header">
        <button
          type="button"
          className="btn-subpage-back"
          onClick={() => switchPage('profile')}
        >
          <i className="fa-solid fa-chevron-left"></i>
          <span>Profile</span>
        </button>
        <h2 className="subpage-header-title">About Lomii Bingo</h2>
        <div style={{ width: '40px' }}></div>
      </div>

      <div className="subpage-content-scroll">
        {/* Brand Logo & Version Hero */}
        <div className="about-brand-hero-card">
          <div className="about-logo-row">
            <span className="logo-letter">L</span>
            <span className="logo-lemon-emoji">🍋</span>
            <span className="logo-letter">MII</span>
            <span className="logo-bingo-gold">BINGO</span>
          </div>
          <span className="about-app-version">Version 3.4.0 (Production Build 2026.08)</span>
          <span className="about-tagline">Ethiopia's #1 Real-Time 75-Ball Express Bingo Platform</span>
        </div>

        {/* Licensing & Regulatory Authority */}
        <div className="about-info-group">
          <span className="about-group-title">
            <i className="fa-solid fa-building-columns gold"></i> REGULATORY & LICENSING
          </span>

          <div className="about-compliance-card">
            <div className="compliance-row">
              <i className="fa-solid fa-shield-halved compliance-icon green"></i>
              <div>
                <strong className="compliance-title">National Lottery Administration of Ethiopia</strong>
                <p className="compliance-sub">
                  Operated under official remote gaming permit <strong>NLA/ET/2026-882</strong> by Lomi Entertainment PLC, Addis Ababa, Ethiopia.
                </p>
              </div>
            </div>

            <div className="compliance-row" style={{ marginTop: '10px' }}>
              <i className="fa-solid fa-dice compliance-icon gold"></i>
              <div>
                <strong className="compliance-title">Certified Provably Fair RNG</strong>
                <p className="compliance-sub">
                  Our 75-ball draw engine utilizes certified cryptographic SHA-256 random number generation, guaranteeing 100% unbiased, tamper-proof draws.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Game Engine Specifications */}
        <div className="about-info-group">
          <span className="about-group-title">
            <i className="fa-solid fa-microchip gold"></i> GAME ENGINE SPECIFICATIONS
          </span>

          <div className="engine-specs-grid">
            <div className="spec-card-item">
              <span className="spec-label">GAME FORMAT</span>
              <strong className="spec-val">75-Ball 5x5 Matrix</strong>
            </div>

            <div className="spec-card-item">
              <span className="spec-label">DRAW SPEED</span>
              <strong className="spec-val">Express (3.4s / Ball)</strong>
            </div>

            <div className="spec-card-item">
              <span className="spec-label">CALLER AUDIO</span>
              <strong className="spec-val">Amharic & English</strong>
            </div>

            <div className="spec-card-item">
              <span className="spec-label">SETTLEMENT</span>
              <strong className="spec-val">Instant 24/7 Cashier</strong>
            </div>
          </div>
        </div>

        {/* Responsible Gaming (18+) & Terms Links */}
        <div className="about-info-group">
          <div className="responsible-gaming-badge-bar">
            <span className="badge-18-plus">18+</span>
            <div className="responsible-text-col">
              <strong>Play Responsibly</strong>
              <span>Betting is for entertainment. Never stake more than you can afford to lose.</span>
            </div>
          </div>

          <div className="legal-links-list">
            <button
              type="button"
              className="btn-legal-link-row"
              onClick={() => showToast('📄 Terms & Conditions: Verified Active')}
            >
              <span>Terms & Conditions of Service</span>
              <i className="fa-solid fa-chevron-right"></i>
            </button>

            <button
              type="button"
              className="btn-legal-link-row"
              onClick={() => showToast('🔒 Privacy Policy: Encrypted & GDPR Compliant')}
            >
              <span>Privacy & Data Protection Policy</span>
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
