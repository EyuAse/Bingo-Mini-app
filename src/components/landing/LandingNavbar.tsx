import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { LomiLogo } from '../common/LomiLogo.tsx';
import { LanguageDropdown } from '../common/LanguageDropdown.tsx';

export const LandingNavbar: React.FC = () => {
  const { switchPage } = useApp();

  return (
    <header className="landing-fresh-navbar">
      {/* Left: Brand Logo */}
      <div className="landing-nav-left">
        <LomiLogo size="md" onClick={() => switchPage('landing')} />
      </div>

      {/* Right: Language Pill Only (Ultra Clean) */}
      <div className="landing-nav-right">
        <LanguageDropdown />
      </div>
    </header>
  );
};
