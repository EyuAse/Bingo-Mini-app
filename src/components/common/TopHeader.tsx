import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { LanguageDropdown } from './LanguageDropdown.tsx';
import { DepositModal } from '../wallet/DepositModal.tsx';

export const TopHeader: React.FC = () => {
  const { switchPage, showToast } = useApp();
  const { t } = useLanguage();
  const [isDepositOpen, setIsDepositOpen] = useState(false);

  return (
    <>
      <header className="lobby-fresh-header">
        {/* Left: Hamburger Drawer Toggle */}
        <button
          type="button"
          className="btn-lobby-hamburger"
          id="header-menu-btn"
          onClick={() => switchPage('landing')}
          title="Menu"
        >
          <i className="fa-solid fa-bars"></i>
        </button>

        {/* Center: Exact LOMII BINGO Logo */}
        <div
          className="lobby-brand-center"
          onClick={() => switchPage('games')}
          style={{ cursor: 'pointer' }}
        >
          <div className="lomi-brand-logo-inline">
            <span className="brand-lomi-txt">L</span>
            <span className="brand-lemon-o">
              <svg className="mini-lemon-svg" viewBox="0 0 40 40" fill="none">
                {/* Leaves */}
                <path d="M19 11C16 7 11 5 8 7C9 11 12 13 16 13L19 11Z" fill="#22c55e" />
                <path d="M21 11C24 7 29 5 32 7C31 11 28 13 24 13L21 11Z" fill="#16a34a" />
                {/* Lemon Body */}
                <ellipse cx="20" cy="24" rx="14" ry="12" fill="url(#mini-lemon-grad)" />
                <ellipse cx="20" cy="24" rx="13.5" ry="11.5" stroke="#eab308" strokeWidth="0.5" />
                {/* Left & Right Lemon Tips */}
                <path d="M6 24C5 24 4 24.5 4 25C4 25.5 5 26 6 26L7 25L6 24Z" fill="#facc15" />
                <path d="M34 24C35 24 36 24.5 36 25C36 25.5 35 26 34 26L33 25L34 24Z" fill="#facc15" />
                {/* White Gloss */}
                <ellipse cx="16" cy="19" rx="5" ry="2.5" transform="rotate(-20 16 19)" fill="white" fillOpacity="0.5" />
                <defs>
                  <radialGradient id="mini-lemon-grad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(16 20) rotate(45) scale(16 14)">
                    <stop stopColor="#fef08a" />
                    <stop offset="0.6" stopColor="#facc15" />
                    <stop offset="1" stopColor="#eab308" />
                  </radialGradient>
                </defs>
              </svg>
            </span>
            <span className="brand-lomi-txt">MII</span>
            <span className="brand-bingo-gold">BINGO</span>
          </div>
        </div>

        {/* Right: Language Pill & Notification Bell */}
        <div className="lobby-header-right">
          <LanguageDropdown />

          <button
            type="button"
            className="btn-lobby-notif"
            id="header-notif-btn"
            onClick={() => showToast('🔔 You have 4 new bonuses & winner notifications!')}
            title="Notifications"
          >
            <i className="fa-regular fa-bell"></i>
            <span className="notif-pill-badge">4</span>
          </button>
        </div>
      </header>

      {/* Quick Deposit Modal */}
      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
    </>
  );
};
