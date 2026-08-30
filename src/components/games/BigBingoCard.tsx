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
    <div className="fresh-fast-bingo-card">
      {/* Top Badges Row */}
      <div className="card-top-badges">
        <span className="badge-fast-pill">
          <i className="fa-solid fa-bolt"></i>
          <span>{t('games.versionTag')}</span>
        </span>
        <span className="badge-players-pill">
          <i className="fa-solid fa-user-group"></i>
          <span>75+ {t('games.activePlayers')}</span>
        </span>
      </div>

      {/* Main Content: Left Info & Right 3D Artwork */}
      <div className="card-main-split">
        {/* Left Info Column */}
        <div className="card-left-info">
          <h3 className="card-title-fast">Lomii Bingo</h3>
          <span className="badge-75-ball">75-Ball</span>

          <div className="stakes-values-txt">10 • 20 • 50 • 100 ETB</div>
          <div className="stakes-limits-sub">{t('games.stakesSub')}</div>

          {/* Micro Stats: Players & Top Prize */}
          <div className="card-micro-stats-row">
            <div className="micro-stat-item">
              <div className="stat-icon-circ yellow">
                <i className="fa-solid fa-users"></i>
              </div>
              <div className="stat-text-meta">
                <strong className="stat-bold-val">{playersCount || 437}</strong>
                <span className="stat-sub-lbl">{t('bingo.players')}</span>
              </div>
            </div>

            <div className="micro-stat-item">
              <div className="stat-icon-circ yellow">
                <i className="fa-solid fa-trophy"></i>
              </div>
              <div className="stat-text-meta">
                <strong className="stat-bold-val">
                  {prizePool ? prizePool.toLocaleString() : '7,866'} ETB
                </strong>
                <span className="stat-sub-lbl">{t('games.prizePool')}</span>
              </div>
            </div>
          </div>

          {/* Golden CTA Button */}
          <button
            type="button"
            className="btn-card-play-now"
            onClick={handlePlayNow}
          >
            <i className="fa-solid fa-play"></i>
            <span>{t('games.playNow')}</span>
          </button>
        </div>

        {/* Right 3D Artwork Column */}
        <div className="card-right-art">
          <div className="bingo-star-hero-glow"></div>
          <div className="bingo-3d-ball-showcase">
            <div className="bingo-ball-3d sphere-b12">
              <span className="sphere-letter">B</span>
              <span className="sphere-num">12</span>
            </div>
            <div className="bingo-ball-3d sphere-n34">
              <span className="sphere-letter">N</span>
              <span className="sphere-num">34</span>
            </div>
            <div className="bingo-ball-3d sphere-o75">
              <span className="sphere-letter">O</span>
              <span className="sphere-num">75</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
