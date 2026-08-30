import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { LanguageDropdown } from './LanguageDropdown.tsx';
import { LomiLogo } from './LomiLogo.tsx';
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
                <path d="M19 10C17 6 13 4 10 5C11 9 13 11 17 12L19 10Z" fill="#22c55e" />
                <path d="M21 10C24 6 28 5 31 7C29 10 27 12 23 12L21 10Z" fill="#16a34a" />
                <ellipse cx="20" cy="23" rx="14" ry="12" fill="url(#mini-lemon-grad)" />
                <ellipse cx="16" cy="18" rx="6" ry="3" transform="rotate(-20 16 18)" fill="white" fillOpacity="0.4" />
                <defs>
                  <radialGradient id="mini-lemon-grad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(16 19) rotate(45) scale(16 14)">
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
