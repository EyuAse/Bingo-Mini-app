import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { LanguageDropdown } from '../common/LanguageDropdown.tsx';

export const LandingNavbar: React.FC = () => {
  const { switchPage } = useApp();
  const { t } = useLanguage();

  return (
    <header className="landing-navbar">
      {/* Left: Colorful B I N G O balls logo with crowns */}
      <div className="landing-nav-logo" onClick={() => switchPage('landing')} style={{ cursor: 'pointer' }}>
        <div className="nav-ball ball-purple"><span className="ball-crown">👑</span><span>B</span></div>
        <div className="nav-ball ball-pink"><span className="ball-crown">👑</span><span>I</span></div>
        <div className="nav-ball ball-gold"><span>N</span></div>
        <div className="nav-ball ball-lime"><span>G</span></div>
        <div className="nav-ball ball-magenta"><span>O</span></div>
      </div>

      {/* Center: Nav links */}
      <nav className="landing-nav-links">
        <a href="#bingo" className="nav-link active" onClick={e => { e.preventDefault(); switchPage('games'); }}>
          Bingo <i className="fa-solid fa-chevron-down nav-chevron"></i>
        </a>
        <a href="#games" className="nav-link" onClick={e => { e.preventDefault(); switchPage('games'); }}>
          {t('nav.games')}
        </a>
        <a href="#promotions" className="nav-link" onClick={e => { e.preventDefault(); switchPage('wallet'); }}>
          {t('nav.wallet')}
        </a>
        <a href="#winners" className="nav-link" onClick={e => { e.preventDefault(); switchPage('leader'); }}>
          {t('nav.leaderboard')}
        </a>
      </nav>

      {/* Right: Language Dropdown, Login, Join Now */}
      <div className="landing-nav-actions">
        <LanguageDropdown />

        <div className="nav-actions-sep"></div>

        <button className="nav-login-btn" id="nav-login-btn" onClick={() => switchPage('login')}>
          {t('nav.login')}
        </button>
        <button className="nav-join-btn" id="nav-join-btn" onClick={() => switchPage('signup')}>
          {t('nav.register')}
        </button>
      </div>
    </header>
  );
};
