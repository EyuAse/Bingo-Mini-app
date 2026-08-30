import React from 'react';
import { BigBingoCard } from '../components/games/BigBingoCard.tsx';
import { MoreGamesGrid } from '../components/games/MoreGamesGrid.tsx';

export const GamesPage: React.FC = () => {
  return (
    <div className="page active" id="page-games">
      {/* Ready to Play? Banner */}
      <div className="ready-play-banner">
        <div className="ready-play-content">
          <h2 className="ready-play-title">Ready to Play?</h2>
          <p className="ready-play-subtitle">Pick a room and let the bingo fun begin! 🎉</p>
        </div>
        <div className="ready-play-visual">
          <img
            src="/assets/images/cards-balls-hero.svg"
            alt="Cards & Balls"
            className="ready-play-img"
          />
        </div>
      </div>

      {/* Featured Big Bingo Card */}
      <BigBingoCard />

      {/* Games Footer Banner */}
      <div className="games-footer-banner">
        <img src="/assets/images/footer-banner.jpg" alt="" className="footer-banner-img" />
        <div className="footer-text-overlay">
          <div className="footer-title">More fun, More wins!</div>
          <div className="footer-subtitle">Play, Win &amp; Enjoy Big Rewards</div>
        </div>
      </div>

      {/* More Games Grid */}
      <MoreGamesGrid />
    </div>
  );
};
