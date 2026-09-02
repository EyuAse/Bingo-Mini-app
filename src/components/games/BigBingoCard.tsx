import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { useBingo } from '../../context/BingoContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const BigBingoCard: React.FC = () => {
  const { switchPage } = useApp();
  const { startLobbyCountdown, playersCount, prizePool } = useBingo();
  const { lang } = useLanguage();

  const handlePlayNow = () => {
    switchPage('bingo');
    startLobbyCountdown();
  };

  return (
    <div className="fresh-fast-bingo-card">
      {/* Top Badges Row */}
      <div className="card-top-badges">
        <span className="badge-fast-pill" style={{ background: '#f59e0b', color: '#fff' }}>
          <i className="fa-solid fa-clock"></i>
          <span>{lang === 'am' ? 'በቅርብ ቀን' : 'Coming Soon'}</span>
        </span>
        <span className="badge-players-pill">
          <i className="fa-solid fa-bolt" style={{ color: '#eab308' }}></i>
          <span>75-Ball Multiplayer</span>
        </span>
      </div>

      {/* Main Content: Left Info & Right 3D Artwork */}
      <div className="card-main-split">
        {/* Left Info Column */}
        <div className="card-left-info">
          <h3 className="card-title-fast">{lang === 'am' ? 'ፈጣን ቢንጎ' : 'Fast Bingo'}</h3>
          <span className="badge-75-ball">{lang === 'am' ? 'በቅርብ ቀን የሚጀመር' : 'Launching Soon'}</span>

          <div className="stakes-values-txt">10 • 20 • 50 • 100 ETB</div>
          <div className="stakes-limits-sub">
            {lang === 'am' ? 'ዝቅተኛ፡ 10 • ከፍተኛ፡ 2,000 ብር' : 'Min: 10 • Max: 2,000 ETB'}
          </div>

          {/* Micro Stats: Players & Top Prize */}
          <div className="card-micro-stats-row">
            <div className="micro-stat-item">
              <div className="stat-icon-circ yellow">
                <i className="fa-solid fa-gift"></i>
              </div>
              <div className="stat-text-meta">
                <strong className="stat-bold-val">10 ETB</strong>
                <span className="stat-sub-lbl">{lang === 'am' ? 'የመመዝገቢያ ቦነስ' : 'Signup Bonus'}</span>
              </div>
            </div>

            <div className="micro-stat-item">
              <div className="stat-icon-circ yellow">
                <i className="fa-solid fa-trophy"></i>
              </div>
              <div className="stat-text-meta">
                <strong className="stat-bold-val">5,000+ ETB</strong>
                <span className="stat-sub-lbl">{lang === 'am' ? 'ጃክፖት ሽልማት' : 'Jackpot Pot'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 3D Artwork Column with Exact Image */}
        <div className="card-right-art">
          <img
            src="/assets/images/fast-bingo-exact-hero.jpg"
            alt="Fast Bingo 3D Cards, Star Coin and Balls"
            className="fast-bingo-3d-hero-img"
          />
        </div>
      </div>

      {/* Full-width Golden CTA Button */}
      <button
        type="button"
        className="btn-play-fast-bingo-cta"
        onClick={handlePlayNow}
      >
        <span>{lang === 'am' ? 'የቢንጎ ገጽ ይመልከቱ (በቅርብ ቀን)' : 'Preview Bingo (Coming Soon)'}</span>
        <i className="fa-solid fa-arrow-right"></i>
      </button>
    </div>
  );
};
