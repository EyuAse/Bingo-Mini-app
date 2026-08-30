import React from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const ReadyPlayBanner: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="ready-banner">
      <div className="banner-content">
        <h2 className="banner-title">{t('games.readyToPlay')}</h2>
        <p className="banner-sub">{t('games.startWinning')}</p>
      </div>
      <div className="banner-visual">
        <div className="banner-ball-3d">
          <span className="banner-crown">👑</span>
          <span className="banner-ball-letter">75</span>
        </div>
      </div>
    </div>
  );
};
