import React from 'react';
import { TopHeader } from '../components/common/TopHeader.tsx';
import { BalanceBar } from '../components/common/BalanceBar.tsx';
import { BigBingoCard } from '../components/games/BigBingoCard.tsx';
import { MoreGamesGrid } from '../components/games/MoreGamesGrid.tsx';
import { BottomNav } from '../components/common/BottomNav.tsx';

export const GamesPage: React.FC = () => {
  return (
    <div className="page active page-lobby-fresh" id="page-games">
      {/* 1. Top Header with LOMII BINGO Branding */}
      <TopHeader />

      <main className="lobby-content-scroll-container">
        {/* 2. Interactive Balance Bar */}
        <BalanceBar />

        {/* 3. "Ready to Play?" Mini Banner */}
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

        {/* 4. Hero Fast Bingo (75-Ball) Feature Card */}
        <BigBingoCard />

        {/* 5. "More fun, More wins!" Reward Banner */}
        <div className="lobby-rewards-chest-card">
          <div className="chest-balls-left">
            <div className="chest-ball ball-b7">
              <span>7</span>
            </div>
            <div className="chest-ball ball-g32">
              <span>32</span>
            </div>
            <div className="chest-ball ball-p61">
              <span>61</span>
            </div>
          </div>

          <div className="chest-center-text">
            <h3 className="chest-title-bold">More fun, More wins!</h3>
            <p className="chest-sub-txt">Play, Win & Enjoy Big Rewards!</p>
          </div>

          <div className="chest-graphic-right">
            <div className="treasure-chest-3d-box">
              <div className="chest-glow-aura"></div>
              <span className="chest-emoji-art">👑</span>
              <span className="chest-gold-coins">✨💰</span>
            </div>
          </div>
        </div>

        {/* 6. "More Games" 2x2 Grid */}
        <MoreGamesGrid />
      </main>

      {/* 7. Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
};
