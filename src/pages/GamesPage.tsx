import React from 'react';
import { BigBingoCard } from '../components/games/BigBingoCard.tsx';
import { MoreGamesGrid } from '../components/games/MoreGamesGrid.tsx';
import { TreasureRewardBanner } from '../components/games/TreasureRewardBanner.tsx';

export const GamesPage: React.FC = () => {
  return (
    <div className="page active page-lobby-fresh" id="page-games">
      <main className="lobby-content-scroll-container">
        {/* 1. "Ready to Play?" Mini Banner */}
        <div className="lobby-ready-play-card">
          <div className="ready-lemon-slice-bg"></div>
          <div className="ready-text-group">
            <h2 className="ready-title-bold">Ready to Play?</h2>
            <p className="ready-subtitle-txt">
              Pick a room and let the bingo fun begin! 🎉
            </p>
          </div>

          <div className="ready-balls-cluster">
            <div className="mini-3d-ball ball-y7">
              <span className="ball-digit">7</span>
            </div>
            <div className="mini-3d-ball ball-g3">
              <span className="ball-digit">3</span>
            </div>
            <div className="mini-3d-ball ball-y1">
              <span className="ball-digit">1</span>
            </div>
          </div>
        </div>

        {/* 2. Hero Fast Bingo (75-Ball) Feature Card */}
        <BigBingoCard />

        {/* 3. "More fun, More wins!" Reward Banner with 75-Ball and Golden Treasure Chest */}
        <TreasureRewardBanner />

        {/* 4. "More Games" 2x2 Grid */}
        <MoreGamesGrid />
      </main>
    </div>
  );
};
