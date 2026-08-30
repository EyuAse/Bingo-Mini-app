import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { LomiLogo } from '../common/LomiLogo.tsx';
import { LanguageDropdown } from '../common/LanguageDropdown.tsx';

export const LandingNavbar: React.FC = () => {
  const { switchPage } = useApp();
  const { lang, setLang } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showBingoMenu, setShowBingoMenu] = useState(false);

  return (
    <header className="landing-fresh-navbar">
      {/* Left: Brand Logo & Bingo Dropdown */}
      <div className="landing-nav-left">
        <LomiLogo size="md" onClick={() => switchPage('landing')} />

        <div className="nav-bingo-dropdown-wrap">
          <button
            type="button"
            className="btn-nav-bingo-select"
            onClick={() => setShowBingoMenu(prev => !prev)}
          >
            <span>Bingo</span>
            <i className="fa-solid fa-chevron-down nav-chevron-mini"></i>
          </button>

          {showBingoMenu && (
            <div className="nav-dropdown-menu-pop" onClick={() => setShowBingoMenu(false)}>
              <div className="dropdown-opt-item" onClick={() => switchPage('games')}>
                <i className="fa-solid fa-gamepad" style={{ color: '#eab308' }}></i>
                <span>All Bingo Rooms</span>
              </div>
              <div className="dropdown-opt-item" onClick={() => switchPage('games')}>
                <i className="fa-solid fa-bolt" style={{ color: '#22c55e' }}></i>
                <span>Fast 75-Ball Express</span>
              </div>
              <div className="dropdown-opt-item" onClick={() => switchPage('wallet')}>
                <i className="fa-solid fa-gift" style={{ color: '#38bdf8' }}></i>
                <span>Promotions & Bonus</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Language Pill, Login, Sign Up */}
      <div className="landing-nav-right">
        <LanguageDropdown />

        {/* Login Button */}
        <button
          type="button"
          className="btn-nav-fresh-login"
          id="nav-login-btn"
          onClick={() => switchPage('login')}
        >
          Login
        </button>

        {/* Sign Up Button (Bright Gold Pill) */}
        <button
          type="button"
          className="btn-nav-fresh-signup"
          id="nav-join-btn"
          onClick={() => switchPage('signup')}
        >
          <i className="fa-solid fa-user-plus"></i>
          <span>Sign Up</span>
        </button>
      </div>
    </header>
  );
};
