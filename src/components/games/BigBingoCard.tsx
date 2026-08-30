import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { useBingo } from '../../context/BingoContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const BigBingoCard: React.FC = () => {
  const { switchPage } = useApp();
  const { startLobbyCountdown, playersCount, prizePool } = useBingo();
  const { t } = useLanguage();

  const handlePlayNow = () => {
    switchPage('bingo');
    startLobbyCountdown();
  };

  return (
    <div className="big-bingo-card-container">
      <div className="big-bingo-card" onClick={handlePlayNow}>
        {/* Top Badge */}
        <div className="big-card-top">
          <span className="big-card-badge">
            <span className="fire-icon">🍋</span>
            <span>{t('landing.title')}</span>
          </span>
          <span className="big-card-live-pill">
            <span className="live-pulse"></span>
            <span>{t('games.liveNow')}</span>
          </span>
        </div>

        {/* Big 3D Hero Graphic */}
        <div className="big-card-hero">
          <div className="big-hero-glow"></div>
          <img
            src="/assets/images/fast-bingo.jpg"
            alt="Lomi Bingo 3D Cards and Balls"
            className="big-hero-img"
          />
        </div>

        {/* Card Body Information */}
        <div className="big-card-body">
          <div className="big-card-title-row">
            <h3 className="big-card-title">{t('landing.title')}</h3>
            <span className="big-card-version-tag">{t('games.versionTag')}</span>
          </div>
          <p className="big-card-sub">{t('games.stakesSub')}</p>

          {/* Live Stats Row */}
          <div className="big-card-stats-row">
            <div className="big-stat-item">
              <i className="fa-solid fa-users"></i>
              <span className="stat-value">{playersCount}</span>
              <span className="stat-label">{t('games.activePlayers')}</span>
            </div>
            <div className="big-stat-divider"></div>
            <div className="big-stat-item jackpot-item">
              <i className="fa-solid fa-trophy"></i>
              <span className="stat-value gold">{prizePool.toLocaleString()} ETB</span>
              <span className="stat-label">{t('games.prizePool')}</span>
            </div>
          </div>

          {/* Large CTA Button */}
          <button
            className="big-play-btn"
            onClick={e => {
              e.stopPropagation();
              handlePlayNow();
            }}
          >
            <span>{t('games.playNow')}</span>
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
