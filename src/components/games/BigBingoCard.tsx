import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { useBingo } from '../../context/BingoContext.tsx';

export const BigBingoCard: React.FC = () => {
  const { switchPage } = useApp();
  const { startLobbyCountdown, playersCount, prizePool } = useBingo();

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
          <span>Fast Bingo</span>
        </span>
        <span className="badge-players-pill">
          <i className="fa-solid fa-user-group"></i>
          <span>75+ Players</span>
        </span>
      </div>

      {/* Main Content: Left Info & Right 3D Artwork */}
      <div className="card-main-split">
        {/* Left Info Column */}
        <div className="card-left-info">
          <h3 className="card-title-fast">Fast Bingo</h3>
          <span className="badge-75-ball">75-Ball</span>

          <div className="stakes-values-txt">10 • 20 • 50 • 100 ETB</div>
          <div className="stakes-limits-sub">Min: 10 • Max: 2,000 ETB</div>

          {/* Micro Stats: Players & Top Prize */}
          <div className="card-micro-stats-row">
            <div className="micro-stat-item">
              <div className="stat-icon-circ yellow">
                <i className="fa-solid fa-users"></i>
              </div>
              <div className="stat-text-meta">
                <strong className="stat-bold-val">{playersCount || 437}</strong>
                <span className="stat-sub-lbl">Players</span>
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
                <span className="stat-sub-lbl">Top Prize</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 3D Artwork Column */}
        <div className="card-right-art">
          <img
            src="/assets/images/fast-bingo-hero-art.jpg"
            alt="Fast Bingo 3D Cards and Star Coin"
            className="fast-bingo-3d-img"
          />
        </div>
      </div>

      {/* Full-width Golden CTA Button */}
      <button
        type="button"
        className="btn-play-fast-bingo-cta"
        onClick={handlePlayNow}
      >
        <span>Play Fast Bingo</span>
        <i className="fa-solid fa-arrow-right"></i>
      </button>
    </div>
  );
};
